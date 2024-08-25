import { logQueryEvent } from '@evidence-dev/telemetry';
import os from 'os';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { buildMultipartParquet } from '@evidence-dev/universal-sql';
import { EvidenceError } from '../../../lib/EvidenceError.js';
import { addToCache } from '../SourceResultCache.js';
import { dataUrlPrefix } from '../../../lib/projectPaths.js';
import chalk from 'chalk';
import { execPipeline } from './execPipelines.js';

/**
 * @param {import('../types.js').DatasourceSpec} source
 * @param {import('../types.js').QueryResultTable<any>} table
 * @param {import('../types.js').SourceUtils} utils
 * @param {{dataPath: string; metaPath: string}} paths
 * @returns {Promise<Array<{ name: string, filepath: string }> | null>}  URL / Filepath to the result table file. Null when no file was written
 */
export const buildSourceTable = async (source, table, utils, { dataPath, metaPath }) => {
	const spinner = ora({
		prefixText: `  ${table.name}`,
		spinner: 'triangle',
		discardStdin: false,
		interval: 250
	});

	const tableCacheKey = 'url' in table ? table.url : table.content;

	spinner.start('Processing...');
	if (utils.isFiltered(table.name)) {
		spinner.info('Skipped due to filtering');
		return null;
	}
	if (utils.isCached(table.name, tableCacheKey)) {
		spinner.info('Reused from cache');
		logQueryEvent('cache-query', source.type, source.name);
		return null;
	}
	/**
	 * @type {Array<{ name: string, filepath: string }>}
	 */
	const outputs = [];

	if ('url' in table) {
		return table.url;
	}
	try {
		if (!table.rows) {
			spinner.warn('No results returned');
			return null;
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
		await fs.writeFile(
			path.join(outDir, table.name + '.schema.json'),
			JSON.stringify(table.columnTypes)
		);

		addToCache(source.name, table.name, table.content);

		spinner.succeed(`Finished, wrote ${writtenRows} rows.`);
		outputs.push({
			name: table.name,
			filepath: `${dataUrlPrefix}/${source.name}/${table.name}/${filename}`
		});

		const pipelines = source.pipelines.filter((pipe) => pipe.source === table.name);
		for (const pipeline of pipelines) {
			const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-pipeline'));

			const destination = pipeline.destination ?? pipeline.source;
			const destDir = path.join(dataPath, source.name, destination);

			await fs.cp(
				path.join(outDir, table.name + '.parquet'),
				path.join(tmpdir, table.name + '.parquet')
			);
			await fs.cp(
				path.join(outDir, table.name + '.schema.json'),
				path.join(tmpdir, table.name + '.schema.json')
			);

			await execPipeline(table.name, pipeline, tmpdir);

			await fs.mkdir(destDir, { recursive: true });
			await fs.cp(
				path.join(tmpdir, table.name + '.parquet'),
				path.join(destDir, destination + '.parquet')
			);
			await fs.cp(
				path.join(tmpdir, table.name + '.schema.json'),
				path.join(destDir, destination + '.schema.json')
			);

			if (pipeline.destination && pipeline.destination !== pipeline.source) {
				// Register the new table in the manifest
				addToCache(source.name, destination, table.content);

				// Create a new directory for the destination
				outputs.push({
					name: destination,
					filepath: `${dataUrlPrefix}/${source.name}/${destination}/${destination}.parquet`
				});
			}
			await fs.rm(tmpdir, { recursive: true });
		}
	} catch (e) {
		if (e instanceof Error) spinner.fail(e.message);
		else spinner.fail('Unknown Error Encountered');
		if (e instanceof EvidenceError && e.context) {
			if (Array.isArray(e.context)) console.warn(chalk.dim('    ' + e.context.join('\n    ')));
			else console.warn(chalk.dim('    ' + e.context));
		}
		console.debug();
		if (e instanceof Error) console.debug(chalk.dim('    ' + e.stack?.split('\n').join('\n    ')));
		else console.debug(chalk.dim(e));
		return null;
	}
	return outputs;
};
