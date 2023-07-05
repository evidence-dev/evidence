import { NODE_RUNTIME, DuckDBDataProtocol, createDuckDB, ConsoleLogger } from '@duckdb/duckdb-wasm/dist/duckdb-node-blocking';
import { createRequire } from 'module';
import { resolve, dirname } from "path";
import { Type } from 'apache-arrow';
const require = createRequire(import.meta.url);
const DUCKDB_DIST = dirname(require.resolve('@duckdb/duckdb-wasm'));

/** @type {Awaited<ReturnType<typeof createDuckDB>>} */
let db;

export async function initDB() {
	if (db) return;

    const DUCKDB_BUNDLES = {
        mvp: {
            mainModule: resolve(DUCKDB_DIST, './duckdb-mvp.wasm'),
            mainWorker: resolve(DUCKDB_DIST, './duckdb-node-mvp.worker.cjs'),
        },
        eh: {
            mainModule: resolve(DUCKDB_DIST, './duckdb-eh.wasm'),
            mainWorker: resolve(DUCKDB_DIST, './duckdb-node-eh.worker.cjs'),
        },
    };
    const logger = new ConsoleLogger();

	// and synchronous database
	db = await createDuckDB(DUCKDB_BUNDLES, logger, NODE_RUNTIME);
	await db.instantiate();
	db.open({ query: { castBigIntToDouble: true, castTimestampToDate: true } });
}

/**
 * Adds a new view to the database, pointing to the provided parquet URL.
 *
 * @param {string} table
 * @param {string} url
 * @returns {void}
 */
export function setParquetURL(table, url) {
	const connection = db.connect();

	const file_name = `${table}.parquet`;
	db.registerFileURL(file_name, `./static${url}`, DuckDBDataProtocol.NODE_FS, false);
	connection.query(
		`CREATE OR REPLACE VIEW ${table} AS SELECT * FROM read_parquet('${file_name}');`
	);

	connection.close();
}

/**
 * Queries the database with the given SQL statement.
 *
 * @param {string} sql
 * @returns {ReturnType<import("@duckdb/duckdb-wasm").AsyncDuckDBConnection['query']> | null}
 */
export function query(sql) {
	const connection = db.connect();
	const res = arrowTableToJSON(connection.query(sql));
    connection.close();

    console.log({ node: res })

	return res;
}

/**
 * Converts an Apache Arrow type to an Evidence type.
 *
 * @param {import("apache-arrow").Type} type
 */
function apacheToEvidenceType(type) {
	switch (
		type.typeId // maybe just replace with `typeof`
	) {
		case Type.Date:
			return 'date';
		case Type.Float:
		case Type.Int:
			return 'number';
		case Type.Bool:
			return 'boolean';
		case Type.Dictionary:
		default:
			return 'string';
	}
}

/**
 *
 * @param {import("apache-arrow").Table} table
 * @returns
 */
export function arrowTableToJSON(table) {
	if (table == null) return [];
	const arr = table.toArray();

	Object.defineProperty(arr, '_evidenceColumnTypes', {
		enumerable: false,
		value: table.schema.fields.map((field) => ({
			name: field.name,
			evidenceType: apacheToEvidenceType(field.type),
			typeFidelity: 'precise'
		}))
	});

	return arr;
}