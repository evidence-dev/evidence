import { AsyncDuckDB, ConsoleLogger, selectBundle } from '@duckdb/duckdb-wasm';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import Worker from 'web-worker';

const require = createRequire(import.meta.url);
const DUCKDB_DIST = dirname(require.resolve('@duckdb/duckdb-wasm'));

/** @type {AsyncDuckDB} */
let db;

/** @type {Awaited<ReturnType<AsyncDuckDB["connect"]>>} */
let connection;

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export async function initDB() {
	// If the database is already available, don't do anything
	if (db) return;

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
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import('apache-arrow').Table | null>}
 */
export async function query(sql) {
	return await connection.query(sql);
}
