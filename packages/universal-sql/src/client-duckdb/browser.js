import { Type } from 'apache-arrow';
import { ConsoleLogger, AsyncDuckDB, DuckDBDataProtocol, getPlatformFeatures } from '@duckdb/duckdb-wasm';

/** @type {import("@duckdb/duckdb-wasm").AsyncDuckDB} */
let db;

export async function initDB() {
	if (db) return;

    const useEh = await getPlatformFeatures().then(x => x.wasmExceptions);

    const DUCKDB_CONFIG = useEh?
        { mainModule: (await import('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url')).default, mainWorker: (await import("@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?worker")).default } :
        { mainModule: (await import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url')).default, mainWorker: (await import("@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker")).default };

    const logger = new ConsoleLogger();
    const worker = new DUCKDB_CONFIG.mainWorker();

	// and asynchronous database
	db = new AsyncDuckDB(logger, worker);
	await db.instantiate(DUCKDB_CONFIG.mainModule);
	await db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });
}

/**
 * Adds a new view to the database, pointing to the provided parquet URL.
 *
 * @param {string} table
 * @param {string} url
 * @returns {Promise<void>}
 */
export async function setParquetURL(table, url) {
	if (!db) await initDB();

	const connection = await db.connect();

	const file_name = `${table}.parquet`;
	await db.registerFileURL(file_name, url, DuckDBDataProtocol.HTTP, false);
	await connection.query(
		`CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_parquet('${file_name}');`
	);

	await connection.close();
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<ReturnType<import("@duckdb/duckdb-wasm").AsyncDuckDBConnection['query']> | null>}
 */
export async function query(sql) {
	if (!db) await initDB();

	const connection = await db.connect();
	const res = await connection.query(sql).then(arrowTableToJSON);
	await connection.close();

    console.log({ browser: res });

	return res;
}

/**
 * Converts an Apache Arrow type to an Evidence type.
 *
 * @param {import("apache-arrow").Type} type
 */
function apacheToEvidenceType(type) {
	switch (
		type.typeId // maybe just replace with `typeof`
	) {
		case Type.Date:
			return 'date';
		case Type.Float:
		case Type.Int:
			return 'number';
		case Type.Bool:
			return 'boolean';
		case Type.Dictionary:
		default:
			return 'string';
	}
}

/**
 *
 * @param {import("apache-arrow").Table} table
 * @returns
 */
function arrowTableToJSON(table) {
	if (table == null) return [];
	const arr = table.toArray();

	Object.defineProperty(arr, '_evidenceColumnTypes', {
		enumerable: false,
		value: table.schema.fields.map((field) => ({
			name: field.name,
			evidenceType: apacheToEvidenceType(field.type),
			typeFidelity: 'precise'
		}))
	});

	return arr;
}