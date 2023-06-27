import { buildParquetFromResultSet } from '@evidence-dev/universal-sql';
import fs from 'fs/promises';
/**
 *
 * @param {DatasourceSpec} source
 * @param {PluginDatabases} supportedDbs
 * @returns {Promise<void>}
 */
export const execSource = async (source, supportedDbs) => {
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

	for (const query of results) {
		const { result } = query;
		if (!result) continue;
		const parquetBuffer = await buildParquetFromResultSet(result.columnTypes, result.rows);
		await fs.writeFile(query.filepath.split('.')[0] + '.parquet', parquetBuffer);
	}
};
