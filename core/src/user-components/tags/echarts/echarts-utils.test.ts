import { describe, expect, it, vi } from 'vitest';
import type { EChartsOption } from 'echarts';
import { withAutoTimeAxisLabelThinning, withAutoXAxisLabelLayout } from './echarts-utils';

const createNode = (clientWidth: number, clientHeight = 215) =>
	({ clientWidth, clientHeight }) as HTMLDivElement;

const getAxisLabel = (option: EChartsOption) =>
	(option.xAxis as { axisLabel: Record<string, unknown> }).axisLabel;

const getGrid = (option: EChartsOption) => option.grid as { bottom?: number };

const getLayout = (option: EChartsOption, node: HTMLDivElement) =>
	withAutoXAxisLabelLayout(option, node);

describe('withAutoXAxisLabelLayout', () => {
	it('auto-rotates category x-axis labels when any label is wider than its slot', () => {
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [
						['Short', 1],
						['A very long category label', 2]
					]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(120));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 45,
			overflow: 'truncate'
		});
		expect(getGrid(layout.options).bottom).toBeGreaterThan(39);
	});

	it('caps auto-rotated label width so extreme labels do not crush the chart area', () => {
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [['An extremely long category label that should never force a huge axis gutter', 1]]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(60, 400));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 45,
			overflow: 'truncate',
			width: 180
		});
		expect(getGrid(layout.options).bottom).toBeLessThan(180);
	});

	it('adds breathing room so normal labels do not truncate at their exact measured width', () => {
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [
						['Clothing', 1],
						['Electronics', 2],
						['Groceries', 3],
						['Home', 4],
						['Sports', 5]
					]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(320));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 45,
			overflow: 'truncate'
		});
		expect(getAxisLabel(layout.options).width as number).toBeGreaterThan(80);
	});

	it('requests extra height to preserve a minimum plot area', () => {
		const sourceOptions: EChartsOption = {
			grid: { top: 15, bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [['An extremely long category label that should not crush the chart area', 1]]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(60, 215));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 45,
			overflow: 'truncate',
			width: 180
		});
		expect(getGrid(layout.options).bottom).toBeGreaterThan(100);
		expect(layout.extraHeight).toBeGreaterThan(0);
		expect(215 + layout.extraHeight - 15 - (getGrid(layout.options).bottom ?? 0)).toBe(150);
	});

	it('keeps extra height stable after the container has grown', () => {
		const sourceOptions: EChartsOption = {
			grid: { top: 15, bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [['An extremely long category label that should not crush the chart area', 1]]
				}
			]
		};
		const firstLayout = getLayout(sourceOptions, createNode(60, 215));
		const secondLayout = withAutoXAxisLabelLayout(
			sourceOptions,
			createNode(60, 215 + firstLayout.extraHeight),
			firstLayout.extraHeight
		);

		expect(secondLayout.extraHeight).toBe(firstLayout.extraHeight);
	});

	it('reserves bottom grid space when grid.bottom is omitted', () => {
		const sourceOptions: EChartsOption = {
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [['A very long category label', 1]]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(60));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 45,
			overflow: 'truncate'
		});
		expect(getGrid(layout.options).bottom).toBeGreaterThan(0);
	});

	it('reserves bottom grid space when grid.bottom is percentage-based', () => {
		const sourceOptions: EChartsOption = {
			grid: { bottom: '10%' },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [['A very long category label', 1]]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(60, 300));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 45,
			overflow: 'truncate'
		});
		expect(getGrid(layout.options).bottom).toBeGreaterThan(30);
	});

	it('preserves an explicit label rotation override', () => {
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate',
					rotate: 0
				}
			},
			series: [
				{
					type: 'bar',
					data: [['A very long category label', 1]]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(60));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 0,
			overflow: 'truncate'
		});
		expect(getGrid(layout.options).bottom).toBe(39);
		expect(layout.extraHeight).toBe(0);
	});

	it('treats xAxis.data as authoritative and ignores series.data with non-categorical shape', () => {
		// Heatmap-style: xAxis.data holds the category strings, but the series
		// items are [xIndex, yIndex, value]. The helper must not mix the numeric
		// indices into the category list — doing so doubles the slot count (so
		// rotation triggers too late) and feeds the user's formatter integer
		// indices (a date formatter would turn `0` into "1970-01-01" and inflate
		// the measured label width).
		const formatter = vi.fn((value: unknown) => `formatted:${String(value)}`);
		const sourceOptions: EChartsOption = {
			grid: { bottom: 10 },
			xAxis: {
				type: 'category',
				data: ['Q1', 'Q2', 'Q3', 'Q4'],
				axisLabel: { formatter }
			},
			series: [
				{
					type: 'heatmap',
					data: [
						[0, 0, 1],
						[1, 0, 2],
						[2, 0, 3],
						[3, 0, 4]
					]
				}
			]
		};

		getLayout(sourceOptions, createNode(800));

		const formatterCallValues = formatter.mock.calls.map((call) => call[0]);
		expect(formatterCallValues).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
	});

	it('skips layout adjustments for top-positioned x-axes', () => {
		// Heatmaps render their x-axis at the top. The helper budgets bottom-grid
		// space and reports extraHeight assuming a bottom axis; for a top axis
		// that adjustment lands on the wrong dimension and inflates the wrapper
		// unnecessarily.
		const sourceOptions: EChartsOption = {
			grid: { bottom: '10%' },
			xAxis: {
				type: 'category',
				position: 'top',
				data: ['A very long category label', 'Another very long category label'],
				axisLabel: { overflow: 'truncate' }
			},
			series: [
				{
					type: 'heatmap',
					data: [
						[0, 0, 1],
						[1, 0, 2]
					]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(60, 300));

		expect(layout.options).toBe(sourceOptions);
		expect(layout.extraHeight).toBe(0);
	});

	it('keeps short labels unrotated', () => {
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: {
					overflow: 'truncate'
				}
			},
			series: [
				{
					type: 'bar',
					data: [
						['A', 1],
						['B', 2]
					]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(400));

		expect(getAxisLabel(layout.options)).toMatchObject({
			rotate: 0,
			overflow: 'truncate'
		});
		expect(getGrid(layout.options).bottom).toBe(39);
		expect(layout.extraHeight).toBe(0);
	});

	it('never sets a truncation width on horizontal labels', () => {
		// The matrix (X_AXIS_SPEC.md § 6): horizontal category labels are shown
		// whole or the axis rotates — there is no mid-width band where labels
		// ellipsize before the rotate breakpoint. Setting `width` = slot width
		// re-created exactly that band whenever ECharts' internal measurement
		// disagreed with the canvas estimate by a few pixels.
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: { overflow: 'truncate' }
			},
			series: [
				{
					type: 'bar',
					data: [
						['2024-Q1', 1],
						['2024-Q2', 2],
						['2024-Q3', 3],
						['2024-Q4', 4]
					]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(600));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBe(0);
		expect(axisLabel.width).toBeUndefined();
		expect(axisLabel.interval).toBe(0);
	});

	it('keeps the slot width when the user opted into wrapping', () => {
		// overflow: 'break' needs a width to wrap to.
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: { overflow: 'break' }
			},
			series: [
				{
					type: 'bar',
					data: [
						['A very long category label', 1],
						['Another very long category label', 2]
					]
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(300));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBe(0);
		expect(axisLabel.overflow).toBe('break');
		expect(axisLabel.width as number).toBeGreaterThan(0);
	});

	it('thins rotated labels uniformly when slots are narrower than a rotated line', () => {
		// 60 categories at 300px: slot = 240/60 = 4px, far below the ~19px a
		// 45°-rotated line needs. Uniform every-k-th thinning, not greedy
		// hideOverlap.
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: { overflow: 'truncate' }
			},
			series: [
				{
					type: 'bar',
					data: Array.from({ length: 60 }, (_, i) => [`Category number ${i + 1}`, i])
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(300));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBe(45);
		expect(axisLabel.hideOverlap).toBe(false);
		// pitch ≈ 12·√2 + 2 ≈ 19px, slot = 4px → k = ceil(19/4) − 1 = 4.
		expect(axisLabel.interval).toBe(4);
	});

	it('shows every rotated label when slots are wide enough for the rotated pitch', () => {
		// 5 long labels at 600px: slot = 96px ≫ 19px rotated pitch → rotation
		// alone fits everything, interval stays 0.
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: {
				type: 'category',
				axisLabel: { overflow: 'truncate' }
			},
			series: [
				{
					type: 'bar',
					data: Array.from({ length: 5 }, (_, i) => [`A fairly long category label ${i + 1}`, i])
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(600));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBe(45);
		expect(axisLabel.interval).toBe(0);
	});

	it('thins numeric category labels HORIZONTALLY instead of rotating', () => {
		// A stacked "day of month" bar chart is coerced to a category axis; its
		// 1..31 labels overflow their slots but read fine horizontally, so we
		// thin (every k-th) and keep rotate: 0 — matching the same grain's line
		// chart on a value axis. (Contrast: the string-label case above rotates.)
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: { type: 'category' },
			series: [
				{
					type: 'bar',
					data: Array.from({ length: 31 }, (_, i) => [String(i + 1), i])
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(300));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBe(0);
		// Thinned, not rotated: interval > 0 skips labels to keep survivors clear.
		expect(axisLabel.interval as number).toBeGreaterThan(0);
		// Horizontal labels are never width-clamped (no ellipsis).
		expect(axisLabel.width).toBeUndefined();
		// No extra bottom gutter is needed for horizontal labels.
		expect(layout.extraHeight).toBe(0);
	});

	it('shows every numeric category label when they all fit', () => {
		// 5 short numbers at 600px: slots are far wider than "5" → no thinning.
		const sourceOptions: EChartsOption = {
			grid: { bottom: 39 },
			xAxis: { type: 'category' },
			series: [
				{
					type: 'bar',
					data: Array.from({ length: 5 }, (_, i) => [String(i + 1), i])
				}
			]
		};

		const layout = getLayout(sourceOptions, createNode(600));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBe(0);
		expect(axisLabel.interval).toBe(0);
	});
});

describe('withAutoTimeAxisLabelThinning', () => {
	const MONTH_NAMES = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	/** Monthly UTC timestamps starting Jan of `startYear`. */
	const monthlyTimestamps = (startYear: number, count: number) =>
		Array.from({ length: count }, (_, i) => Date.UTC(startYear + Math.floor(i / 12), i % 12, 1));

	/** Mirrors formatTimeAxisLabel's two-tier month output: first tick and Januaries get "Mon\nYYYY". */
	const twoTierMonthFormatter = (value: unknown, index: number) => {
		const d = new Date(value as number);
		const month = MONTH_NAMES[d.getUTCMonth()];
		if (index === 0 || d.getUTCMonth() === 0) return `${month}\n${d.getUTCFullYear()}`;
		return month;
	};

	const timeAxisOptions = (
		customValues: number[],
		seriesType: 'line' | 'bar'
	): EChartsOption => ({
		grid: { left: 3, right: 3, bottom: 27 },
		xAxis: {
			type: 'time',
			axisLabel: {
				formatter: twoTierMonthFormatter,
				customValues
			}
		},
		series: [{ type: seriesType, data: customValues.map((v) => [v, 1]) }]
	});

	const getCustomValues = (option: EChartsOption) =>
		getAxisLabel(option).customValues as number[] | undefined;

	it('thins with a steady stride, preserving first, last, and year-rollover labels', () => {
		const values = monthlyTimestamps(2024, 24); // Jan 2024 – Dec 2025
		const layout = withAutoTimeAxisLabelThinning(timeAxisOptions(values, 'line'), createNode(300));

		const axisLabel = getAxisLabel(layout.options);
		expect(axisLabel.rotate).toBeUndefined();

		const thinned = getCustomValues(layout.options);
		expect(thinned).toBeDefined();
		expect(thinned!.length).toBeLessThan(values.length);
		expect(thinned).toContain(values[0]); // first
		expect(thinned).toContain(values[values.length - 1]); // last
		expect(thinned).toContain(Date.UTC(2025, 0, 1)); // Jan\n2025 year rollover
	});

	it('bar charts get the same thinning as lines — time axes never auto-rotate', () => {
		// Identical geometry, both mark types: the strategy must not differ.
		const values = monthlyTimestamps(2024, 12);
		const barLayout = withAutoTimeAxisLabelThinning(timeAxisOptions(values, 'bar'), createNode(300));
		const lineLayout = withAutoTimeAxisLabelThinning(
			timeAxisOptions(values, 'line'),
			createNode(300)
		);

		expect(getAxisLabel(barLayout.options).rotate).toBeUndefined();
		expect(getCustomValues(barLayout.options)).toEqual(getCustomValues(lineLayout.options));
		expect(getCustomValues(barLayout.options)!.length).toBeLessThan(values.length);
	});

	it('never drops an anchor or picks a label adjacent to one', () => {
		const values = monthlyTimestamps(2024, 12); // Jan 2024 – Dec 2024
		const layout = withAutoTimeAxisLabelThinning(timeAxisOptions(values, 'line'), createNode(300));

		const thinned = getCustomValues(layout.options)!;
		const indexes = thinned.map((v) => values.indexOf(v));
		expect(indexes[0]).toBe(0);
		expect(indexes[indexes.length - 1]).toBe(values.length - 1);
		// No two picked labels sit on adjacent months (would render as a cramped pair).
		for (let i = 1; i < indexes.length; i++) {
			expect(indexes[i] - indexes[i - 1]).toBeGreaterThan(1);
		}
	});

	it('leaves everything untouched when all labels fit horizontally', () => {
		const values = monthlyTimestamps(2024, 12);
		const layout = withAutoTimeAxisLabelThinning(
			timeAxisOptions(values, 'line'),
			createNode(1200)
		);

		expect(getCustomValues(layout.options)).toEqual(values);
		expect(getAxisLabel(layout.options).rotate).toBeUndefined();
	});
});
