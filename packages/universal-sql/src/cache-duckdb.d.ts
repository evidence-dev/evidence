/**
 * Caches DuckDB queries that have been
 * @param {string} route_hash md5 hash of the route id
 * @param {string} sql_string SQL string executed
 * @param {string} query_name name of the query
 * @param {import("apache-arrow").Table} data result of the query
 * @returns {void}
 */
export function cache_for_hash(
	route_hash: string,
	sql_string: string,
	query_name: string,
	data: import('apache-arrow').Table
): void;

/**
 * Gets the cached arrow response for a given route hash and query name
 * @param {string} route_hash
 * @param {string} query_name
 * @returns {Buffer}
 */
export function get_cache_for_hash(route_hash: string, query_name: string): Buffer;
