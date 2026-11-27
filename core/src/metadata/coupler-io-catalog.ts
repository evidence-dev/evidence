/**
 * Schema-browser catalog statements for the Coupler.io connector. The connector
 * answers them from the Public API (dataset list, dataset columns) instead of
 * sending them as SQL, so the metadata loader can read the catalog through the
 * ordinary query path.
 */

export const COUPLER_IO_TABLES_SQL = 'SELECT name, rows FROM coupler_io_catalog.tables';
export const COUPLER_IO_COLUMNS_SQL =
	'SELECT "tableName", "columnName", "columnType" FROM coupler_io_catalog.columns';

export function isCouplerIoCatalogSql(sql: string): 'tables' | 'columns' | null {
	if (sql.includes('coupler_io_catalog.tables')) return 'tables';
	if (sql.includes('coupler_io_catalog.columns')) return 'columns';
	return null;
}
