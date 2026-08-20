import { describe, it, expect } from 'vitest';
import { generateSQLQuery, type SQLQueryConfig } from '../../common/sql-options';
import { processColumnExpression } from '../../common/sql-expression-utils';
import { dialectFor, type SqlDialect, type WarehouseType } from '../../../sql-dialect';
import { buildValueQueryOrder } from './filterUtils.svelte';

/**
 * The table-filter value picker (StringValueSelector) lists selectable values with a
 * `SELECT DISTINCT col AS "value", COUNT(*) AS "count" ... ORDER BY …` query. Ordering by
 * the `value`/`count` *aliases* breaks on uppercase-folding warehouses (Snowflake): the
 * alias is emitted quoted-lowercase (`"value"`), but a bare `ORDER BY value` folds to
 * `VALUE` and errors with `invalid identifier 'VALUE'`. The picker must order by the
 * underlying column / `COUNT(*)`. These exercise the real ordering helper
 * (`buildValueQueryOrder`, the exact call the component makes) and feed it through
 * `generateSQLQuery` so an alias-based or wrong-column regression fails the suite.
 */

const WAREHOUSES: WarehouseType[] = [
	'clickhouse',
	'snowflake',
	'bigquery',
	'fabric',
	'databricks',
	'postgres',
	'cube',
	'motherduck'
];

const COLUMN = 'company';

function optionsQuerySql(order: string, dialect: SqlDialect): string {
	const config: SQLQueryConfig = {
		tableExpressionName: 'orders',
		columns: [
			processColumnExpression({ value: `DISTINCT ${COLUMN} as value` }, dialect),
			processColumnExpression({ value: 'COUNT(*) as count' }, dialect)
		],
		where: `${COLUMN} IS NOT NULL`,
		order,
		limit: 10000
	};
	const { sql, error } = generateSQLQuery(
		config,
		undefined,
		undefined,
		undefined,
		'sunday',
		dialect
	);
	expect(error).toBeUndefined();
	return sql!;
}

// The production ordering choice: the column, never the synthetic aliases. If this ever
// regresses to `value` / `count DESC, value`, every dialect assertion below breaks too.
describe('buildValueQueryOrder', () => {
	it('orders by the column when no minimum-records threshold is set', () => {
		expect(buildValueQueryOrder(COLUMN, null)).toBe(COLUMN);
	});

	it('orders by COUNT(*) then the column when a minimum-records threshold is set', () => {
		expect(buildValueQueryOrder(COLUMN, 5)).toBe(`COUNT(*) DESC, ${COLUMN}`);
	});
});

describe.each(WAREHOUSES)('StringValueSelector options-query ordering — %s', (warehouse) => {
	const dialect = dialectFor(warehouse);

	it('default ordering sorts by the column, not the bare `value` alias', () => {
		const sql = optionsQuerySql(buildValueQueryOrder(COLUMN, null), dialect);
		expect(sql).toMatch(new RegExp(`ORDER BY ${COLUMN}\\b`, 'i'));
		expect(sql).not.toMatch(/ORDER BY value\b/i);
	});

	it('minimum-records ordering sorts by COUNT(*) then the column, not bare aliases', () => {
		const sql = optionsQuerySql(buildValueQueryOrder(COLUMN, 5), dialect);
		expect(sql).toMatch(new RegExp(`ORDER BY COUNT\\(\\*\\) DESC, ${COLUMN}\\b`, 'i'));
		expect(sql).not.toMatch(/,\s*value\b/i);
	});

	// Documents the hazard: the old alias-based ordering emitted the failing bare alias.
	it('the previous alias-based ordering would have emitted the failing bare `value`', () => {
		expect(optionsQuerySql('value', dialect)).toMatch(/ORDER BY value\b/i);
	});
});
