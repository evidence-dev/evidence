import { describe, it, expect } from 'vitest';
import { generateSeriesConfig } from './seriesConfig';
import type { ScatterSeriesOption } from 'echarts';

describe('generateSeriesConfig - scatter size', () => {
	const baseOptions = {
		type: 'scatter' as const,
		x: 'x',
		y: 'y',
		size: 'amount'
	};

	it('scales point sizes based on numeric integer values', () => {
		const data = [
			{ x: 1, y: 10, amount: 100 },
			{ x: 2, y: 20, amount: 500 },
			{ x: 3, y: 30, amount: 1000 }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		expect(result).toHaveLength(1);

		const series = result[0] as ScatterSeriesOption;
		expect(typeof series.symbolSize).toBe('function');

		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;
		const smallSize = sizeFn([1, 10, 100]);
		const largeSize = sizeFn([3, 30, 1000]);
		expect(largeSize).toBeGreaterThan(smallSize);
		expect(largeSize).toBe(35); // max bubble size for max value
	});

	it('scales point sizes based on decimal/float values', () => {
		const data = [
			{ x: 1, y: 10, amount: 0.5 },
			{ x: 2, y: 20, amount: 2.75 },
			{ x: 3, y: 30, amount: 10.123 }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		const series = result[0] as ScatterSeriesOption;
		expect(typeof series.symbolSize).toBe('function');

		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;
		const smallSize = sizeFn([1, 10, 0.5]);
		const medSize = sizeFn([2, 20, 2.75]);
		const largeSize = sizeFn([3, 30, 10.123]);

		expect(medSize).toBeGreaterThan(smallSize);
		expect(largeSize).toBeGreaterThan(medSize);
		expect(largeSize).toBe(35);
	});

	it('scales point sizes when values are strings (ClickHouse Decimal type)', () => {
		const data = [
			{ x: 1, y: 10, amount: '50.25' },
			{ x: 2, y: 20, amount: '200.75' },
			{ x: 3, y: 30, amount: '1000.50' }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		const series = result[0] as ScatterSeriesOption;
		expect(typeof series.symbolSize).toBe('function');

		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;
		const smallSize = sizeFn([1, 10, 50.25]);
		const largeSize = sizeFn([3, 30, 1000.50]);

		expect(largeSize).toBeGreaterThan(smallSize);
		expect(largeSize).toBe(35);
	});

	it('handles zero size values without NaN', () => {
		const data = [
			{ x: 1, y: 10, amount: 0 },
			{ x: 2, y: 20, amount: 500 }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		const series = result[0] as ScatterSeriesOption;
		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;

		const zeroSize = sizeFn([1, 10, 0]);
		expect(zeroSize).toBe(0);
		expect(Number.isNaN(zeroSize)).toBe(false);
	});

	it('handles null/undefined size values gracefully', () => {
		const data = [
			{ x: 1, y: 10, amount: null },
			{ x: 2, y: 20, amount: 500 }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		const series = result[0] as ScatterSeriesOption;
		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;

		const nullSize = sizeFn([1, 10, 0]);
		expect(nullSize).toBe(0);
		expect(Number.isNaN(nullSize)).toBe(false);
	});

	it('uses uniform symbolSize when no size column is provided', () => {
		const data = [
			{ x: 1, y: 10 },
			{ x: 2, y: 20 }
		];

		const result = generateSeriesConfig({ type: 'scatter', x: 'x', y: 'y', data });
		const series = result[0] as ScatterSeriesOption;
		expect(series.symbolSize).toBe(9);
	});

	it('handles multi-series with size correctly', () => {
		const data = [
			{ x: 1, y: 10, amount: 100, category: 'A' },
			{ x: 2, y: 20, amount: 500, category: 'A' },
			{ x: 3, y: 30, amount: 200, category: 'B' },
			{ x: 4, y: 40, amount: 800, category: 'B' }
		];

		const result = generateSeriesConfig({
			...baseOptions,
			data,
			series: 'category'
		});

		expect(result).toHaveLength(2);
		for (const s of result) {
			const series = s as ScatterSeriesOption;
			expect(typeof series.symbolSize).toBe('function');
		}

		const seriesA = result[0] as ScatterSeriesOption;
		const sizeFnA = seriesA.symbolSize as (dataPoint: number[]) => number;
		const sizeA_small = sizeFnA([1, 10, 100]);
		const sizeA_large = sizeFnA([2, 20, 500]);
		expect(sizeA_large).toBeGreaterThan(sizeA_small);
	});

	it('handles very small decimal values', () => {
		const data = [
			{ x: 1, y: 10, amount: 0.001 },
			{ x: 2, y: 20, amount: 0.05 },
			{ x: 3, y: 30, amount: 0.1 }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		const series = result[0] as ScatterSeriesOption;
		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;

		const smallSize = sizeFn([1, 10, 0.001]);
		const largeSize = sizeFn([3, 30, 0.1]);

		expect(largeSize).toBeGreaterThan(smallSize);
		expect(largeSize).toBe(35);
		expect(Number.isNaN(smallSize)).toBe(false);
		expect(smallSize).toBeGreaterThan(0);
	});

	it('handles negative size values without NaN', () => {
		const data = [
			{ x: 1, y: 10, amount: -50 },
			{ x: 2, y: 20, amount: 500 }
		];

		const result = generateSeriesConfig({ ...baseOptions, data });
		const series = result[0] as ScatterSeriesOption;
		const sizeFn = series.symbolSize as (dataPoint: number[]) => number;

		const negativeSize = sizeFn([1, 10, -50]);
		expect(Number.isNaN(negativeSize)).toBe(false);
	});
});

describe('generateSeriesConfig - scatter point_title', () => {
	it('includes point_title in data array for single series', () => {
		const data = [
			{ x: 1, y: 10, item_name: 'Alpha' },
			{ x: 2, y: 20, item_name: 'Beta' }
		];

		const result = generateSeriesConfig({
			type: 'scatter',
			x: 'x',
			y: 'y',
			data,
			pointTitle: 'item_name'
		});

		expect(result).toHaveLength(1);
		const seriesData = result[0].data as unknown[][];
		expect(seriesData[0][3]).toBe('Alpha');
		expect(seriesData[1][3]).toBe('Beta');
	});

	it('includes point_title in data array for multi-series', () => {
		const data = [
			{ x: 1, y: 10, category: 'A', item_name: 'Alpha' },
			{ x: 2, y: 20, category: 'A', item_name: 'Beta' },
			{ x: 1, y: 30, category: 'B', item_name: 'Gamma' },
			{ x: 2, y: 40, category: 'B', item_name: 'Delta' }
		];

		const result = generateSeriesConfig({
			type: 'scatter',
			x: 'x',
			y: 'y',
			series: 'category',
			data,
			pointTitle: 'item_name'
		});

		expect(result).toHaveLength(2);

		const seriesA = result[0].data as unknown[][];
		expect(seriesA[0][3]).toBe('Alpha');
		expect(seriesA[1][3]).toBe('Beta');

		const seriesB = result[1].data as unknown[][];
		expect(seriesB[0][3]).toBe('Gamma');
		expect(seriesB[1][3]).toBe('Delta');
	});

	it('sets point_title to undefined when not provided', () => {
		const data = [
			{ x: 1, y: 10, category: 'A' },
			{ x: 2, y: 20, category: 'B' }
		];

		const result = generateSeriesConfig({
			type: 'scatter',
			x: 'x',
			y: 'y',
			series: 'category',
			data
		});

		const seriesData = result[0].data as unknown[][];
		expect(seriesData[0][3]).toBeUndefined();
	});
});

describe('generateSeriesConfig - missing bar values', () => {
	it('distinguishes a filled stacked value from a real zero', () => {
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			series: 'category',
			handleMissing: 'zero',
			data: [
				{ x: 'Jan', y: 10, category: 'A' },
				{ x: 'Jan', y: 0, category: 'B' },
				{ x: 'Feb', y: 20, category: 'A' }
			]
		});

		const seriesBData = result[1].data as unknown[];
		expect(seriesBData[0]).toEqual(['Jan', 0, undefined, undefined]);
		expect(seriesBData[1]).toEqual({
			value: ['Feb', 0, undefined, undefined],
			isMissing: true
		});
	});

	it('reorders single-series bar data to match xValueOrder', () => {
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: ['C', 'A', 'B'],
			data: [
				{ x: 'A', y: 10 },
				{ x: 'B', y: 20 },
				{ x: 'C', y: 30 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual(['C', 'A', 'B']);
	});

	it('leaves unmatched x values at the end of the ordered set', () => {
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: ['B'],
			data: [
				{ x: 'A', y: 10 },
				{ x: 'B', y: 20 },
				{ x: 'C', y: 30 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual(['B', 'A', 'C']);
	});

	it('multi-series reorder applies to every series identically', () => {
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			series: 'category',
			xValueOrder: ['B', 'A'],
			data: [
				{ x: 'A', y: 1, category: 'p' },
				{ x: 'A', y: 2, category: 'q' },
				{ x: 'B', y: 3, category: 'p' },
				{ x: 'B', y: 4, category: 'q' }
			]
		});
		const seriesP = result[0].data as unknown[][];
		const seriesQ = result[1].data as unknown[][];
		expect(seriesP.map((r) => r[0])).toEqual(['B', 'A']);
		expect(seriesQ.map((r) => r[0])).toEqual(['B', 'A']);
	});

	it('xValueOrder takes precedence over sortByStackTotal', () => {
		// Both provided: the explicit order wins so multi-child combos and
		// stacked charts share the same category layout when the author asks.
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			series: 'category',
			xValueOrder: ['A', 'B'],
			sortByStackTotal: 'desc',
			data: [
				{ x: 'A', y: 1, category: 'p' },
				{ x: 'A', y: 2, category: 'q' },
				{ x: 'B', y: 100, category: 'p' },
				{ x: 'B', y: 200, category: 'q' }
			]
		});
		const seriesP = result[0].data as unknown[][];
		expect(seriesP.map((r) => r[0])).toEqual(['A', 'B']);
	});

	it('empty data + xValueOrder — no crash, empty series', () => {
		// A chart whose query returned no rows shouldn't crash when the chart
		// layer tries to apply an ordering derived from other children.
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: ['A', 'B'],
			data: []
		});
		expect(result).toEqual([]);
	});

	it('xValueOrder with all-unmatched xs is a stable no-op (source order kept)', () => {
		// If NONE of the returned x values are in the explicit order list, the
		// helper mustn't reshuffle randomly — every row falls through to its
		// original position (stable sort by original index).
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: ['Q', 'R', 'S'],
			data: [
				{ x: 'A', y: 1 },
				{ x: 'B', y: 2 },
				{ x: 'C', y: 3 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual(['A', 'B', 'C']);
	});

	it('xValueOrderIsExhaustive drops rows outside the top-N (P1 top-N filter fix)', () => {
		// ComboChart flips this flag on for `sort="y *"` + `limit=` after
		// dropping SQL LIMIT — the client-side top-N slice must FILTER, not
		// just reorder, or the chart renders more categories than requested.
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: ['B', 'A'],
			xValueOrderIsExhaustive: true,
			data: [
				{ x: 'A', y: 10 },
				{ x: 'B', y: 20 },
				{ x: 'C', y: 30 },
				{ x: 'D', y: 40 }
			]
		});
		const rows = result[0].data as unknown[][];
		// Only B and A survive; C and D are dropped despite existing in the data.
		expect(rows.map((r) => r[0])).toEqual(['B', 'A']);
	});

	it('xValueOrderIsExhaustive drops non-matching rows in the multi-series branch too', () => {
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			series: 'grp',
			xValueOrder: ['A', 'B'],
			xValueOrderIsExhaustive: true,
			data: [
				{ x: 'A', y: 1, grp: 'p' },
				{ x: 'A', y: 2, grp: 'q' },
				{ x: 'B', y: 3, grp: 'p' },
				{ x: 'B', y: 4, grp: 'q' },
				{ x: 'C', y: 999, grp: 'p' },
				{ x: 'C', y: 999, grp: 'q' }
			]
		});
		// Two series, each rendering only A and B; C is dropped from both.
		for (const s of result) {
			const rows = s.data as unknown[][];
			expect(rows.map((r) => r[0])).toEqual(['A', 'B']);
		}
	});

	it('xValueOrderIsExhaustive=false (default) keeps the unlisted-rows-after behavior for sort=[array]', () => {
		// Explicit array sort semantically means "put these first" — unlisted
		// rows still render so the author sees their whole dataset. The
		// exhaustive flag is opt-in for the top-N slice case.
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: ['B'],
			data: [
				{ x: 'A', y: 10 },
				{ x: 'B', y: 20 },
				{ x: 'C', y: 30 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual(['B', 'A', 'C']);
	});

	it('handles numeric x values in xValueOrder without stringification drift', () => {
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xValueOrder: [3, 1, 2],
			data: [
				{ x: 1, y: 10 },
				{ x: 2, y: 20 },
				{ x: 3, y: 30 }
			]
		});
		const rows = result[0].data as unknown[][];
		// After category-axis normalization numbers become strings, so match on the string form.
		expect(rows.map((r) => String(r[0]))).toEqual(['3', '1', '2']);
	});

	it('line on non-category axis: enforces x-order even when SQL returned y-sorted rows (anti-zigzag)', () => {
		// The bug this closes: sort="y desc" on a line chart against a time
		// axis returns rows in [Feb(50), Apr(25), Jan(10), Mar(5)] order.
		// ECharts positions each point at its date but connects them in ARRAY
		// order, producing a criss-cross polyline. The rendering layer must
		// re-sort by x for line/area on non-category axes to draw a normal
		// left-to-right line.
		const jan = new Date('2024-01-01');
		const feb = new Date('2024-02-01');
		const mar = new Date('2024-03-01');
		const apr = new Date('2024-04-01');
		const result = generateSeriesConfig({
			type: 'line',
			x: 'd',
			y: 'val',
			xColumnType: 'date',
			// treatAsCategoryAxis is false by default — this is the time-axis path.
			data: [
				{ d: feb, val: 50 },
				{ d: apr, val: 25 },
				{ d: jan, val: 10 },
				{ d: mar, val: 5 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => (r[0] as Date).toISOString())).toEqual([
			jan.toISOString(),
			feb.toISOString(),
			mar.toISOString(),
			apr.toISOString()
		]);
	});

	it('line on non-category axis + xSortDirection="desc": draws reverse-timeline monotonically', () => {
		// Feedback from PR audit: `sort="x desc"` was documented as
		// "reverse-chronological" but the anti-zigzag helper forced
		// ascending, making it a no-op. Now the direction propagates.
		const jan = new Date('2024-01-01');
		const feb = new Date('2024-02-01');
		const mar = new Date('2024-03-01');
		const result = generateSeriesConfig({
			type: 'line',
			x: 'd',
			y: 'val',
			xColumnType: 'date',
			xSortDirection: 'desc',
			data: [
				{ d: jan, val: 10 },
				{ d: feb, val: 50 },
				{ d: mar, val: 5 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => (r[0] as Date).toISOString())).toEqual([
			mar.toISOString(),
			feb.toISOString(),
			jan.toISOString()
		]);
	});

	it('scatter with xValueOrder: does NOT reorder (positions come from x/y coordinates)', () => {
		// Feedback from PR audit: sort silently reordered scatter series and
		// recolored categories. Continuous coordinate charts should skip the
		// reorder entirely — points position by (x, y).
		const original = [
			{ x: 5, y: 30, grp: 'gamma' },
			{ x: 3, y: 10, grp: 'alpha' },
			{ x: 7, y: 20, grp: 'beta' }
		];
		const result = generateSeriesConfig({
			type: 'scatter',
			x: 'x',
			y: 'y',
			series: 'grp',
			xValueOrder: [3, 5, 7],
			data: original
		});
		// Series iteration order matches insertion order in the raw data:
		// gamma comes first because its row is first. If reorder had fired
		// we'd get [alpha, gamma, beta] (matching xValueOrder).
		expect(result.map((s) => s.name)).toEqual(['gamma', 'alpha', 'beta']);
	});

	it('line on non-category axis: xValueOrder is overridden by x-sort so the polyline stays clean', () => {
		// Even if the chart layer computes an xValueOrder (from `sort=[...]`
		// or `sort="y desc"` on multi-series), a LINE on a non-category axis
		// still gets rewritten to x-order before rendering. Any explicit
		// reorder would zigzag the polyline — the sort was really a category-
		// axis feature that a time-axis chart shouldn't obey.
		const result = generateSeriesConfig({
			type: 'line',
			x: 'x',
			y: 'y',
			xColumnType: 'number',
			xValueOrder: [3, 1, 2],
			data: [
				{ x: 1, y: 10 },
				{ x: 2, y: 20 },
				{ x: 3, y: 30 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual([1, 2, 3]);
	});

	it('line on CATEGORY axis: xValueOrder still applies (no anti-zigzag override)', () => {
		// Category axes position by array index, not by data value — so the
		// reorder IS the display order there. The x-sort override must gate
		// on treatAsCategoryAxis.
		const result = generateSeriesConfig({
			type: 'line',
			x: 'x',
			y: 'y',
			xColumnType: 'string',
			treatAsCategoryAxis: true,
			xValueOrder: ['C', 'A', 'B'],
			data: [
				{ x: 'A', y: 10 },
				{ x: 'B', y: 20 },
				{ x: 'C', y: 30 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual(['C', 'A', 'B']);
	});

	it('bar on non-category axis: NOT rewritten by anti-zigzag (bars position by x independently)', () => {
		// Bars on a time/value axis position by their own x value, so array
		// order doesn't drive placement — no zigzag issue. Preserving the
		// input order avoids overriding a user's SQL `sort="y desc"` which
		// they may legitimately want (e.g. paired with LIMIT for top-N months).
		const result = generateSeriesConfig({
			type: 'bar',
			x: 'x',
			y: 'y',
			xColumnType: 'number',
			data: [
				{ x: 2, y: 50 },
				{ x: 4, y: 25 },
				{ x: 1, y: 10 }
			]
		});
		const rows = result[0].data as unknown[][];
		expect(rows.map((r) => r[0])).toEqual([2, 4, 1]);
	});

	it('multi-series line on non-category axis: each series is x-sorted', () => {
		const result = generateSeriesConfig({
			type: 'line',
			x: 'x',
			y: 'y',
			series: 'grp',
			xColumnType: 'number',
			data: [
				{ x: 3, y: 30, grp: 'p' },
				{ x: 1, y: 10, grp: 'p' },
				{ x: 2, y: 20, grp: 'p' },
				{ x: 2, y: 200, grp: 'q' },
				{ x: 1, y: 100, grp: 'q' },
				{ x: 3, y: 300, grp: 'q' }
			]
		});
		for (const s of result) {
			const rows = s.data as unknown[][];
			expect(rows.map((r) => r[0])).toEqual([1, 2, 3]);
		}
	});

	it('retains user-requested filled zeros for line charts', () => {
		const result = generateSeriesConfig({
			type: 'line',
			x: 'x',
			y: 'y',
			series: 'category',
			handleMissing: 'zero',
			xColumnType: 'number',
			data: [
				{ x: 1, y: 10, category: 'A' },
				{ x: 1, y: 5, category: 'B' },
				{ x: 3, y: 30, category: 'A' },
				{ x: 3, y: 15, category: 'B' },
				{ x: 4, y: 40, category: 'A' },
				{ x: 4, y: 20, category: 'B' }
			]
		});

		const seriesBData = result[1].data as unknown[];
		expect(seriesBData[1]).toEqual([2, 0, undefined, undefined]);
	});
});
