import { arrowTableToJSON, getPromise, withTimeout } from './both.js';
import {
	AsyncDuckDB,
	ConsoleLogger,
	DuckDBDataProtocol,
	getPlatformFeatures
} from '@duckdb/duckdb-wasm';

export { tableFromIPC } from 'apache-arrow';

/** @type {import("@duckdb/duckdb-wasm").AsyncDuckDB} */
let db;

/** @type {import("@duckdb/duckdb-wasm").AsyncDuckDBConnection} */
let connection;

const { resolve: resolveInit, reject: rejectInit, promise: initPromise } = getPromise();
const { resolve: resolveTables, reject: rejectTables, promise: tablesPromise } = getPromise();
let initializing = false;

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export async function initDB() {
	// If the database is already available, don't do anything
	if (db) return;

	// If the database is already initializing, don't try to do it twice
	// Instead, let the call wait for the initPromise
	if (initializing) return withTimeout(initPromise);
	// This call is the first (to execute), don't let anybody else try
	// to initialize the database
	initializing = true;
	try {
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
		await db.open({
			query: {
				castBigIntToDouble: true,
				castTimestampToDate: true,
				castDecimalToDouble: true,
				castDurationToTime64: true
			}
		});
		connection = await db.connect();
		resolveInit();
	} catch (e) {
		rejectInit(e);
		throw e;
	}
}

/**
 * Updates the duckdb search path to include only the list of included schemas
 * @param {string[]} schemas
 * @returns {Promise<void>}
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

	try {
		for (const source in urls) {
			await connection.query(`CREATE SCHEMA IF NOT EXISTS ${source};`);
			for (const url of urls[source]) {
				const table = url.split('/').at(-1).slice(0, -'.parquet'.length);
				const file_name = `${source}_${table}.parquet`;
				let path = url
				if (!url.startsWith("http") && !url.startsWith("/")) {
					// URL Needs to be absolute
					path = `/${url}`
				}
				if (path.startsWith("/static")) path = path.substring(7)
				await db.registerFileURL(file_name, path, DuckDBDataProtocol.HTTP, false);
				await connection.query(
					`CREATE OR REPLACE VIEW ${source}.${table} AS SELECT * FROM read_parquet('${file_name}');`
				);
			}
		}
		resolveTables();
	} catch (e) {
		rejectTables(e);
		throw e;
	}
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import("apache-arrow").Table | null>}
 */
export async function query(sql) {
	// After this point, the database has been initialized
	if (!db) await initDB();
	// We need to wait for tables to be available
	await withTimeout(tablesPromise);

	// Now we can safely execute our query
	const res = await connection.query(sql).then(arrowTableToJSON);

	return res;
}

export { arrowTableToJSON };
