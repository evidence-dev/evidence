/**
 * Caches DuckDB queries that have been
 * @param {string} sql_string SQL string executed
 * @param {import("apache-arrow").Table} data result of the query
 * @param {{ route_hash: string, query_name: string, prerendering: boolean }} cache_options
 * @returns {void}
 */
export function cache_for_hash(
	sql_string: string,
	data: import('apache-arrow').Table,
	cache_options: { route_hash: string; query_name: string; prerendering: boolean }
): void;

/**
 * Gets the cached arrow response for a given route hash and query name
 * @param {string} route_hash
 * @param {string} query_name
 * @returns {Buffer}
 */
export function get_cache_for_hash(route_hash: string, query_name: string): Buffer;
