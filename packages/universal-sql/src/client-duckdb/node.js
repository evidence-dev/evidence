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

export { tableFromIPC } from 'apache-arrow';

/** @type {import("@duckdb/duckdb-wasm/dist/types/src/bindings/bindings_node_base").DuckDBNodeBindings} */
let db;

/** @type {import("@duckdb/duckdb-wasm/dist/types/src/bindings/connection").DuckDBConnection} */
let connection;

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
	connection = db.connect();
}


/**
 * Updates the duckdb search path to include only the list of included schemas
 * @param {string[]} schemas
 * @returns {void}
 */
export function updateSearchPath(schemas) {
	connection.query(`PRAGMA search_path='${schemas.join(',')}'`);
}

/**
 * Adds a new view to the database, pointing to the provided parquet URLs.
 *
 * @param {Record<string, string[]>} urls
 * @returns {void}
 */
export async function setParquetURLs(urls) {
	for (const source in urls) {
		connection.query(`CREATE SCHEMA IF NOT EXISTS ${source};`);
		for (const url of urls[source]) {
			const table = url.split('/').at(-1).slice(0, -'.parquet'.length);
			const file_name = `${table}.parquet`;
			db.registerFileURL(file_name, `./static${url}`, DuckDBDataProtocol.NODE_FS, false);
			connection.query(
				`CREATE OR REPLACE VIEW ${source}.${table} AS SELECT * FROM read_parquet('${file_name}');`
			);
		}
	}
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @param {{ route_hash: string, query_name: string }} cache_options
 * @returns {import('apache-arrow').Table | null}
 */
export function query(sql, cache_options) {
	const res = connection.query(sql);

	if (cache_options) {
		cache_for_hash(cache_options.route_hash, sql, cache_options.query_name, res);
	}

	return arrowTableToJSON(res);
}

export { arrowTableToJSON };
