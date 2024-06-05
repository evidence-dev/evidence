import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

import { EvidenceError } from '../../lib/EvidenceError.js';
import { loadSourcePlugins } from './loadSourcePlugins.js';
import { loadSources } from './loadSources.js';
import { wrapSimpleConnector } from './wrapSimpleConnector.js';
import { buildMultipartParquet } from '@evidence-dev/universal-sql';
import { buildSourceDirectoryProxy } from './buildSourceDirectoryProxy.js';
import { addToCache, checkCache, flushCache, loadCache } from './SourceResultCache.js';
import ora from 'ora';

// TODO: Telemetry

/**
 * @param {string} dataPath
 * @param {string} metaPath
 * @param {import('./types.js').SourceFilters} [filters] `sources` or `queries` being null means no filter
 * @returns {Promise<import('./types.js').Manifest>}
 */
export const evalSources = async (dataPath, metaPath, filters) => {
	const pluginLoader = ora({ text: 'Loading plugins & sources' }).start();

	// Setup work
	const [sourcePlugins, sources] = await Promise.all([
		loadSourcePlugins(),
		loadSources(),
		loadCache(metaPath)
	]).catch((e) => {
		pluginLoader.fail();
		throw e;
	});

	pluginLoader.succeed();

	/** @type {import('./types.js').Manifest} */
	const outputManifest = { renderedFiles: {}, locatedFiles: {} };

	for (const source of sources) {
		console.log(chalk.dim('-'.repeat(5)));
		if (filters?.sources?.size && !filters?.sources?.has(source.name)) {
			console.log(`  [Filtered] ${chalk.bold(source.name)}`);
			continue;
		} else {
			console.log(chalk.green(`  [Processing] ${chalk.bold(source.name)}`));
		}

		const plugin = sourcePlugins.getBySource(source.type);
		if (!plugin) {
			// TODO: How forgiving do we want to be here?
			// TODO: If we want to be really fancy; we could batch these, and do an NPM lookup at the end to say "these packages provide those datasources"
			throw new EvidenceError(
				`Could not find matching datasource plugin for ${chalk.bold(
					source.name
				)} (source: ${chalk.bold(source.type)})`
			);
		}
		const [, mod] = plugin;

		/** @type {import('./types.js').ProcessSourceFn} */
		const tableIter = 'processSource' in mod ? mod.processSource : wrapSimpleConnector(mod, source);

		const utils = buildUtils(source, filters);

		outputManifest.renderedFiles[source.name] = [];
		if (!outputManifest.locatedFiles) outputManifest.locatedFiles = {};
		outputManifest.locatedFiles[source.name] = [];

		for await (const table of tableIter(
			source.options,
			await buildSourceDirectoryProxy(source.dir),
			utils
		)) {
			const spinner = ora({
				prefixText: `  ${table.name}`,
				spinner: 'triangle',
				discardStdin: false,
				interval: 250
			});
			outputManifest.locatedFiles[source.name].push(table.name);
			spinner.start('Processing...');
			if (utils.isFiltered(table.name)) {
				spinner.warn('Skipping: Filtered');
				continue;
			}
			if (filters?.only_changed && utils.isCached(table.name, table.content)) {
				spinner.warn('Skipping: Cached');
				continue;
			}

			if ('url' in table) {
				outputManifest.renderedFiles[source.name].push(table.url);
				continue;
			}
			try {
				if (!table.rows) {
					spinner.warn('No results returned.');
					continue;
				}
				const outDir = path.join(dataPath, source.name, table.name);
				await fs.mkdir(outDir, { recursive: true });
				const tmpDir = path.join(metaPath, source.name, table.name, 'tmp');
				await fs.mkdir(tmpDir, { recursive: true });
				const filename = table.name + '.parquet';
				const writtenRows = await buildMultipartParquet(
					table.columnTypes,
					table.rows,
					tmpDir,
					outDir,
					filename,
					table.expectedRowCount,
					1000 * 1000 // TODO: Configurable?
				);

				if (writtenRows === false) {
					throw new EvidenceError('Internal Error', [
						'No rows were written to the filesystem, but the table claimed to contain rows'
					]);
				}
				outputManifest.renderedFiles[source.name].push(
					`/_evidence/query/${source.name}/${filename}`
				);
				addToCache(source.name, table.name, table.content);

				spinner.succeed(`Finished, wrote ${writtenRows} rows.`);
			} catch (e) {
				if (e instanceof Error) spinner.fail(e.message);
				else spinner.fail('Unknown Error Encountered');
				if (e instanceof EvidenceError && e.context) {
					if (Array.isArray(e.context)) console.warn(chalk.dim('    ' + e.context.join('\n    ')));
					else console.warn(chalk.dim('    ' + e.context));
				}
				console.debug();
				if (e instanceof Error)
					console.debug(chalk.dim('    ' + e.stack?.split('\n').join('\n    ')));
				else console.debug(chalk.dim(e));
			}
		}
	}
	console.log(chalk.dim('-'.repeat(5)));

	await flushCache(metaPath);

	return outputManifest;
};

/**
 *
 * @param {Awaited<ReturnType<typeof loadSources>>[number]} source
 * @param {import('./types.js').SourceFilters} [filters]
 * @returns
 */
const buildUtils = (source, filters) => {
	const utils = {
		/**
		 * @param {string} name
		 * @param {string} content
		 */
		isCached: (name, content) => checkCache(source.name, name, content),
		/**
		 * @param {string} name
		 * @returns {boolean} true if query is included in filters
		 */
		isFiltered: (name) => {
			if (!filters?.queries?.size) return false;
			return Boolean(!filters.queries.has(name) && !filters.queries.has(`${source.name}.${name}`));
		},
		/**
		 * @param {string} name
		 * @param {string} content
		 * @returns {boolean}
		 */
		shouldRun: (name, content) =>
			!utils.isFiltered(name) &&
			Boolean(filters?.only_changed) &&
			!checkCache(source.name, name, content),
		/**
		 * @param {string} name
		 * @param {string} content
		 */
		addToCache: (name, content) => addToCache(source.name, name, content)
	};

	return utils;
};
