import { describe, it, expect } from 'vitest';
import merge from 'lodash/merge';
import { generateSeriesConfig, applyLineMarkerVisibility } from './seriesConfig';
import type { DataPoint } from '../../../../types';
import type { LineSeriesOption, ScatterSeriesOption, SeriesOption } from 'echarts';

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
		const largeSize = sizeFn([3, 30, 1000.5]);

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

describe('applyLineMarkerVisibility', () => {
	const lineSeries = (
		data: DataPoint[],
		extra: Partial<Parameters<typeof generateSeriesConfig>[0]> = {}
	) => {
		const result = generateSeriesConfig({ data, type: 'line', x: 'x', y: 'y', ...extra });
		result.forEach(applyLineMarkerVisibility);
		return result as LineSeriesOption[];
	};

	const visibleIndexes = (series: SeriesOption) =>
		(series.data as unknown[]).flatMap((item, i) =>
			(item as { itemStyle?: { opacity?: number } })?.itemStyle?.opacity === 1 ? [i] : []
		);

	it('shows the only point of a single-row series', () => {
		const [series] = lineSeries([{ x: 'a', y: 5 }]);
		expect(series.data).toEqual([
			{ value: ['a', 5, undefined, undefined], itemStyle: { opacity: 1 } }
		]);
	});

	it('shows a single-row series in a multi-series chart', () => {
		const result = lineSeries(
			[
				{ x: 'a', y: 1, s: 'North' },
				{ x: 'b', y: 2, s: 'North' },
				{ x: 'a', y: 3, s: 'South' }
			],
			{ series: 's' }
		);
		const north = result.find((r) => r.name === 'North')!;
		const south = result.find((r) => r.name === 'South')!;
		expect(visibleIndexes(north)).toEqual([]);
		expect(visibleIndexes(south)).toEqual([0]);
	});

	it('shows a point with a null on both sides', () => {
		const [series] = lineSeries([
			{ x: 1, y: 10 },
			{ x: 2, y: null },
			{ x: 3, y: 30 },
			{ x: 4, y: undefined },
			{ x: 5, y: 50 },
			{ x: 6, y: 60 }
		]);
		expect(visibleIndexes(series)).toEqual([0, 2]);
	});

	it('shows an end point whose only neighbour is null', () => {
		const [series] = lineSeries([
			{ x: 1, y: 10 },
			{ x: 2, y: 20 },
			{ x: 3, y: null },
			{ x: 4, y: 40 }
		]);
		expect(visibleIndexes(series)).toEqual([3]);
	});

	it('shows every point when handle_missing="gaps" offsets two series', () => {
		const result = lineSeries(
			[
				{ x: '2024-01-01', y: 10, region: 'North' },
				{ x: '2024-01-03', y: 30, region: 'South' },
				{ x: '2024-01-05', y: 50, region: 'North' }
			],
			{ series: 'region', handleMissing: 'gaps', dateGrain: 'day', xColumnType: 'date' }
		);
		for (const series of result) {
			const nonNull = (series.data as unknown[]).flatMap((item, i) => {
				const value = Array.isArray(item) ? item : (item as { value: unknown[] }).value;
				return value[1] === null ? [] : [i];
			});
			expect(nonNull.length).toBeGreaterThan(0);
			expect(visibleIndexes(series)).toEqual(nonNull);
		}
	});

	it('leaves a connected series untouched', () => {
		const data = [
			{ x: 1, y: 10 },
			{ x: 2, y: 20 },
			{ x: 3, y: 30 }
		];
		const [series] = lineSeries(data);
		expect(series.data).toEqual(data.map((r) => [r.x, r.y, undefined, undefined]));
	});

	it('keeps tooltip_fields extras on isolated object items', () => {
		const [series] = lineSeries([{ x: 'a', y: 5, share: 0.25 }], {
			tooltipFields: [
				{
					alias: 'share',
					label: 'Share',
					fmt: undefined,
					color_by_sign: false,
					down_is_good: false
				}
			]
		});
		expect(series.data).toEqual([
			{
				value: ['a', 5, undefined, undefined],
				extras: { share: 0.25 },
				itemStyle: { opacity: 1 }
			}
		]);
	});

	it.each([
		['visible markers', { itemStyle: { opacity: 0.6 } }],
		['showSymbol=false', { showSymbol: false }],
		['symbol="none"', { symbol: 'none' }]
	])('defers to echarts_series_options with %s', (_label, overrides) => {
		const [series] = generateSeriesConfig({
			data: [{ x: 'a', y: 5 }],
			type: 'line',
			x: 'x',
			y: 'y'
		});
		merge(series, overrides);
		applyLineMarkerVisibility(series);
		expect(series.data).toEqual([['a', 5, undefined, undefined]]);
	});

	it("keeps the author's marker colour and border on the isolated point", () => {
		const [series] = generateSeriesConfig({
			data: [{ x: 'a', y: 5 }],
			type: 'line',
			x: 'x',
			y: 'y'
		});
		merge(series, {
			symbolSize: 10,
			itemStyle: { color: '#fff', borderColor: '#f00', borderWidth: 2 }
		});
		applyLineMarkerVisibility(series);
		expect(series.data).toEqual([
			{ value: ['a', 5, undefined, undefined], itemStyle: { opacity: 1 } }
		]);
		expect(series.itemStyle).toEqual({
			opacity: 0,
			color: '#fff',
			borderColor: '#f00',
			borderWidth: 2
		});
	});

	it("keeps an item's own symbolSize and itemStyle on an isolated point", () => {
		const series = {
			type: 'line',
			symbolSize: 9,
			label: { show: true },
			data: [{ value: ['a', 5], symbolSize: 0 }]
		};
		applyLineMarkerVisibility(series as SeriesOption);
		expect(series.data).toEqual([{ value: ['a', 5], symbolSize: 0, itemStyle: {} }]);
	});

	it('ignores bar and scatter series', () => {
		for (const type of ['bar', 'scatter'] as const) {
			const [series] = generateSeriesConfig({ data: [{ x: 'a', y: 5 }], type, x: 'x', y: 'y' });
			const before = series.data;
			applyLineMarkerVisibility(series);
			expect(series.data).toBe(before);
		}
	});
});
