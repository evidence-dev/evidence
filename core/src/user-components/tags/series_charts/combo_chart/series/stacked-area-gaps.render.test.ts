import { describe, it, expect } from 'vitest';
import { init, type SeriesOption } from 'echarts';
import { generateSeriesConfig, type SeriesConfigOptions } from './seriesConfig';
import { shouldDisplayTooltipParam } from '../tooltipFormatterParams.schema';
import type { DataPoint } from '../../../../types';

// Asserts what ECharts actually stacks (SSR); a NaN here is a hole in the painted area.

type Rendered = { name: string; stacked: number[] };

function renderStacked(series: SeriesOption[], xAxisType: 'time' | 'category'): Rendered[] {
	const chart = init(null, null, { renderer: 'svg', ssr: true, width: 600, height: 300 });
	chart.setOption({
		animation: false,
		xAxis: { type: xAxisType },
		yAxis: { type: 'value' },
		series
	});
	const out: Rendered[] = [];
	(chart as unknown as { getModel(): { eachSeries(cb: (m: unknown) => void): void } })
		.getModel()
		.eachSeries((m) => {
			const s = m as {
				name: string;
				getData(): {
					count(): number;
					get(dim: string, i: number): number;
					getCalculationInfo(key: string): string;
				};
			};
			const data = s.getData();
			const dim = data.getCalculationInfo('stackResultDimension');
			const stacked: number[] = [];
			for (let i = 0; i < data.count(); i++) stacked.push(data.get(dim, i));
			out.push({ name: s.name, stacked });
		});
	chart.dispose();
	return out;
}

// The reported chart (see integration-suite/fixtures/stacked-area-missing-dates.md).
const rows: [string, string, number][] = [
	['2026-09-14', 'Clean', 26],
	['2026-09-14', 'Violation', 26],
	['2026-09-14', 'Fail-closed', 1],
	['2026-09-21', 'Clean', 39],
	['2026-09-21', 'Violation', 20],
	['2026-09-21', 'Fail-closed', 2],
	['2026-09-28', 'Clean', 40],
	['2026-09-28', 'Violation', 37],
	['2026-09-28', 'Fail-closed', 2],
	['2026-10-05', 'Clean', 42],
	['2026-10-05', 'Advisory', 25],
	['2026-10-05', 'Violation', 2],
	['2026-10-05', 'Fail-closed', 3],
	['2026-10-12', 'Clean', 16],
	['2026-10-12', 'Advisory', 12],
	['2026-10-12', 'Fail-closed', 1]
];
const data: DataPoint[] = rows.map(([x, s, y]) => ({ x, s, y }));
const order = ['Clean', 'Advisory', 'Violation', 'Fail-closed'];

// Mirrors what <Area stacked> + ComboChart pass for a date x column on a time axis.
const stackedAreaSeries = (extra: Partial<SeriesConfigOptions> = {}) =>
	generateSeriesConfig({
		data,
		type: 'line',
		x: 'x',
		y: 'y',
		series: 's',
		seriesOrder: order,
		xColumnType: 'date',
		handleMissing: 'connect',
		stackId: 'stack1',
		...extra
	}).map((s) => ({ ...s, stack: extra.stackId ?? 'stack1', areaStyle: {} })) as SeriesOption[];

describe('stacked area with series missing some dates, as rendered by ECharts', () => {
	it('stacks every series at every date on a time axis, so no area has a hole', () => {
		const result = renderStacked(stackedAreaSeries(), 'time');
		expect(result.map((s) => [s.name, s.stacked])).toEqual([
			['Clean', [26, 39, 40, 42, 16]],
			['Advisory', [26, 39, 40, 67, 28]],
			['Violation', [52, 59, 77, 69, 28]],
			['Fail-closed', [53, 61, 79, 72, 29]]
		]);
	});

	it('keeps the filled points out of the tooltip', () => {
		const advisory = stackedAreaSeries().find((s) => s.name === 'Advisory')!;
		const shown = (advisory.data as unknown[]).map((item, dataIndex) =>
			shouldDisplayTooltipParam({
				value: Array.isArray(item) ? item : (item as { value: unknown[] }).value,
				data: item,
				seriesIndex: 1,
				dataIndex,
				seriesName: 'Advisory',
				marker: '',
				seriesType: 'line'
			})
		);
		expect(shown).toEqual([false, false, false, true, true]);
	});

	it('draws no data label on the filled points', () => {
		const series = stackedAreaSeries().map((s) => ({ ...s, label: { show: true } }));
		const chart = init(null, null, { renderer: 'svg', ssr: true, width: 600, height: 300 });
		chart.setOption({
			animation: false,
			xAxis: { type: 'time' },
			yAxis: { type: 'value' },
			series
		});
		const labels = [...chart.renderToSVGString().matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
			.map((m) => m[1])
			.filter((t) => !t.includes(':'));
		chart.dispose();
		// The y-axis has its own "0" tick, so only data labels beyond that one count.
		expect(labels.filter((t) => t === '0')).toHaveLength(1);
		expect(labels).toEqual(expect.arrayContaining(['25', '12', '37', '2']));
	});

	it('does not add dates the data never had', () => {
		const sparse: DataPoint[] = [
			{ x: '2026-09-14', s: 'A', y: 1 },
			{ x: '2026-10-12', s: 'A', y: 2 },
			{ x: '2026-10-12', s: 'B', y: 3 }
		];
		const series = generateSeriesConfig({
			data: sparse,
			type: 'line',
			x: 'x',
			y: 'y',
			series: 's',
			xColumnType: 'date',
			handleMissing: 'connect',
			stackId: 'stack1'
		});
		expect(series.map((s) => (s.data as unknown[]).length)).toEqual([2, 2]);
	});

	it('leaves unstacked lines on connect alone: missing dates stay null', () => {
		const [, advisory] = generateSeriesConfig({
			data,
			type: 'line',
			x: 'x',
			y: 'y',
			series: 's',
			seriesOrder: order,
			xColumnType: 'date',
			handleMissing: 'connect'
		});
		expect((advisory.data as unknown[][]).map((p) => p[1])).toEqual([null, null, null, 25, 12]);
	});

	it.each(['gaps', 'zero'] as const)(
		'respects an explicit handle_missing="%s" on a stacked area',
		(handleMissing) => {
			const fill = handleMissing === 'zero' ? 0 : null;
			const [, advisory] = stackedAreaSeries({ handleMissing });
			expect(
				(advisory.data as unknown[]).map(
					(p) => (Array.isArray(p) ? p : (p as { value: unknown[] }).value)[1]
				)
			).toEqual([fill, fill, fill, 25, 12]);
		}
	);
});
