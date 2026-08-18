import { describe, it, expect } from 'vitest';
import { parseMetricsView } from './metric-schema';

describe('parseMetricsView', () => {
	it('parses a minimal metrics view (base + one metric)', () => {
		const { view, errors } = parseMetricsView(`
base: orders
metrics:
  revenue:
    sql: sum(extended_amount)
`);
		expect(errors).toEqual([]);
		expect(view?.base).toBe('orders');
		expect(view?.metrics).toHaveLength(1);
		expect(view?.metrics[0]).toMatchObject({ name: 'revenue', sql: 'sum(extended_amount)' });
	});

	it('captures optional metric filter, fmt, synonyms, description, and per-metric date', () => {
		const { view, errors } = parseMetricsView(`
base: orders
date: order_date
metrics:
  revenue:
    sql: sum(extended_amount)
    filter: type != 'test'
    fmt: usd
    synonyms: [sales, gmv]
    description: Net revenue
    date: shipped_at
`);
		expect(errors).toEqual([]);
		expect(view?.date).toBe('order_date');
		expect(view?.metrics[0]).toMatchObject({
			name: 'revenue',
			filter: "type != 'test'",
			fmt: 'usd',
			synonyms: ['sales', 'gmv'],
			description: 'Net revenue',
			date: 'shipped_at'
		});
	});

	it('accepts a base query via base_sql instead of a table', () => {
		const { view, errors } = parseMetricsView(`
base_sql: select * from raw_orders where status = 'complete'
metrics:
  revenue: { sql: sum(amount) }
`);
		expect(errors).toEqual([]);
		expect(view?.base).toBeUndefined();
		expect(view?.baseSql).toBe("select * from raw_orders where status = 'complete'");
	});

	it('parses dimensions as a name → source map', () => {
		const { view, errors } = parseMetricsView(`
base: orders
dimensions:
  channel: channel
  region: customer.region
metrics:
  revenue: { sql: sum(amount) }
`);
		expect(errors).toEqual([]);
		expect(view?.dimensions).toEqual([
			{ name: 'channel', source: 'channel' },
			{ name: 'region', source: 'customer.region' }
		]);
	});

	it('rejects a view with neither base nor base_sql', () => {
		const { view, errors } = parseMetricsView(`
metrics:
  revenue: { sql: sum(amount) }
`);
		expect(view).toBeUndefined();
		expect(errors.join('\n')).toMatch(/base/i);
	});

	it('rejects a view that sets both base and base_sql', () => {
		const { errors } = parseMetricsView(`
base: orders
base_sql: select * from orders
metrics:
  revenue: { sql: sum(amount) }
`);
		expect(errors.join('\n')).toMatch(/both|exactly one/i);
	});

	it('requires at least one metric', () => {
		const { view, errors } = parseMetricsView(`
base: orders
metrics: {}
`);
		expect(view).toBeUndefined();
		expect(errors.join('\n')).toMatch(/metric/i);
	});

	it('rejects a reserved metric type (ratio) with a coming-later message', () => {
		const { view, errors } = parseMetricsView(`
base: orders
metrics:
  aov:
    type: ratio
    numerator: revenue
    denominator: order_count
`);
		expect(view).toBeUndefined();
		expect(errors.join('\n')).toMatch(/ratio|type|not yet|coming/i);
	});

	it('returns an error (not a throw) on malformed yaml', () => {
		const { view, errors } = parseMetricsView('base: orders\n  bad: : :');
		expect(view).toBeUndefined();
		expect(errors.length).toBeGreaterThan(0);
	});

	it('flags dotted `{view.metric}` cross-view refs with a "not supported yet" message', () => {
		// The bare-{name} regex ignores dotted refs, so previously the literal
		// `{sales.revenue}` string reached the warehouse verbatim and failed with
		// a raw ClickHouse syntax error. Now we spot the dotted shape at parse
		// time and flag the metric so the author gets an actionable message.
		const { view, errors } = parseMetricsView(`
base: orders
metrics:
  revenue:
    sql: sum(amount)
  ratio:
    sql: "{sales.revenue} / nullif({orders}, 0)"
`);
		const err = errors.find((e) => /ratio/.test(e) && /sales\.revenue/.test(e));
		expect(err).toBeTruthy();
		expect(err).toMatch(/cross-view.*aren'?t supported yet/i);
		// The good sibling still compiles.
		expect(view?.metrics.map((m) => m.name)).toContain('revenue');
	});

	it('appends a "quote it" hint when a metric field parses as a YAML comment', () => {
		// `fmt: #,##0.0` unquoted → YAML reads the `#` as a comment marker →
		// `fmt` resolves to null → zod fails with the opaque "received null".
		// parseMetricsView enriches that with a hint pointing at the fix so both
		// the editor squiggle AND AI-tool error surfaces get the actionable copy.
		const { errors } = parseMetricsView(`
base: orders
metrics:
  revenue:
    sql: sum(amount)
    fmt: #,##0.0
`);
		const fmtError = errors.find((e) => /fmt/.test(e));
		expect(fmtError).toBeTruthy();
		expect(fmtError).toMatch(/YAML reads as a comment/);
		expect(fmtError).toMatch(/Quote it/);
	});

	it('isolates per-metric schema failures — sibling metrics still compile', () => {
		// The unquoted-#-comment footgun: YAML reads `#,##0.0` as a comment so
		// `fmt:` becomes null, which fails `metricSchema` (expected string).
		// The whole file used to disappear from list_metrics; now only the bad
		// metric drops and `revenue` still ships.
		const { view, errors } = parseMetricsView(`
base: orders
metrics:
  revenue:
    sql: sum(extended_amount)
  bad_fmt:
    sql: sum(extended_amount)
    fmt: #,##0.0
`);
		expect(view?.metrics.map((m) => m.name)).toEqual(['revenue']);
		expect(errors.some((e) => /bad_fmt/.test(e))).toBe(true);
	});
});
