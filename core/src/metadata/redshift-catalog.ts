/**
 * current_schema() is a leader-node-only function on Redshift: it errors inside any
 * statement that also reads an SVV/SVL view or a user table, so the svv_columns /
 * svv_tables scans can't call it inline the way the Postgres loader does. Resolve it
 * with this table-less statement (runs on the leader) and unqualify client-side.
 */
export const REDSHIFT_CURRENT_SCHEMA_SQL = 'SELECT current_schema() AS current_schema';

/** `svv_tables.table_type` for Spectrum / external-catalog tables. */
export const REDSHIFT_EXTERNAL_TABLE_TYPE = 'EXTERNAL TABLE';

/**
 * Every Redshift materialized view is backed by an internal `mv_tbl__<name>__N` table
 * that the SVV catalog views list as a BASE TABLE. It is not queryable by users, so hide it.
 */
export function isRedshiftInternalTable(name: string): boolean {
	return name.startsWith('mv_tbl__');
}

/**
 * Tables in the connection's current schema show unqualified, everything else
 * `schema.table`. External tables are always qualified: Redshift's search_path does not
 * apply to external schemas, so an unqualified reference to one never resolves.
 */
export function qualifyRedshiftTableName(
	schema: string,
	name: string,
	currentSchema: string | undefined,
	opts: { external?: boolean } = {}
): string {
	return !opts.external && schema === currentSchema ? name : `${schema}.${name}`;
}
