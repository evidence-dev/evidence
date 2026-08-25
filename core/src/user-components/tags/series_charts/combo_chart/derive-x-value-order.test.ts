import { describe, it, expect } from 'vitest';
import { deriveXValueOrder } from './derive-x-value-order';

describe('deriveXValueOrder — array sort', () => {
	it('returns the explicit array verbatim', () => {
		const order = deriveXValueOrder({
			sort: ['B', 'A', 'C'],
			hasMultipleSeries: false,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: []
		});
		expect(order).toEqual(['B', 'A', 'C']);
	});

	it('returns the array even with no series or xColumnName', () => {
		// Array sort is a pure passthrough — the reorder is applied downstream
		// per series, so the derivation shouldn't gate on series data being loaded.
		const order = deriveXValueOrder({
			sort: ['B', 'A'],
			hasMultipleSeries: false,
			hasStackedSeries: false,
			xColumnName: undefined,
			series: []
		});
		expect(order).toEqual(['B', 'A']);
	});

	it('empty array yields undefined (nothing to reorder)', () => {
		const order = deriveXValueOrder({
			sort: [],
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [{ rows: [{ category: 'A', sum_y: 10 }], yColumnName: 'sum_y' }]
		});
		expect(order).toBeUndefined();
	});
});

describe('deriveXValueOrder — sort="y desc" first-child ranking', () => {
	it('ranks multi-child combos on the FIRST child only (matches Tableau/PowerBI/Vega-Lite)', () => {
		// Two children with different measures. Child 1: A=5, B=1. Child 2:
		// A=999, B=0. First-child rule → rank by child 1 desc → [A, B].
		// (Old cross-child sum would have said [A(1004), B(1)] which happens
		// to agree here — but see the next test for a case where the choice
		// visibly matters.)
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', sum_sales: 5 },
						{ category: 'B', sum_sales: 1 }
					],
					yColumnName: 'sum_sales'
				},
				{
					rows: [
						{ category: 'A', sum_units: 999 },
						{ category: 'B', sum_units: 0 }
					],
					yColumnName: 'sum_units'
				}
			]
		});
		expect(order).toEqual(['A', 'B']);
	});

	it('ignores non-primary children when measures have different scales', () => {
		// Real footgun the first-child rule closes: revenue in dollars +
		// orders in counts. Old sum-across-children ranked by revenue alone
		// (dollars dominated). New first-child rule makes that explicit —
		// the author's first child IS the ranking measure, no scale magic.
		// Child 1 (orders): A=500, B=2000, C=100 → desc [B, A, C]
		// Child 2 (revenue): A=1M, B=800k, C=1.2M (would rank C, A, B alone)
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'region',
			series: [
				{
					rows: [
						{ region: 'A', sum_orders: 500 },
						{ region: 'B', sum_orders: 2000 },
						{ region: 'C', sum_orders: 100 }
					],
					yColumnName: 'sum_orders'
				},
				{
					rows: [
						{ region: 'A', sum_rev: 1_000_000 },
						{ region: 'B', sum_rev: 800_000 },
						{ region: 'C', sum_rev: 1_200_000 }
					],
					yColumnName: 'sum_rev'
				}
			]
		});
		// Ranking is by first child (orders): B(2000), A(500), C(100).
		expect(order).toEqual(['B', 'A', 'C']);
	});

	it('single-query multi-series still aggregates across the series column (stack-total, same measure)', () => {
		// One child, rows split by a series column — same measure at every
		// stack segment, so summing has consistent units. This is the
		// legitimate stack-total pattern every BI tool supports.
		// x=A: (5+10)=15, x=B: (1+2)=3. Desc → [A, B].
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', sum_sales: 5, grp: 'p' },
						{ category: 'A', sum_sales: 10, grp: 'q' },
						{ category: 'B', sum_sales: 1, grp: 'p' },
						{ category: 'B', sum_sales: 2, grp: 'q' }
					],
					yColumnName: 'sum_sales'
				}
			]
		});
		expect(order).toEqual(['A', 'B']);
	});

	it('handles "y asc" by summing then ascending', () => {
		const order = deriveXValueOrder({
			sort: 'y asc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: 100 },
						{ category: 'B', y: 1 }
					],
					yColumnName: 'y'
				}
			]
		});
		expect(order).toEqual(['B', 'A']);
	});

	it('coerces string numeric y values (ClickHouse Decimal type)', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: '3.5' },
						{ category: 'B', y: '10.25' }
					],
					yColumnName: 'y'
				}
			]
		});
		expect(order).toEqual(['B', 'A']);
	});

	it('treats non-numeric y as 0 (Number(...) || 0)', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: 'garbage' },
						{ category: 'B', y: 5 }
					],
					yColumnName: 'y'
				}
			]
		});
		// A totals 0, B totals 5. Desc order: [B, A].
		expect(order).toEqual(['B', 'A']);
	});

	it('skips rows with null/undefined x', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: null, y: 1000 },
						{ category: undefined, y: 500 },
						{ category: 'A', y: 3 },
						{ category: 'B', y: 7 }
					],
					yColumnName: 'y'
				}
			]
		});
		expect(order).toEqual(['B', 'A']);
	});

	it('preserves numeric x values instead of stringifying them', () => {
		// The reorder helper downstream normalizes keys via String() but the
		// returned xVal keeps its type so category-axis normalization there can
		// still branch on typeof value === 'number'.
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'x',
			series: [
				{
					rows: [
						{ x: 1, y: 5 },
						{ x: 2, y: 100 },
						{ x: 3, y: 20 }
					],
					yColumnName: 'y'
				}
			]
		});
		expect(order).toEqual([2, 3, 1]);
		expect(typeof (order as (string | number)[])[0]).toBe('number');
	});

	it('preserves Date x values from the first child', () => {
		const jan = new Date('2024-01-01');
		const feb = new Date('2024-02-01');
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'date',
			series: [
				{
					rows: [
						{ date: jan, y: 10 },
						{ date: feb, y: 100 }
					],
					yColumnName: 'y'
				},
				{
					rows: [
						{ date: new Date('2024-01-01'), y: 5 },
						{ date: new Date('2024-02-01'), y: 3 }
					],
					yColumnName: 'y'
				}
			]
		});
		// First child: jan=10, feb=100. Desc → [feb, jan]. The returned xVal
		// preserves the original Date instance (not stringified) so the
		// downstream reorder can still ISO-key it correctly.
		expect(order?.length).toBe(2);
		expect((order![0] as unknown as Date).toISOString()).toBe(feb.toISOString());
		expect((order![1] as unknown as Date).toISOString()).toBe(jan.toISOString());
	});
});

