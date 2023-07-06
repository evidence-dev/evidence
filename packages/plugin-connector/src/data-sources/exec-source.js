import { buildParquetFromResultSet } from '@evidence-dev/universal-sql';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 *
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
	const results = await Promise.all(
		source.queries.map(async (q) => {
			const filename = q.filepath.split('/').pop();
			console.log(` >| Executing ${filename}`);
			const before = performance.now();
			return {
				...q,
				result: await runner(q.content, q.filepath).then((x) => {
					console.log(
						` <| Finished ${filename} (took ${(performance.now() - before).toFixed(2)}ms)`
					);
					return x;
				})
			};
		})
	);
	console.log(`Finished ${source.name}`);

	/** @type {Set<string>} */
	const outputFilenames = new Set();

	for (const query of results) {
		const { result } = query;
		if (!result) continue;
		const parquetBuffer = await buildParquetFromResultSet(result.columnTypes, result.rows);
		/* Split on / or \ (windows compatibility) */
		const fileparts = query.filepath.split(/[/\\]/);
		const outputFilename = fileparts.pop()?.split('.')[0];

		const outputSubdir = path.join(
			...path
				.join(...fileparts)
				.split('sources')
				.slice(1)
		);
		outputFilenames.add(path.join(outputSubdir, outputFilename + '.parquet'));
		await fs.mkdir(path.join(outDir, outputSubdir), { recursive: true });
		await fs.writeFile(path.join(outDir, outputSubdir, outputFilename + '.parquet'), parquetBuffer);
		await fs.writeFile(
			path.join(outDir, outputSubdir, outputFilename + '.schema.json'),
			JSON.stringify(result.columnTypes)
		);
	}

	return Array.from(outputFilenames);
};
