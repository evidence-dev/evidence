import { describe, it, expect } from 'vitest';
import { MetricsCatalog } from './metrics-catalog';

const ordersView = `
base: orders
date: order_date
metrics:
  revenue:
    sql: sum(extended_amount)
    fmt: usd
  order_count:
    sql: count(*)
`;

const sessionsView = `
base: sessions
metrics:
  active_users:
    sql: count(distinct user_id)
`;

describe('MetricsCatalog', () => {
	it('indexes metrics by their flat global name across views', () => {
		const catalog = new MetricsCatalog({ 'metrics/orders.yaml': ordersView });
		const found = catalog.getMetric('revenue');
		expect(found?.metric.sql).toBe('sum(extended_amount)');
		expect(found?.metric.fmt).toBe('usd');
		// the metric carries its owning view (base/date), so the compiler can reach them
		expect(found?.view.base).toBe('orders');
		expect(found?.view.date).toBe('order_date');
	});

	it('exposes every metric from every view; size counts metrics not files', () => {
		const catalog = new MetricsCatalog({ a: ordersView, b: sessionsView });
		expect(
			catalog
				.listMetrics()
				.map((m) => m.metric.name)
				.sort()
		).toEqual(['active_users', 'order_count', 'revenue']);
		expect(catalog.size).toBe(3);
		expect(catalog.hasMetric('active_users')).toBe(true);
	});

	it('skips files that fail to parse rather than throwing', () => {
		const catalog = new MetricsCatalog({ good: ordersView, bad: 'base: x\n  : : :' });
		expect(catalog.hasMetric('revenue')).toBe(true);
		expect(catalog.size).toBe(2); // revenue + order_count from the good file
	});

	it('trims whitespace on lookup', () => {
		const catalog = new MetricsCatalog({ a: ordersView });
		expect(catalog.getMetric('  revenue ')).toBeDefined();
	});

	it('first definition wins on a duplicate metric name across views', () => {
		const dup = `
base: other
metrics:
  revenue:
    sql: sum(other_amount)
`;
		const catalog = new MetricsCatalog({ a: ordersView, b: dup });
		// exactly one 'revenue' is indexed
		expect(catalog.listMetrics().filter((m) => m.metric.name === 'revenue')).toHaveLength(1);
	});

	it('reports metric names defined in more than one file as conflicts', () => {
		const dup = `
base: other
metrics:
  revenue:
    sql: sum(other_amount)
`;
		const catalog = new MetricsCatalog({ a: ordersView, b: dup });
		expect([...catalog.getConflictingNames()]).toContain('revenue');
	});

	it('clears a conflict once the duplicate is removed', () => {
		const dup = `
base: other
metrics:
  revenue:
    sql: sum(other_amount)
`;
		const catalog = new MetricsCatalog({ a: ordersView, b: dup });
		expect(catalog.getConflictingNames().size).toBeGreaterThan(0);
		catalog.setFromYaml({ a: ordersView });
		expect(catalog.getConflictingNames().size).toBe(0);
	});

	it('setFromYaml replaces the catalog and drops stale metrics', () => {
		const catalog = new MetricsCatalog({ a: ordersView });
		catalog.setFromYaml({ b: sessionsView });
		expect(catalog.hasMetric('revenue')).toBe(false);
		expect(catalog.hasMetric('active_users')).toBe(true);
	});
});
