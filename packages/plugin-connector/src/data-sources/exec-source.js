import { buildParquetFromResultSet } from '@evidence-dev/universal-sql';
import fs from 'fs/promises';
import path from 'path';

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
	const results = await Promise.all(
		source.queries.map(async (q) => {
			return {
				...q,
				result: await runner(q.content, q.filepath)
			};
		})
	);

	/** @type {Set<string>} */
	const outputFilenames = new Set();

	for (const query of results) {
		const { result } = query;
		if (!result) continue;
		const parquetBuffer = await buildParquetFromResultSet(result.columnTypes, result.rows);
		/* Split on / or \ (windows compatibility) */
		const fileparts = query.filepath.split(/[/\\]/);
		const outputFilename = fileparts.pop()?.split('.')[0] + '.parquet';

		const outputSubdir = path.join(
			...path
				.join(...fileparts)
				.split('sources')
				.slice(1)
		);
		outputFilenames.add(path.join(outputSubdir, outputFilename));
		await fs.mkdir(path.join(outDir, outputSubdir), { recursive: true });
		await fs.writeFile(path.join(outDir, outputSubdir, outputFilename), parquetBuffer);
	}

	return Array.from(outputFilenames);
};
