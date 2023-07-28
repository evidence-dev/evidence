import { arrowTableToJSON } from './both.js';
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

/**
 * Indicate if the database has already started initializing
 */
let initializing = false;

// Unwrap a promise so we can manually resolve / reject it
let resolveInit, rejectInit;
/**
 * DB Initialization promise. Resolves once Parquet URLs are set.
 */
let initPromise = new Promise((res, rej) => {
	resolveInit = res;
	rejectInit = rej;
});

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
	if (initializing)
		return Promise.race([
			initPromise,
			new Promise((_, rej) =>
				// If the database isn't initialized after 5 seconds, throw an error
				setTimeout(() => rej(new Error('Timeout while initializing database')), 5000)
			)
		]);
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
		await db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });
		connection = await db.connect();
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
				const file_name = `${table}.parquet`;
				await db.registerFileURL(file_name, url, DuckDBDataProtocol.HTTP, false);
				await connection.query(
					`CREATE OR REPLACE VIEW ${source}.${table} AS SELECT * FROM read_parquet('${file_name}');`
				);
			}
		}
		resolveInit();
	} catch (e) {
		rejectInit(e);
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
	if (!db) await initDB();

	const res = await connection.query(sql).then(arrowTableToJSON);

	return res;
}

export { arrowTableToJSON };
