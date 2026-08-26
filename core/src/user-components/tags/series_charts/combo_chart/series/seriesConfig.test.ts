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