describe('deriveXValueOrder — gates on chart shape', () => {
	it('single-series with `sort="y desc"` yields undefined (SQL handles it)', () => {
		// Single-series y-desc gets sorted correctly by the SQL `ORDER BY
		// y_alias DESC` alone — no client-side compute needed.
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: false,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: 5 },
						{ category: 'B', y: 10 }
					],
					yColumnName: 'y'
				}
			]
		});
		expect(order).toBeUndefined();
	});

	it('stacked single-child triggers cross-series compute (stack total sort)', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: false,
			hasStackedSeries: true,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: 5 },
						{ category: 'B', y: 10 }
					],
					yColumnName: 'y'
				}
			]
		});
		expect(order).toEqual(['B', 'A']);
	});

	it('missing xColumnName short-circuits `sort="y desc"`', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: undefined,
			series: [{ rows: [{ y: 1 }], yColumnName: 'y' }]
		});
		expect(order).toBeUndefined();
	});

	it('no series data yields undefined even when sort + shape both qualify', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: []
		});
		expect(order).toBeUndefined();
	});

	it('unrecognized sort value yields undefined', () => {
		const order = deriveXValueOrder({
			sort: 'x asc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [{ rows: [{ category: 'A', y: 1 }], yColumnName: 'y' }]
		});
		// `x asc` / `x desc` are handled entirely in SQL (see buildChartSQL); no
		// cross-series compute is needed at the chart level.
		expect(order).toBeUndefined();
	});
});

describe('deriveXValueOrder — limitTopN (the LIMIT-drop fix)', () => {
	it('slices the derived order to top-N when limitTopN is set', () => {
		// Simulates ComboChart's `skipLimit` path: SQL drops LIMIT so this
		// derivation ranks against the full row set, then trims to the author's
		// original `limit=`. Rows: A=1, B=100, C=50, D=200, E=25 → desc totals
		// [D, B, C, E, A]; limit=3 → [D, B, C].
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: 1 },
						{ category: 'B', y: 100 },
						{ category: 'C', y: 50 },
						{ category: 'D', y: 200 },
						{ category: 'E', y: 25 }
					],
					yColumnName: 'y'
				}
			],
			limitTopN: 3
		});
		expect(order).toEqual(['D', 'B', 'C']);
	});

	it('limitTopN greater than the total x count keeps every value', () => {
		const order = deriveXValueOrder({
			sort: 'y desc',
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [
				{
					rows: [
						{ category: 'A', y: 5 },
						{ category: 'B', y: 10 }
					],
					yColumnName: 'y'
				}
			],
			limitTopN: 10
		});
		expect(order).toEqual(['B', 'A']);
	});

	it('array sort ignores limitTopN — author owns the full order', () => {
		const order = deriveXValueOrder({
			sort: ['B', 'A', 'C'],
			hasMultipleSeries: true,
			hasStackedSeries: false,
			xColumnName: 'category',
			series: [{ rows: [{ category: 'A', y: 1 }], yColumnName: 'y' }],
			limitTopN: 2
		});
		expect(order).toEqual(['B', 'A', 'C']);
	});
});
