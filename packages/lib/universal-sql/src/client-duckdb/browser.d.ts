export { tableFromIPC } from 'apache-arrow';

/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export function initDB(): Promise<void>;

/**
 * Updates the duckdb search path to include only the list of included schemas
 * @param {string[]} schemas
 * @returns {Promise<void>}
 */
export function updateSearchPath(schemas): Promise<void>;
/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import('apache-arrow').Table | null>}
 */
export function query(sql: string): Promise<import('apache-arrow').Table | null>;

/**
 * Adds a new view to the database, pointing to the provided parquet URLs.
 *
 * @param {Record<string, string[]>} urls
 * @param {{ append?: boolean, addBasePath?: (path: string) => string }} [opts]
 * @returns {Promise<void>}
 */
export function setParquetURLs(
	urls: Record<string, string[]>,
	opts?: { append?: boolean; addBasePath?: (path: string) => string }
): Promise<void>;

/**
 * Converts an Apache Arrow table to a Javascript array.
 * @param {import("apache-arrow").Table} table
 * @returns {any[]}
 */
export function arrowTableToJSON(table: import('apache-arrow').Table): any[];
