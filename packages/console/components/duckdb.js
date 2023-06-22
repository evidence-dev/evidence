import { ConsoleLogger, AsyncDuckDB } from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker';
import { browser } from '$app/environment';

class DuckDBInstance {
	constructor() {
		this.db = undefined;
		this.tables = new Set();
		this.setting_data = new Promise((r) => (this.resolve_initial_data = r));
	}

	async initDB() {
		if (!browser) return;
		if (this.db) return this.db;

		// Instantiate worker
		const logger = new ConsoleLogger();
		const worker = new duckdb_worker();

		// and asynchronous database
		let uninstantiated_db = new AsyncDuckDB(logger, worker);
		await uninstantiated_db.instantiate(duckdb_wasm);
		this.db = uninstantiated_db;
	}

	/**
	 *
	 * @param {string} table
	 * @param {any} data
	 * @returns
	 */
	async setData(table, data) {
		if (!browser) return;
		if (!this.db) await this.initDB();

		await this.db.registerFileText(`${table}.json`, JSON.stringify(data));
		const connection = await this.db.connect();

		if (this.tables.has(table)) {
			await connection.query(`DROP TABLE ${table}`);
		} else this.tables.add(table);

		await connection.insertJSONFromPath(`${table}.json`, { schema: 'main', name: table });

		this.resolve_initial_data();
	}

	/**
	 *
	 * @param {string} sql
	 * @returns
	 */
	async query(sql) {
		if (!browser) return null;

		await this.setting_data;

		const connection = await this.db.connect();

		return connection.query(sql);
	}
}

// @ts-expect-error to be fixed in typescript#52534
/** @type {WeakMap<symbol, DuckDBInstance>} */
// @ts-expect-error to be fixed in typescript#52534
const instances = new WeakMap();

/**
 * Sets the contents of `table` to the JSON object `data`.
 *
 * @param {symbol} instance
 * @param {string} table
 * @param {any} data
 * @returns
 */
async function setData(instance, table, data) {
	if (!browser) return;
	if (!instances.has(instance)) instances.set(instance, new DuckDBInstance());

	return instances.get(instance)?.setData(table, data);
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {symbol} instance
 * @param {string} sql
 * @returns
 */
async function query(instance, sql) {
	if (!browser) return;
	if (!instances.has(instance)) instances.set(instance, new DuckDBInstance());

	return instances.get(instance)?.query(sql);
}

export { query, setData }; // so we can import this elsewhere
