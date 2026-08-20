import { describe, it, expect } from 'vitest';
import { buildBigValueSQL, type BigValueSQLAttrs } from './build-bigvalue-sql';
import { orderCompatibleWithSingleValue } from '../../validators';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect
} from '../../../sql-dialect';

const dialects = [
	new ClickHouseDialect(),
	new SnowflakeDialect(),
	new BigQueryDialect(),
	new FabricDialect(),
	new DatabricksDialect(),
	new PostgresDialect(),
	new CubeDialect(),
	new MotherDuckDialect()
];

function buildAllDialects(attrs: Omit<BigValueSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => {
			const { sql, error } = buildBigValueSQL({ ...attrs, dialect });
			// A dialect that can't express the query returns an error instead of SQL.
			return error ? `ERROR: ${error}` : sql;
		})
		.join('"\n----\n"');
	return { sql };
}

describe('big_value SQL', () => {
	it('Basic Usage (schema example)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)'
		});
		expect(sql).toMatchInlineSnapshot(`
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
		`);
	});

	it('Comparison (schema example)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 12 months' },
			comparison: { compare_vs: 'prior year' },
			anchorDate: new Date(2026, 0, 1)
		});
		expect(sql).toMatchInlineSnapshot(`
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (formatDateTime(toDate('2025-01-02'), '%b %e/%y') || ' - ' || formatDateTime(toDate('2026-01-01'), '%b %e/%y')) as "__ev_sum_total_sales_prior_year_comparison_current_period", (formatDateTime(date_add(year, -1, toDate('2025-01-02')), '%b %e/%y') || ' - ' || formatDateTime(date_add(year, -1, toDate('2026-01-01')), '%b %e/%y')) as "__ev_sum_total_sales_prior_year_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-01-02') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_year_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= date_add(year, -1, toDate('2025-01-02')) AND date <= date_add(year, -1, toDate('2026-01-01')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison" as "__ev_sum_total_sales_prior_year_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 as "__ev_sum_total_sales_prior_year_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison"), 0)) as "__ev_sum_total_sales_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "SUM_TOTAL_SALES", (TO_CHAR(TO_DATE('2025-01-02'), 'MON DD/YY') || ' - ' || TO_CHAR(TO_DATE('2026-01-01'), 'MON DD/YY')) as "__ev_sum_total_sales_prior_year_comparison_current_period", (TO_CHAR(DATEADD('YEAR', -1, TO_DATE('2025-01-02')), 'MON DD/YY') || ' - ' || TO_CHAR(DATEADD('YEAR', -1, TO_DATE('2026-01-01')), 'MON DD/YY')) as "__ev_sum_total_sales_prior_year_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-01-02') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_year_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATEADD('YEAR', -1, TO_DATE('2025-01-02')) AND date <= DATEADD('YEAR', -1, TO_DATE('2026-01-01')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison" as "__ev_sum_total_sales_prior_year_comparison_compared_value", (main_query."SUM_TOTAL_SALES" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 as "__ev_sum_total_sales_prior_year_comparison_abs", ((main_query."SUM_TOTAL_SALES" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison"), 0)) as "__ev_sum_total_sales_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, (FORMAT_DATE('%b %d/%y', DATE '2025-01-02') || ' - ' || FORMAT_DATE('%b %d/%y', DATE '2026-01-01')) as \`__ev_sum_total_sales_prior_year_comparison_current_period\`, (FORMAT_DATE('%b %d/%y', DATE_ADD(DATE '2025-01-02', INTERVAL -1 YEAR)) || ' - ' || FORMAT_DATE('%b %d/%y', DATE_ADD(DATE '2026-01-01', INTERVAL -1 YEAR))) as \`__ev_sum_total_sales_prior_year_comparison_previous_period\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as \`__ev_sum_total_sales_prior_year_comparison\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE_ADD(DATE '2025-01-02', INTERVAL -1 YEAR) AND date <= DATE_ADD(DATE '2026-01-01', INTERVAL -1 YEAR))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\` as \`__ev_sum_total_sales_prior_year_comparison_compared_value\`, (main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\`) * 1.0 as \`__ev_sum_total_sales_prior_year_comparison_abs\`, ((main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\`) * 1.0 / nullIf(abs(comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\`), 0)) as \`__ev_sum_total_sales_prior_year_comparison_pct\`
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (CONCAT(FORMAT(CAST('2025-01-02' AS DATE), 'MMM d/yy', 'en-US'), ' - ', FORMAT(CAST('2026-01-01' AS DATE), 'MMM d/yy', 'en-US'))) as "__ev_sum_total_sales_prior_year_comparison_current_period", (CONCAT(FORMAT(DATEADD(year, -1, CAST('2025-01-02' AS DATE)), 'MMM d/yy', 'en-US'), ' - ', FORMAT(DATEADD(year, -1, CAST('2026-01-01' AS DATE)), 'MMM d/yy', 'en-US'))) as "__ev_sum_total_sales_prior_year_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-01-02' AS DATE) AND date <= CAST('2026-01-01' AS DATE))),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_year_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATEADD(year, -1, CAST('2025-01-02' AS DATE)) AND date <= DATEADD(year, -1, CAST('2026-01-01' AS DATE))))
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison" as "__ev_sum_total_sales_prior_year_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 as "__ev_sum_total_sales_prior_year_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison"), 0)) as "__ev_sum_total_sales_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, (DATE_FORMAT(DATE '2025-01-02', 'MMM d/yy') || ' - ' || DATE_FORMAT(DATE '2026-01-01', 'MMM d/yy')) as \`__ev_sum_total_sales_prior_year_comparison_current_period\`, (DATE_FORMAT(DATEADD(YEAR, -1, DATE '2025-01-02'), 'MMM d/yy') || ' - ' || DATE_FORMAT(DATEADD(YEAR, -1, DATE '2026-01-01'), 'MMM d/yy')) as \`__ev_sum_total_sales_prior_year_comparison_previous_period\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as \`__ev_sum_total_sales_prior_year_comparison\`
			 FROM demo.daily_orders
			 WHERE (date >= DATEADD(YEAR, -1, DATE '2025-01-02') AND date <= DATEADD(YEAR, -1, DATE '2026-01-01'))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\` as \`__ev_sum_total_sales_prior_year_comparison_compared_value\`, (main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\`) * 1.0 as \`__ev_sum_total_sales_prior_year_comparison_abs\`, ((main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\`) * 1.0 / nullIf(abs(comparison_1_fragment.\`__ev_sum_total_sales_prior_year_comparison\`), 0)) as \`__ev_sum_total_sales_prior_year_comparison_pct\`
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (TO_CHAR(DATE '2025-01-02', 'Mon FMDD/YY') || ' - ' || TO_CHAR(DATE '2026-01-01', 'Mon FMDD/YY')) as "__ev_sum_total_sales_prior_year_comparison_current_period", (TO_CHAR(DATE '2025-01-02' + (-1 * INTERVAL '1 year'), 'Mon FMDD/YY') || ' - ' || TO_CHAR(DATE '2026-01-01' + (-1 * INTERVAL '1 year'), 'Mon FMDD/YY')) as "__ev_sum_total_sales_prior_year_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_year_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' + (-1 * INTERVAL '1 year') AND date <= DATE '2026-01-01' + (-1 * INTERVAL '1 year')))
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison" as "__ev_sum_total_sales_prior_year_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 as "__ev_sum_total_sales_prior_year_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison"), 0)) as "__ev_sum_total_sales_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"ERROR: "prior year" comparisons aren't supported on cube connections — compare against a target or benchmark instead."
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (strftime(DATE '2025-01-02', '%b %-d/%y') || ' - ' || strftime(DATE '2026-01-01', '%b %-d/%y')) as "__ev_sum_total_sales_prior_year_comparison_current_period", (strftime(DATE '2025-01-02' + to_years(-1), '%b %-d/%y') || ' - ' || strftime(DATE '2026-01-01' + to_years(-1), '%b %-d/%y')) as "__ev_sum_total_sales_prior_year_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_year_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' + to_years(-1) AND date <= DATE '2026-01-01' + to_years(-1))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison" as "__ev_sum_total_sales_prior_year_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 as "__ev_sum_total_sales_prior_year_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_year_comparison"), 0)) as "__ev_sum_total_sales_prior_year_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
		`);
	});

	it('Sparkline (schema example)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			sparkline: { type: 'line', x: 'date' }
		});
		expect(sql).toMatchInlineSnapshot(`
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "SUM_TOTAL_SALES", count(*) as "__ev_count", (
			 SELECT ARRAY_AGG(ARRAY_CONSTRUCT(x_val, y_val)) WITHIN GROUP (ORDER BY x_val)
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`, count(*) as \`__ev_count\`, (
			 SELECT TO_JSON_STRING(ARRAY_AGG(JSON_ARRAY(x_val, y_val) ORDER BY x_val))
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as \`__ev_spark_src\`
			 ) as \`__ev_sparkline_sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT CONCAT('[', STRING_AGG(CONCAT('["', CAST(x_val AS VARCHAR(MAX)), '",', ISNULL(CAST(y_val AS VARCHAR(MAX)), 'null'), ']'), ',') WITHIN GROUP (ORDER BY x_val), ']')
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`, count(*) as \`__ev_count\`, (
			 SELECT CONCAT('[', ARRAY_JOIN(TRANSFORM(SORT_ARRAY(COLLECT_LIST(STRUCT(x_val AS k, y_val AS y))), x -> CONCAT('["', CAST(x.k AS STRING), '",', COALESCE(CAST(x.y AS STRING), 'null'), ']')), ','), ']')
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as \`__ev_spark_src\`
			 ) as \`__ev_sparkline_sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT (JSON_AGG(JSON_BUILD_ARRAY(x_val::text, y_val) ORDER BY x_val))::text
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT '[' || STRING_AGG('["' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CAST(x_val AS TEXT), '\\', '\\\\'), '"', '\\"'), CHR(10), '\\n'), CHR(13), '\\r'), CHR(9), '\\t') || '",' || COALESCE(CAST(y_val AS TEXT), 'null') || ']', ',' ORDER BY x_val) || ']'
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT to_json(list(json_array(x_val, y_val) ORDER BY x_val))
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
		`);
	});

	it('Sparkline with date_grain', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			sparkline: { type: 'area', x: 'date', date_grain: 'month' }
		});
		expect(sql).toMatchInlineSnapshot(`
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT toStartOfMonth(date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "SUM_TOTAL_SALES", count(*) as "__ev_count", (
			 SELECT ARRAY_AGG(ARRAY_CONSTRUCT(x_val, y_val)) WITHIN GROUP (ORDER BY x_val)
			 FROM (
			 SELECT DATE_TRUNC('MONTH', date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`, count(*) as \`__ev_count\`, (
			 SELECT TO_JSON_STRING(ARRAY_AGG(JSON_ARRAY(x_val, y_val) ORDER BY x_val))
			 FROM (
			 SELECT DATE_TRUNC(date, MONTH) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as \`__ev_spark_src\`
			 ) as \`__ev_sparkline_sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT CONCAT('[', STRING_AGG(CONCAT('["', CAST(x_val AS VARCHAR(MAX)), '",', ISNULL(CAST(y_val AS VARCHAR(MAX)), 'null'), ']'), ',') WITHIN GROUP (ORDER BY x_val), ']')
			 FROM (
			 SELECT DATETRUNC(month, date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY DATETRUNC(month, date)
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`, count(*) as \`__ev_count\`, (
			 SELECT CONCAT('[', ARRAY_JOIN(TRANSFORM(SORT_ARRAY(COLLECT_LIST(STRUCT(x_val AS k, y_val AS y))), x -> CONCAT('["', CAST(x.k AS STRING), '",', COALESCE(CAST(x.y AS STRING), 'null'), ']')), ','), ']')
			 FROM (
			 SELECT DATE_TRUNC('MONTH', date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as \`__ev_spark_src\`
			 ) as \`__ev_sparkline_sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT (JSON_AGG(JSON_BUILD_ARRAY(x_val::text, y_val) ORDER BY x_val))::text
			 FROM (
			 SELECT DATE_TRUNC('month', date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT '[' || STRING_AGG('["' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CAST(x_val AS TEXT), '\\', '\\\\'), '"', '\\"'), CHR(10), '\\n'), CHR(13), '\\r'), CHR(9), '\\t') || '",' || COALESCE(CAST(y_val AS TEXT), 'null') || ']', ',' ORDER BY x_val) || ']'
			 FROM (
			 SELECT DATE_TRUNC('month', date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT to_json(list(json_array(x_val, y_val) ORDER BY x_val))
			 FROM (
			 SELECT DATE_TRUNC('month', date) as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 1"
		`);
	});

	it('Sparkline inherits x from date_range when not specified', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 30 days' },
			sparkline: { type: 'line' },
			anchorDate: new Date(2026, 0, 1)
		});
		expect(sql).toMatchInlineSnapshot(`
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "SUM_TOTAL_SALES", count(*) as "__ev_count", (
			 SELECT ARRAY_AGG(ARRAY_CONSTRUCT(x_val, y_val)) WITHIN GROUP (ORDER BY x_val)
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`, count(*) as \`__ev_count\`, (
			 SELECT TO_JSON_STRING(ARRAY_AGG(JSON_ARRAY(x_val, y_val) ORDER BY x_val))
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as \`__ev_spark_src\`
			 ) as \`__ev_sparkline_sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT CONCAT('[', STRING_AGG(CONCAT('["', CAST(x_val AS VARCHAR(MAX)), '",', ISNULL(CAST(y_val AS VARCHAR(MAX)), 'null'), ']'), ',') WITHIN GROUP (ORDER BY x_val), ']')
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY date
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE)) ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`, count(*) as \`__ev_count\`, (
			 SELECT CONCAT('[', ARRAY_JOIN(TRANSFORM(SORT_ARRAY(COLLECT_LIST(STRUCT(x_val AS k, y_val AS y))), x -> CONCAT('["', CAST(x.k AS STRING), '",', COALESCE(CAST(x.y AS STRING), 'null'), ']')), ','), ']')
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as \`__ev_spark_src\`
			 ) as \`__ev_sparkline_sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT (JSON_AGG(JSON_BUILD_ARRAY(x_val::text, y_val) ORDER BY x_val))::text
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01') LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT '[' || STRING_AGG('["' || REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CAST(x_val AS TEXT), '\\', '\\\\'), '"', '\\"'), CHR(10), '\\n'), CHR(13), '\\r'), CHR(9), '\\t') || '",' || COALESCE(CAST(y_val AS TEXT), 'null') || ']', ',' ORDER BY x_val) || ']'
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP)) LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales", count(*) as "__ev_count", (
			 SELECT to_json(list(json_array(x_val, y_val) ORDER BY x_val))
			 FROM (
			 SELECT date as x_val, sum(total_sales) as y_val
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY x_val
			 ORDER BY x_val
			 ) as "__ev_spark_src"
			 ) as "__ev_sparkline_sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL LIMIT 1"
		`);
	});
});

