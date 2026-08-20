import { describe, it, expect } from 'vitest';
import {
	generateSQLQuery,
	generateGroupingSets,
	generateSubtotalHelperColumns
} from './sql-options';
import type { SQLQueryConfig } from './sql-options';
import { processColumnExpression, applyAggregateFilter } from './sql-expression-utils';
import { dialectFor, type SqlDialect, type WarehouseType } from '../../sql-dialect';
import { Filters } from '../../Filters.svelte';

/**
 * Golden snapshots of the SQL emitted for every dialect — a regression net for
 * the multi-connection prep refactors (QUERY_AND_DIALECT_SYSTEM.md, Appendix B),
 * which must be strict no-ops: a changed snapshot means generated SQL changed.
 * Configs avoid calendar-date computation (date grains wrap the column but
 * compute no dates) so snapshots don't depend on the machine timezone.
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

/** A grouped chart: one dimension + one measure, ordered and limited. */
function groupedChart(dialect: SqlDialect): SQLQueryConfig {
	return {
		tableExpressionName: 'orders',
		columns: [
			processColumnExpression({ value: 'category', type: 'dimension' }, dialect),
			processColumnExpression({ value: 'sum(sales)', type: 'measure' }, dialect)
		],
		order: 'category desc',
		limit: 100
	};
}

/** A date-grain dimension exercises the dialect's date-truncation SQL. */
function dateGrainDimension(dialect: SqlDialect): SQLQueryConfig {
	return {
		tableExpressionName: 'orders',
		columns: [
			processColumnExpression({ value: 'category', type: 'dimension' }, dialect),
			processColumnExpression(
				{ value: 'order_date', type: 'dimension', dateGrain: 'month' },
				dialect
			),
			processColumnExpression({ value: 'sum(sales)', type: 'measure' }, dialect)
		]
	};
}

/** A table with subtotals exercises GROUPING SETS + the helper columns. */
function subtotalsTable(dialect: SqlDialect): SQLQueryConfig {
	const columns = [
		processColumnExpression({ value: 'category', type: 'dimension' }, dialect),
		processColumnExpression({ value: 'region', type: 'dimension' }, dialect),
		processColumnExpression({ value: 'sum(sales)', type: 'measure' }, dialect)
	];
	return {
		tableExpressionName: 'orders',
		columns,
		subtotals: true,
		groupingSets: generateGroupingSets(columns),
		subtotalHelperColumns: generateSubtotalHelperColumns(columns, dialect)
	};
}

/** Search + pagination exercises the row-limit clause, subquery wrap, and search predicate. */
function searchAndPagination(dialect: SqlDialect): SQLQueryConfig {
	return {
		tableExpressionName: 'orders',
		columns: [
			processColumnExpression({ value: 'category', type: 'dimension' }, dialect),
			processColumnExpression({ value: 'sum(sales)', type: 'measure' }, dialect)
		],
		search: { term: 'abc' },
		hasMeasures: true,
		limit: 2000,
		page_size: 10,
		offset: 20
	};
}

const CONFIGS: Record<string, (dialect: SqlDialect) => SQLQueryConfig> = {
	'grouped chart': groupedChart,
	'date-grain dimension': dateGrainDimension,
	'subtotals table': subtotalsTable,
	'search + pagination': searchAndPagination
};

describe.each(WAREHOUSES)('generateSQLQuery — %s', (warehouse) => {
	const dialect = dialectFor(warehouse);

	for (const [name, build] of Object.entries(CONFIGS)) {
		it(name, () => {
			const { sql, error } = generateSQLQuery(
				build(dialect),
				undefined,
				undefined,
				undefined,
				'sunday',
				dialect
			);
			expect(error).toBeUndefined();
			expect(sql).toMatchSnapshot();
		});
	}
});

/**
 * The filter-routing boundary: `filterIds` + a real filter context flow through
 * processFilterIds into the WHERE clause. Guards the consumer-side predicate
 * refactor, which reroutes this path (Filter.sql → predicateSql(dialect)) and
 * would otherwise drop or alter predicates with no snapshot changing. A quoted
 * scalar and a list value pin the dialect's value escaping and IN rendering.
 */
describe.each(WAREHOUSES)('generateSQLQuery with filters — %s', (warehouse) => {
	const dialect = dialectFor(warehouse);

	it('routes column-bound filter predicates into the WHERE clause', () => {
		const filters = new Filters({
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect: () => dialect
		});
		filters.createExternal('category_sel', "O'Brien", 'category');
		filters.createExternal('region_sel', ['East', 'West'], 'region');

		const config: SQLQueryConfig = {
			...groupedChart(dialect),
			filterIds: ['category_sel', 'region_sel']
		};

		const { sql, error } = generateSQLQuery(
			config,
			[filters],
			undefined,
			undefined,
			'sunday',
			dialect
		);
		expect(error).toBeUndefined();
		expect(sql).toMatchSnapshot();
	});
});

/**
 * A compound measure with a pushed-down predicate: ClickHouse emits per-aggregate
 * `FILTER (WHERE …)`, dialects without it rewrite each aggregate as `CASE WHEN`.
 * A synthetic predicate keeps this free of date computation (and so timezone-stable).
 */
describe.each(WAREHOUSES)('applyAggregateFilter — %s', (warehouse) => {
	const dialect = dialectFor(warehouse);

	it('distributes a predicate across a compound measure', () => {
		const result = applyAggregateFilter(
			'sum(sales) / nullif(sum(quantity), 0)',
			"order_date >= '2024-01-01'",
			dialect
		);
		expect(result).toMatchSnapshot();
	});
});
