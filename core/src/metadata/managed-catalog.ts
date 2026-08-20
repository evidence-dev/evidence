export const MANAGED_CATALOG_SCOPES = [
	{ database: 'currentDatabase()', prefix: '' },
	{ database: "'demo'", prefix: 'demo.' },
	{ database: "'evidence'", prefix: 'evidence.' }
] as const;

// system.* reads can't be cached; append to any catalog query.
export const NO_QUERY_CACHE = 'SETTINGS use_query_cache = false';

export function managedColumnsSql(): string {
	const select = (scope: (typeof MANAGED_CATALOG_SCOPES)[number]) => {
		const tableExpr = scope.prefix ? `concat('${scope.prefix}', column.table)` : 'column.table';
		return `SELECT
	${tableExpr} AS tableName,
	column.name AS columnName,
	column.type AS columnType
FROM system.columns AS column
WHERE column.database = ${scope.database} AND column.table NOT LIKE '.%'`;
	};
	return MANAGED_CATALOG_SCOPES.map(select).join('\nUNION ALL\n');
}

export function managedViewsSql(): string {
	return `SELECT name FROM system.tables WHERE database = currentDatabase() AND engine LIKE '%View%'`;
}

export function managedModelsSql(): string {
	return `SELECT name FROM system.tables WHERE database = currentDatabase() AND engine = 'MaterializedView'`;
}

export function managedTableNamesSql(): string {
	// total_rows is approximate and NULL for views; surfaced by `tables --verbose`.
	const select = (scope: (typeof MANAGED_CATALOG_SCOPES)[number]) => {
		const nameExpr = scope.prefix ? `concat('${scope.prefix}', t.name)` : 't.name';
		return `SELECT ${nameExpr} AS name, t.total_rows AS rows
FROM system.tables AS t
WHERE t.database = ${scope.database} AND t.name NOT LIKE '.%'`;
	};
	return `SELECT name, rows FROM (\n${MANAGED_CATALOG_SCOPES.map(select).join('\nUNION ALL\n')}\n) ORDER BY name ${NO_QUERY_CACHE}`;
}
