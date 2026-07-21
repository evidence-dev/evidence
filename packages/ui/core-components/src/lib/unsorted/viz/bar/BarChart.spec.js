// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';

const { chartUpdates } = vi.hoisted(() => ({ chartUpdates: [] }));

vi.mock('$app/environment', () => ({
	browser: true,
	building: false,
	dev: false,
	version: 'test'
}));

vi.mock('$lib/themes/themes.js', async () => {
	const { readable } = await import('svelte/store');
	const palette = ['#1f77b4', '#ff7f0e', '#2ca02c'];

	return {
		getThemeStores: () => ({
			activeAppearance: readable('light'),
			theme: readable({ colors: { 'base-content-muted': '#666666' } }),
			resolveColor: (color) => readable(color),
			resolveColorsObject: (colors) => readable(colors),
			resolveColorPalette: () => readable(palette)
		})
	};
});

vi.mock('@evidence-dev/component-utilities/echarts', () => ({
	default: (_node, options) => {
		chartUpdates.push(options);
		return {
			update(nextOptions) {
				chartUpdates.push(nextOptions);
			},
			destroy() {}
		};
	}
}));

vi.mock('@evidence-dev/component-utilities/echartsCopy', () => ({
	default: () => ({ destroy() {} })
}));

vi.mock('@evidence-dev/component-utilities/echartsCanvasDownload', () => ({
	default: () => ({ destroy() {} })
}));

import BarChart from './BarChart.svelte';

const data = [
	{ name: 'Alice', status: 'open', value: 3_000_000 },
	{ name: 'Alice', status: 'closed', value: 1_500_000 },
	{ name: 'Bob', status: 'open', value: 2_000_000 },
	{ name: 'Bob', status: 'closed', value: 2_500_000 }
];

const snapshot = () => {
	const config = chartUpdates.at(-1).config;
	const series = config.series.filter(({ name }) => name !== 'stackTotal');
	const valueIndex = 1;

	return {
		axisMaximum: config.yAxis[0].max,
		axisLabelAtHalf: config.yAxis[0].axisLabel.formatter(0.5),
		seriesCount: series.length,
		seriesNames: series.map(({ name }) => name),
		seriesValues: series.map(({ data: seriesData }) =>
			seriesData.map((point) => point[valueIndex])
		),
		seriesColors: series.map((_, index) => config.color[index])
	};
};

const expectStacked100 = (state) => {
	expect([undefined, 1]).toContain(state.axisMaximum);
	expect(state.axisLabelAtHalf).toContain('50');
	expect(state.seriesCount).toBe(2);
	expect(state.seriesNames).toEqual(['open', 'closed']);
	expect(state.seriesValues.flat().every((value) => value >= 0 && value <= 1)).toBe(true);
	expect(new Set(state.seriesColors).size).toBe(2);
	expect(state.seriesValues[0][0]).toBeCloseTo(2 / 3);
	expect(state.seriesValues[0][1]).toBeCloseTo(4 / 9);
	expect(state.seriesValues[1][0]).toBeCloseTo(1 / 3);
	expect(state.seriesValues[1][1]).toBeCloseTo(5 / 9);

	for (let index = 0; index < state.seriesValues[0].length; index++) {
		const total = state.seriesValues.reduce((sum, values) => sum + values[index], 0);
		expect(total).toBeCloseTo(1);
	}
};

const expectStacked = (state) => {
	expect(state.axisMaximum).toBeUndefined();
	expect(state.axisLabelAtHalf).not.toContain('%');
	expect(state.seriesCount).toBe(2);
	expect(state.seriesNames).toEqual(['open', 'closed']);
	expect(state.seriesValues).toEqual([
		[3_000_000, 2_000_000],
		[1_500_000, 2_500_000]
	]);
	expect(new Set(state.seriesColors).size).toBe(2);
};

let chart;

const flushChart = async () => {
	await tick();
	await tick();
};

const mountChart = async (type, yFmt) => {
	chart = new BarChart({
		target: document.body,
		props: {
			data,
			x: 'name',
			y: 'value',
			series: 'status',
			type,
			yFmt,
			sort: false,
			showAllXAxisLabels: false
		}
	});
	await flushChart();
	return snapshot();
};

const setChartType = async (type, yFmt) => {
	chart.$set({ type, yFmt });
	await flushChart();
	return snapshot();
};

afterEach(() => {
	chart?.$destroy();
	chart = undefined;
	chartUpdates.length = 0;
	document.body.replaceChildren();
});

describe('BarChart stacked type changes', () => {
	it('updates normalized data, axis formatting, and series colors when entering stacked100', async () => {
		const initialStacked = await mountChart('stacked');
		expectStacked(initialStacked);

		const stacked100 = await setChartType('stacked100', 'pct');
		expectStacked100(stacked100);
		expect(stacked100.seriesNames).toEqual(initialStacked.seriesNames);
		expect(stacked100.seriesColors).toEqual(initialStacked.seriesColors);
	});

	it('restores raw values and axis formatting when leaving stacked100', async () => {
		const initialStacked100 = await mountChart('stacked100', 'pct');
		expectStacked100(initialStacked100);

		const stacked = await setChartType('stacked');
		expectStacked(stacked);
		expect(stacked.seriesNames).toEqual(initialStacked100.seriesNames);
		expect(stacked.seriesColors).toEqual(initialStacked100.seriesColors);
	});

	it('does not accumulate stale series across repeated type changes', async () => {
		const initialStacked = await mountChart('stacked');
		const firstStacked100 = await setChartType('stacked100', 'pct');
		const secondStacked = await setChartType('stacked');
		const secondStacked100 = await setChartType('stacked100', 'pct');

		expectStacked(initialStacked);
		expectStacked100(firstStacked100);
		expectStacked(secondStacked);
		expectStacked100(secondStacked100);
		expect(secondStacked.seriesNames).toEqual(initialStacked.seriesNames);
		expect(secondStacked.seriesColors).toEqual(initialStacked.seriesColors);
		expect(secondStacked100.seriesNames).toEqual(firstStacked100.seriesNames);
		expect(secondStacked100.seriesColors).toEqual(firstStacked100.seriesColors);
	});

	it('renders stacked100 correctly on the initial mount', async () => {
		expectStacked100(await mountChart('stacked100', 'pct'));
	});
});
