import { describe, it, expect } from 'vitest';
import { sparklineHasTimeAxis } from './sparklineHasTimeAxis';
import { MetricsCatalog } from '../../metrics/metrics-catalog';
import type { ValidationContext } from './types';

const catalog = new MetricsCatalog({
	orders: `
base: orders
date: order_date
metrics:
  revenue: { sql: sum(amount) }
`,
	sessions: `
base: sessions
metrics:
  sessions: { sql: count(*) }
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

const validate = sparklineHasTimeAxis('sparkline', 'metric', 'date_range');

// Minimal Markdoc-node stand-in — the validator only reads `attributes`/`location`.
const node = (attributes: Record<string, unknown>) =>
	({ attributes, location: undefined }) as unknown as Parameters<typeof validate>[0];

const config = {} as Parameters<typeof validate>[1];

describe('sparklineHasTimeAxis validator', () => {
	it('skips when there is no sparkline', () => {
		expect(validate(node({ data: 'orders', value: 'sum(amount)' }), config, ctx())).toEqual([]);
	});

	describe('raw mode (data/value)', () => {
		it('errors when a sparkline has no x', () => {
			const errs = validate(
				node({ data: 'orders', value: 'sum(amount)', sparkline: { type: 'line' } }),
				config,
				ctx()
			);
			expect(errs).toHaveLength(1);
			expect(errs[0].level).toBe('warning');
			expect(errs[0].id).toBe('sparkline-requires-x');
			expect(errs[0].message).toMatch(/`x` column is required/);
		});

		it('passes with an explicit x', () => {
			expect(
				validate(node({ data: 'orders', sparkline: { type: 'line', x: 'date' } }), config, ctx())
			).toEqual([]);
		});

		it('passes when x is a runtime variable', () => {
			expect(
				validate(node({ data: 'orders', sparkline: { x: '{{ col }}' } }), config, ctx())
			).toEqual([]);
		});

		it('passes when the sparkline date_range supplies a date', () => {
			expect(
				validate(
					node({ data: 'orders', sparkline: { date_range: { date: 'created_at' } } }),
					config,
					ctx()
				)
			).toEqual([]);
		});

		it('passes when the component date_range supplies a date', () => {
			expect(
				validate(
					node({ data: 'orders', date_range: { date: 'created_at' }, sparkline: { type: 'line' } }),
					config,
					ctx()
				)
			).toEqual([]);
		});
	});

	describe('metric mode', () => {
		it('passes with no x when the metric view declares a date (auto-selected)', () => {
			expect(
				validate(node({ metric: 'revenue', sparkline: { type: 'line' } }), config, ctx())
			).toEqual([]);
		});

		it('passes with an explicit x override', () => {
			expect(
				validate(node({ metric: 'sessions', sparkline: { x: 'started_at' } }), config, ctx())
			).toEqual([]);
		});

		it('errors when the metric view declares no date and no x is given', () => {
			const errs = validate(
				node({ metric: 'sessions', sparkline: { type: 'line' } }),
				config,
				ctx()
			);
			expect(errs).toHaveLength(1);
			expect(errs[0].id).toBe('sparkline-requires-x');
			expect(errs[0].message).toMatch(/has no `date` in its view/);
		});

		it('stays lenient when no catalog is loaded (cannot introspect the view)', () => {
			expect(
				validate(
					node({ metric: 'sessions', sparkline: { type: 'line' } }),
					config,
					ctx({ metricsCatalog: undefined })
				)
			).toEqual([]);
		});

		it('skips a runtime-variable metric reference', () => {
			expect(
				validate(node({ metric: '{{ m }}', sparkline: { type: 'line' } }), config, ctx())
			).toEqual([]);
		});
	});
});
