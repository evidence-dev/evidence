import { escapeSqlValue, type SqlDialect } from './sql-dialect';

/**
 * Shared `col = / IN` predicate for the dropdown-family filters. The dialect is a
 * parameter so a filter shared across warehouses escapes per the consuming query.
 */
export function renderColumnPredicate(
	column: string,
	value: unknown,
	dialect?: SqlDialect
): string | undefined {
	if (Array.isArray(value)) {
		if (value.length === 0) return undefined;
		return `${column} IN (${value.map((v) => `'${escapeSqlValue(String(v), dialect)}'`).join(', ')})`;
	}
	if (value === undefined || value === null || value === '') return undefined;
	return `${column}='${escapeSqlValue(String(value), dialect)}'`;
}
