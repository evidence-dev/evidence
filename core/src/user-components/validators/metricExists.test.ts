import { describe, it, expect } from 'vitest';
import { metricExists } from './metricExists';
import { MetricsCatalog } from '../../metrics/metrics-catalog';
import type { ValidationContext } from './types';

const catalog = new MetricsCatalog({
	orders: `
base: orders
metrics:
  revenue: { sql: sum(amount) }
  orders: { sql: count(*) }
`
});

function ctx(overrides: Partial<ValidationContext> = {}): ValidationContext {
	return {
		metadata: undefined,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined,
		metricsCatalog: catalog,
		...overrides
	};
}

const validate = metricExists('metric');

// Minimal Markdoc-node stand-in — the validator only reads `attributes`/`location`.
const node = (metric?: string | unknown[]) =>
	({
		attributes: metric === undefined ? {} : { metric },
		location: undefined
	}) as unknown as Parameters<typeof validate>[0];

const config = {} as Parameters<typeof validate>[1];

describe('metricExists validator', () => {
	it('passes for a metric that exists in the catalog', () => {
		expect(validate(node('revenue'), config, ctx())).toEqual([]);
	});

	it('errors for a metric missing from the catalog', () => {
		const errs = validate(node('nope'), config, ctx());
		expect(errs).toHaveLength(1);
		expect(errs[0].level).toBe('error');
		expect(errs[0].message).toMatch(/not defined/i);
	});

	it('skips when there is no metric attribute (raw data path)', () => {
		expect(validate(node(), config, ctx())).toEqual([]);
	});

	it('skips a runtime variable reference', () => {
		expect(validate(node('{{ my_metric }}'), config, ctx())).toEqual([]);
	});

	it('skips when no catalog is available (cannot assert non-existence)', () => {
		expect(validate(node('nope'), config, ctx({ metricsCatalog: undefined }))).toEqual([]);
	});

	describe('array shape (multi-metric)', () => {
		it('passes for an array of existing metrics', () => {
			expect(validate(node(['revenue', 'orders']), config, ctx())).toEqual([]);
		});

		it('errors on any missing metric in the array', () => {
			const errs = validate(node(['revenue', 'nope']), config, ctx());
			expect(errs).toHaveLength(1);
			expect(errs[0].message).toMatch(/nope.*not defined/i);
		});

		it('passes for a single-element array (same as string)', () => {
			expect(validate(node(['revenue']), config, ctx())).toEqual([]);
		});

		it('skips a runtime variable inside an array', () => {
			expect(validate(node(['{{ dynamic }}', 'revenue']), config, ctx())).toEqual([]);
		});
	});

	describe('cross-base arrays (rejected)', () => {
		// A separate two-view catalog so revenue lives on `orders` and daily_sales on
		// `daily_orders`. Every agent-round has flagged this as a silent-blank
		// failure — pinning it as a hard error so a regression can't slip through.
		const twoViewCatalog = new MetricsCatalog({
			orders: `
base: orders
metrics:
  revenue: { sql: sum(amount) }
`,
			daily: `
base: daily_orders
metrics:
  daily_sales: { sql: sum(amount) }
`
		});

		const twoViewCtx = ctx({ metricsCatalog: twoViewCatalog });

		it('errors on an array whose metrics belong to different views', () => {
			const errs = validate(node(['revenue', 'daily_sales']), config, twoViewCtx);
			expect(errs).toHaveLength(1);
			expect(errs[0].level).toBe('error');
			expect(errs[0].message).toMatch(/can'?t share a chart/i);
			expect(errs[0].message).toMatch(/combo_chart/i);
		});

		it('names both bases so the author sees which pair is conflicting', () => {
			const errs = validate(node(['revenue', 'daily_sales']), config, twoViewCtx);
			expect(errs[0].message).toContain('orders');
			expect(errs[0].message).toContain('daily_orders');
		});

		it('does NOT error when every metric shares the same base', () => {
			// Sanity: adding a second same-base metric to the two-view catalog
			// shouldn't trip the cross-base check.
			const singleView = new MetricsCatalog({
				orders: `
base: orders
metrics:
  revenue: { sql: sum(amount) }
  orders_count: { sql: count(*) }
`
			});
			expect(
				validate(node(['revenue', 'orders_count']), config, ctx({ metricsCatalog: singleView }))
			).toEqual([]);
		});
	});

	describe('comma-separated string (rejected)', () => {
		it('errors and suggests the array form', () => {
			const errs = validate(node('revenue, orders'), config, ctx());
			expect(errs).toHaveLength(1);
			expect(errs[0].message).toContain('metric=["revenue", "orders"]');
			expect(errs[0].message).toMatch(/array/i);
		});

		it('rejects even when all comma-parts would exist in the catalog', () => {
			// Silently splitting would have passed both — this test pins that we do NOT.
			const errs = validate(node('revenue, orders'), config, ctx());
			expect(errs.length).toBeGreaterThan(0);
		});
	});
});
