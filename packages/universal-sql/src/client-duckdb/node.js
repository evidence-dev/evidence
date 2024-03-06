import { arrowTableToJSON, getPromise } from './both.js';
import {
	ConsoleLogger,
	createDuckDB,
	DuckDBDataProtocol,
	NODE_RUNTIME,
	VoidLogger
} from '@duckdb/duckdb-wasm/dist/duckdb-node-blocking';
import { createRequire } from 'module';
import path from 'path';
import { cache_for_hash, get_arrow_if_sql_already_run } from '../cache-duckdb.js';
import { withTimeout } from './both.js';

const require = createRequire(import.meta.url);
const DUCKDB_DIST = path.dirname(require.resolve('@duckdb/duckdb-wasm'));

export { tableFromIPC } from 'apache-arrow';

/** @type {import("@duckdb/duckdb-wasm/dist/types/src/bindings/bindings_node_base").DuckDBNodeBindings} */
let db;

/** @type {import("@duckdb/duckdb-wasm/dist/types/src/bindings/connection").DuckDBConnection} */
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
		const DUCKDB_BUNDLES = {
			mvp: {
				mainModule: path.resolve(DUCKDB_DIST, './duckdb-mvp.wasm'),
				mainWorker: path.resolve(DUCKDB_DIST, './duckdb-node-mvp.worker.cjs')
			},
			eh: {
				mainModule: path.resolve(DUCKDB_DIST, './duckdb-eh.wasm'),
				mainWorker: path.resolve(DUCKDB_DIST, './duckdb-node-eh.worker.cjs')
			}
		};
		const logger = process.env.VITE_EVIDENCE_DEBUG ? new ConsoleLogger() : new VoidLogger();

		// and synchronous database
		db = await createDuckDB(DUCKDB_BUNDLES, logger, NODE_RUNTIME);
		await db.instantiate();
		db.open({
			query: {
				castBigIntToDouble: true,
				castTimestampToDate: true,
				castDecimalToDouble: true,
				castDurationToTime64: true
			}
		});
		connection = db.connect();
		resolveInit();
	} catch (e) {
		rejectInit(e);
		throw e;
	}
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
 * @param {string} targetGlob
 */
export async function emptyDbFs(targetGlob) {
	await db.flushFiles();
	for (const f of db.globFiles(targetGlob)) {
		await db.dropFile(f.fileName);
	}
}

/**
 * Adds a new view to the database, pointing to the provided parquet URLs.
 *
 * @param {Record<string, ({ partitions: string[], name: string, useHive: boolean })[]>} tables
 * @param {boolean} [append]
 * @returns {void}
 */
export async function setParquetURLs(tables, append = false) {
	if (!append) await emptyDbFs('*');

	if (process.env.VITE_EVIDENCE_DEBUG) console.log(`Updating Parquet URLs`);
	for (const source in tables) {
		connection.query(`CREATE SCHEMA IF NOT EXISTS "${source}";`);
		/**
		 *
		 * @param {string} s
		 * @returns {string}
		 */
		const adaptForPlatform = (s) => s.split(/[\\/]/g).join(path.sep);
		for (const table of tables[source]) {
			const partitions = table.partitions.map((p) => [
				adaptForPlatform(p),
				p.replaceAll(path.sep, '_')
			]);
			for (const [url, file_name] of partitions) {
				if (append) {
					await emptyDbFs(file_name);
				}
				db.registerFileURL(file_name, url, DuckDBDataProtocol.NODE_FS, false);
			}
			connection.query(
				`CREATE OR REPLACE VIEW "${source}"."${table.name}" AS (
					SELECT * FROM read_parquet([${partitions
						.map((p) => `'${p[1].replaceAll("'", "''")}'`)
						.join(', ')}], hive_partitioning = ${table.useHive ? '1' : '0'})
				);`
			);
		}
	}
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @param {Parameters<typeof cache_for_hash>[2]} [cache_options]
 * @returns {Record<string, unknown>[]}
 */
export function query(sql, cache_options) {
	let result;

	// only cache during build, because
	// parquet can/will eventually change during dev
	if (cache_options?.prerendering) {
		result = get_arrow_if_sql_already_run(sql);
	}

	// TODO: This just fails, where is the process going?
	// if cache missed, fallback to querying
	if (!result) {
		result = connection.query(sql);
	}

	if (cache_options) {
		cache_for_hash(sql, result, cache_options);
	}

	return arrowTableToJSON(result);
}

export { arrowTableToJSON };
