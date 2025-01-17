import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { dirname } from 'path';

/*
	apache-arrow is a cjs module, so we need to require it
	apache-arrow also uses a lot of `instanceof`, which is very fragile in javascript
	By requiring apache-arrow relative to duckdb-wasm, we can be sure that we are sharing
	the same references with duckdb, thus making instanceof work again.
*/
const require1 = createRequire(import.meta.url);
const require = createRequire(require1.resolve('@duckdb/duckdb-wasm'));

const { tableToIPC, tableFromIPC } = require('apache-arrow');
// blocking duckdb-wasm uses cjs and need to have same Table declaration for instanceof

/*
Caching strategy:
- SQL string and the corresponding output from that is fed to `cache_for_hash`
- Additional route and query information is also given
- If the SQL has not been cached yet, it is written to
	1. the cache folder, and, if we're building,
	2. the location sveltekit writes prerendered API routes (`prerender_path`)

- The SQL string and hash of the resulting arrow table are then written to a route-specific _queries.json
  which will be used when we're refreshing routes in the future (will likely change by then)

- A subset of _queries.json (just query name -> result hash object) is written to a route-specific 
  `all-queries.json` which is used by `+layout.js` to load the prerendered data
*/

/** @type {typeof writeFileSync} */
const writeToPossiblyNonexistentFile = (path, data) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, data);
};

function getCacheFolder(route_hash, additional_hash) {
	if (additional_hash) return `./.evidence-queries/cache/${route_hash}/${additional_hash}`;
	else if (route_hash) return `./.evidence-queries/cache/${route_hash}`;
	else return `./.evidence-queries/cache`;
}

/**
 *
 * @param {Uint8Array | string} buffer
 * @returns {string}
 */
function hash(buffer) {
	return createHash('md5').update(buffer).digest('hex');
}

/**
 * Points SQL strings to a hash of their output
 * @type {Map<string, string>}
 */
const sql_string_cache = new Map();

// while prerendering static sites, sveltekit finds endpoints based on what's used in load functions with
// the provided fetch - since the data isn't ready yet, instead we write the data to the place where sveltekit
// would have written it
const prerender_path = `.svelte-kit/output/prerendered/dependencies`;

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
	// if the it's in the cache then we shouldn't bother
	let ipc_table_hash = sql_string_cache.get(sql_string);

	// this can only be false during `prerendering`
	if (!sql_string_cache.has(sql_string)) {
		const ipc_table = tableToIPC(data);
		ipc_table_hash = hash(ipc_table);

		// write the data to cache
		// query caches are grouped by the hash of the ipc_table
		// this prevents duplicate queries (ie parameterized page queries) from exploding built site size
		const base_cache_path = getCacheFolder();
		writeToPossiblyNonexistentFile(`${base_cache_path}/${ipc_table_hash}.arrow`, ipc_table);
		if (prerendering) {
			// save the result of the query
			writeToPossiblyNonexistentFile(
				`${prerender_path}/api/prerendered_queries/${ipc_table_hash}.arrow`,
				ipc_table
			);
			sql_string_cache.set(sql_string, ipc_table_hash);
		}
	}

	// keeps a cache of the sql queries for each route
	// for later refreshing without fully rebuilding the site
	const double_cache_path = getCacheFolder(route_hash, additional_hash);
	const sql_path = `${double_cache_path}/_queries.json`;
	if (!existsSync(sql_path)) {
		writeToPossiblyNonexistentFile(sql_path, '{}');
	}
	const sql_cache = JSON.parse(readFileSync(sql_path, 'utf-8'));
	sql_cache[query_name] = { sql_string, query_hash: ipc_table_hash };
	writeFileSync(sql_path, JSON.stringify(sql_cache));

	// keep track of query hashes so `+layout.js` knows what to fetch
	const sql_cache_with_hashed_query_strings = Object.fromEntries(
		Object.entries(sql_cache).map((entry) => [entry[0], entry[1].query_hash])
	);
	/* 
		uses double cache path because parameterized pages could theoretically have
		distinct queries run in them, such as:
		{#if params.country === 'USA'}
			<Dropdown />
		{:else}
			<Slider />
		{/if}
	*/
	writeToPossiblyNonexistentFile(
		`${double_cache_path}/all-queries.json`,
		JSON.stringify(sql_cache_with_hashed_query_strings)
	);
	if (prerendering) {
		// keep track of the query names for the page
		writeToPossiblyNonexistentFile(
			`${prerender_path}/api/${route_hash}/${additional_hash}/all-queries.json`,
			JSON.stringify(sql_cache_with_hashed_query_strings)
		);
	}
}

/**
 * Gets the cached arrow response for a given route hash and query name
 * @param {string} query_hash
 * @returns {Buffer}
 */
export function get_cache_for_hash(query_hash) {
	const cache_path = getCacheFolder();
	return readFileSync(`${cache_path}/${query_hash}.arrow`);
}

/**
 * Gets all the queries that run on a given page
 * @param {string} route_hash
 * @param {string} additional_hash
 * @returns {string}
 */
export function get_all_page_queries(route_hash, additional_hash) {
	try {
		const cache_path = getCacheFolder(route_hash, additional_hash);

		// Check if the file exists before attempting to read it
		const file_path = `${cache_path}/all-queries.json`;
		if (!existsSync(file_path)) {
			return '{}'; // Return an empty object string as a fallback
		}

		// Read and return the file contents
		return readFileSync(file_path, 'utf8');
	} catch (error) {
		// Log the error and return a fallback
		console.error(`Error reading all-queries.json:`, error);
		return '{}'; // Return an empty object string as a fallback
	}
}

/**
 * If a string has already been queried during the lifetime of the program
 * fetch it from cache instead of re-executing it
 *
 * Only runs during build
 * @param {string} sql
 * @returns {import("apache-arrow").Table | null}
 */
export function get_arrow_if_sql_already_run(sql) {
	if (!sql_string_cache.has(sql)) return null;
	return tableFromIPC(get_cache_for_hash(sql_string_cache.get(sql)));
}
