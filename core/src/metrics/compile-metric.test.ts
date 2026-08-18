import { describe, it, expect } from 'vitest';
import { compileMetric } from './compile-metric';
import { parseMetricsView, type MetricsView } from './metric-schema';
import { generateSQLQuery } from '../user-components/common/sql-options';
import { ClickHouseDialect, SnowflakeDialect, type SqlDialect } from '../sql-dialect';

const ch = new ClickHouseDialect();
const sf = new SnowflakeDialect();

function view(yaml: string): MetricsView {
	const { view, errors } = parseMetricsView(yaml);
	if (!view) throw new Error(`bad fixture: ${errors.join(', ')}`);
	return view;
}

const orders = view(`
base: orders
dimensions:
  month: order_month
  region: region
metrics:
  sales:
    sql: sum(extended_amount)
    filter: type != 'test'
    fmt: usd
  order_count:
    sql: count(*)
    fmt: num0
`);

function sqlFor(
	v: MetricsView,
	request: Parameters<typeof compileMetric>[1],
	dialect: SqlDialect = ch
) {
	const { queryConfig, errors } = compileMetric(v, request, dialect);
	expect(errors).toEqual([]);
	const { sql, error } = generateSQLQuery(
		queryConfig!,
		undefined,
		undefined,
		undefined,
		'sunday',
		dialect
	);
	expect(error).toBeUndefined();
	return sql;
}

describe('compileMetric', () => {
	it('compiles a single metric over a base table', () => {
		const sql = sqlFor(orders, { metrics: ['sales'] });
		expect(sql).toContain('sum(extended_amount)');
		expect(sql).toContain('AS "sales"');
		expect(sql).toContain('FROM orders');
	});

	it('emits the per-metric filter as FILTER on ClickHouse', () => {
		const sql = sqlFor(orders, { metrics: ['sales'] });
		expect(sql).toMatch(/sum\(extended_amount\) FILTER \(WHERE .*type != 'test'.*\)/);
	});

	it('rewrites the filter to CASE WHEN on Snowflake', () => {
		const sql = sqlFor(orders, { metrics: ['sales'] }, sf);
		expect(sql).not.toContain('FILTER (WHERE');
		expect(sql.toUpperCase()).toContain('CASE WHEN');
	});

	it('lets an unfiltered metric coexist with a filtered one in the same query', () => {
		const sql = sqlFor(orders, { metrics: ['sales', 'order_count'] });
		expect(sql).toContain('count(*)');
		expect(sql).not.toMatch(/count\(\*\) FILTER/);
	});

	it('groups by exactly the requested base dimension (correct grain)', () => {
		const sql = sqlFor(orders, { metrics: ['sales'], dimensions: ['region'] });
		expect(sql).toContain('AS "region"');
		expect(sql).not.toContain('order_month');
	});

	it('supports a base query via base_sql', () => {
		const v = view(`
base_sql: select * from raw_orders where status = 'complete'
metrics:
  sales: { sql: sum(amount) }
`);
		expect(sqlFor(v, { metrics: ['sales'] })).toContain(
			"select * from raw_orders where status = 'complete'"
		);
	});

	it('returns metric formats keyed by name', () => {
		const { columnFormats } = compileMetric(orders, { metrics: ['sales', 'order_count'] }, ch);
		expect(columnFormats).toEqual({ sales: 'usd', order_count: 'num0' });
	});

	it('errors on an unknown metric name', () => {
		const { errors } = compileMetric(orders, { metrics: ['nope'] }, ch);
		expect(errors.join('\n')).toMatch(/metric.*nope/i);
	});
});

