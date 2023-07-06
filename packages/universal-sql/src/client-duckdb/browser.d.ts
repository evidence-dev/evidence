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
 * @returns {Promise<import('apache-arrow').Table | null>}
 */
export function query(sql: string): Promise<import('apache-arrow').Table | null>;

/**
 * Adds a new view to the database, pointing to the provided parquet URL.
 *
 * @param {string} table
 * @param {string} url
 * @returns {Promise<void>}
 */
export function setParquetURL(table: string, url: string): Promise<void>;

/**
 * Converts an Apache Arrow table to a Javascript array.
 * @param {import("apache-arrow").Table} table
 * @returns {any[]}
 */
export function arrowTableToJSON(table: import('apache-arrow').Table): any[];
