import { describe, it, expect } from 'vitest';
import { getSparklinePaths } from './sparkline.js';

/** @param {(number | null)[]} values */
const series = (values) => values.map((v, i) => [new Date(Date.UTC(2024, i, 1)), v]);

/** @param {string} path */
const points = (path) =>
	path
		.slice(1)
		.split('L')
		.map((p) => p.split(',').map(Number));

const WIDTH = 90;
const HEIGHT = 19;

describe('getSparklinePaths', () => {
	it('maps a line series left to right, inverting the y axis', () => {
		const { linePaths } = getSparklinePaths(series([10, 20, 30, 20]), 'line', WIDTH, HEIGHT, false);
		expect(linePaths).toHaveLength(1);

		const pts = points(linePaths[0]);
		expect(pts).toHaveLength(4);
		// x increases monotonically and stays within the viewBox
		expect(pts.every(([x], i) => i === 0 || x > pts[i - 1][0])).toBe(true);
		expect(pts[0][0]).toBeGreaterThanOrEqual(0);
		expect(pts[3][0]).toBeLessThanOrEqual(WIDTH);
		// larger values sit higher, i.e. at a smaller y
		expect(pts[2][1]).toBeLessThan(pts[1][1]);
		expect(pts[1][1]).toBeLessThan(pts[0][1]);
	});

	it('anchors the axis to zero by default', () => {
		// matches an ECharts value axis with scale:false, which always includes zero
		const { baseline } = getSparklinePaths(series([10, 20, 30]), 'line', WIDTH, HEIGHT, false);
		expect(baseline).toBeGreaterThan(HEIGHT - 1);
	});

	it('scales the axis to the data when yScale is set', () => {
		const { linePaths, baseline } = getSparklinePaths(
			series([10, 20, 30]),
			'line',
			WIDTH,
			HEIGHT,
			true
		);
		const pts = points(linePaths[0]);
		expect(pts[0][1]).toBeGreaterThan(HEIGHT - 1); // the minimum reaches the floor
		expect(pts[2][1]).toBeLessThan(1); // the maximum reaches the ceiling
		// zero is out of range, so the axis line falls back to the bottom
		expect(baseline).toBe(HEIGHT - 0.5);
	});

	it('breaks the line at nulls rather than connecting across them', () => {
		const { linePaths } = getSparklinePaths(
			series([1, 2, null, 4, 5]),
			'line',
			WIDTH,
			HEIGHT,
			false
		);
		expect(linePaths).toHaveLength(2);
		expect(points(linePaths[0])).toHaveLength(2);
		expect(points(linePaths[1])).toHaveLength(2);
	});

	it('lifts the baseline off the floor when the series crosses zero', () => {
		const { baseline, areaPaths } = getSparklinePaths(
			series([-10, 5, 10, -5]),
			'area',
			WIDTH,
			HEIGHT,
			false
		);
		expect(baseline).toBeGreaterThan(1);
		expect(baseline).toBeLessThan(HEIGHT - 1);
		expect(areaPaths).toHaveLength(1);
		expect(areaPaths[0].endsWith('Z')).toBe(true); // closed back to the baseline
	});

	it('hangs bars off both sides of the baseline', () => {
		const { bars, baseline, linePaths } = getSparklinePaths(
			series([-10, 5, 10, -5]),
			'bar',
			WIDTH,
			HEIGHT,
			false
		);
		expect(linePaths).toHaveLength(0);
		expect(bars).toHaveLength(4);
		expect(bars.every((b) => b.w >= 1 && b.h >= 0.5)).toBe(true);
		expect(bars[0].y).toBeCloseTo(baseline, 1); // negative: starts at the baseline
		expect(bars[2].y + bars[2].h).toBeCloseTo(baseline, 1); // positive: ends at it
	});

	it('returns null when there is nothing to draw', () => {
		expect(getSparklinePaths(series([null, null]), 'line', WIDTH, HEIGHT, false)).toBeNull();
		expect(getSparklinePaths([], 'line', WIDTH, HEIGHT, false)).toBeNull();
	});

	it('still renders degenerate series', () => {
		// a single point would otherwise draw an empty path
		const single = getSparklinePaths(series([7]), 'line', WIDTH, HEIGHT, false);
		expect(points(single.linePaths[0])).toHaveLength(2);

		// a flat series would divide by zero, and is centred instead
		const flat = getSparklinePaths(series([0, 0, 0]), 'line', WIDTH, HEIGHT, true);
		expect(points(flat.linePaths[0]).every(([, y]) => y === HEIGHT / 2)).toBe(true);
	});

	it('accepts date strings as well as Date objects', () => {
		const { linePaths } = getSparklinePaths(
			[
				['2024-01-01', 5],
				['2024-02-01', 9]
			],
			'line',
			WIDTH,
			HEIGHT,
			false
		);
		expect(points(linePaths[0])).toHaveLength(2);
	});
});
