import { ConsoleLogger, AsyncDuckDB } from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker';
import { browser } from '$app/environment';

let db: AsyncDuckDB;

async function initDB() {
	if (!browser) return;
	if (db) return db;

	// Instantiate worker
	const logger = new ConsoleLogger();
	const worker = new duckdb_worker();

	// and asynchronous database
	let uninstantiated_db = new AsyncDuckDB(logger, worker);
	await uninstantiated_db.instantiate(duckdb_wasm);
	db = uninstantiated_db;
}

const tables = new Set();

let resolve_initial_data: Function;
let setting_data = new Promise((r) => (resolve_initial_data = r));

async function setData(table: string, data: any) {
	if (!browser) return;
	if (!db) await initDB();

	await db.registerFileText(`${table}.json`, JSON.stringify(data));
	const connection = await db.connect();

	if (tables.has(table)) {
		await connection.query(`DROP TABLE ${table}`);
	} else tables.add(table);

	await connection.insertJSONFromPath(`${table}.json`, { schema: 'main', name: table });

	resolve_initial_data();
}

async function query(sql: string) {
	if (!browser) return {};

	await setting_data;

	const connection = await db.connect();

	return connection.query<Record<string, any>>(sql);
}

export { query, setData }; // so we can import this elsewhere
