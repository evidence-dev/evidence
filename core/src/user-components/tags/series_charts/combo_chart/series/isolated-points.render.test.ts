import { describe, it, expect } from 'vitest';
import { init, type SeriesOption } from 'echarts';
import merge from 'lodash/merge';
import { generateSeriesConfig, applyLineMarkerVisibility } from './seriesConfig';
import type { DataPoint } from '../../../../types';

// Asserts what ECharts actually paints (SSR), since per-item and series styles merge inside ECharts.

const PALETTE = ['#154886', '#45a1bf'];

type Dot = { x: unknown; fill?: unknown; stroke?: unknown; lineWidth?: unknown; symbol: string };

type RenderedSeries = { name: string; dots: Dot[]; labels: unknown[] };

interface SymbolEl {
	invisible?: boolean;
	childAt(i: number):
		| {
				style: Record<string, unknown>;
				getTextContent():
					| { invisible?: boolean; ignore?: boolean; style?: { opacity?: number } }
					| undefined;
		  }
		| undefined;
}
interface SeriesDataLike {
	count(): number;
	get(dim: string, i: number): number;
	mapDimension(dim: string): string;
	getRawIndex(i: number): number;
	getItemVisual(i: number, key: string): unknown;
	getItemGraphicEl(i: number): SymbolEl | undefined;
}

function render(
	series: SeriesOption[],
	{ xAxisType = 'category', width = 600 }: { xAxisType?: 'category' | 'value'; width?: number } = {}
): RenderedSeries[] {
	const chart = init(null, null, { renderer: 'svg', ssr: true, width, height: 300 });
	chart.setOption({
		animation: false,
		color: PALETTE,
		xAxis: { type: xAxisType },
		yAxis: { type: 'value' },
		series
	});
	const out: RenderedSeries[] = [];
	const model = (
		chart as unknown as { getModel(): { eachSeries(cb: (m: unknown) => void): void } }
	).getModel();
	model.eachSeries((m) => {
		const s = m as { name: string; getData(): SeriesDataLike };
		const data = s.getData();
		const dots: Dot[] = [];
		const labels: unknown[] = [];
		for (let i = 0; i < data.count(); i++) {
			if (isNaN(data.get(data.mapDimension('y'), i))) continue;
			const path = data.getItemGraphicEl(i)?.childAt(0);
			const label = path?.getTextContent();
			if (label && !label.invisible && !label.ignore && (label.style?.opacity ?? 1) > 0)
				labels.push(data.getRawIndex(i));
			const symbol = data.getItemVisual(i, 'symbol') as string;
			const size = data.getItemVisual(i, 'symbolSize') as number;
			const opacity = (path?.style.opacity as number | undefined) ?? 1;
			if (!path || symbol === 'none' || !(size > 0) || !(opacity > 0)) continue;
			const { fill, stroke, lineWidth } = path.style;
			dots.push({ x: data.getRawIndex(i), symbol, fill, stroke, lineWidth });
		}
		out.push({ name: s.name, dots, labels });
	});
	chart.dispose();
	return out;
}

const lineSeries = (
	data: DataPoint[],
	overrides?: Record<string, unknown>,
	extra: Partial<Parameters<typeof generateSeriesConfig>[0]> = {}
) => {
	const series = generateSeriesConfig({ data, type: 'line', x: 'x', y: 'y', ...extra });
	for (const s of series) {
		if (overrides) merge(s, overrides);
		applyLineMarkerVisibility(s);
	}
	return series as SeriesOption[];
};

const gappy: DataPoint[] = [
	{ x: 'a', y: 1 },
	{ x: 'b', y: 2 },
	{ x: 'c', y: null },
	{ x: 'd', y: 4 },
	{ x: 'e', y: null },
	{ x: 'f', y: 6 }
];

