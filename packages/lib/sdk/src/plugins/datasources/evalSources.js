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
import { dataUrlPrefix } from '../../lib/projectPaths.js';
import { subSourceVariables } from './sub-source-vars.js';
import { logQueryEvent } from '@evidence-dev/telemetry';

// TODO: This is a great candidate for unit testing - but it may need to be broken down further to make that more achievable, right now it would take a _lot_ of mocks

/**
 * @param {string} dataPath
 * @param {string} metaPath
 * @param {import('./types.js').SourceFilters} [filters] `sources` or `queries` being null means no filter
 * @param {boolean} [strict]
 * @returns {Promise<import('./types.js').Manifest>}
 */
export const evalSources = async (dataPath, metaPath, filters, strict) => {
	const pluginLoader = ora({ text: 'Loading plugins & sources' }).start();

	// Setup work
	const [sourcePlugins, sources] = await Promise.all([
		loadSourcePlugins(),
		loadSources(pluginLoader),
		loadCache(metaPath)
	]).catch((e) => {
		pluginLoader.fail();
		throw e;
	});

	if (sources.length) {
		pluginLoader.succeed();
	}

	/** @type {import('./types.js').Manifest} */
	const outputManifest = { renderedFiles: {}, locatedFiles: {}, locatedSchemas: [] };

	/** @type {string[]} */
	const skippedSources = [];

	for (const source of sources) {
		outputManifest.locatedSchemas ??= [];
		outputManifest.locatedSchemas.push(source.name);
		if (filters?.sources?.size && !filters?.sources?.has(source.name)) {
			console.debug(`  [Skipping]: ${chalk.bold(source.name)}`);
			skippedSources.push(source.name);
			continue;
		} else {
			console.log(chalk.dim('-'.repeat(5)));
			console.log(chalk.green(`  [Processing] ${chalk.bold(source.name)}`));
		}

		const plugin = sourcePlugins.getBySource(source.type);
		if (!plugin) {
			logQueryEvent('source-connector-not-found', source.type, source.name);
			// TODO: How forgiving do we want to be here?
			// TODO: If we want to be really fancy; we could batch these, and do an NPM lookup at the end to say "these packages provide those datasources"
			throw new EvidenceError(
				`Could not find matching datasource plugin for ${chalk.bold(
					source.name
				)} (source: ${chalk.bold(source.type)})`
			);
		}
		const [, mod] = plugin;
		const testResult = await mod.testConnection(source.options, source.dir);
		if (testResult !== true) {
			logQueryEvent('db-connection-error', source.type, source.name);
			throw new EvidenceError(
				`Error connecting to datasource ${chalk.bold(source.name)}: ${testResult.reason}`
			);
		} else {
			logQueryEvent('db-connection-success', source.type, source.name);
		}

		/** @type {import('./types.js').ProcessSourceFn} */
		const tableIter = 'processSource' in mod ? mod.processSource : wrapSimpleConnector(mod, source);

		const utils = buildUtils(source, filters);

		outputManifest.renderedFiles[source.name] = [];
		if (!outputManifest.locatedFiles) outputManifest.locatedFiles = {};
		outputManifest.locatedFiles[source.name] = [];

		const iter = tableIter(source.options, await buildSourceDirectoryProxy(source.dir), utils)[
			Symbol.asyncIterator
		](); // this is required for typescript to be happy

		/** @type {IteratorResult<import('./types.js').QueryResultTable<any> | EvidenceError>} */
		let iterResult;

		while (((iterResult = await iter.next()), !iterResult.done)) {
			if (iterResult.done) continue;
			if (iterResult.value instanceof Error) {
				const error = iterResult.value;
				let tableName = 'Unknown';
				if (error instanceof EvidenceError) {
					if (error.metadata.tableName) tableName = error.metadata.tableName;
				}
				ora({
					prefixText: `  ${tableName}`,
					spinner: 'triangle',
					discardStdin: false,
					interval: 250
				}).fail(`Error: ${error.message}`);
				logQueryEvent('db-error', source.type, source.name, tableName);
				if (strict) throw error;
				continue;
			}
			const table = { ...iterResult.value };
			const spinner = ora({
				prefixText: `  ${table.name}`,
				spinner: 'triangle',
				discardStdin: false,
				interval: 250
			});

			outputManifest.locatedFiles[source.name].push(table.name);
			spinner.start('Processing...');
			if (utils.isFiltered(table.name)) {
				spinner.info('Skipped');
				continue;
			}
			if (utils.isCached(table.name, table.content)) {
				spinner.info('From Cache');
				logQueryEvent('cache-query', source.type, source.name);
				continue;
			}
			logQueryEvent('db-query', source.type, source.name, table.name);

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
					source.buildOptions.batchSize
				);

				if (writtenRows === false) {
					throw new EvidenceError('Internal Error', [
						'No rows were written to the filesystem, but the table claimed to contain rows'
					]);
				}
				outputManifest.renderedFiles[source.name].push(
					`${dataUrlPrefix}/${source.name}/${table.name}/${filename}`
				);
				await fs.writeFile(
					path.join(outDir, table.name + '.schema.json'),
					JSON.stringify(table.columnTypes)
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

	if (skippedSources.length)
		console.log(
			chalk.dim(
				`  ${skippedSources.length} source${skippedSources.length === 1 ? '' : 's'} were not run due to filters`
			)
		);

	await flushCache(metaPath);

	return outputManifest;
};

/**
 *
 * @param {Awaited<ReturnType<typeof loadSources>>[number]} source
 * @param {import('./types.js').SourceFilters} [filters]
 * @returns {import('./types.js').SourceUtils}
 */
const buildUtils = (source, filters) => {
	/** @type {import('./types.js').SourceUtils} */
	const utils = {
		/**
		 * @param {string} name
		 * @param {string} content
		 */
		isCached: (name, content) =>
			Boolean(filters?.only_changed && checkCache(source.name, name, content)),
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
		shouldRun: (name, content) => !utils.isFiltered(name) && !utils.isCached(name, content),
		/**
		 * @param {string} name
		 * @param {string} content
		 */
		addToCache: (name, content) => addToCache(source.name, name, content),
		subSourceVariables: subSourceVariables,
		escape: (tableName, tableContent) => ({
			name: tableName,
			content: tableContent,
			rows: [],
			columnTypes: []
		})
	};

	return utils;
};
