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
}

/**
 * Adds a new view to the database, pointing to the provided parquet URL.
 *
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export async function setParquetURLs(urls) {
	if (!db) await initDB();

	const connection = await db.connect();

	for (const url of urls) {
		const table = url.split('/').at(-1).slice(0, -'.parquet'.length);
		const file_name = `${table}.parquet`;
		await db.registerFileURL(file_name, url, DuckDBDataProtocol.HTTP, false);
		await connection.query(
			`CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_parquet('${file_name}');`
		);
	}

	await connection.close();
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import("apache-arrow").Table | null>}
 */
export async function query(sql) {
	if (!db) await initDB();

	const connection = await db.connect();
	const res = await connection.query(sql).then(arrowTableToJSON);
	await connection.close();

	return res;
}

export { arrowTableToJSON };
