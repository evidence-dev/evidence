/**
 * Caches DuckDB queries that have been 
 * @param {string} route_hash md5 hash of the route id
 * @param {string} sql_string SQL string executed
 * @param {string} query_name name of the query
 * @param {import("apache-arrow").Table} data result of the query
 * @returns {void}
 */
export function cache_for_hash(route_hash: string, sql_string: string, query_name: string, data: import("apache-arrow").Table): void;

/**
 * Gets the cached SQL for a route hash
 * @param {string} route_hash md5 hash of the route id
 * @returns {FormData}
 */
export function get_cached_sql(route_hash: string): FormData;