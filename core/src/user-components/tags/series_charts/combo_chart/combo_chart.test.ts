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

// Combo chart itself emits no SQL — children (SeriesModels) call
// buildChartSQLConfig with { ...sharedContext, y: <child's y> }. These tests
// simulate that flow by invoking buildChartSQL with combo-level attrs +
// a child series' y column.
describe('combo_chart SQL (per-child series queries)', () => {
	// TODO: BUG - when `order` and `x_sort` are both set, x_sort silently wins and `order` is dropped from the query. A user supplying both reasonably expects `order` to be the ORDER BY. Either emit a warning or let `order` take precedence over x_sort.
	it('schema example: x=category, order + x_sort="data" — x_sort wins, order ignored', () => {
		// {% combo_chart
		//     data="demo.daily_orders"
		//     x="category"
		//     order="avg(avg_transaction_value) desc"
		//     x_sort="data"
		// %}
		//   {% series y="avg(avg_transaction_value)" /%}
		//   {% series y="sum(transactions)" /%}
		// {% /combo_chart %}
		const sharedAttrs = {
			data: 'demo.daily_orders',
			x: 'category',
			order: 'avg(avg_transaction_value) desc',
			x_sort: 'data' as const
		};

		// First child series
		const series1 = buildAllDialects({ ...sharedAttrs, y: 'avg(avg_transaction_value)' });
		expect(series1.sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", avg(avg_transaction_value) AS "AVG_AVG_TRANSACTION_VALUE"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, avg(avg_transaction_value) AS \`avg_avg_transaction_value\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS \`category\`, avg(avg_transaction_value) AS \`avg_avg_transaction_value\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
		`);

		// Second child series — same shared context, different y
		const series2 = buildAllDialects({ ...sharedAttrs, y: 'sum(transactions)' });
		expect(series2.sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(transactions) AS "sum_transactions"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", sum(transactions) AS "SUM_TRANSACTIONS"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, sum(transactions) AS \`sum_transactions\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(transactions) AS "sum_transactions"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS \`category\`, sum(transactions) AS \`sum_transactions\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(transactions) AS "sum_transactions"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(transactions) AS "sum_transactions"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(transactions) AS "sum_transactions"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
		`);
	});

	it('order respected when x_sort is absent', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'avg(avg_transaction_value)',
			order: 'avg(avg_transaction_value) desc'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS "CATEGORY", avg(avg_transaction_value) AS "AVG_AVG_TRANSACTION_VALUE"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS \`category\`, avg(avg_transaction_value) AS \`avg_avg_transaction_value\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS \`category\`, avg(avg_transaction_value) AS \`avg_avg_transaction_value\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
			----
			"SELECT category AS "category", avg(avg_transaction_value) AS "avg_avg_transaction_value"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY avg(avg_transaction_value) desc"
		`);
	});

	it('sort="y desc" flows through every child series and references each y alias', () => {
		// Simulates a two-child combo where every child inherits the parent's
		// `sort=`. Each child references its own y alias, so aggregates stay
		// intact and Postgres/BigQuery accept the ordering.
		const shared = {
			data: 'demo.daily_orders',
			x: 'category',
			sort: 'y desc' as const
		};

		const series1 = buildChartSQL({
			...shared,
			y: 'sum(total_sales)',
			dialect: new ClickHouseDialect()
		}).sql;
		expect(series1).toContain('sum_total_sales desc');

		const series2 = buildChartSQL({
			...shared,
			y: 'sum(transactions)',
			dialect: new ClickHouseDialect()
		}).sql;
		expect(series2).toContain('sum_transactions desc');
	});

	it('sort=[array] with limit — child SQL keeps a stable ORDER BY x (LIMIT still bounds rows)', () => {
		// Array sort is client-side reorder. SQL keeps ORDER BY x so LIMIT is
		// deterministic. Author still gets the top-N x values in x order at
		// SQL time; the chart layer rearranges them to the given array.
		const sql = buildChartSQL({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			sort: ['B', 'A', 'C'],
			limit: 3,
			dialect: new ClickHouseDialect()
		}).sql;
		expect(sql).toContain('ORDER BY category');
		expect(sql).toContain('LIMIT 3');
	});

	it('sort="y desc" + skipLimit=true drops per-child LIMIT (P1 fix path)', () => {
		// ComboChart sets `skipLimit` on the shared context when unified y-sort
		// needs the full rowset to rank cross-series correctly. Each child's
		// SQL then omits LIMIT so partial data can't skew the client-side
		// totals; the ranking-then-slice happens in `deriveXValueOrder`.
		const shared = {
			data: 'demo.daily_orders',
			x: 'category',
			sort: 'y desc' as const,
			limit: 5,
			skipLimit: true,
			dialect: new ClickHouseDialect()
		};

		const series1 = buildChartSQL({ ...shared, y: 'sum(total_sales)' }).sql;
		const series2 = buildChartSQL({ ...shared, y: 'sum(transactions)' }).sql;
		expect(series1).not.toContain('LIMIT 5');
		expect(series2).not.toContain('LIMIT 5');
		// The ORDER BY on each child still helps the warehouse's own top-N
		// scan, even without LIMIT.
		expect(series1).toContain('sum_total_sales desc');
		expect(series2).toContain('sum_transactions desc');
	});

	it('sort="y desc" + skipLimit=false keeps LIMIT (single-series path, SQL sorts correctly)', () => {
		// The single-series path leaves `skipLimit=false` because SQL
		// `ORDER BY y_alias LIMIT n` returns the right rows on its own.
		const sql = buildChartSQL({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			sort: 'y desc',
			limit: 5,
			dialect: new ClickHouseDialect()
		}).sql;
		expect(sql).toContain('LIMIT 5');
		expect(sql).toContain('sum_total_sales desc');
	});

	it('metric-mode child + sort="y desc" — references the metric name as y alias', () => {
		// Simulates a `{% line metric="revenue" /%}` child inside a combo_chart
		// with `sort="y desc"`. SeriesModel swaps `data=metric.base` and
		// `y="<expression> AS <metric_name>"`, then buildChartSQLConfig picks
		// up sort just like a raw child. The resulting alias in ORDER BY is
		// the metric's name, not the raw expression.
		const dialect = new ClickHouseDialect();
		const sql = buildChartSQL({
			data: 'analytics.orders', // metric.base
			x: 'category',
			// Simulated metric.valueExpression + quoted alias — matches what
			// SeriesModel builds for a metric child.
			y: 'sum(total_sales) AS "revenue"',
			sort: 'y desc',
			dialect
		}).sql;
		expect(sql).toContain('AS "revenue"');
		expect(sql).toContain('revenue desc');
		// Regression: the alias reference must not accidentally expand back to
		// the raw sum() expression in ORDER BY (would break aggregation on some
		// dialects and defeat the point of using an alias).
		expect(sql).not.toContain('ORDER BY sum(total_sales) desc');
	});

	it('sort="y desc" + filter=[...] — filters, sort, and GROUP BY compose in one query', () => {
		// The whole point of the shared context is that filters and sort don't
		// interfere with each other — filters live in WHERE, sort in ORDER BY,
		// aggregation in GROUP BY.
		const sql = buildChartSQL({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			sort: 'y desc',
			where: 'region = \'north\'',
			dialect: new ClickHouseDialect()
		}).sql;
		expect(sql).toContain("WHERE (region = 'north')");
		expect(sql).toContain('GROUP BY');
		expect(sql).toContain('sum_total_sales desc');
	});

	it('sort="y desc" + date_range on aggregating chart still emits the date filter', () => {
		const sql = buildChartSQL({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)',
			sort: 'y desc',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1),
			dialect: new ClickHouseDialect()
		}).sql;
		expect(sql).toContain("date >= toDate('2025-12-03')");
		expect(sql).toContain('sum_total_sales desc');
	});

	it('non-agg y across two children preserves source ORDER BY per child (no ORDER BY x default)', () => {
		// The AI-writes-SQL-with-ORDER-BY scenario, spanning two children of a
		// combo. Both bare y children skip GROUP BY and skip the default
		// ORDER BY x — the inline query's own ORDER BY propagates.
		const shared = { data: 'demo.waterfall', x: 'step', dialect: new ClickHouseDialect() };
		const bar = buildChartSQL({ ...shared, y: 'amount' }).sql;
		const line = buildChartSQL({ ...shared, y: 'cumulative_amount' }).sql;
		expect(bar).not.toContain('GROUP BY');
		expect(bar).not.toContain('ORDER BY');
		expect(line).not.toContain('GROUP BY');
		expect(line).not.toContain('ORDER BY');
	});

	it('x_sort="data" with no series emits no ORDER BY (order ignored)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'avg(avg_transaction_value)',
			order: 'avg(avg_transaction_value) desc',
			x_sort: 'data'
		});
		expect(sql).not.toMatch(/ORDER BY/);
	});

	it('date_grain on x flows through shared context', () => {
		// {% combo_chart data="demo.daily_orders" x="date" date_grain="month" %}
		//   {% series y="sum(total_sales)" /%}
		// {% /combo_chart %}
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			x: 'date',
			date_grain: 'month',
			y: 'sum(total_sales)'
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

	it('date_range on combo applies to every child series', () => {
		const shared = {
			data: 'demo.daily_orders',
			x: 'date',
			date_grain: 'month',
			date_range: { date: 'date', range: 'last 12 months' },
			anchorDate: new Date(2026, 0, 1)
		};

		const series1 = buildAllDialects({ ...shared, y: 'sum(total_sales)' });
		expect(series1.sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-01-02') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS "DATE__MONTH", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-01-02') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE__MONTH"
			----
			"SELECT DATE_TRUNC(date, MONTH) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATETRUNC(month, date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-01-02' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY DATETRUNC(month, date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('MONTH', date) AS \`date__month\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-01-02' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY DATE_TRUNC('month', date)
			 
			 
			 ORDER BY date__month"
			----
			"SELECT DATE_TRUNC('month', date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month"
		`);

		const series2 = buildAllDialects({ ...shared, y: 'sum(transactions)' });
		// Second series inherits the same WHERE and date_grain
		expect(series2.sql).toContain(
			"WHERE (date >= toDate('2025-01-02') AND date <= toDate('2026-01-01'))"
		);
		expect(series2.sql).toContain('toStartOfMonth(date)');
	});
});

// tooltip_fields append to the child's SELECT so hover extras come out of
// the same aggregation. `processColumnExpression` derives aliases
// deterministically from the SQL text, so an author showing the same
// metric twice (say, primary y in USD and a tooltip field with a coarser
// USD format) will collide on that shared alias. Warehouses reject
// duplicate SELECT aliases, so buildChartSQLConfig drops the collisions
// — the tooltip formatter still reads `extras[alias]` and finds the
// value under the primary column's alias, so nothing breaks visually.
describe('combo_chart SQL — tooltip_fields column dedup', () => {
	// Small helper — mimics what SeriesModel does with resolveTooltipFields
	// before calling buildChartSQLConfig, but avoids pulling in the runtime
	// module here (which needs the resolvers). We just use
	// processColumnExpression directly.
	const shared = {
		data: 'demo.daily_orders',
		x: 'date',
		date_grain: 'month' as const
	};

	it('drops a tooltip field whose alias matches the primary y', async () => {
		const { processColumnExpression } = await import('../../../common/sql-expression-utils');
		const { ClickHouseDialect } = await import('../../../../sql-dialect');
		const dialect = new ClickHouseDialect();
		// Exactly the "same metric, different format" scenario.
		const duplicateColumn = processColumnExpression({ value: 'sum(total_sales)' }, dialect);

		const sql = buildChartSQL({
			...shared,
			y: 'sum(total_sales)',
			tooltipFieldColumns: [duplicateColumn],
			dialect
		}).sql;

		// Only one occurrence of `AS "sum_total_sales"` — the tooltip
		// field's would-be duplicate is dropped. The tooltip formatter
		// still finds the value under the primary alias in the row.
		const aliasCount = (sql.match(/AS "sum_total_sales"/g) || []).length;
		expect(aliasCount).toBe(1);
	});

	it('drops a tooltip field whose alias matches an earlier tooltip field', async () => {
		const { processColumnExpression } = await import('../../../common/sql-expression-utils');
		const { ClickHouseDialect } = await import('../../../../sql-dialect');
		const dialect = new ClickHouseDialect();
		const first = processColumnExpression({ value: 'sum(transactions)' }, dialect);
		const second = processColumnExpression({ value: 'sum(transactions)' }, dialect);

		const sql = buildChartSQL({
			...shared,
			y: 'sum(total_sales)',
			tooltipFieldColumns: [first, second],
			dialect
		}).sql;

		// Primary + one tooltip column, not two.
		expect(sql).toContain('AS "sum_total_sales"');
		const txCount = (sql.match(/AS "sum_transactions"/g) || []).length;
		expect(txCount).toBe(1);
	});

	it('non-agg primary + agg tooltip keeps GROUP BY (P1 fix)', async () => {
		// Regression: without the tooltip-agg-awareness fix, a bare x/y with an
		// aggregate tooltip would skip GROUP BY and emit a mixed SELECT the
		// warehouse rejects.
		const { processColumnExpression } = await import('../../../common/sql-expression-utils');
		const { ClickHouseDialect } = await import('../../../../sql-dialect');
		const dialect = new ClickHouseDialect();
		const aggTooltip = processColumnExpression({ value: 'sum(profit)' }, dialect);

		const sql = buildChartSQL({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'amount',
			tooltipFieldColumns: [aggTooltip],
			dialect
		}).sql;

		expect(sql).toContain('GROUP BY');
	});

	it('keeps a tooltip field whose alias is genuinely distinct', async () => {
		const { processColumnExpression } = await import('../../../common/sql-expression-utils');
		const { ClickHouseDialect } = await import('../../../../sql-dialect');
		const dialect = new ClickHouseDialect();
		const extra = processColumnExpression({ value: 'sum(transactions)' }, dialect);

		const sql = buildChartSQL({
			...shared,
			y: 'sum(total_sales)',
			tooltipFieldColumns: [extra],
			dialect
		}).sql;

		expect(sql).toContain('AS "sum_total_sales"');
		expect(sql).toContain('AS "sum_transactions"');
	});
});
