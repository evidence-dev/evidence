import { arrowTableToJSON } from './both.js';
import {
	ConsoleLogger,
	AsyncDuckDB,
	DuckDBDataProtocol,
	getPlatformFeatures
} from '@duckdb/duckdb-wasm';

export { tableFromIPC } from 'apache-arrow';

/** @type {import("@duckdb/duckdb-wasm").AsyncDuckDB} */
let db;

/** @type {import("@duckdb/duckdb-wasm").AsyncDuckDBConnection} */
let connection;

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export async function initDB() {
	if (db) return;

	const useEh = await getPlatformFeatures().then((x) => x.wasmExceptions);

	const DUCKDB_CONFIG = useEh
		? {
				mainModule: (await import('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url')).default,
				mainWorker: (await import('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?worker'))
					.default
		  }
		: {
				mainModule: (await import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url')).default,
				mainWorker: (await import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker'))
					.default
		  };

	const logger = new ConsoleLogger();
	const worker = new DUCKDB_CONFIG.mainWorker();

	// and asynchronous database
	db = new AsyncDuckDB(logger, worker);
	await db.instantiate(DUCKDB_CONFIG.mainModule);
	await db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });
	connection = await db.connect();
}

/**
 * Updates the duckdb search path to include only the list of included schemas
 * @param {string[]} schemas
 * @returns {void}
 */
export async function updateSearchPath(schemas) {
	if (!db) await initDB();

	await connection.query(`PRAGMA search_path='${schemas.join(',')}'`);
}

/**
 * Adds a new view to the database, pointing to the provided parquet URL.
 *
 * @param {Record<string, string[]>} urls
 * @returns {Promise<void>}
 */
export async function setParquetURLs(urls) {
	if (!db) await initDB();

	for (const source in urls) {
		await connection.query(`CREATE SCHEMA IF NOT EXISTS ${source};`);
		for (const url of urls[source]) {
			const table = url.split('/').at(-1).slice(0, -'.parquet'.length);
			const file_name = `${table}.parquet`;
			await db.registerFileURL(file_name, url, DuckDBDataProtocol.HTTP, false);
			await connection.query(
				`CREATE OR REPLACE VIEW ${source}.${table} AS SELECT * FROM read_parquet('${file_name}');`
			);
		}
	}
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import("apache-arrow").Table | null>}
 */
export async function query(sql) {
	if (!db) await initDB();

	const res = await connection.query(sql).then(arrowTableToJSON);

	return res;
}

export { arrowTableToJSON };
