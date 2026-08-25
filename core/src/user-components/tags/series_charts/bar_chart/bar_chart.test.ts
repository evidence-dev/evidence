import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../../test-utils/ch-parse';
import { buildChartSQL, type ChartSQLAttrs } from '../build-chart-sql';
import { processColumnExpression } from '../../../common/sql-expression-utils';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect
} from '../../../../sql-dialect';

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

function buildAllDialects(attrs: Omit<ChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('bar_chart SQL (schema examples)', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY CATEGORY"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
		`);
	});

	it('Bar Chart with Date Grain', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'month'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__MONTH"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATETRUNC(month, date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
		`);
	});

	it('Sorting by Value', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			order: 'sum(total_sales) desc'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
		`);
	});

	it('Custom Category Order', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			x_sort: ['Clothing', 'Home', 'Sports', 'Electronics']
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY CATEGORY"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
		`);
	});

	it('x_sort="desc"', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			x_sort: 'desc'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category desc"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY CATEGORY desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category desc"
		`);
	});

	it('Bar Chart with Series Colors', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			series:
				"case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end"
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS "case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES", case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS "CASE_WHEN_SUM_TOTAL_SALES_7000_THEN_7K_WHEN_SUM_TOTAL_SALES_3500_THEN_3_5K_ELSE_3_5K_END"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY CATEGORY"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`, case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS \`case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS "case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`, case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS \`case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS "case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS "case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 7000 then '>$7k' when sum(total_sales) > 3500 then '>$3.5k' else '<$3.5k' end AS "case_when_sum_total_sales_7000_then_7k_when_sum_total_sales_3500_then_3_5k_else_3_5k_end"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category"
		`);
	});

	it('100% Stacked Bar Chart', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			series: 'category',
			date_grain: 'month'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", sum(total_sales) AS "sum_total_sales", category AS "category"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", sum(total_sales) AS "SUM_TOTAL_SALES", category AS "CATEGORY"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__MONTH"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`, category AS \`category\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", sum(total_sales) AS "sum_total_sales", category AS "category"
			 FROM demo.daily_orders
			 
			 GROUP BY DATETRUNC(month, date), category
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`, category AS \`category\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales", category AS "category"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date), category
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales", category AS "category"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date), category
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales", category AS "category"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
		`);
	});

	it('Revenue by Day of Week', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day of week'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toDayOfWeek(date, 3) AS "date__day_of_week", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_week"
			----
			"SELECT DAYOFWEEK(date) AS "DATE__DAY_OF_WEEK", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY_OF_WEEK"
			----
			"SELECT EXTRACT(DAYOFWEEK FROM date) AS \`date__day_of_week\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_week"
			----
			"SELECT DATEPART(weekday, date) AS "date__day_of_week", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATEPART(weekday, date)
			 
			 
			 ORDER BY date__day_of_week"
			----
			"SELECT DAYOFWEEK(date) AS \`date__day_of_week\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_week"
			----
			"SELECT EXTRACT(DOW FROM date) AS "date__day_of_week", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DOW FROM date)
			 
			 
			 ORDER BY date__day_of_week"
			----
			"SELECT EXTRACT(DOW FROM date) AS "date__day_of_week", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DOW FROM date)
			 
			 
			 ORDER BY date__day_of_week"
			----
			"SELECT DAYOFWEEK(date) AS "date__day_of_week", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_week"
		`);
	});

	it('Seasonality Analysis (Month of Year)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'month of year'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toMonth(date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month_of_year"
			----
			"SELECT MONTH(date) AS "DATE__MONTH_OF_YEAR", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__MONTH_OF_YEAR"
			----
			"SELECT EXTRACT(MONTH FROM date) AS \`date__month_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month_of_year"
			----
			"SELECT MONTH(date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY MONTH(date)
			 
			 
			 ORDER BY date__month_of_year"
			----
			"SELECT MONTH(date) AS \`date__month_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month_of_year"
			----
			"SELECT EXTRACT(MONTH FROM date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(MONTH FROM date)
			 
			 
			 ORDER BY date__month_of_year"
			----
			"SELECT EXTRACT(MONTH FROM date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(MONTH FROM date)
			 
			 
			 ORDER BY date__month_of_year"
			----
			"SELECT MONTH(date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month_of_year"
		`);
	});

	it('Quarterly Trends', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'quarter of year'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toQuarter(date) AS "date__quarter_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__quarter_of_year"
			----
			"SELECT QUARTER(date) AS "DATE__QUARTER_OF_YEAR", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__QUARTER_OF_YEAR"
			----
			"SELECT EXTRACT(QUARTER FROM date) AS \`date__quarter_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__quarter_of_year"
			----
			"SELECT DATEPART(quarter, date) AS "date__quarter_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATEPART(quarter, date)
			 
			 
			 ORDER BY date__quarter_of_year"
			----
			"SELECT QUARTER(date) AS \`date__quarter_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__quarter_of_year"
			----
			"SELECT EXTRACT(QUARTER FROM date) AS "date__quarter_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(QUARTER FROM date)
			 
			 
			 ORDER BY date__quarter_of_year"
			----
			"SELECT EXTRACT(QUARTER FROM date) AS "date__quarter_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(QUARTER FROM date)
			 
			 
			 ORDER BY date__quarter_of_year"
			----
			"SELECT QUARTER(date) AS "date__quarter_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__quarter_of_year"
		`);
	});

	it('Monthly Billing Cycle Patterns', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day of month'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toDayOfMonth(date) AS "date__day_of_month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_month"
			----
			"SELECT DAYOFMONTH(date) AS "DATE__DAY_OF_MONTH", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY_OF_MONTH"
			----
			"SELECT EXTRACT(DAY FROM date) AS \`date__day_of_month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_month"
			----
			"SELECT DAY(date) AS "date__day_of_month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DAY(date)
			 
			 
			 ORDER BY date__day_of_month"
			----
			"SELECT DAYOFMONTH(date) AS \`date__day_of_month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_month"
			----
			"SELECT EXTRACT(DAY FROM date) AS "date__day_of_month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DAY FROM date)
			 
			 
			 ORDER BY date__day_of_month"
			----
			"SELECT EXTRACT(DAY FROM date) AS "date__day_of_month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DAY FROM date)
			 
			 
			 ORDER BY date__day_of_month"
			----
			"SELECT DAYOFMONTH(date) AS "date__day_of_month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_month"
		`);
	});

	it('Week Number Analysis', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'week of year'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toWeek(date, 0) AS "date__week_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week_of_year"
			----
			"SELECT WEEKOFYEAR(date) AS "DATE__WEEK_OF_YEAR", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__WEEK_OF_YEAR"
			----
			"SELECT EXTRACT(ISOWEEK FROM date) AS \`date__week_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week_of_year"
			----
			"SELECT DATEPART(week, date) AS "date__week_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATEPART(week, date)
			 
			 
			 ORDER BY date__week_of_year"
			----
			"SELECT WEEKOFYEAR(date) AS \`date__week_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week_of_year"
			----
			"SELECT EXTRACT(WEEK FROM date) AS "date__week_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(WEEK FROM date)
			 
			 
			 ORDER BY date__week_of_year"
			----
			"SELECT EXTRACT(WEEK FROM date) AS "date__week_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(WEEK FROM date)
			 
			 
			 ORDER BY date__week_of_year"
			----
			"SELECT WEEKOFYEAR(date) AS "date__week_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__week_of_year"
		`);
	});

	it('Day of Year Analysis', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day of year'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toDayOfYear(date) AS "date__day_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_year"
			----
			"SELECT DAYOFYEAR(date) AS "DATE__DAY_OF_YEAR", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY_OF_YEAR"
			----
			"SELECT EXTRACT(DAYOFYEAR FROM date) AS \`date__day_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_year"
			----
			"SELECT DATEPART(dayofyear, date) AS "date__day_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATEPART(dayofyear, date)
			 
			 
			 ORDER BY date__day_of_year"
			----
			"SELECT DAYOFYEAR(date) AS \`date__day_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_year"
			----
			"SELECT EXTRACT(DOY FROM date) AS "date__day_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DOY FROM date)
			 
			 
			 ORDER BY date__day_of_year"
			----
			"SELECT EXTRACT(DOY FROM date) AS "date__day_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DOY FROM date)
			 
			 
			 ORDER BY date__day_of_year"
			----
			"SELECT DAYOFYEAR(date) AS "date__day_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day_of_year"
		`);
	});

	// x_sort="data" means "preserve query order" — no ORDER BY should be emitted.
	it('x_sort="data" (no series) emits no ORDER BY', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			x_sort: 'data'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
		`);
	});

	it('non-aggregating chart skips GROUP BY + default ORDER BY so source order propagates', () => {
		// Bare x + bare y with no aggregation anywhere is a passthrough over
		// the user's source query. We must not GROUP BY (would rehash and lose
		// row order) and must not add a default ORDER BY x (would clobber the
		// author's own ORDER BY inside the inline query).
		const { sql } = buildAllDialects({
			data: 'demo.waterfall_steps',
			x: 'step',
			y: 'amount'
		});
		expect(sql).not.toContain('GROUP BY');
		expect(sql).not.toContain('ORDER BY');
	});

	it('non-aggregating chart with sum() tooltip field still emits GROUP BY (tooltip-agg fix)', () => {
		// P1 fix: skipGroupBy must look at tooltip columns too. Bare primary
		// columns with an aggregate tooltip would otherwise emit a mixed
		// aggregate + bare-column SELECT with no GROUP BY that every warehouse
		// rejects.
		const dialect = new ClickHouseDialect();
		const { sql } = buildChartSQL({
			data: 'demo.orders',
			x: 'category',
			y: 'total',
			tooltipFieldColumns: [
				processColumnExpression({ value: 'sum(profit)' }, dialect)
			] as const,
			dialect
		});
		expect(sql).toContain('GROUP BY');
	});

	it('sort="x asc" emits ORDER BY x asc', () => {
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: 'x asc'
		});
		expect(sql).toContain('ORDER BY category asc');
	});

	it('sort="x desc" emits ORDER BY x desc', () => {
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: 'x desc'
		});
		expect(sql).toContain('ORDER BY category desc');
	});

	it('sort="y desc" resolves to y alias so aggregation is preserved', () => {
		// Referencing the alias (not the raw sum(...)) prevents the SELECT
		// order-column-lifter from adding the bare column and breaking agg.
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total_sales)',
			sort: 'y desc'
		});
		expect(sql).toContain('sum_total_sales desc');
	});

	it('sort="y asc" on non-aggregating chart references the y alias', () => {
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'amount',
			sort: 'y asc'
		});
		expect(sql).toContain('amount asc');
	});

	it('sort=[...] emits stable ORDER BY x (client layer applies the array order)', () => {
		// Explicit category order needs a deterministic SQL sort for correct
		// LIMIT semantics; the array reorder happens client-side.
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: ['B', 'A', 'C']
		});
		expect(sql).toContain('ORDER BY category');
	});

	it('sort takes precedence over x_sort when both are provided', () => {
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: 'x desc',
			x_sort: 'asc'
		});
		expect(sql).toContain('category desc');
	});

	it('sort takes precedence over order= raw escape hatch', () => {
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: 'x asc',
			order: 'category desc'
		});
		expect(sql).toContain('category asc');
		expect(sql).not.toContain('category desc');
	});

	it('skipLimit=true drops the LIMIT clause', () => {
		// ComboChart flips this on for multi-child unified y-sort so per-child
		// truncation doesn't skew the client-side cross-child totals.
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: 'y desc',
			limit: 5,
			skipLimit: true
		});
		expect(sql).not.toContain('LIMIT 5');
	});

	it('skipLimit=false keeps the LIMIT clause', () => {
		const { sql } = buildAllDialects({
			data: 'demo.orders',
			x: 'category',
			y: 'sum(total)',
			sort: 'y desc',
			limit: 5
		});
		expect(sql).toContain('LIMIT 5');
	});

	it('x_sort="data" with series still orders by x, series (stacked-rendering quirk)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			series: 'region',
			x_sort: 'data'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category, region"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES", region AS "REGION"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY CATEGORY, region"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY category, region"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY category, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY category, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category, region"
		`);
	});
});
