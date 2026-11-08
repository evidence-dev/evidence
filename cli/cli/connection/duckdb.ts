/**
 * Local DuckDB query executor.
 *
 * Instances are cached per database path, while individual connections
 * are short-lived. The driver returns JSON-safe values.
 */
import { DuckDBInstance } from '@duckdb/node-api';
import { getMotherduckToJsType } from '@evidence/core/connectors/motherduck/type-mapping';
import { normalizeDateRows } from '@evidence/core/connectors/postgres/normalize-date-rows';
import { normalizeSparklineRows } from '@evidence/core/connectors/normalize-sparkline-rows';
import type { DuckDBCredentials } from '@evidence/core/connectors/duckdb/credentials';
import type { QueryResult } from './types';

/**
 * Convert numeric JSON strings only when the conversion is lossless.
 * Large integers and high-precision decimals remain strings.
 */
function safeNumericValue(value: unknown): unknown {
	if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(value)) {
		return value;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed)) return value;
	if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
		return value;
	}

	const normalized = value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;

	return String(parsed) === normalized ? parsed : value;
}

export async function executeDuckDBQuery(
	sql: string,
	config: DuckDBCredentials
): Promise<QueryResult> {
	const instance = await DuckDBInstance.fromCache(config.database);
	const connection = await instance.connect();

	try {
		// Resolve relative CSV/Parquet paths against the Evidence project.
		const escapedRoot = config.projectDir.replace(/'/g, "''");
		await connection.runAndReadAll(`SET file_search_path = '${escapedRoot}'`);

		const reader = await connection.runAndReadAll(sql);

		const names = reader.columnNames();
		const types = reader.columnTypes();

		const columns = names.map((name, index) => {
			const duckdbType = types[index].toString();

			return {
				name,
				clickhouseType: duckdbType,
				jsType: getMotherduckToJsType(duckdbType)
			};
		});

		const rows: Record<string, unknown>[] = reader.getRowObjectsJson();

		const numericColumns = columns
			.filter((column) => column.jsType === 'number')
			.map((column) => column.name);

		for (const row of rows) {
			for (const name of numericColumns) {
				row[name] = safeNumericValue(row[name]);
			}
		}

		const dateColumns = new Set(
			columns.filter((column) => column.jsType === 'date').map((column) => column.name)
		);

		normalizeDateRows(rows, dateColumns);
		normalizeSparklineRows(rows, columns);

		return { rows, columns };
	} finally {
		connection.closeSync();
	}
}
