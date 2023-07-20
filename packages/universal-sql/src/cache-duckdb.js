import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { tableToIPC } = require('apache-arrow');
// blocking duckdb-wasm uses cjs and need to have same Table declaration for instanceof

/**
 * Caches DuckDB queries that have been
 * @param {string} route_hash md5 hash of the route id
 * @param {string} sql_string SQL string executed
 * @param {string} query_name name of the query
 * @param {import("apache-arrow").Table} data result of the query
 * @param {boolean} [data] whether or not we're prerendering
 * @returns {void}
 */
export function cache_for_hash(route_hash, sql_string, query_name, data, prerendering = false) {
	// keeps a cache of the sql queries for each route
	// for later refreshing without fully rebuilding the site
	const cache_path = `./.evidence-queries/cache/${route_hash}`;
	const sql_path = `${cache_path}/_queries.json`;
	if (!existsSync(sql_path)) {
		mkdirSync(cache_path, { recursive: true });
		writeFileSync(sql_path, '{}');
	}
	const sql_cache = JSON.parse(readFileSync(sql_path, 'utf-8'));
	sql_cache[query_name] = sql_string;
	writeFileSync(sql_path, JSON.stringify(sql_cache));

	// write the data to cache
	writeFileSync(`${cache_path}/${query_name}.arrow`, tableToIPC(data));

	if (prerendering) {
		// simulate prerendering during build
		const prerender_path = `.svelte-kit/output/prerendered/dependencies/api/${route_hash}`;
		mkdirSync(prerender_path, { recursive: true });
		writeFileSync(`${prerender_path}/${query_name}.arrow`, tableToIPC(data));
	}
}

/**
 * Gets the cached arrow response for a given route hash and query name
 * @param {string} route_hash
 * @param {string} query_name
 * @returns {Buffer}
 */
export function get_cache_for_hash(route_hash, query_name) {
	const cache_path = `./.evidence-queries/cache/${route_hash}`;
	return readFileSync(`${cache_path}/${query_name}.arrow`);
}