describe('calculated (derived) metrics', () => {
	const derived = view(`
base: orders
dimensions:
  region: region
metrics:
  revenue:
    sql: sum(amount)
    filter: type != 'test'
    fmt: usd
  order_count:
    sql: count(*)
  aov:
    sql: "{revenue} / nullif({order_count}, 0)"
    fmt: usd
  margin:
    sql: "{revenue} - {cost}"
  cost:
    sql: sum(cost_amount)
`);

	it('expands {metric} references into the referenced aggregates', () => {
		const sql = sqlFor(derived, { metrics: ['aov'] });
		// numerator keeps its filter; denominator expands to count(*)
		expect(sql).toMatch(/sum\(amount\) FILTER \(WHERE .*type != 'test'.*\)/);
		expect(sql).toContain('nullif((count(*)), 0)');
		expect(sql).toContain('AS "aov"');
	});

	it('treats a derived metric as a measure (not grouped) alongside a dimension', () => {
		const sql = sqlFor(derived, { metrics: ['aov'], dimensions: ['region'] });
		expect(sql).toContain('AS "region"');
		expect(sql).toContain('AS "aov"');
		expect(sql.toUpperCase()).toContain('GROUP BY');
	});

	it('carries the derived metric format', () => {
		const { columnFormats } = compileMetric(derived, { metrics: ['aov'] }, ch);
		expect(columnFormats).toEqual({ aov: 'usd' });
	});

	it('expands a metric that references another derived metric', () => {
		// margin references revenue + cost; both are simple. Verify both inline.
		const sql = sqlFor(derived, { metrics: ['margin'] });
		expect(sql).toContain('sum(amount)');
		expect(sql).toContain('sum(cost_amount)');
	});

	it('rejects a cross-view / unknown reference at parse time', () => {
		const { errors } = parseMetricsView(`
base: orders
metrics:
  conv:
    sql: "{order_count} / {sessions}"
  order_count: { sql: count(*) }
`);
		expect(errors.join('\n')).toMatch(/sessions.*not a metric|cross-view/i);
	});

	it('rejects a filter on a calculated metric at parse time', () => {
		const { errors } = parseMetricsView(`
base: orders
metrics:
  revenue: { sql: sum(amount) }
  order_count: { sql: count(*) }
  aov:
    sql: "{revenue} / {order_count}"
    filter: type != 'test'
`);
		expect(errors.join('\n')).toMatch(/filter.*only supported on simple/i);
	});

	it('flags a self-referencing metric with a self-reference message (not the malformed generic-cycle text)', () => {
		// A one-node loop (`sql: "{self} * 2"`) is technically a cycle with one
		// member — the generic cycle message would render as "…forms a cycle with
		// : self → self. Remove one of the {undefined} references". Special-cased
		// to a self-reference message so the copy is actually helpful.
		const { errors } = parseMetricsView(`
base: orders
metrics:
  self_ref:
    sql: "{self_ref} * 2"
`);
		const err = errors.find((e) => /self_ref/.test(e));
		expect(err).toMatch(/references itself/i);
		expect(err).not.toMatch(/undefined/);
		expect(err).not.toMatch(/cycle with :/);
	});

	it('flags each cycle member with a per-metric error that names the loop', () => {
		const { view, errors } = parseMetricsView(`
base: orders
metrics:
  a: { sql: "{b} + 1" }
  b: { sql: "{a} + 1" }
  good: { sql: sum(amount) }
`);
		// One error per cycle member — anchors to the metric so the editor can
		// squiggle each one instead of putting a single squiggle at the file top.
		expect(errors).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/Metric "a" forms a cycle with b:.*Remove one of the \{b\}/),
				expect.stringMatching(/Metric "b" forms a cycle with a:.*Remove one of the \{a\}/)
			])
		);
		// Cycle members drop out; sibling `good` still compiles.
		expect(view?.metrics.map((m) => m.name)).toEqual(['good']);
	});

	it('flags `{{ variable }}` interpolation inside metric SQL as unsupported at parse time', () => {
		// {{ variable }} interpolation isn't wired inside metric sql/filter —
		// compiled metric SQL bypasses the variable processor, so a raw {{...}}
		// would reach the warehouse literally. Detect and flag per-metric so
		// the author sees an actionable error instead of an opaque DB failure.
		// (Filter reactivity comes from the component's own `filters=`/`where=`
		// on the consuming chart, not from metric-internal interpolation.)
		const { view: v, errors } = parseMetricsView(`
base: orders
metrics:
  regional:
    sql: sum(amount) filter (where region = {{region_filter}})
`);
		expect(errors.some((e) => /regional.*variable.*isn'?t supported/i.test(e))).toBe(true);
		// The bad metric drops out; no siblings to salvage here, so the view fails.
		expect(v?.metrics.find((m) => m.name === 'regional')).toBeUndefined();
	});
});
