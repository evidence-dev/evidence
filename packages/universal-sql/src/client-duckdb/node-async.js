import { getPromise } from './both.js';
import { AsyncDuckDB, ConsoleLogger, selectBundle } from '@duckdb/duckdb-wasm';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { withTimeout } from './both.js';
import Worker from 'web-worker';

const require = createRequire(import.meta.url);
const DUCKDB_DIST = dirname(require.resolve('@duckdb/duckdb-wasm'));

export { tableFromIPC } from 'apache-arrow';

/** @type {AsyncDuckDB} */
let db;

/** @type {Awaited<ReturnType<AsyncDuckDB["connect"]>>} */
let connection;

const { resolve: resolveInit, reject: rejectInit, promise: initPromise } = getPromise();
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
		const DUCKDB_BUNDLES = await selectBundle({
			mvp: {
				mainModule: resolve(DUCKDB_DIST, './duckdb-mvp.wasm'),
				mainWorker: resolve(DUCKDB_DIST, './duckdb-node-mvp.worker.cjs')
			},
			eh: {
				mainModule: resolve(DUCKDB_DIST, './duckdb-eh.wasm'),
				mainWorker: resolve(DUCKDB_DIST, './duckdb-node-eh.worker.cjs')
			}
		});
		const logger = new ConsoleLogger();
		const worker = new Worker(DUCKDB_BUNDLES.mainWorker);

		// and synchronous database
		db = new AsyncDuckDB(logger, worker);
		await db.instantiate(DUCKDB_BUNDLES.mainModule);
		await db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });
		connection = await db.connect();
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
 * @returns {import('apache-arrow').Table | null}
 */
export function query(sql) {
	return connection.query(sql);
}
