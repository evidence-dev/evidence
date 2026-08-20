import { describe, it, expect } from 'vitest';
import { resolveMetric, resolveMetricChart, metricDisplayLabel } from './resolve-metric';
import { MetricsCatalog } from './metrics-catalog';
import { buildChartSQL } from '../user-components/tags/series_charts/build-chart-sql';
import { ClickHouseDialect } from '../sql-dialect';

const dialect = new ClickHouseDialect();
const catalog = new MetricsCatalog({
	orders: `
base: orders
date: order_date
default_date_grain: month
dimensions:
  region: customer_region
metrics:
  revenue:
    sql: sum(amount)
    fmt: usd
    label: Total Revenue
  order_count:
    sql: count(*)
`
});

describe('resolveMetric', () => {
	it('resolves a known metric to a compiled query + format + label', () => {
		const r = resolveMetric(catalog, 'revenue', dialect);
		expect(r?.name).toBe('revenue');
		expect(r?.queryConfig).toBeTruthy();
		expect(r?.columnFormats).toEqual({ revenue: 'usd' });
		expect(r?.label).toBe('Total Revenue');
	});

	it('leaves label undefined when the metric has none', () => {
		expect(resolveMetric(catalog, 'order_count', dialect)?.label).toBeUndefined();
	});

	it('returns undefined for an unknown metric (validation surfaces the error)', () => {
		expect(resolveMetric(catalog, 'nope', dialect)).toBeUndefined();
	});

	it('returns undefined with no reference or no catalog', () => {
		expect(resolveMetric(catalog, undefined, dialect)).toBeUndefined();
		expect(resolveMetric(undefined, 'revenue', dialect)).toBeUndefined();
	});
});

describe('metricDisplayLabel (shared across components)', () => {
	it('uses the explicit label when present', () => {
		expect(metricDisplayLabel({ name: 'revenue', label: 'Total Revenue' })).toBe('Total Revenue');
	});

	it('humanizes the name when there is no label', () => {
		expect(metricDisplayLabel({ name: 'order_count' })).toBe('Order Count');
		expect(metricDisplayLabel({ name: 'aov' })).toBe('AOV');
	});

	it('is the same value big_value and line_chart both consume', () => {
		// big_value reads resolveMetric().displayLabel; line_chart carries the same
		// label in `yLabels` (the SQL alias is the raw name so column refs resolve).
		const scalar = resolveMetric(catalog, 'revenue', dialect);
		const chart = resolveMetricChart(catalog, 'revenue', dialect);
		expect(scalar?.displayLabel).toBe('Total Revenue');
		expect(chart?.yLabels[0]).toBe('Total Revenue');
	});
});

describe('resolveMetricChart', () => {
	it('defaults x to the view time column and grain, and aliases y by raw metric name', () => {
		const r = resolveMetricChart(catalog, 'revenue', dialect);
		expect(r?.data).toBe('orders');
		expect(r?.x).toBe('order_date');
		expect(r?.dateGrain).toBe('month');
		// SQL alias is the raw name so `order="revenue"`/column refs resolve; the
		// humanized label rides alongside in `yLabels` for the legend.
		expect(r?.y).toEqual(['sum(amount) AS "revenue"']);
		expect(r?.yLabels).toEqual(['Total Revenue']);
		expect(r?.yFmt).toBe('usd');
	});

	it('fans out multiple metrics into one aliased y expression each', () => {
		// Array shape — matches the `y` attribute's `[String, Array]` type.
		const r = resolveMetricChart(catalog, ['revenue', 'order_count'], dialect);
		expect(r?.y).toEqual(['sum(amount) AS "revenue"', 'count(*) AS "order_count"']);
		// revenue has an explicit label; order_count humanizes from its name.
		expect(r?.yLabels).toEqual(['Total Revenue', 'Order Count']);
		// formats disagree (usd vs none) → no shared axis format
		expect(r?.yFmt).toBeUndefined();
	});

	it('rejects the old comma-separated string shape (returns undefined)', () => {
		// Previously silently split; now not — validator surfaces the fix hint.
		const r = resolveMetricChart(catalog, 'revenue, order_count', dialect);
		expect(r).toBeUndefined();
	});

	it('resolves a named dimension for x and series to its source expression', () => {
		const r = resolveMetricChart(catalog, 'revenue', dialect, { x: 'region', series: 'region' });
		expect(r?.x).toBe('customer_region');
		expect(r?.series).toBe('customer_region');
	});

	it('does NOT apply the view grain when x is overridden to a non-time axis', () => {
		// Regression: `x="region"` was being date-truncated (toStartOfMonth(region))
		// because the view's default grain leaked onto a category axis.
		const r = resolveMetricChart(catalog, 'revenue', dialect, { x: 'region' });
		expect(r?.x).toBe('customer_region');
		expect(r?.dateGrain).toBeUndefined();
	});

	it('does NOT apply the view grain when x is a raw non-dimension column', () => {
		const r = resolveMetricChart(catalog, 'revenue', dialect, { x: 'category' });
		expect(r?.x).toBe('category');
		expect(r?.dateGrain).toBeUndefined();
	});

	it('keeps the grain when x is explicitly the view time column', () => {
		const r = resolveMetricChart(catalog, 'revenue', dialect, { x: 'order_date' });
		expect(r?.x).toBe('order_date');
		expect(r?.dateGrain).toBe('month');
	});

	it('passes through a raw x/series that is not a named dimension', () => {
		const r = resolveMetricChart(catalog, 'revenue', dialect, {
			series: "case when x then 'a' end"
		});
		expect(r?.series).toBe("case when x then 'a' end");
	});

	it('returns undefined for an unknown metric or no catalog', () => {
		expect(resolveMetricChart(catalog, 'nope', dialect)).toBeUndefined();
		expect(resolveMetricChart(undefined, 'revenue', dialect)).toBeUndefined();
	});

	it('feeds the existing chart SQL builder to produce a grouped time series', () => {
		const r = resolveMetricChart(catalog, 'revenue', dialect)!;
		const { sql, error } = buildChartSQL({
			data: r.data,
			x: r.x,
			y: r.y[0],
			date_grain: r.dateGrain,
			dialect
		});
		expect(error).toBeUndefined();
		expect(sql).toContain('sum(amount)');
		expect(sql.toLowerCase()).toContain('group by');
		expect(sql.toLowerCase()).toMatch(/month/);
	});
});
