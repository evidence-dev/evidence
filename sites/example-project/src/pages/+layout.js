import { browser } from '$app/environment';

/** @type {import("@duckdb/duckdb-wasm").AsyncDuckDB} */
let db;

async function initDB() {
	if (!browser) return;
	if (db) return db;

	// Instantiate worker
	const duckdb_worker = (
		await import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker')
	).default;
	const { ConsoleLogger, AsyncDuckDB } = await import('@duckdb/duckdb-wasm');
	const duckdb_wasm = (await import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url')).default;

	const logger = new ConsoleLogger();
	const worker = new duckdb_worker();

	// and asynchronous database
	let uninstantiated_db = new AsyncDuckDB(logger, worker);
	await uninstantiated_db.instantiate(duckdb_wasm);
	await uninstantiated_db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });

	db = uninstantiated_db;
}

/** @type {Function} */
let resolve_initial_data;
let setting_data = new Promise((r) => (resolve_initial_data = r));

/**
 * Sets the contents of `table` to the JSON object `data`.
 *
 * @param {string} table
 * @param {any} data
 * @returns {Promise<void>}
 */
async function setData(table, data) {
	if (!browser) return;
	if (!db) await initDB();

	console.time(`setting data for ${table}`);
	const connection = await db.connect();

	if (typeof data === 'object') {
		await db.registerFileText(`${table}.json`, JSON.stringify(data));
		await connection.insertJSONFromPath(`${table}.json`, { schema: 'main', name: table });
	} else if (typeof data === 'string') {
		const random_file_name = `${Math.random().toString(36).substring(7)}.parquet`;
		await db.registerFileURL(random_file_name, data, 4, false);
		await connection.query(
			`CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_parquet('${random_file_name}');`
		);
	}

	await connection.close();
	console.timeEnd(`setting data for ${table}`);

	resolve_initial_data();
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {Promise<ReturnType<import("@duckdb/duckdb-wasm").AsyncDuckDBConnection['query']> | null>}
 */
async function query(sql) {
	if (!browser) return null;

	await setting_data;

	const connection = await db.connect();
	const res = await connection.query(sql).then(arrowTableToJSON);
	await connection.close();

	return res;
}

function arrowTableToJSON(table) {
	if (table == null) return [];

	return table.toArray();
}

export const load = async ({ fetch, route, data: parentData }) => {
	if (route.id && route.id !== '/settings') {
		const { customFormattingSettings, routeHash } = parentData;
		const res = await fetch(`/api/${routeHash}.json`);
		// has to be cloned to bypass the proxy https://github.com/sveltejs/kit/blob/master/packages/kit/src/runtime/server/page/load_data.js#L297
		const { data } = await res.clone().json();

		// for (const [key, value] of Object.entries(data)) {
		//     await setData(key, value);
		// }

		await setData('taxis', '/taxis.parquet');

		return {
			__db: { query },
			data,
			customFormattingSettings
		};
	}
};
