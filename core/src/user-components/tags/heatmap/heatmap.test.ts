import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildHeatmapSQL, type HeatmapSQLAttrs } from './build-heatmap-sql';
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

function buildAllDialects(attrs: Omit<HeatmapSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildHeatmapSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('heatmap SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'region',
			value: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "CATEGORY", region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES DESC"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
		`);
	});

	// x_date_grain and y_date_grain emit ClickHouse-specific date functions
	// (toStartOfMonth, toDayOfWeek, etc.) — pinned here so a dialect swap is caught.
	it('x_date_grain=month emits toStartOfMonth', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'region',
			value: 'sum(total_sales)',
			x_date_grain: 'month'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES DESC"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATETRUNC(month, date), region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date), region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date), region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
		`);
	});

	it('x/y date_grain combo (day of week × month of year)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'date',
			value: 'sum(total_sales)',
			x_date_grain: 'day of week',
			y_date_grain: 'month of year'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toDayOfWeek(date, 3) AS "date__day_of_week", toMonth(date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DAYOFWEEK(date) AS "DATE__DAY_OF_WEEK", MONTH(date) AS "DATE__MONTH_OF_YEAR", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES DESC"
			----
			"SELECT EXTRACT(DAYOFWEEK FROM date) AS \`date__day_of_week\`, EXTRACT(MONTH FROM date) AS \`date__month_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DATEPART(weekday, date) AS "date__day_of_week", MONTH(date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATEPART(weekday, date), MONTH(date)
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DAYOFWEEK(date) AS \`date__day_of_week\`, MONTH(date) AS \`date__month_of_year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT EXTRACT(DOW FROM date) AS "date__day_of_week", EXTRACT(MONTH FROM date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DOW FROM date), EXTRACT(MONTH FROM date)
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT EXTRACT(DOW FROM date) AS "date__day_of_week", EXTRACT(MONTH FROM date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY EXTRACT(DOW FROM date), EXTRACT(MONTH FROM date)
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT DAYOFWEEK(date) AS "date__day_of_week", MONTH(date) AS "date__month_of_year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'region',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "CATEGORY", region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES DESC"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
		`);
	});
});
