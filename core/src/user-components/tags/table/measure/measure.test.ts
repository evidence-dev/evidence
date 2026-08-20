import { describe, it, expect } from 'vitest';
import { assertExprParses } from '../../../../test-utils/ch-parse';
import { processColumnExpression } from '../../../common/sql-expression-utils';

// Measure-level `date_range` distributes the predicate into each aggregate.
// ClickHouse (default dialect) uses `FILTER (WHERE …)` per aggregate.
// Snowflake/BigQuery use `CASE WHEN … THEN args END` inside each aggregate.
describe('measure-level date_range SQL', () => {
	const anchorDate = new Date(2026, 0, 1);

	it('last 30 days — FILTER + toDate bounds', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: 'last 30 days' },
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(
			`"sum(total_sales) FILTER (WHERE date >= toDate('2025-12-03') AND date <= toDate('2026-01-01')) AS "sum_total_sales__l30d""`
		);
		expect(processed.hasDateRange).toBe(true);
		expect(processed.sqlWithoutDateFiltersOrAlias).toBe('sum(total_sales)');
	});

	it('last 12 months', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: 'last 12 months' },
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(
			`"sum(total_sales) FILTER (WHERE date >= toDate('2025-01-02') AND date <= toDate('2026-01-01')) AS "sum_total_sales__l12m""`
		);
	});

	it('this month', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: 'this month' },
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(
			`"sum(total_sales) FILTER (WHERE date >= toDate('2026-01-01') AND date <= toDate('2026-01-31')) AS "sum_total_sales__tm""`
		);
	});

	it('year to date', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: 'year to date' },
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(
			`"sum(total_sales) FILTER (WHERE date >= toDate('2026-01-01') AND date <= toDate('2026-01-01')) AS "sum_total_sales__ytd""`
		);
	});

	it('all time — no date predicate applied', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: 'all time' },
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(
			`"sum(total_sales) AS "sum_total_sales""`
		);
		expect(processed.hasDateRange).toBe(false);
	});

	it('custom range (absolute start + end)', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: '2025-06-01 to 2025-06-30' },
			anchorDate
		});
		expect(processed.sqlWithAlias).toContain(
			"FILTER (WHERE date >= toDate('2025-06-01') AND date <= toDate('2025-06-30'))"
		);
	});

	it('compound ratio measure distributes the date predicate into each aggregate', () => {
		const processed = processColumnExpression({
			value: 'sum(cp1) / nullif(sum(revenue), 0) as cp1_margin',
			type: 'measure',
			dateRange: { date: 'date', range: 'last 30 days' },
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(`"sum(cp1) FILTER (WHERE date >= toDate('2025-12-03') AND date <= toDate('2026-01-01')) / nullif(sum(revenue) FILTER (WHERE date >= toDate('2025-12-03') AND date <= toDate('2026-01-01')), 0) AS "cp1_margin""`);
	});

	it('comparison + date_range together (prior year)', () => {
		const processed = processColumnExpression({
			value: 'sum(total_sales)',
			type: 'measure',
			dateRange: { date: 'date', range: 'last 30 days' },
			isTableComparison: true,
			comparisonType: 'prior year',
			anchorDate
		});
		assertExprParses(processed.sqlWithAlias);
		expect(processed.sqlWithAlias).toMatchInlineSnapshot(
			`"sum(total_sales) FILTER (WHERE date >= toDate('2025-12-03') AND date <= toDate('2026-01-01')) AS "__ev_sum_total_sales_l30d_prior_year_comparison""`
		);
	});

});
