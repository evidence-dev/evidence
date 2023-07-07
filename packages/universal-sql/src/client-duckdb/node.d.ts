export { tableFromIPC } from 'apache-arrow';

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export function initDB(): Promise<void>;

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @param {{ route_hash: string, query_name: string }} cache_options
 * @returns {import('apache-arrow').Table | null}
 */
export function query(
	sql: string,
	cache_options?: { route_hash: string; query_name: string }
): import('apache-arrow').Table | null;

/**
 * Adds a new view to the database, pointing to the provided parquet URLs.
 *
 * @param {string[]} urls
 * @returns {void}
 */
export function setParquetURLs(urls: string): void;

/**
 * Converts an Apache Arrow table to a Javascript array.
 * @param {import("apache-arrow").Table} table
 * @returns {any[]}
 */
export function arrowTableToJSON(table: import('apache-arrow').Table): any[];
