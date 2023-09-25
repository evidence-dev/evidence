/**
 * Initializes the database.
 *
 * @returns {Promise<void>}
 */
export async function initDB(): Promise<void>;

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<import('apache-arrow').Table | null>}
 */
export function query(sql: string): Promise<import("apache-arrow").Table<any> | null>;