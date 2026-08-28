import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateSQLQuery, type SQLQueryConfig } from './sql-options';
import { processColumnExpression } from './sql-expression-utils';
import { dialectFor, type SqlDialect, type WarehouseType } from '../../sql-dialect';

/**
 * Data-driven inputs (dropdown, button_group, input_tabs, table_filter, repeat) list the
 * values of a column with an options query. That query has no aggregate over the value
 * column, so `generateSQLQuery` puts the column in the GROUP BY — which is what makes the
 * options distinct.
 *
 * Baking `DISTINCT` into the column expression instead put it in the GROUP BY too
 * (`GROUP BY DISTINCT store`), because `processColumnExpression` keeps the whole string as
 * `sqlWithoutAlias` and `hasAgg` doesn't recognise a bare quantifier. Postgres 14+ accepts
 * that form (it de-duplicates grouping sets), so it went unnoticed; Cube's DataFusion-based
 * parser rejects it with `Expected: joined table, found: store` and every dropdown rendered
 * "No options found".
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

const COLUMN = 'store';

/** The shape every data-driven input builds: value column, optional label, no aggregate. */
function optionsQuerySql(dialect: SqlDialect, withLabel: boolean): string {
	const columns = [processColumnExpression({ value: `${COLUMN} as value` }, dialect)];
	if (withLabel) {
		columns.push(processColumnExpression({ value: 'store_name as label' }, dialect));
	}
	const config: SQLQueryConfig = {
		tableExpressionName: 'ga4_sessions',
		columns,
		where: `${COLUMN} IS NOT NULL`,
		order: COLUMN,
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

/**
 * The GROUP BY clause only — deliberately not the whole query. `DISTINCT` is legal
 * elsewhere: `shouldAddDistinct` exists to put one on the SELECT list, and `IS NOT DISTINCT
 * FROM` is this codebase's own null-safe equality (`SqlDialect.nullSafeEqual`), which an
 * author's `where` could contain. Asserting over the whole query would fail on SQL that
 * isn't broken.
 */
function groupByClause(sql: string): string {
	const match = /\bGROUP BY\b([\s\S]*?)(?=\bHAVING\b|\bQUALIFY\b|\bORDER BY\b|\bLIMIT\b|\bOFFSET\b|$)/i.exec(
		sql
	);
	expect(match, `no GROUP BY in: ${sql}`).not.toBeNull();
	return match![1];
}

describe.each(WAREHOUSES)('options query for data-driven inputs — %s', (warehouse) => {
	const dialect = dialectFor(warehouse);

	it.each([
		['value only', false],
		['value and label', true]
	])('emits no DISTINCT quantifier in the GROUP BY (%s)', (_label, withLabel) => {
		expect(groupByClause(optionsQuerySql(dialect, withLabel as boolean))).not.toMatch(
			/\bDISTINCT\b/i
		);
	});

	it('still de-duplicates via GROUP BY', () => {
		// Either an explicit list or `GROUP BY ALL`, depending on the dialect — but never absent,
		// since the GROUP BY is the only thing making the options unique.
		expect(groupByClause(optionsQuerySql(dialect, false)).trim()).not.toBe('');
	});
});

/**
 * A guard on the call sites themselves: the components build their value column as a
 * template string, so a regression would reintroduce `DISTINCT ${col} as value` without
 * failing any assertion above.
 */
describe('data-driven input call sites', () => {
	const CALL_SITES = [
		'../tags/dropdown/Dropdown.svelte',
		'../tags/button_group/ButtonGroup.svelte',
		'../tags/input_tabs/InputTabs.svelte',
		'../tags/table_filter/StringValueSelector.svelte',
		'../tags/repeat/build-repeat-query-config.ts'
	];

	it.each(CALL_SITES)('%s does not bake DISTINCT into the value column expression', (relative) => {
		const source = readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
		expect(source).not.toMatch(/value:\s*[`'"]\s*DISTINCT\b/i);
	});
});
