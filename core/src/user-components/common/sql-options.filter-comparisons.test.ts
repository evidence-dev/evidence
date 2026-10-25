import { describe, it, expect } from 'vitest';
import { queryClickHouse } from '../../test-utils/ch-parse';
import { ClickHouseDialect } from '../../sql-dialect';
import { Filters } from '../../Filters.svelte';
import type { FilterClass } from '../../Filter.svelte';
import { DropdownFilter } from '../tags/dropdown/DropdownFilter.svelte';
import { RangeCalendarFilter } from '../tags/range_calendar/RangeCalendarFilter.svelte';
import { buildBigValueSQLConfig } from '../tags/bigvalue/build-bigvalue-sql';
import { buildTableSQLConfig } from '../tags/table/build-table-sql';
import type { UnifiedColumnDefinition } from '../tags/table/unified-column-definition.types';
import { generateComparisonId } from './build-comparisons';
import { InlineQueries } from './inline-queries';
import { processColumnExpression } from './sql-expression-utils';
import { generateSQLQuery, type SQLQueryConfig } from './sql-options';

// Regression (#3335): a prior-period comparison on a range_calendar in filters=[...] compared the
// range against itself, so the delta was always 0%.

const dialect = new ClickHouseDialect();
const RANGE = '2025-01-08 to 2025-01-14';

function filters(): Filters {
	const pageFilters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: () => dialect
	});
	pageFilters
		.create(
			{
				id: 'dates',
				userComponentName: 'range_calendar',
				attributes: { value_column: 'start_date' }
			},
			RangeCalendarFilter as unknown as FilterClass<'range_calendar', Record<string, unknown>>
		)
		.setDefault({ range: RANGE });
	pageFilters
		.create(
			{
				id: 'region',
				userComponentName: 'dropdown',
				attributes: { value_column: 'region', multiple: false }
			},
			DropdownFilter as unknown as FilterClass<'dropdown', Record<string, unknown>>
		)
		.setDefault('East');
	return pageFilters;
}

// East: Dec 2024 = 999, Jan 1-7 = 100, Jan 8-14 = 150, Jan 8-14 2024 = 75. West shows up if a
// filter is dropped from the comparison.
function generate(config: SQLQueryConfig): string {
	const filterContexts = [filters()];
	const inlineQueries = new InlineQueries({ filterContexts });
	inlineQueries.set(
		'sales',
		`select * from values('start_date Date, region String, amount Float64',
			('2025-01-03', 'East', 100), ('2025-01-09', 'East', 60), ('2025-01-14', 'East', 90),
			('2024-01-10', 'East', 75), ('2024-12-20', 'East', 999),
			('2025-01-04', 'West', 7), ('2025-01-10', 'West', 11))`
	);
	const { sql, error } = generateSQLQuery(
		config,
		filterContexts,
		inlineQueries,
		undefined,
		'sunday',
		dialect
	);
	expect(error).toBeFalsy();
	return sql;
}

function query(config: SQLQueryConfig): string[][] {
	return queryClickHouse(generate(config))
		.trim()
		.split('\n')
		.map((row) => row.split('\t'));
}

function bigValue(
	attrs: Partial<Parameters<typeof buildBigValueSQLConfig>[0]>,
	compare_vs: 'prior period' | 'prior year' = 'prior period'
) {
	return buildBigValueSQLConfig({
		data: 'sales',
		value: 'sum(amount)',
		comparison: { compare_vs },
		dialect,
		...attrs
	});
}

// Minimal stand-ins for what DimensionModel/MeasureModel produce, as in table.test.ts.
function dim(value: string, date_grain?: string): UnifiedColumnDefinition {
	const p = processColumnExpression({ value, type: 'dimension', dateGrain: date_grain }, dialect);
	return {
		type: 'dimension',
		processedColumnExpression: p,
		sqlWithAlias: p.sqlWithAlias,
		alias: p.alias,
		columnIdForRendering: p.alias,
		sqlWithoutAlias: p.sqlWithoutAlias,
		isComplexExpression: p.isComplexExpression,
		date_grain,
		isTemporalDateGrain: p.isTemporalDateGrain
	};
}