describe('isolated line points, as rendered by ECharts', () => {
	it('draws only the points that cannot join a line, in the series colour', () => {
		const [s] = render(lineSeries(gappy));
		expect(s.dots).toEqual([
			{ x: 3, symbol: 'circle', fill: PALETTE[0], stroke: undefined, lineWidth: 1 },
			{ x: 5, symbol: 'circle', fill: PALETTE[0], stroke: undefined, lineWidth: 1 }
		]);
	});

	it('draws nothing extra for a connected series', () => {
		const [s] = render(lineSeries(gappy.filter((r) => r.y !== null)));
		expect(s.dots).toEqual([]);
	});

	it('uses series_colors and palette colours per series', () => {
		const result = render(
			lineSeries(
				[
					{ x: 'a', y: 1, r: 'North' },
					{ x: 'b', y: 2, r: 'North' },
					{ x: 'a', y: 3, r: 'South' }
				],
				undefined,
				{ series: 'r', seriesColors: { South: '#ea580c' } }
			)
		);
		expect(result.map((s) => [s.name, s.dots.map((d) => d.fill)])).toEqual([
			['North', []],
			['South', ['#ea580c']]
		]);
	});

	it("keeps an author's marker shape, fill and border", () => {
		const [s] = render(
			lineSeries(gappy, {
				symbol: 'diamond',
				itemStyle: { color: '#fff', borderColor: '#dc2626', borderWidth: 3 }
			})
		);
		expect(
			s.dots.map(({ symbol, fill, stroke, lineWidth }) => ({ symbol, fill, stroke, lineWidth }))
		).toEqual([
			{ symbol: 'diamond', fill: '#fff', stroke: '#dc2626', lineWidth: 3 },
			{ symbol: 'diamond', fill: '#fff', stroke: '#dc2626', lineWidth: 3 }
		]);
	});

	it('draws every marker unchanged when the author already shows markers', () => {
		const [s] = render(lineSeries(gappy, { itemStyle: { opacity: 1 } }));
		expect(s.dots.map((d) => d.x)).toEqual([0, 1, 3, 5]);
	});

	it.each([
		['showSymbol=false', { showSymbol: false }],
		['symbol="none"', { symbol: 'none' }],
		['symbolSize=0', { symbolSize: 0 }]
	])('draws nothing when the author turns markers off (%s)', (_label, overrides) => {
		const [s] = render(lineSeries(gappy, overrides));
		expect(s.dots).toEqual([]);
	});

	it('with connectNulls, only a lone real point gets a dot', () => {
		const [connected] = render(lineSeries(gappy, { connectNulls: true }));
		expect(connected.dots).toEqual([]);
		const [lone] = render(
			lineSeries(
				[
					{ x: 'a', y: null },
					{ x: 'b', y: 2 },
					{ x: 'c', y: null }
				],
				{ connectNulls: true }
			)
		);
		expect(lone.dots.map((d) => d.x)).toEqual([1]);
	});

	it('treats an explicit itemStyle.opacity=0 as the author hiding every marker', () => {
		const [s] = render(lineSeries(gappy, { itemStyle: { opacity: 0 } }));
		expect(s.dots).toEqual([]);
	});

	it('with data labels, labels every point and still draws the isolated dots', () => {
		const [s] = render(lineSeries(gappy, { label: { show: true } }));
		expect(s.labels).toEqual([0, 1, 3, 5]);
		expect(s.dots.map((d) => d.x)).toEqual([3, 5]);
	});

	it('with data labels and an author symbolSize=0, draws no dots', () => {
		const [s] = render(lineSeries(gappy, { label: { show: true }, symbolSize: 0 }));
		expect(s.labels).toEqual([0, 1, 3, 5]);
		expect(s.dots).toEqual([]);
	});

	it('colours the dot like the line when only lineStyle.color is overridden', () => {
		const [s] = render(lineSeries(gappy, { lineStyle: { color: '#16a34a' } }));
		expect(s.dots.map((d) => d.fill)).toEqual(['#16a34a', '#16a34a']);
	});

	describe('known limits', () => {
		// Upstream ECharts bug: after a null run lttbDownSample's anchor is NaN, so the frame keeps the null.
		it.fails('keeps an isolated point after a null run through lttb sampling', () => {
			const data: DataPoint[] = Array.from({ length: 3000 }, (_, i) => ({
				x: i,
				y: i > 1480 && i < 1520 && i !== 1500 ? null : Math.sin(i / 40) * 20 + 50
			}));
			const [s] = render(lineSeries(data), { xAxisType: 'value' });
			expect(s.dots.map((d) => d.x)).toContain(1500);
		});
	});
});
