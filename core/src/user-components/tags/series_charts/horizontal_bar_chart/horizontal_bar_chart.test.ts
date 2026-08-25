import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../../test-utils/ch-parse';
import {
	buildHorizontalBarChartSQL,
	type HorizontalBarChartSQLAttrs
} from './build-horizontal-bar-chart-sql';
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

function buildAllDialects(attrs: Omit<HorizontalBarChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildHorizontalBarChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('horizontal_bar_chart SQL', () => {
	it('Basic Usage — default ORDER BY value desc', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
		`);
	});

	it('y_sort="asc"', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			y_sort: 'asc'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category asc"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY CATEGORY asc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category asc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category asc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category asc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category asc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category asc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category asc"
		`);
	});

	it('y_sort="data" emits no ORDER BY', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			y_sort: 'data'
		});
		expect(sql).not.toMatch(/ORDER BY/);
	});

	it('y_sort=string[] uses y column (client-side array sort)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			y_sort: ['Home', 'Clothing', 'Sports', 'Electronics']
		});
		expect(sql).toContain('ORDER BY category');
	});

	it('series appends to ORDER BY (pre-refactor quirk)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			series: 'region'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc, region"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES", region AS "REGION"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES desc, region"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales desc, region"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`, region AS \`region\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales desc, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region
			 
			 
			 ORDER BY sum_total_sales desc, region"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales", region AS "region"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc, region"
		`);
	});

	it('date_grain on y (vertical date axis)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'date',
			date_grain: 'month'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES desc"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATETRUNC(month, date)
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
		`);
	});

	it('sort="x desc" — biggest bars first (equivalent to bar_chart sort="y desc")', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			sort: 'x desc'
		});
		expect(sql).toContain('sum_total_sales desc');
	});

	it('sort="x asc" — smallest bars first', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			sort: 'x asc'
		});
		expect(sql).toContain('sum_total_sales asc');
	});

	it('sort="y desc" — categories reverse-alphabetical', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			sort: 'y desc'
		});
		expect(sql).toContain('category desc');
	});

	it('sort=[array] — SQL stable ORDER BY y, chart layer reorders client-side', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			sort: ['Enterprise', 'SMB', 'Consumer']
		});
		expect(sql).toContain('ORDER BY category');
	});

	it('sort takes precedence over legacy y_sort', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			sort: 'x desc',
			y_sort: 'asc'
		});
		expect(sql).toContain('sum_total_sales desc');
	});

	it('non-aggregating chart preserves source ORDER BY (no default value-desc)', () => {
		const { sql } = buildAllDialects({
			data: 'my_ranked_categories',
			x: 'total',
			y: 'category'
		});
		expect(sql).not.toContain('GROUP BY');
		expect(sql).not.toContain('ORDER BY');
	});

	it('non-aggregating primary + aggregate tooltip still emits GROUP BY (P1 fix)', async () => {
		const { processColumnExpression } = await import('../../../common/sql-expression-utils');
		const { ClickHouseDialect } = await import('../../../../sql-dialect');
		const dialect = new ClickHouseDialect();
		const aggTooltip = processColumnExpression({ value: 'sum(profit)' }, dialect);

		const { sql } = buildHorizontalBarChartSQL({
			data: 'demo.daily_orders',
			x: 'amount',
			y: 'category',
			tooltipFieldColumns: [aggTooltip],
			dialect
		});
		expect(sql).toContain('GROUP BY');
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'sum(total_sales)',
			y: 'category',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales desc"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales desc"
		`);
	});
});
