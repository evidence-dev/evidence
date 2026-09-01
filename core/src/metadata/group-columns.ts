import type { IColumnMetadata } from './metadata';

/**
 * Groups catalog rows by table in one pass.
 *
 * Grouping with a `filter()` inside a loop over table names is O(tables x rows),
 * which stalls the main thread on a large warehouse — the catalog load runs on
 * every authenticated route, so that cost is paid on every page.
 *
 * Catalog queries order by table then ordinal position, so insertion order
 * preserves each table's on-disk column order.
 */
export function groupColumnsByTable<Row>(
	rows: readonly Row[],
	tableKey: (row: Row) => string,
	toColumn: (row: Row) => IColumnMetadata
): Map<string, Record<string, IColumnMetadata>> {
	const byTable = new Map<string, Record<string, IColumnMetadata>>();

	for (const row of rows) {
		const key = tableKey(row);
		let columns = byTable.get(key);
		if (!columns) {
			columns = {};
			byTable.set(key, columns);
		}
		const column = toColumn(row);
		columns[column.name] = column;
	}

	return byTable;
}
