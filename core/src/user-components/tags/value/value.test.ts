import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildValueSQL, type ValueSQLAttrs } from './build-value-sql';
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

function buildAllDialects(attrs: Omit<ValueSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => {
			const { sql, error } = buildValueSQL({ ...attrs, dialect });
			// A dialect that can't express the query returns an error instead of SQL.
			return error ? `ERROR: ${error}` : sql;
		})
		.join('"\n----\n"');
	return { sql };
}

describe('value SQL', () => {
	it('Basic Usage (schema example)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
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

	it('where clause', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			where: "category = 'Home'"
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (category = 'Home')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (category = 'Home')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (category = 'Home')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (category = 'Home') ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (category = 'Home')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (category = 'Home') LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (category = 'Home') LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (category = 'Home')
			 GROUP BY ALL LIMIT 1"
		`);
	});

	it('date_range only (no comparison)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE)) ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01') LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP)) LIMIT 1"
			----
			"SELECT sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL LIMIT 1"
		`);
	});

	it('comparison: prior year (with date_range)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 12 months' },
			comparison: { compare_vs: 'prior year' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
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

	it('comparison: prior period (with date_range)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 30 days' },
			comparison: { compare_vs: 'prior period' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (formatDateTime(toDate('2025-12-03'), '%b %e/%y') || ' - ' || formatDateTime(toDate('2026-01-01'), '%b %e/%y')) as "__ev_sum_total_sales_prior_period_comparison_current_period", (formatDateTime(date_add(day, -30, toDate('2025-12-03')), '%b %e/%y') || ' - ' || formatDateTime(date_add(day, -30, toDate('2026-01-01')), '%b %e/%y')) as "__ev_sum_total_sales_prior_period_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_period_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= date_add(day, -30, toDate('2025-12-03')) AND date <= date_add(day, -30, toDate('2026-01-01')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison" as "__ev_sum_total_sales_prior_period_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 as "__ev_sum_total_sales_prior_period_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison"), 0)) as "__ev_sum_total_sales_prior_period_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "SUM_TOTAL_SALES", (TO_CHAR(TO_DATE('2025-12-03'), 'MON DD/YY') || ' - ' || TO_CHAR(TO_DATE('2026-01-01'), 'MON DD/YY')) as "__ev_sum_total_sales_prior_period_comparison_current_period", (TO_CHAR(DATEADD('DAY', -30, TO_DATE('2025-12-03')), 'MON DD/YY') || ' - ' || TO_CHAR(DATEADD('DAY', -30, TO_DATE('2026-01-01')), 'MON DD/YY')) as "__ev_sum_total_sales_prior_period_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_period_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATEADD('DAY', -30, TO_DATE('2025-12-03')) AND date <= DATEADD('DAY', -30, TO_DATE('2026-01-01')))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison" as "__ev_sum_total_sales_prior_period_comparison_compared_value", (main_query."SUM_TOTAL_SALES" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 as "__ev_sum_total_sales_prior_period_comparison_abs", ((main_query."SUM_TOTAL_SALES" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison"), 0)) as "__ev_sum_total_sales_prior_period_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, (FORMAT_DATE('%b %d/%y', DATE '2025-12-03') || ' - ' || FORMAT_DATE('%b %d/%y', DATE '2026-01-01')) as \`__ev_sum_total_sales_prior_period_comparison_current_period\`, (FORMAT_DATE('%b %d/%y', DATE_ADD(DATE '2025-12-03', INTERVAL -30 DAY)) || ' - ' || FORMAT_DATE('%b %d/%y', DATE_ADD(DATE '2026-01-01', INTERVAL -30 DAY))) as \`__ev_sum_total_sales_prior_period_comparison_previous_period\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as \`__ev_sum_total_sales_prior_period_comparison\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE_ADD(DATE '2025-12-03', INTERVAL -30 DAY) AND date <= DATE_ADD(DATE '2026-01-01', INTERVAL -30 DAY))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\` as \`__ev_sum_total_sales_prior_period_comparison_compared_value\`, (main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\`) * 1.0 as \`__ev_sum_total_sales_prior_period_comparison_abs\`, ((main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\`) * 1.0 / nullIf(abs(comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\`), 0)) as \`__ev_sum_total_sales_prior_period_comparison_pct\`
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (CONCAT(FORMAT(CAST('2025-12-03' AS DATE), 'MMM d/yy', 'en-US'), ' - ', FORMAT(CAST('2026-01-01' AS DATE), 'MMM d/yy', 'en-US'))) as "__ev_sum_total_sales_prior_period_comparison_current_period", (CONCAT(FORMAT(DATEADD(day, -30, CAST('2025-12-03' AS DATE)), 'MMM d/yy', 'en-US'), ' - ', FORMAT(DATEADD(day, -30, CAST('2026-01-01' AS DATE)), 'MMM d/yy', 'en-US'))) as "__ev_sum_total_sales_prior_period_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_period_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATEADD(day, -30, CAST('2025-12-03' AS DATE)) AND date <= DATEADD(day, -30, CAST('2026-01-01' AS DATE))))
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison" as "__ev_sum_total_sales_prior_period_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 as "__ev_sum_total_sales_prior_period_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison"), 0)) as "__ev_sum_total_sales_prior_period_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, (DATE_FORMAT(DATE '2025-12-03', 'MMM d/yy') || ' - ' || DATE_FORMAT(DATE '2026-01-01', 'MMM d/yy')) as \`__ev_sum_total_sales_prior_period_comparison_current_period\`, (DATE_FORMAT(DATEADD(DAY, -30, DATE '2025-12-03'), 'MMM d/yy') || ' - ' || DATE_FORMAT(DATEADD(DAY, -30, DATE '2026-01-01'), 'MMM d/yy')) as \`__ev_sum_total_sales_prior_period_comparison_previous_period\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as \`__ev_sum_total_sales_prior_period_comparison\`
			 FROM demo.daily_orders
			 WHERE (date >= DATEADD(DAY, -30, DATE '2025-12-03') AND date <= DATEADD(DAY, -30, DATE '2026-01-01'))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\` as \`__ev_sum_total_sales_prior_period_comparison_compared_value\`, (main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\`) * 1.0 as \`__ev_sum_total_sales_prior_period_comparison_abs\`, ((main_query.\`sum_total_sales\` - comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\`) * 1.0 / nullIf(abs(comparison_1_fragment.\`__ev_sum_total_sales_prior_period_comparison\`), 0)) as \`__ev_sum_total_sales_prior_period_comparison_pct\`
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (TO_CHAR(DATE '2025-12-03', 'Mon FMDD/YY') || ' - ' || TO_CHAR(DATE '2026-01-01', 'Mon FMDD/YY')) as "__ev_sum_total_sales_prior_period_comparison_current_period", (TO_CHAR(DATE '2025-12-03' + (-30 * INTERVAL '1 day'), 'Mon FMDD/YY') || ' - ' || TO_CHAR(DATE '2026-01-01' + (-30 * INTERVAL '1 day'), 'Mon FMDD/YY')) as "__ev_sum_total_sales_prior_period_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_period_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' + (-30 * INTERVAL '1 day') AND date <= DATE '2026-01-01' + (-30 * INTERVAL '1 day')))
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison" as "__ev_sum_total_sales_prior_period_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 as "__ev_sum_total_sales_prior_period_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison"), 0)) as "__ev_sum_total_sales_prior_period_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
			----
			"ERROR: "prior period" comparisons aren't supported on cube connections — compare against a target or benchmark instead."
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", (strftime(DATE '2025-12-03', '%b %-d/%y') || ' - ' || strftime(DATE '2026-01-01', '%b %-d/%y')) as "__ev_sum_total_sales_prior_period_comparison_current_period", (strftime(DATE '2025-12-03' + to_days(-30), '%b %-d/%y') || ' - ' || strftime(DATE '2026-01-01' + to_days(-30), '%b %-d/%y')) as "__ev_sum_total_sales_prior_period_comparison_previous_period"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL),
			comparison_1_fragment AS (SELECT sum(total_sales) as "__ev_sum_total_sales_prior_period_comparison"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' + to_days(-30) AND date <= DATE '2026-01-01' + to_days(-30))
			 GROUP BY ALL)
			SELECT main_query.*, comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison" as "__ev_sum_total_sales_prior_period_comparison_compared_value", (main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 as "__ev_sum_total_sales_prior_period_comparison_abs", ((main_query."sum_total_sales" - comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison") * 1.0 / nullIf(abs(comparison_1_fragment."__ev_sum_total_sales_prior_period_comparison"), 0)) as "__ev_sum_total_sales_prior_period_comparison_pct"
			FROM main_query
			LEFT JOIN comparison_1_fragment ON 1 = 1 LIMIT 1"
		`);
	});

	it('comparison: benchmark with within dimension', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			comparison: {
				compare_vs: 'benchmark',
				benchmark: {
					agg: 'avg',
					subject: 'region',
					within: ['region'],
					exclude_self: false
				}
			}
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 avg("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 FROM subject_totals
			 GROUP BY "region")
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."region" <=> benchmark_1_fragment."region" LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "SUM_TOTAL_SALES", region AS "REGION"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "REGION",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY REGION)
			 SELECT
			 "REGION",
			 avg("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 FROM subject_totals
			 GROUP BY "REGION")
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."SUM_TOTAL_SALES" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."SUM_TOTAL_SALES" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."REGION" IS NOT DISTINCT FROM benchmark_1_fragment."REGION" LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as \`region\`,
			 sum(total_sales) as \`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 \`region\`,
			 avg(\`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`) as \`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`
			 FROM subject_totals
			 GROUP BY \`region\`)
			SELECT main_query.*, benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\` as \`__ev_sum_total_sales_benchmark_avg_comparison_compared_value\`, (main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 as \`__ev_sum_total_sales_benchmark_avg_comparison_abs\`, ((main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 / nullIf(abs(benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`), 0)) as \`__ev_sum_total_sales_benchmark_avg_comparison_pct\`
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON ((main_query.\`region\` IS NULL AND benchmark_1_fragment.\`region\` IS NULL) OR main_query.\`region\` = benchmark_1_fragment.\`region\`) LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY region),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 avg("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 FROM subject_totals
			 GROUP BY "region")
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON ((main_query."region" IS NULL AND benchmark_1_fragment."region" IS NULL) OR main_query."region" = benchmark_1_fragment."region") ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as \`region\`,
			 sum(total_sales) as \`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 \`region\`,
			 avg(\`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`) as \`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`
			 FROM subject_totals
			 GROUP BY \`region\`)
			SELECT main_query.*, benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\` as \`__ev_sum_total_sales_benchmark_avg_comparison_compared_value\`, (main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 as \`__ev_sum_total_sales_benchmark_avg_comparison_abs\`, ((main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 / nullIf(abs(benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`), 0)) as \`__ev_sum_total_sales_benchmark_avg_comparison_pct\`
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query.\`region\` <=> benchmark_1_fragment.\`region\` LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY region),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 avg("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 FROM subject_totals
			 GROUP BY "region")
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."region" IS NOT DISTINCT FROM benchmark_1_fragment."region" LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY region),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 avg("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 FROM subject_totals
			 GROUP BY "region")
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON ((main_query."region" IS NULL AND benchmark_1_fragment."region" IS NULL) OR main_query."region" = benchmark_1_fragment."region") LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 avg("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 FROM subject_totals
			 GROUP BY "region")
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."region" IS NOT DISTINCT FROM benchmark_1_fragment."region" LIMIT 1"
		`);
	});

	it('comparison: benchmark with exclude_self', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'sum(total_sales)',
			comparison: {
				compare_vs: 'benchmark',
				benchmark: {
					agg: 'avg',
					subject: 'region',
					exclude_self: true
				}
			}
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 
			 (sum("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") OVER () - "__ev_sum_total_sales_benchmark_avg_comparison_subject_total") /
			 (count(*) OVER () - 1) as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."region" <=> benchmark_1_fragment."region" LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "SUM_TOTAL_SALES", region AS "REGION"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "REGION",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY REGION)
			 SELECT
			 "REGION",
			 
			 (sum("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") OVER () - "__ev_sum_total_sales_benchmark_avg_comparison_subject_total") /
			 (count(*) OVER () - 1) as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."SUM_TOTAL_SALES" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."SUM_TOTAL_SALES" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."REGION" IS NOT DISTINCT FROM benchmark_1_fragment."REGION" LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as \`region\`,
			 sum(total_sales) as \`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 \`region\`,
			 
			 (sum(\`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`) OVER () - \`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`) /
			 (count(*) OVER () - 1) as \`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\` as \`__ev_sum_total_sales_benchmark_avg_comparison_compared_value\`, (main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 as \`__ev_sum_total_sales_benchmark_avg_comparison_abs\`, ((main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 / nullIf(abs(benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`), 0)) as \`__ev_sum_total_sales_benchmark_avg_comparison_pct\`
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON ((main_query.\`region\` IS NULL AND benchmark_1_fragment.\`region\` IS NULL) OR main_query.\`region\` = benchmark_1_fragment.\`region\`) LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY region),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 
			 (sum("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") OVER () - "__ev_sum_total_sales_benchmark_avg_comparison_subject_total") /
			 (count(*) OVER () - 1) as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON ((main_query."region" IS NULL AND benchmark_1_fragment."region" IS NULL) OR main_query."region" = benchmark_1_fragment."region") ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as \`region\`,
			 sum(total_sales) as \`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 \`region\`,
			 
			 (sum(\`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`) OVER () - \`__ev_sum_total_sales_benchmark_avg_comparison_subject_total\`) /
			 (count(*) OVER () - 1) as \`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\` as \`__ev_sum_total_sales_benchmark_avg_comparison_compared_value\`, (main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 as \`__ev_sum_total_sales_benchmark_avg_comparison_abs\`, ((main_query.\`sum_total_sales\` - benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`) * 1.0 / nullIf(abs(benchmark_1_fragment.\`__ev_sum_total_sales_benchmark_avg_comparison_benchmark\`), 0)) as \`__ev_sum_total_sales_benchmark_avg_comparison_pct\`
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query.\`region\` <=> benchmark_1_fragment.\`region\` LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY region),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 
			 (sum("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") OVER () - "__ev_sum_total_sales_benchmark_avg_comparison_subject_total") /
			 (count(*) OVER () - 1) as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."region" IS NOT DISTINCT FROM benchmark_1_fragment."region" LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY region),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 
			 (sum("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") OVER () - "__ev_sum_total_sales_benchmark_avg_comparison_subject_total") /
			 (count(*) OVER () - 1) as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON ((main_query."region" IS NULL AND benchmark_1_fragment."region" IS NULL) OR main_query."region" = benchmark_1_fragment."region") LIMIT 1"
			----
			"WITH main_query AS (SELECT sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL),
			benchmark_1_fragment AS (WITH subject_totals AS (SELECT 
			 region as "region",
			 sum(total_sales) as "__ev_sum_total_sales_benchmark_avg_comparison_subject_total"
			 FROM demo.daily_orders
			 
			 GROUP BY region)
			 SELECT
			 "region",
			 
			 (sum("__ev_sum_total_sales_benchmark_avg_comparison_subject_total") OVER () - "__ev_sum_total_sales_benchmark_avg_comparison_subject_total") /
			 (count(*) OVER () - 1) as "__ev_sum_total_sales_benchmark_avg_comparison_benchmark"
			 
			 FROM subject_totals)
			SELECT main_query.*, benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark" as "__ev_sum_total_sales_benchmark_avg_comparison_compared_value", (main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 as "__ev_sum_total_sales_benchmark_avg_comparison_abs", ((main_query."sum_total_sales" - benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark") * 1.0 / nullIf(abs(benchmark_1_fragment."__ev_sum_total_sales_benchmark_avg_comparison_benchmark"), 0)) as "__ev_sum_total_sales_benchmark_avg_comparison_pct"
			FROM main_query
			LEFT JOIN benchmark_1_fragment ON main_query."region" IS NOT DISTINCT FROM benchmark_1_fragment."region" LIMIT 1"
		`);
	});
});