describe('order × value compatibility (author-time guard for the GROUP BY ALL shape)', () => {
	// Battle-test provenance: `order="year_date"` generates
	// `GROUP BY ALL ORDER BY year_date LIMIT 1`, which ClickHouse rejects with
	// NOT_AN_AGGREGATE (verified by executing the generated SQL on chdb) —
	// previously surfacing as a silent blank card. Both the bare-column and the
	// (otherwise correct) argMax forms fail; the validator errors at author time
	// with the argMax teaching.
	const validator = orderCompatibleWithSingleValue('order', 'value');
	const ctx = { metadata: undefined, filters: undefined, inlineQueries: undefined };
	const node = (attributes: Record<string, unknown>) =>
		({ attributes, location: undefined }) as unknown as Parameters<typeof validator>[0];
	const cfg = {} as Parameters<typeof validator>[1];

	it('errors when order accompanies an aggregate value', () => {
		const errors = validator(
			node({ value: 'argMax(value, year_date)', order: 'year_date' }),
			cfg,
			ctx
		);
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('order-on-aggregated-value');
		expect(errors[0].message).toContain('single row');
	});

	it('errors when order references a column other than the bare value, teaching argMax', () => {
		const errors = validator(node({ value: 'value', order: 'year_date desc' }), cfg, ctx);
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('argMax(value, year_date)');
	});

	it('allows order by the value column itself (valid: in the group)', () => {
		expect(validator(node({ value: 'value', order: 'value' }), cfg, ctx)).toEqual([]);
	});

	it('no order → no error; variables skip validation', () => {
		expect(validator(node({ value: 'argMax(value, y)' }), cfg, ctx)).toEqual([]);
		expect(validator(node({ value: 'value', order: '{{ f.value }}' }), cfg, ctx)).toEqual([]);
	});

	// False-positive guards — each of these EXECUTES successfully under
	// GROUP BY ALL (verified on embedded ClickHouse), so the validator must
	// stay silent.
	it('allows ordering by an aggregate (most-frequent / top-by-metric patterns)', () => {
		expect(validator(node({ value: 'category', order: 'count(*) desc' }), cfg, ctx)).toEqual([]);
		expect(validator(node({ value: 'category', order: 'sum(value) desc' }), cfg, ctx)).toEqual([]);
	});

	it('allows ordering by an expression over the grouped value column', () => {
		expect(validator(node({ value: 'category', order: 'upper(category)' }), cfg, ctx)).toEqual([]);
	});

	it('allows a multi-arg aggregate in order — the nested comma is not a term split', () => {
		expect(
			validator(node({ value: 'total', order: 'argMax(total, category) desc' }), cfg, ctx)
		).toEqual([]);
		expect(
			validator(
				node({ value: 'category', order: 'argMax(total, category) desc, count(*) asc' }),
				cfg,
				ctx
			)
		).toEqual([]);
	});

	it('allows ordering by the aggregate value alias', () => {
		expect(
			validator(
				node({ value: 'argMax(value, year_date)', order: 'argmax_value_year_date' }),
				cfg,
				ctx
			)
		).toEqual([]);
	});

	it('stands down when a comparison is configured (extra groupable projections)', () => {
		expect(
			validator(node({ value: 'value', order: 'year_date', comparison: { target: 'x' } }), cfg, ctx)
		).toEqual([]);
	});
});
