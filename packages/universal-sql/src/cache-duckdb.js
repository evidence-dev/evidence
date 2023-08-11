import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const { tableToIPC } = require('apache-arrow');
// blocking duckdb-wasm uses cjs and need to have same Table declaration for instanceof

/** @type {typeof writeFileSync} */
const writeToPossiblyNonexistentFile = (path, data) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, data);
};

function getCacheFolder(route_hash, additional_hash) {
	if (additional_hash) return `./.evidence-queries/cache/${route_hash}/${additional_hash}`;
	return `./.evidence-queries/cache/${route_hash}`;
}

/**
 * Caches DuckDB queries that have been executed during SSR
 * @param {string} sql_string SQL string executed
 * @param {import("apache-arrow").Table} data result of the query
 * @param {{ route_hash: string, additional_hash: string, query_name: string, prerendering: boolean }} cache_options
 * @returns {void}
 */
export function cache_for_hash(
	sql_string,
	data,
	{ route_hash, additional_hash, query_name, prerendering }
) {
	// keeps a cache of the sql queries for each route
	// for later refreshing without fully rebuilding the site
	const double_cache_path = getCacheFolder(route_hash, additional_hash);
	const sql_path = `${double_cache_path}/_queries.json`;
	if (!existsSync(sql_path)) {
		writeToPossiblyNonexistentFile(sql_path, '{}');
	}
	const sql_cache = JSON.parse(readFileSync(sql_path, 'utf-8'));
	sql_cache[query_name] = sql_string;
	writeFileSync(sql_path, JSON.stringify(sql_cache));

	// write the data to cache
	writeToPossiblyNonexistentFile(`${double_cache_path}/${query_name}.arrow`, tableToIPC(data));

	const cache_path = getCacheFolder(route_hash);
	// keep track of the query names for the page
	writeToPossiblyNonexistentFile(
		`${cache_path}/all-queries.json`,
		JSON.stringify(Object.keys(sql_cache))
	);

	if (prerendering) {
		// while prerendering static sites, sveltekit finds endpoints based on what's used in load functions with
		// the provided fetch - since the data isn't ready yet, instead we write the data to the place where sveltekit
		// would have written it
		const prerender_path = `.svelte-kit/output/prerendered/dependencies/api/${route_hash}`;

		// keep track of the query names for the page
		writeToPossiblyNonexistentFile(
			`${prerender_path}/all-queries.json`,
			JSON.stringify(Object.keys(sql_cache))
		);

		// save the result of the query
		writeToPossiblyNonexistentFile(
			`${prerender_path}/${additional_hash}/${query_name}.arrow`,
			tableToIPC(data)
		);
	}
}

/**
 * Gets the cached arrow response for a given route hash and query name
 * @param {string} route_hash
 * @param {string} additional_hash
 * @param {string} query_name
 * @returns {Buffer}
 */
export function get_cache_for_hash(route_hash, additional_hash, query_name) {
	const cache_path = getCacheFolder(route_hash, additional_hash);
	return readFileSync(`${cache_path}/${query_name}.arrow`);
}

/**
 * Gets all the queries that run on a given page
 * @param {string} route_hash
 * @returns {string}
 */
export function get_all_page_queries(route_hash) {
	const cache_path = getCacheFolder(route_hash);
	return readFileSync(`${cache_path}/all-queries.json`);
}
