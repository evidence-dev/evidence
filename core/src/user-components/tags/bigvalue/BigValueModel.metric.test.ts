import { describe, it, expect } from 'vitest';
import { BigValueModel } from './BigValueModel.svelte';
import type { schema } from './schema';
import { MetricsCatalog } from '../../../metrics/metrics-catalog';
import { generateSQLQuery } from '../../common/sql-options';
import { ClickHouseDialect } from '../../../sql-dialect';
import type { QueryDependencies } from '../../../Query.svelte';
import type { UserComponentProps } from '../../types';

type BigValueAttributes = UserComponentProps<typeof schema>;

const dialect = new ClickHouseDialect();
const deps = { queryService: { dialect } } as unknown as QueryDependencies;

const revenueYaml = `
base: orders
metrics:
  revenue:
    sql: sum(extended_amount)
    filter: type != 'test'
    fmt: usd
`;

function model(attributes: Record<string, unknown>) {
	return new BigValueModel({
		attributes: attributes as unknown as BigValueAttributes,
		validationErrors: [],
		parent: null,
		deps,
		metricsCatalog: new MetricsCatalog({ a: revenueYaml })
	});
}

describe('BigValueModel metric path', () => {
	it('compiles `metric` + `value`-as-measure-name into the metric SQL', () => {
		const m = model({ metric: 'revenue' });
		const { sql } = generateSQLQuery(
			m.queryConfig!,
			undefined,
			undefined,
			undefined,
			'sunday',
			dialect
		);
		expect(sql).toContain('sum(extended_amount)');
		expect(sql).toContain('FROM orders');
		expect(sql).toMatch(/FILTER \(WHERE .*type != 'test'/);
	});

	it('inherits the metric format when fmt is not set', () => {
		const m = model({ metric: 'revenue' });
		expect(m.resolvedFmt).toBe('usd');
	});

	it('lets an explicit fmt override the metric format', () => {
		const m = model({ metric: 'revenue', fmt: 'eur' });
		expect(m.resolvedFmt).toBe('eur');
	});

	it('defaults the title to the metric name when none is given', () => {
		const m = model({ metric: 'revenue' });
		// prettified name (displayAlias) of `revenue`
		expect(m.resolvedTitle?.toLowerCase()).toBe('revenue');
	});

	it('uses the metric label as the title when defined', () => {
		const labelled = new BigValueModel({
			attributes: { metric: 'revenue' } as unknown as BigValueAttributes,
			validationErrors: [],
			parent: null,
			deps,
			metricsCatalog: new MetricsCatalog({
				a: `
base: orders
metrics:
  revenue:
    sql: sum(amount)
    label: Total Revenue
`
			})
		});
		expect(labelled.resolvedTitle).toBe('Total Revenue');
	});

	it('lets an explicit title override the metric label', () => {
		const m = model({ metric: 'revenue', title: 'Custom' });
		expect(m.resolvedTitle).toBe('Custom');
	});

	it('falls back to the raw data path when no metric is set', () => {
		const m = model({ data: 'orders', value: 'sum(amount)' });
		const { sql } = generateSQLQuery(
			m.queryConfig!,
			undefined,
			undefined,
			undefined,
			'sunday',
			dialect
		);
		expect(sql).toContain('sum(amount)');
		expect(sql).toContain('FROM orders');
	});

	it('builds no query for an unknown metric (error surfaced at edit time by validation)', () => {
		const m = model({ metric: 'nope' });
		expect(m.metricCompiled).toBeUndefined();
		expect(m.queryConfig).toBeUndefined();
	});

	it('does not fall through to the raw data path when metric is set', () => {
		// metric set + stray data/value: must NOT silently run the raw path.
		const m = model({ metric: 'nope', data: 'orders', value: 'sum(amount)' });
		expect(m.queryConfig).toBeUndefined();
	});

	it('respects component filters in metric mode', () => {
		const m = model({ metric: 'revenue', filters: ['region'] });
		expect(m.queryConfig?.filterIds).toContain('region');
	});
});

const timedRevenueYaml = `
base: orders
date: order_date
default_date_grain: month
metrics:
  revenue:
    sql: sum(amount)
`;

function timedModel(attributes: Record<string, unknown>) {
	return new BigValueModel({
		attributes: attributes as unknown as BigValueAttributes,
		validationErrors: [],
		parent: null,
		deps,
		metricsCatalog: new MetricsCatalog({ a: timedRevenueYaml })
	});
}

describe('BigValueModel metric sparkline', () => {
	it("defaults a bare sparkline's x and grain to the metric view's time axis", () => {
		// `sparkline={type:"line"}` with only `metric=` used to render nothing because
		// the x-axis never fell back to the view's declared `date`/`default_date_grain`.
		const m = timedModel({ metric: 'revenue', sparkline: { type: 'line' } });
		expect(m.resolvedSparkline?.x).toBe('order_date');
		expect(m.resolvedSparkline?.date_grain).toBe('month');
		// The gate BigValue.svelte renders on is non-null now.
		expect(m.sparklineId).not.toBeNull();

		const { sql } = generateSQLQuery(
			m.queryConfig!,
			undefined,
			undefined,
			undefined,
			'sunday',
			dialect
		);
		expect(sql).toContain('__ev_sparkline');
		expect(sql).toContain('order_date');
	});

	it('lets an explicit sparkline x win over the metric time column', () => {
		const m = timedModel({ metric: 'revenue', sparkline: { type: 'line', x: 'shipped_at' } });
		expect(m.resolvedSparkline?.x).toBe('shipped_at');
		// Grain is only defaulted onto the view's own time column, never a custom x.
		expect(m.resolvedSparkline?.date_grain).toBeUndefined();
	});

	it('does not synthesize a sparkline axis when the view declares no date', () => {
		// `revenueYaml` has no `date:` — a bare sparkline stays inert (nothing to plot).
		const m = model({ metric: 'revenue', sparkline: { type: 'line' } });
		expect(m.resolvedSparkline?.x).toBeUndefined();
		expect(m.sparklineId).toBeNull();
	});
});
