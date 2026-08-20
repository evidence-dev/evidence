/**
 * Canonical warehouse-mode union, shared between core and studio.
 *
 * `mode` is broader than `dialect.name` — it includes `managed`, which means
 * "use the hosted ClickHouse query engine" rather than naming a SQL dialect.
 */
export const WAREHOUSE_MODES = [
	'managed',
	'snowflake',
	'bigquery',
	'fabric',
	'clickhouse',
	'databricks',
	'postgres',
	'cube',
	'motherduck'
] as const;

export type WarehouseMode = (typeof WAREHOUSE_MODES)[number];
