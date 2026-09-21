import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import {
	buildWaterfallChartSQL,
	buildWaterfallChartSQLConfig,
	resolveWaterfallOrder,
	type WaterfallChartSQLAttrs
} from './build-waterfall-chart-sql';
import { processColumnExpression } from '../../common/sql-expression-utils';
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

function buildAllDialects(attrs: Omit<WaterfallChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildWaterfallChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

const clickhouse = (attrs: Omit<WaterfallChartSQLAttrs, 'dialect'>) =>
	buildWaterfallChartSQL({ ...attrs, dialect: new ClickHouseDialect() }).sql;

describe('resolveWaterfallOrder', () => {
	const base = { xAlias: 'step', yAlias: 'amount', order: undefined };

	it('keeps source order for pre-summarized rows and sorts aggregates largest-first', () => {
		expect(resolveWaterfallOrder({ ...base, xSort: undefined, aggregated: false })).toBeUndefined();
		expect(resolveWaterfallOrder({ ...base, xSort: undefined, aggregated: true })).toBe(
			'amount DESC'
		);
	});

	it('maps each x_sort option', () => {
		expect(resolveWaterfallOrder({ ...base, xSort: 'asc', aggregated: false })).toBe('step ASC');
		expect(resolveWaterfallOrder({ ...base, xSort: 'desc', aggregated: true })).toBe('step DESC');
		expect(resolveWaterfallOrder({ ...base, xSort: 'value_asc', aggregated: false })).toBe(
			'amount ASC'
		);
		expect(resolveWaterfallOrder({ ...base, xSort: 'value_desc', aggregated: false })).toBe(
			'amount DESC'
		);
	});

	it('with a label list, leaves pre-summarized rows in source order and only sorts aggregated ones', () => {
		expect(resolveWaterfallOrder({ ...base, xSort: ['B', 'A'], aggregated: true })).toBe('step');
		expect(
			resolveWaterfallOrder({ ...base, xSort: ['B', 'A'], aggregated: false })
		).toBeUndefined();
	});

	it('orders breakdown mode by x only, so totals run in sequence', () => {
		expect(
			resolveWaterfallOrder({ ...base, xSort: undefined, aggregated: true, breakdown: true })
		).toBe('step ASC');
		expect(
			resolveWaterfallOrder({ ...base, xSort: 'desc', aggregated: true, breakdown: true })
		).toBe('step DESC');
		expect(
			resolveWaterfallOrder({ ...base, xSort: 'value_desc', aggregated: true, breakdown: true })
		).toBe('step ASC');
	});

	it('lets a raw order clause win over everything', () => {
		expect(
			resolveWaterfallOrder({ ...base, order: 'step_order', xSort: 'desc', aggregated: true })
		).toBe('step_order');
	});
});

describe('buildWaterfallChartSQLConfig', () => {
	it('skips GROUP BY for a plain y column so source order survives', () => {
		const config = buildWaterfallChartSQLConfig({ data: 'bridge', x: 'step', y: 'amount' });
		expect(config.skipGroupBy).toBe(true);
		expect(config.order).toBeUndefined();
	});

	it('groups when y aggregates', () => {
		const config = buildWaterfallChartSQLConfig({
			data: 'demo.daily_orders',
			x: 'category',
			y: 'sum(total_sales)'
		});
		expect(config.skipGroupBy).toBe(false);
		expect(config.order).toBe('sum_total_sales DESC');
	});

	it('restores GROUP BY when a tooltip field aggregates over plain rows', () => {
		const dialect = new ClickHouseDialect();
		const config = buildWaterfallChartSQLConfig({
			data: 'bridge',
			x: 'step',
			y: 'amount',
			dialect,
			tooltipFieldColumns: [processColumnExpression({ value: 'sum(share)' }, dialect)]
		});
		expect(config.skipGroupBy).toBe(false);
		// Ordering semantics still follow `y`: plain rows keep their source order.
		expect(config.order).toBeUndefined();

		const sql = buildWaterfallChartSQL({
			data: 'bridge',
			x: 'step',
			y: 'amount',
			dialect,
			tooltipFieldColumns: [processColumnExpression({ value: 'sum(share)' }, dialect)]
		}).sql;
		assertParses(sql);
		expect(sql).toContain('GROUP BY ALL');
	});

	it('selects the bar_type column alongside x and y', () => {
		const config = buildWaterfallChartSQLConfig({
			data: 'bridge',
			x: 'step',
			y: 'amount',
			bar_type: 'kind'
		});
		expect(config.columns.map((c) => c.alias)).toEqual(['step', 'amount', 'kind']);
	});
});

describe('waterfall_chart SQL', () => {
	it('Pre-summarized rows (plain y) — no GROUP BY, no ORDER BY', () => {
		const { sql } = buildAllDialects({
			data: 'revenue_bridge',
			x: 'step',
			y: 'amount',
			bar_type: 'bar_type'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT step AS "step", amount AS "amount", bar_type AS "bar_type"
			 FROM revenue_bridge"
			----
			"SELECT step AS "STEP", amount AS "AMOUNT", bar_type AS "BAR_TYPE"
			 FROM revenue_bridge"
			----
			"SELECT step AS \`step\`, amount AS \`amount\`, bar_type AS \`bar_type\`
			 FROM revenue_bridge"
			----
			"SELECT step AS "step", amount AS "amount", bar_type AS "bar_type"
			 FROM revenue_bridge"
			----
			"SELECT step AS \`step\`, amount AS \`amount\`, bar_type AS \`bar_type\`
			 FROM revenue_bridge"
			----
			"SELECT step AS "step", amount AS "amount", bar_type AS "bar_type"
			 FROM revenue_bridge"
			----
			"SELECT step AS "step", amount AS "amount", bar_type AS "bar_type"
			 FROM revenue_bridge"
			----
			"SELECT step AS "step", amount AS "amount", bar_type AS "bar_type"
			 FROM revenue_bridge"
		`);
	});

	it('Raw data (aggregate y) — grouped, largest change first', () => {
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
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES DESC"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
		`);
	});

	it('date_grain with x_sort asc and a date_range', () => {
		const sql = clickhouse({
			data: 'demo.daily_orders',
			x: 'date',
			y: 'sum(total_sales)',
			date_grain: 'month',
			x_sort: 'asc',
			date_range: { date: 'date', range: 'last 6 months' },
			anchorDate: new Date('2024-07-15T00:00:00Z')
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT toStartOfMonth(date) AS "date__month", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2024-01-16') AND date <= toDate('2024-07-15'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date__month ASC"
		`);
	});

	it('explicit label order on aggregated rows sorts by x in SQL', () => {
		const sql = clickhouse({
			data: 'bridge',
			x: 'step',
			y: 'sum(amount)',
			x_sort: ['Start', 'New', 'Churn']
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT step AS "step", sum(amount) AS "sum_amount"
			 FROM bridge
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY step"
		`);
	});

	it('raw order attribute wins and is pulled into the select when grouping', () => {
		const sql = clickhouse({
			data: 'ledger',
			x: 'account',
			y: 'sum(amount)',
			order: 'step_order'
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT account AS "account", sum(amount) AS "sum_amount", MIN(step_order) AS "step_order"
			 FROM ledger
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY step_order"
		`);
	});

	it('breakdown mode selects x, y and the breakdown column, grouped and ordered by x', () => {
		const { sql } = buildAllDialects({
			data: 'revenue',
			x: 'period',
			y: 'sum(revenue)',
			breakdown: 'segment'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT period AS "period", sum(revenue) AS "sum_revenue", segment AS "segment"
			 FROM revenue
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY period ASC"
			----
			"SELECT period AS "PERIOD", sum(revenue) AS "SUM_REVENUE", segment AS "SEGMENT"
			 FROM revenue
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY PERIOD ASC"
			----
			"SELECT period AS \`period\`, sum(revenue) AS \`sum_revenue\`, segment AS \`segment\`
			 FROM revenue
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY period ASC"
			----
			"SELECT period AS "period", sum(revenue) AS "sum_revenue", segment AS "segment"
			 FROM revenue
			 
			 GROUP BY period, segment
			 
			 
			 ORDER BY period ASC"
			----
			"SELECT period AS \`period\`, sum(revenue) AS \`sum_revenue\`, segment AS \`segment\`
			 FROM revenue
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY period ASC"
			----
			"SELECT period AS "period", sum(revenue) AS "sum_revenue", segment AS "segment"
			 FROM revenue
			 
			 GROUP BY period, segment
			 
			 
			 ORDER BY period ASC"
			----
			"SELECT period AS "period", sum(revenue) AS "sum_revenue", segment AS "segment"
			 FROM revenue
			 
			 GROUP BY period, segment
			 
			 
			 ORDER BY period ASC"
			----
			"SELECT period AS "period", sum(revenue) AS "sum_revenue", segment AS "segment"
			 FROM revenue
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY period ASC"
		`);
	});

	it('where + filters + limit', () => {
		const sql = clickhouse({
			data: 'ledger',
			x: 'account',
			y: 'sum(amount)',
			where: 'fiscal_year = 2024',
			limit: 10
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT account AS "account", sum(amount) AS "sum_amount"
			 FROM ledger
			 WHERE (fiscal_year = 2024)
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC LIMIT 10"
		`);
	});
});
