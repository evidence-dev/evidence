import { buildParquetFromResultSet } from '@evidence-dev/universal-sql';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 * @param {DatasourceSpec} source
 * @param {PluginDatabases} supportedDbs
 * @param {string} outDir
 * @returns {Promise<string[]>} Returns a list of generated parquet files
 */
export const execSource = async (source, supportedDbs, outDir) => {
	if (!(source.type in supportedDbs)) {
		// TODO: Make this error message better
		throw new Error(`Unsupported database type: ${source.type}`);
	}

	const db = supportedDbs[source.type];
	const runner = await db.factory(source.options, source.sourceDirectory);

	console.log(`Executing ${source.name}`);
	/** @type {Set<string>} */
	const outputFilenames = new Set();

	const sourceBefore = performance.now();
	for (const query of source.queries) {
		const filename = query.filepath.split(path.sep).pop();
		console.log(` >| Executing ${filename}`);
		const before = performance.now();
		const result = await runner(query.content, query.filepath);
		console.log(` || Executed ${filename} (took ${(performance.now() - before).toFixed(2)}ms)`);
		if (!result) {
			console.log(
				` <| Finished ${filename}. Returned no results! (took ${(
					performance.now() - before
				).toFixed(2)}ms)\n`
			);
			continue;
		}

		const parquetBuffer = await buildParquetFromResultSet(result.columnTypes, result.rows);

		const queryDirectory = path.dirname(query.filepath);
		const sourcesPath = path.dirname(source.sourceDirectory);
		const outputSubdir = queryDirectory.replace(sourcesPath, '');

		outputFilenames.add(
			new URL(`file:///${path.join(outputSubdir, query.name + '.parquet').slice(1)}`).pathname
		);
		await fs.mkdir(path.join(outDir, outputSubdir), { recursive: true });
		await fs.writeFile(path.join(outDir, outputSubdir, query.name + '.parquet'), parquetBuffer);
		await fs.writeFile(
			path.join(outDir, outputSubdir, query.name + '.schema.json'),
			JSON.stringify(result.columnTypes)
		);

		console.log(
			` <| Finished ${filename} Returned ${result?.rows.length} rows. (took ${(
				performance.now() - before
			).toFixed(2)}ms)\n`
		);
	}

	console.log(`Finished ${source.name} (took ${(performance.now() - sourceBefore).toFixed(2)}ms)`);

	return Array.from(outputFilenames);
};
