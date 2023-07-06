import { arrowTableToJSON } from './both.js';
import {
	NODE_RUNTIME,
	DuckDBDataProtocol,
	createDuckDB,
	ConsoleLogger
} from '@duckdb/duckdb-wasm/dist/duckdb-node-blocking';
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { cache_for_hash } from '../cache-duckdb.js';
const require = createRequire(import.meta.url);
const DUCKDB_DIST = dirname(require.resolve('@duckdb/duckdb-wasm'));

/** @type {Awaited<ReturnType<typeof createDuckDB>>} */
let db;

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export async function initDB() {
	if (db) return;

	const DUCKDB_BUNDLES = {
		mvp: {
			mainModule: resolve(DUCKDB_DIST, './duckdb-mvp.wasm'),
			mainWorker: resolve(DUCKDB_DIST, './duckdb-node-mvp.worker.cjs')
		},
		eh: {
			mainModule: resolve(DUCKDB_DIST, './duckdb-eh.wasm'),
			mainWorker: resolve(DUCKDB_DIST, './duckdb-node-eh.worker.cjs')
		}
	};
	const logger = new ConsoleLogger();

	// and synchronous database
	db = await createDuckDB(DUCKDB_BUNDLES, logger, NODE_RUNTIME);
	await db.instantiate();
	db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });
}

/**
 * Adds a new view to the database, pointing to the provided parquet URL.
 *
 * @param {string} table
 * @param {string} url
 * @returns {void}
 */
export function setParquetURL(table, url) {
	const connection = db.connect();

	const file_name = `${table}.parquet`;
	db.registerFileURL(file_name, `./static${url}`, DuckDBDataProtocol.NODE_FS, false);
	connection.query(
		`CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_parquet('${file_name}');`
	);

	connection.close();
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @param {{ route_hash: string, query_name: string }} cache_options
 * @returns {ReturnType<import("@duckdb/duckdb-wasm").AsyncDuckDBConnection['query']> | null}
 */
export function query(sql, cache_options) {
	const connection = db.connect();
	const res = connection.query(sql);
	connection.close();

	if (cache_options) {
		cache_for_hash(cache_options.route_hash, sql, cache_options.query_name, res);
	}

	return arrowTableToJSON(res);
}

export { arrowTableToJSON };
