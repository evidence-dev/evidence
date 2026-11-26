import { describe, it, expect } from 'vitest';
import { sqlFixture } from '../../../test-utils/component-sql';
import { bigValueSql, type BigValueSqlProps } from './sql';

const fixture = sqlFixture({
	modelProcessor: true,
	dropdowns: {
		region_dd: { value: 'North', column: 'region' },
		val_pick: undefined
	},
	textInputs: { min_amount: '100' },
	comparisonSelectors: { comp: 'prior period' },
	inlineQueries: {
		region_totals: 'select region, sum(amount) as total from csql.sales group by region'
	}
});

function sql(props: Record<string, unknown>) {
	return fixture.render(
		bigValueSql.queries(props as unknown as BigValueSqlProps, fixture.env, undefined)
	);
}

const lastYear = { range: 'last 12 months', date: 'order_date' };

describe('big_value sql', () => {
	it('issues nothing without data and value, or with an unknown metric', () => {
		expect(sql({ data: 'csql.sales' })).toBe('');
		expect(sql({ value: 'sum(amount)' })).toBe('');
		expect(sql({ data: 'csql.sales', value: '{{val_pick}}' })).toBe('');
		expect(sql({ metric: 'nope', data: 'csql.sales', value: 'sum(amount)' })).toBe('');
	});

	it('raw value with clauses, date_range, filters and inputs', () => {
		expect(
			sql({
				data: 'csql.sales',
				value: 'sum(amount)',
				where: 'amount > {{min_amount}}',
				having: 'sum(amount) > 0',
				order: '1',
				qualify: 'true',
				limit: 1,
				date_range: { range: 'last 6 months', date: 'order_date' },
				filters: ['region_dd']
			})
		).toMatchInlineSnapshot(`
			"-- data
			SELECT sum(amount) AS "sum_amount", 1
			 FROM csql.sales
			 WHERE (region='North') AND (amount > 100) AND (order_date >= toDate('2025-12-31') AND order_date <= toDate('2026-06-30'))
			 GROUP BY ALL
			 HAVING (sum(amount) > 0)
			 QUALIFY true
			 ORDER BY 1 LIMIT 1"
		`);
	});

	it('inline query as data', () => {
		expect(sql({ data: 'region_totals', value: 'sum(total)' })).toMatchInlineSnapshot(`
			"-- data
			SELECT sum(total) AS "sum_total"
			 FROM (select region, sum(amount) as total from csql.sales group by region) "__ev_inline_region_totals"
			 
			 GROUP BY ALL LIMIT 1"
		`);
	});

	it('comparisons: prior year, target, benchmark, and a selector', () => {
		expect(
			[
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					date_range: lastYear,
					comparison: { compare_vs: 'prior year' }
				}),
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					comparison: { compare_vs: 'target', target: 'sum(target)' }
				}),
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					where: "region = 'North'",
					comparison: { compare_vs: 'benchmark', benchmark: { agg: 'avg', subject: 'region' } }
				}),
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					date_range: { range: 'last 3 months', date: 'order_date' },
					comparison: { compare_vs: '{{comp}}' }
				})
			].join('\n\n')
		).toMatchInlineSnapshot(`
			"-- data
			WITH main_query AS (SELECT sum(amount) AS "sum_amount", (formatDateTime(toDate('2025-07-01'), '%b %e/%y') || ' - ' || formatDateTime(toDate('2026-06-30'), '%b %e/%y')) as "__ev_sum_amount_prior_year_comparison_current_period", (formatDateTime(date_add(year, -1, toDate('2025-07-01')), '%b %e/%y') || ' - ' || formatDateTime(date_add(year, -1, toDate('2026-06-30')), '%b %e/%y')) as "__ev_sum_amount_prior_year_comparison_previous_period"
			 FROM csql.sales
			 WHERE (order_date >= toDate('2025-07-01') AND order_date <= toDate('2026-06-30'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(amount) as "__ev_sum_amount_prior_year_comparison"
			 FROM csql.sales
			 WHERE (order_date >= date_add(year, -1, toDate('2025-07-01')) AND order_date <= date_add(year, -1, toDate('2026-06-30')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_amount_prior_year_comparison" as "__ev_sum_amount_prior_year_comparison_compared_value", (main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_year_comparison") * 1.0 as "__ev_sum_amount_prior_year_comparison_abs", ((main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_amount_prior_year_comparison"), 0)) as "__ev_sum_amount_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1

			-- data
			SELECT sum(amount) AS "sum_amount", sum(target) as "__ev_sum_amount_target_comparison_compared_value", ("sum_amount" - (sum(target))) * 1.0 as "__ev_sum_amount_target_comparison_abs", (("sum_amount" - (sum(target))) * 1.0 / nullIf(abs((sum(target))), 0)) as "__ev_sum_amount_target_comparison_pct"
			 FROM csql.sales
			 
			 GROUP BY ALL LIMIT 1

			-- data
			WITH main_query AS (SELECT sum(amount) AS "sum_amount"
			 FROM csql.sales
			 WHERE (region = 'North')
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(amount) as "__ev_sum_amount_benchmark_avg_comparison_subject_total"
			 FROM csql.sales
			 
			 GROUP BY region)
			 SELECT
			 avg("__ev_sum_amount_benchmark_avg_comparison_subject_total") as "__ev_sum_amount_benchmark_avg_comparison_benchmark"
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_amount_benchmark_avg_comparison_benchmark" as "__ev_sum_amount_benchmark_avg_comparison_compared_value", (main_query."sum_amount" - benchmark_1_fragment."__ev_sum_amount_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_amount_benchmark_avg_comparison_abs", ((main_query."sum_amount" - benchmark_1_fragment."__ev_sum_amount_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_amount_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_amount_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON 1=1 LIMIT 1

			-- data
			WITH main_query AS (SELECT sum(amount) AS "sum_amount", (formatDateTime(toDate('2026-03-31'), '%b %e/%y') || ' - ' || formatDateTime(toDate('2026-06-30'), '%b %e/%y')) as "__ev_sum_amount_prior_period_comparison_current_period", (formatDateTime(date_add(month, -3, toDate('2026-03-31')), '%b %e/%y') || ' - ' || formatDateTime(date_add(month, -3, toDate('2026-06-30')), '%b %e/%y')) as "__ev_sum_amount_prior_period_comparison_previous_period"
			 FROM csql.sales
			 WHERE (order_date >= toDate('2026-03-31') AND order_date <= toDate('2026-06-30'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(amount) as "__ev_sum_amount_prior_period_comparison"
			 FROM csql.sales
			 WHERE (order_date >= date_add(month, -3, toDate('2026-03-31')) AND order_date <= date_add(month, -3, toDate('2026-06-30')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_amount_prior_period_comparison" as "__ev_sum_amount_prior_period_comparison_compared_value", (main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_period_comparison") * 1.0 as "__ev_sum_amount_prior_period_comparison_abs", ((main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_period_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_amount_prior_period_comparison"), 0)) as "__ev_sum_amount_prior_period_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
		`);
	});

	it('sparklines: default, with a grain and range, and alongside a comparison', () => {
		expect(
			[
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					sparkline: { type: 'line', x: 'order_date' }
				}),
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					filters: ['region_dd'],
					sparkline: {
						type: 'bar',
						x: 'order_date',
						date_grain: 'month',
						date_range: { range: 'last 12 months' }
					}
				}),
				sql({
					data: 'csql.sales',
					value: 'sum(amount)',
					date_range: lastYear,
					comparison: { compare_vs: 'prior year' },
					sparkline: { type: 'area' }
				})
			].join('\n\n')
		).toMatchInlineSnapshot(`
			"-- data
			SELECT sum(amount) AS "sum_amount", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT order_date as x_val, sum(amount) as y_val
			 FROM csql.sales
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_amount"
			 FROM csql.sales
			 
			 GROUP BY ALL LIMIT 1

			-- data
			SELECT sum(amount) AS "sum_amount", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT toStartOfMonth(order_date) as x_val, sum(amount) as y_val
			 FROM csql.sales
			 WHERE (region='North') AND (order_date >= toDate('2025-07-01') AND order_date <= toDate('2026-06-30'))
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_amount"
			 FROM csql.sales
			 WHERE (region='North')
			 GROUP BY ALL LIMIT 1

			-- data
			WITH main_query AS (SELECT sum(amount) AS "sum_amount", (formatDateTime(toDate('2025-07-01'), '%b %e/%y') || ' - ' || formatDateTime(toDate('2026-06-30'), '%b %e/%y')) as "__ev_sum_amount_prior_year_comparison_current_period", (formatDateTime(date_add(year, -1, toDate('2025-07-01')), '%b %e/%y') || ' - ' || formatDateTime(date_add(year, -1, toDate('2026-06-30')), '%b %e/%y')) as "__ev_sum_amount_prior_year_comparison_previous_period", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT order_date as x_val, sum(amount) as y_val
			 FROM csql.sales
			 WHERE (order_date >= toDate('2025-07-01') AND order_date <= toDate('2026-06-30'))
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_amount"
			 FROM csql.sales
			 WHERE (order_date >= toDate('2025-07-01') AND order_date <= toDate('2026-06-30'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(amount) as "__ev_sum_amount_prior_year_comparison"
			 FROM csql.sales
			 WHERE (order_date >= date_add(year, -1, toDate('2025-07-01')) AND order_date <= date_add(year, -1, toDate('2026-06-30')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_amount_prior_year_comparison" as "__ev_sum_amount_prior_year_comparison_compared_value", (main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_year_comparison") * 1.0 as "__ev_sum_amount_prior_year_comparison_abs", ((main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_amount_prior_year_comparison"), 0)) as "__ev_sum_amount_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
		`);
	});

	it('metrics: plain, filtered, with a comparison, and sparklines on the view date or another x', () => {
		expect(
			[
				sql({ metric: 'revenue' }),
				sql({ metric: 'web_revenue', filters: ['region_dd'], where: 'quantity > 1' }),
				sql({
					metric: 'revenue',
					date_range: { range: 'last 12 months' },
					comparison: { compare_vs: 'prior year' }
				}),
				sql({ metric: 'order_count', sparkline: { type: 'line' } }),
				sql({ metric: 'margin', sparkline: { type: 'line', x: 'order_ts' } })
			].join('\n\n')
		).toMatchInlineSnapshot(`
			"-- data
			SELECT sum(amount) AS "sum_amount"
			 FROM csql.sales
			 
			 GROUP BY ALL LIMIT 1

			-- data
			SELECT sum(amount) FILTER (WHERE (channel = 'Web')) AS "sum_amount_filter_where_channel_web"
			 FROM csql.sales
			 WHERE (region='North') AND (quantity > 1)
			 GROUP BY ALL LIMIT 1

			-- data
			WITH main_query AS (SELECT sum(amount) AS "sum_amount", (formatDateTime(toDate('2025-07-01'), '%b %e/%y') || ' - ' || formatDateTime(toDate('2026-06-30'), '%b %e/%y')) as "__ev_sum_amount_prior_year_comparison_current_period", (formatDateTime(date_add(year, -1, toDate('2025-07-01')), '%b %e/%y') || ' - ' || formatDateTime(date_add(year, -1, toDate('2026-06-30')), '%b %e/%y')) as "__ev_sum_amount_prior_year_comparison_previous_period"
			 FROM csql.sales
			 
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(amount) as "__ev_sum_amount_prior_year_comparison"
			 FROM csql.sales
			 
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_amount_prior_year_comparison" as "__ev_sum_amount_prior_year_comparison_compared_value", (main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_year_comparison") * 1.0 as "__ev_sum_amount_prior_year_comparison_abs", ((main_query."sum_amount" - comparison_1_fragment."__ev_sum_amount_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_amount_prior_year_comparison"), 0)) as "__ev_sum_amount_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1

			-- data
			SELECT count(*) AS "count", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT toStartOfMonth(order_date) as x_val, count(*) as y_val
			 FROM csql.sales
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_count"
			 FROM csql.sales
			 
			 GROUP BY ALL LIMIT 1

			-- data
			SELECT (sum(amount)) - sum(cost) AS "sum_amount_sum_cost", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT order_ts as x_val, (sum(amount)) - sum(cost) as y_val
			 FROM csql.sales
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_amount_sum_cost"
			 FROM csql.sales
			 
			 GROUP BY ALL LIMIT 1"
		`);
	});
});