function measure(
	value: string,
	compare_vs: 'prior period' | 'prior year'
): UnifiedColumnDefinition {
	const p = processColumnExpression({ value, type: 'measure' }, dialect);
	return {
		type: 'measure',
		processedColumnExpression: p,
		sqlWithAlias: p.sqlWithAlias,
		alias: p.alias,
		columnIdForRendering: p.alias,
		sqlWithoutAlias: p.sqlWithoutAlias,
		isComplexExpression: p.isComplexExpression,
		comparison: {
			compare_vs,
			display_type: 'compared_value',
			id: generateComparisonId(p.alias, compare_vs)
		}
	} as UnifiedColumnDefinition;
}

describe('comparisons with a date filter in filters=[...]', () => {
	it('compares a range_calendar range against the period before it, like date_range=', () => {
		const rows = query(bigValue({ filters: ['dates'] }));
		expect(rows).toEqual([
			['161', 'Jan 8/25 - Jan 14/25', 'Jan 1/25 - Jan 7/25', '107', '54', '0.5046728971962616']
		]);
		expect(rows).toEqual(query(bigValue({ date_range: { range: RANGE, date: 'start_date' } })));
	});

	it('keeps the other filters on the comparison period', () => {
		expect(query(bigValue({ filters: ['dates', 'region'] }))).toEqual([
			['150', 'Jan 8/25 - Jan 14/25', 'Jan 1/25 - Jan 7/25', '100', '50', '0.5']
		]);
	});

	it('compares against the same range last year', () => {
		const [[value, , , compared]] = query(bigValue({ filters: ['dates', 'region'] }, 'prior year'));
		expect([value, compared]).toEqual(['150', '75']);
	});

	it('leaves an explicit date_range alone', () => {
		const config = bigValue({
			filters: ['dates'],
			date_range: { range: '2025-01-01 to 2025-01-07', date: 'start_date' }
		});
		const sql = generate(config);
		const cte = sql.slice(sql.indexOf('comparison_1_fragment'));
		// The explicit range is the one that shifts; the calendar still filters both periods.
		expect(cte).toContain("date_add(day, -7, toDate('2025-01-01'))");
		expect(cte).toContain("start_date >= toDate('2025-01-08')");
	});

	it('compares each table row against the prior period', () => {
		const region = dim('region');
		const amount = measure('sum(amount)', 'prior period');
		const sql = generate(
			buildTableSQLConfig({
				data: 'sales',
				unifiedColumns: [region, amount],
				filters: ['dates'],
				dialect
			})
		);
		const id = generateComparisonId(amount.alias, 'prior period');
		// Dimension and compared value only, so the rows don't depend on how labels are rendered.
		expect(
			queryClickHouse(
				`SELECT "${region.alias}", "${amount.alias}", "${id}_compared_value" FROM (${sql}) ORDER BY 1`
			)
		).toBe('East\t150\t100\nWest\t11\t7\n');
	});

	it('compares each row of a table with a date dimension against the same day last year', () => {
		const day = dim('start_date', 'day');
		const amount = measure('sum(amount)', 'prior year');
		const id = generateComparisonId(amount.alias, 'prior year');
		const rows = (attrs: { filters?: string[]; date_range?: { range: string; date: string } }) =>
			queryClickHouse(
				`SELECT toString(toDate("${day.alias}")), "${amount.alias}", "${id}_compared_value" FROM (${generate(
					buildTableSQLConfig({ data: 'sales', unifiedColumns: [day, amount], dialect, ...attrs })
				)}) ORDER BY 1`
			)
				.trim()
				.split('\n')
				.map((row) => row.split('\t'));
		const viaFilter = rows({ filters: ['dates'] });
		// Jan 10 2024 = 75 is the only row on the same days last year.
		expect(viaFilter.map(([date, value]) => [date, value])).toEqual([
			['2025-01-09', '60'],
			['2025-01-10', '11'],
			['2025-01-14', '90']
		]);
		expect(viaFilter[1][2]).toBe('75');
		// Days with no row last year get the engine's join default, so only require date_range='s rows.
		expect(viaFilter).toEqual(rows({ date_range: { range: RANGE, date: 'start_date' } }));
	});
});
