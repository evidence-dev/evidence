import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../../test-utils/ch-parse';
import { buildChartSQL, type ChartSQLAttrs } from '../build-chart-sql';
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

// line_chart shares ComboChart + SeriesModel (same SQL pipeline as bar_chart),
// so only distinct surfaces are covered here. date_range / processDateRange is
// the dialect-sensitive path most naturally associated with line charts.

const ANCHOR = new Date(2026, 3, 23);

describe('line_chart SQL — date_range classes', () => {
	it('last N units (relative past)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: ANCHOR
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfDay(date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2026-03-25') AND date <= toDate('2026-04-23'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS "DATE__DAY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2026-03-25') AND date <= TO_DATE('2026-04-23'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY"
			----
			"SELECT DATE_TRUNC(date, DAY) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-25' AND date <= DATE '2026-04-23')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATETRUNC(day, date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-03-25' AS DATE) AND date <= CAST('2026-04-23' AS DATE))
			 GROUP BY DATETRUNC(day, date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-25' AND date <= DATE '2026-04-23')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-25' AND date <= DATE '2026-04-23')
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-03-25' AS TIMESTAMP) AND date <= CAST('2026-04-23' AS TIMESTAMP))
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-25' AND date <= DATE '2026-04-23')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
		`);
	});

	it('this <unit> (current full period)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'month',
			date_range: { date: 'date', range: 'this year' },
			anchorDate: ANCHOR
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2026-01-01') AND date <= toDate('2026-12-31'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2026-01-01') AND date <= TO_DATE('2026-12-31'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__MONTH"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-12-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-01-01' AS DATE) AND date <= CAST('2026-12-31' AS DATE))
			 GROUP BY DATETRUNC(month, date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-12-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-12-31')
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-01-01' AS TIMESTAMP) AND date <= CAST('2026-12-31' AS TIMESTAMP))
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-12-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
		`);
	});

	it('previous <unit> (previous full period)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day',
			date_range: { date: 'date', range: 'previous month' },
			anchorDate: ANCHOR
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfDay(date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2026-03-01') AND date <= toDate('2026-03-31'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS "DATE__DAY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2026-03-01') AND date <= TO_DATE('2026-03-31'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY"
			----
			"SELECT DATE_TRUNC(date, DAY) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-01' AND date <= DATE '2026-03-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATETRUNC(day, date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-03-01' AS DATE) AND date <= CAST('2026-03-31' AS DATE))
			 GROUP BY DATETRUNC(day, date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-01' AND date <= DATE '2026-03-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-01' AND date <= DATE '2026-03-31')
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-03-01' AS TIMESTAMP) AND date <= CAST('2026-03-31' AS TIMESTAMP))
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-03-01' AND date <= DATE '2026-03-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
		`);
	});

	it('<unit> to date', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day',
			date_range: { date: 'date', range: 'year to date' },
			anchorDate: ANCHOR
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfDay(date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2026-01-01') AND date <= toDate('2026-04-23'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS "DATE__DAY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2026-01-01') AND date <= TO_DATE('2026-04-23'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY"
			----
			"SELECT DATE_TRUNC(date, DAY) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-04-23')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATETRUNC(day, date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-01-01' AS DATE) AND date <= CAST('2026-04-23' AS DATE))
			 GROUP BY DATETRUNC(day, date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-04-23')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-04-23')
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2026-01-01' AS TIMESTAMP) AND date <= CAST('2026-04-23' AS TIMESTAMP))
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2026-01-01' AND date <= DATE '2026-04-23')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
		`);
	});

	it('all time (no date filter)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'month',
			date_range: { date: 'date', range: 'all time' },
			anchorDate: ANCHOR
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

	it('explicit "YYYY-MM-DD to YYYY-MM-DD"', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'day',
			date_range: { date: 'date', range: '2023-01-01 to 2023-12-31' },
			anchorDate: ANCHOR
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfDay(date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2023-01-01') AND date <= toDate('2023-12-31'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS "DATE__DAY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2023-01-01') AND date <= TO_DATE('2023-12-31'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__DAY"
			----
			"SELECT DATE_TRUNC(date, DAY) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2023-01-01' AND date <= DATE '2023-12-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATETRUNC(day, date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2023-01-01' AS DATE) AND date <= CAST('2023-12-31' AS DATE))
			 GROUP BY DATETRUNC(day, date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('DAY', date) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2023-01-01' AND date <= DATE '2023-12-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2023-01-01' AND date <= DATE '2023-12-31')
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2023-01-01' AS TIMESTAMP) AND date <= CAST('2023-12-31' AS TIMESTAMP))
			 GROUP BY DATE_TRUNC('day', date)
			 
			 
			 ORDER BY date__day"
			----
			"SELECT DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2023-01-01' AND date <= DATE '2023-12-31')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__day"
		`);
	});
});
