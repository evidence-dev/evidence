import { afterAll, describe, expect, it } from 'vitest';
import { init } from 'echarts';
import type { EChartsOption } from 'echarts';
import { XAxisModel } from './XAxisModel.svelte';
import type { YAxisModel } from './YAxisModel.svelte';
import { TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX } from './constants';
import { canonicalizeTimeAxisValue } from '../../../formatValue';
import {
	withAutoTimeAxisLabelThinning,
	withAutoXAxisLabelLayout
} from '../../echarts/echarts-utils';

/**
 * END-TO-END axis label rendering tests.
 *
 * Everything else in this folder unit-tests one stage of the axis pipeline
 * (rules, formatter, layout helpers). These tests pin the FINAL output: for a
 * given dataset and container width, exactly which labels does ECharts paint,
 * in what order, rotated or not. They exercise the real `XAxisModel`, the
 * real width-aware layout helpers, and ECharts' own tick placement — via
 * ECharts' server-side SVG renderer, which paints the same `<text>` elements
 * a browser canvas would.
 *
 * Fidelity caveat: in Node our label measurement uses the char-count fallback
 * (no canvas) and ECharts uses its built-in measurer, so thin/rotate
 * *breakpoints* can sit a few pixels off from a browser with Geist loaded.
 * The decisions are deterministic — any change to what renders at a given
 * width fails loudly here.
 */

// ── Harness ─────────────────────────────────────────────────────────────────

interface RenderArgs {
	width: number;
	height?: number;
	rows: Record<string, unknown>[];
	columns: { name: string; jsType: string }[];
	x: string;
	y: string;
	seriesType?: 'line' | 'bar';
	dateGrain?: string;
	fmt?: string;
	xAxisOptions?: Record<string, unknown>;
	/** Render the x-axis title graphic like ComboChart does (bottom-right). */
	title?: string;
	/**
	 * Mirror ComboChart's stacked-chart coercion: force the axis to `category`
	 * (dropping the value-axis-only boundaryGap/min/max). Used to exercise a
	 * stacked bar/area on a numeric grain, which lands on a category axis.
	 */
	forceCategory?: boolean;
}

function makeXAxisModel(args: RenderArgs): XAxisModel {
	const queryResult = { rows: args.rows, columns: args.columns };
	const stubAxis = { series: [{ query: { result: queryResult } }] } as unknown as YAxisModel;
	const emptyAxis = { series: [] } as unknown as YAxisModel;
	return new XAxisModel(
		() => ({
			x: args.x,
			date_grain: args.dateGrain,
			fmt: args.fmt,
			...args.xAxisOptions
		}),
		() => ({ y1: stubAxis, y2: emptyAxis })
	);
}

const CHART_MARGIN_PX = 3;
const X_AXIS_FONT_SIZE = 12;

/** Mirrors the ComboChart pieces the axis pipeline depends on (grid budget, title graphic, series shape). */
function coerceToCategory(axisConfig: EChartsOption['xAxis']): EChartsOption['xAxis'] {
	// Same override ComboChart applies to stacked non-time charts.
	const { boundaryGap: _b, min: _min, max: _max, ...rest } = axisConfig as Record<string, unknown>;
	return { ...rest, type: 'category' } as EChartsOption['xAxis'];
}

function assembleOptions(model: XAxisModel, args: RenderArgs): EChartsOption {
	const titleVisible = Boolean(args.title);
	// Mirror seriesConfig.formatXValue: only a date column on a real time axis
	// gets offset-stripped; a numeric category axis stringifies; everything else
	// (strings, value-axis numbers) passes through. (Kept identical to
	// x-axis-test-harness so the two harnesses can't disagree with production.)
	const axisType = args.forceCategory ? 'category' : (model.axisConfig as { type?: string }).type;
	const xJsType = args.columns.find((c) => c.name === args.x)?.jsType;
	const isTimeAxis = xJsType === 'date' && axisType !== 'category';
	const formatXValue = (value: unknown): string | number | Date => {
		if (axisType === 'category' && typeof value === 'number') return String(value);
		if (isTimeAxis) return canonicalizeTimeAxisValue(value) as string | number | Date;
		return value as string | number | Date;
	};
	const gridBottom =
		(titleVisible
			? CHART_MARGIN_PX + X_AXIS_FONT_SIZE + 27
			: CHART_MARGIN_PX + X_AXIS_FONT_SIZE + 12) +
		(model.hasTwoTierLabels ? TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX : 0);
	return {
		// ECharts is left on its default local-time clock — matching production
		// (echarts.action no longer pins useUTC). The x-values in series.data are
		// canonicalized via canonicalizeTimeAxisValue (below), exactly as
		// production's seriesConfig does: any UTC offset is stripped so ECharts,
		// our tick math (parseSeriesTimestampMs), and the label formatters all
		// read the same offset-free wall-clock digits. A date therefore renders
		// verbatim — the same for every viewer — in any runtime timezone.
		animation: false,
		grid: {
			top: 20,
			left: CHART_MARGIN_PX,
			right: CHART_MARGIN_PX,
			bottom: gridBottom
		},
		xAxis: args.forceCategory ? coerceToCategory(model.axisConfig) : model.axisConfig,
		yAxis: { type: 'value' },
		...(titleVisible
			? {
					// Same shape as ComboChart's x-axis title graphic: anchored to
					// the container's bottom-right, independent of grid.bottom.
					graphic: [
						{
							type: 'text' as const,
							right: 1,
							bottom: 0,
							style: { text: args.title, fontSize: X_AXIS_FONT_SIZE }
						}
					]
				}
			: {}),
		series: [
			{
				type: args.seriesType ?? 'line',
				barMaxWidth: 60,
				data: args.rows.map((r) => [formatXValue(r[args.x]), r[args.y]])
			}
		]
	} as EChartsOption;
}

interface RenderedAxis {
	/** Painted x-axis labels, left to right. Two-line labels contain '\n'. */
	labels: string[];
	/** Whether the labels were auto-rotated. */
	rotated: boolean;
	/**
	 * Vertical clearance (px) between the bottom of the lowest label line and
	 * the top of the x-axis title text. Only set when a title was rendered.
	 * Negative would mean the year tier overlaps the title.
	 */
	titleClearancePx?: number;
}

/**
 * The full pipeline: model → assembled options → width-aware layout helpers
 * (with a fake node of the given size) → ECharts SSR render → extract painted
 * x-axis label text from the SVG.
 */
function renderAxis(args: RenderArgs): RenderedAxis {
	const { width, height = 240 } = args;
	const model = makeXAxisModel(args);
	const assembled = assembleOptions(model, args);
	const node = { clientWidth: width, clientHeight: height } as HTMLDivElement;

	// Same order as echarts.action's getLaidOutOptions.
	const categoryLayout = withAutoXAxisLabelLayout(assembled, node, 0);
	const timeLayout = withAutoTimeAxisLabelThinning(categoryLayout.options, node);
	const finalOptions = timeLayout.options;
	const renderHeight = height + categoryLayout.extraHeight;

	const chart = init(null, null, { renderer: 'svg', ssr: true, width, height: renderHeight });
	chart.setOption(finalOptions);
	const svg = chart.renderToSVGString();
	chart.dispose();

	const grid = (finalOptions as { grid?: { bottom?: number } }).grid;
	const gridBottom = typeof grid?.bottom === 'number' ? grid.bottom : 0;
	const plotBottom = renderHeight - gridBottom;
	return extractAxisLabels(svg, plotBottom, args.title);
}

/**
 * Pulls x-axis label strings out of the rendered SVG: every `<text>` painted
 * below the plot area, grouped by tick x-position (a two-tier label is two
 * text nodes at the same x — rejoined with '\n'), ordered left to right.
 * When `titleText` is given, that text node is treated as the axis-title
 * graphic instead of a label, and its clearance from the label block is
 * measured.
 */
function extractAxisLabels(svg: string, plotBottom: number, titleText?: string): RenderedAxis {
	const textRe = /<text([^>]*)>([^<]*)<\/text>/g;
	const byX = new Map<number, { innerY: number; text: string }[]>();
	let rotated = false;
	let labelBottomPx = -Infinity;
	let titleTopPx: number | undefined;

	let m: RegExpExecArray | null;
	while ((m = textRe.exec(svg))) {
		const attrs = m[1];
		const text = m[2];

		// Unrotated labels use translate(x y); rotated ones bake the rotation
		// into a matrix(a,b,c,d,tx,ty) — a non-zero `b` term is the rotation.
		let tx: number;
		let ty: number;
		let isRotated = false;
		const translate = attrs.match(/transform="translate\(([\d.e+-]+)[ ,]+([\d.e+-]+)\)/);
		const matrix = attrs.match(/transform="matrix\(([^)]+)\)"/);
		if (translate) {
			tx = Number(translate[1]);
			ty = Number(translate[2]);
			isRotated = /rotate\(/.test(attrs);
		} else if (matrix) {
			const parts = matrix[1].split(',').map(Number);
			tx = parts[4];
			ty = parts[5];
			isRotated = parts[1] !== 0;
		} else {
			continue;
		}

		// Keep only text in the bottom axis gutter (+1 skips the y-axis "0"
		// label that sits exactly on the plot's bottom edge).
		if (!(ty > plotBottom + 1)) continue;

		// `y` is the line's center offset within the translate; text is
		// baseline-central, so the glyph box spans ±fontSize/2 around it.
		const innerY = Number(attrs.match(/\by="([\d.e+-]+)"/)?.[1] ?? 0);
		const centerY = ty + innerY;

		if (titleText !== undefined && text === titleText) {
			titleTopPx = centerY - X_AXIS_FONT_SIZE / 2;
			continue;
		}

		if (isRotated) rotated = true;
		labelBottomPx = Math.max(labelBottomPx, centerY + X_AXIS_FONT_SIZE / 2);

		const key = Math.round(tx);
		if (!byX.has(key)) byX.set(key, []);
		byX.get(key)!.push({ innerY, text });
	}

	const labels = Array.from(byX.entries())
		.sort(([a], [b]) => a - b)
		.map(([, lines]) =>
			lines
				.sort((a, b) => a.innerY - b.innerY)
				.map((l) => l.text)
				.join('\n')
		)
		.filter((label) => label !== '');

	return {
		labels,
		rotated,
		...(titleTopPx !== undefined && Number.isFinite(labelBottomPx)
			? { titleClearancePx: titleTopPx - labelBottomPx }
			: {})
	};
}

// ── Dataset builders ────────────────────────────────────────────────────────

const monthlyRows = (startYear: number, startMonth: number, count: number) =>
	Array.from({ length: count }, (_, i) => {
		const y = startYear + Math.floor((startMonth + i) / 12);
		const mo = (startMonth + i) % 12;
		return {
			month: `${y}-${String(mo + 1).padStart(2, '0')}-01`,
			revenue: 100 + i * 10
		};
	});

const DATE_COLUMNS = [
	{ name: 'month', jsType: 'date' },
	{ name: 'revenue', jsType: 'number' }
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('rendered x-axis labels (SSR, exact output per container width)', () => {
	it('12 months across a year boundary, wide: every month painted, two-tier years at first tick and January', () => {
		const { labels, rotated } = renderAxis({
			width: 640,
			rows: monthlyRows(2019, 6, 12), // Jul 2019 – Jun 2020
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'month'
		});

		expect(rotated).toBe(false);
		expect(labels).toEqual([
			'Jul\n2019',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
			'Jan\n2020',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun'
		]);
	});

	it('12 months on mobile: steady every-other-month rhythm, year anchors kept, no adjacent pairs', () => {
		// The bug this pins: closest-to-pixel-target thinning picked irregular
		// clusters ("Feb, May, Jun, Aug, Sep, Oct, Jan") on a 375px viewport.
		const { labels, rotated } = renderAxis({
			width: 375,
			rows: monthlyRows(2024, 1, 12), // Feb 2024 – Jan 2025
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'month'
		});

		expect(rotated).toBe(false);
		expect(labels).toEqual(['Feb\n2024', 'Apr', 'Jun', 'Aug', 'Oct', 'Jan\n2025']);
	});

	it('narrow phone (320px): same rhythm survives', () => {
		const { labels } = renderAxis({
			width: 320,
			rows: monthlyRows(2024, 1, 12),
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'month'
		});

		expect(labels).toEqual(['Feb\n2024', 'Apr', 'Jun', 'Aug', 'Oct', 'Jan\n2025']);
	});

	it('8 quarters across a year boundary: single-line year-anchored (inline first tick, bare-year boundaries)', () => {
		const quarterlyRows = Array.from({ length: 8 }, (_, i) => {
			const y = 2023 + Math.floor((2 + i) / 4); // Q3 2023 – Q2 2025
			const q = (2 + i) % 4;
			return {
				quarter: `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`,
				revenue: 100 + i * 10
			};
		});
		const { labels, rotated } = renderAxis({
			width: 640,
			rows: quarterlyRows,
			columns: [
				{ name: 'quarter', jsType: 'date' },
				{ name: 'revenue', jsType: 'number' }
			],
			x: 'quarter',
			y: 'revenue',
			dateGrain: 'quarter'
		});

		// Multi-year span (~2yr) is a year timeline: it reads single-line and
		// year-anchored. Q1 year-boundary ticks show the bare year (no redundant
		// "Q1" stacked over every one); the Q3-2023 first tick, not itself a year
		// boundary, shows an inline "Q3 2023" to state the start year.
		expect(rotated).toBe(false);
		expect(labels).toEqual(['Q3 2023', 'Q4', '2024', 'Q2', 'Q3', 'Q4', '2025', 'Q2']);
	});

	it('24 months (over the pinned-tick threshold): multi-year span reads as bare year separators, interior months intact', () => {
		// > CUSTOM_TICK_THRESHOLD points means no customValues — ECharts picks
		// its own time ticks (quarters here) and our formatter labels them. On a
		// multi-year span the January ticks collapse to the year alone ("2024"),
		// so the axis reads as a clean year scale instead of repeating "Jan".
		const { labels } = renderAxis({
			width: 375,
			rows: monthlyRows(2024, 0, 24), // Jan 2024 – Dec 2025
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'month'
		});

		expect(labels).toEqual(['2024', 'Apr', 'Jul', 'Oct', '2025', 'Apr', 'Jul', 'Oct']);
	});

	it('5 years of monthly data (thinned to yearly ticks): reads as a bare year axis, no repeated "Jan", no two-tier reserve', () => {
		// The exact production regression: ECharts thins a 5-year monthly axis to
		// one tick per year, all on January. Before, every tick stacked "Jan" over
		// the year; now they collapse to the year alone. And because no label is
		// two-tier anymore, the chart must NOT reserve the extra year-line gutter.
		const args = {
			width: 640,
			rows: monthlyRows(2022, 0, 60), // Jan 2022 – Dec 2026
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'month'
		} as const;
		const { labels, rotated } = renderAxis(args);

		expect(rotated).toBe(false);
		// ECharts places a tick at each year boundary (incl. the Jan-2027 axis
		// max just past the Dec-2026 data end) — all bare years, no "Jan".
		expect(labels).toEqual(['2022', '2023', '2024', '2025', '2026', '2027']);
		expect(makeXAxisModel(args).hasTwoTierLabels).toBe(false);
	});

	it('3 years of daily data: multi-year first tick anchors to its YEAR, not a stray "Jan 1"', () => {
		// fix B: on a year timeline the first tick must read as a year separator
		// ("2022") like every other year marker, instead of the day-qualified
		// "Jan 1" that reads as a lone date next to bare "2023"/"2024".
		const rows = Array.from({ length: 1095 }, (_, i) => {
			const d = new Date(2022, 0, 1 + i);
			return {
				month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
					d.getDate()
				).padStart(2, '0')}`,
				revenue: 100 + i
			};
		});
		const { labels, rotated } = renderAxis({
			width: 700,
			rows,
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'day'
		});

		expect(rotated).toBe(false);
		expect(labels).toEqual(['2022', 'Jul', '2023', 'Jul', '2024', 'Jul', '2025']);
	});

	it('3 years of weekly data: same year-anchored first tick as daily', () => {
		const rows = Array.from({ length: 156 }, (_, i) => {
			const d = new Date(2022, 0, 1 + i * 7);
			return {
				month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
					d.getDate()
				).padStart(2, '0')}`,
				revenue: 100 + i
			};
		});
		const { labels, rotated } = renderAxis({
			width: 700,
			rows,
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'week'
		});

		expect(rotated).toBe(false);
		expect(labels[0]).toBe('2022');
		expect(labels).not.toContain('Jan 1');
	});

	it('12 monthly bars at narrow width: same two-tier + thinning treatment as lines, never rotated', () => {
		// Time-axis bars are time buckets, not categories — they get the same
		// stacked-year strategy as line charts instead of 45° rotation.
		const { labels, rotated } = renderAxis({
			width: 360,
			rows: monthlyRows(2019, 6, 12), // Jul 2019 – Jun 2020
			columns: DATE_COLUMNS,
			x: 'month',
			y: 'revenue',
			dateGrain: 'month',
			seriesType: 'bar'
		});

		expect(rotated).toBe(false);
		expect(labels).toEqual(['Jul\n2019', 'Sep', 'Nov', 'Jan\n2020', 'Mar', 'Jun']);
	});

	it('month-of-year bars (integers 1-12): a named seasonality grain shows every month, Jan through Dec', () => {
		// "month of year" labels are names (Jan, Feb, …), so it renders on a
		// CATEGORY axis where every slot is labelled — not a value axis, which
		// would place round-number ticks (2,4,6,…) and drop Jan. On a 640px axis
		// all 12 abbreviations fit horizontally, so no rotation and no thinning.
		const rows = Array.from({ length: 12 }, (_, i) => ({ m: i + 1, revenue: 100 + i * 10 }));
		const { labels, rotated } = renderAxis({
			width: 640,
			rows,
			columns: [
				{ name: 'm', jsType: 'number' },
				{ name: 'revenue', jsType: 'number' }
			],
			x: 'm',
			y: 'revenue',
			dateGrain: 'month of year',
			fmt: 'mmm',
			seriesType: 'bar'
		});

		expect(rotated).toBe(false);
		expect(labels).toEqual([
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
		]);
	});

	it('month-of-year bars: slots stay in calendar order however the rows arrive (EVI-2987)', () => {
		const seasonalityColumns = [
			{ name: 'm', jsType: 'number' },
			{ name: 'revenue', jsType: 'number' }
		];
		const paint = (months: number[], forceCategory = false) =>
			renderAxis({
				width: 640,
				rows: months.map((m) => ({ m, revenue: 100 })),
				columns: seasonalityColumns,
				x: 'm',
				y: 'revenue',
				dateGrain: 'month of year',
				fmt: 'mmm',
				seriesType: 'bar',
				forceCategory
			}).labels;

		// Sparse gap across series: 1,2,4,5 then a later series' 3.
		expect(paint([1, 2, 4, 5, 3])).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May']);
		// Fully scrambled, as a measure sort returns.
		expect(paint([5, 3, 7, 4, 6])).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul']);
		expect(paint([3, 4, 5, 6, 7])).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul']);
		// A stacked series coerces the axis to category; the domain still holds.
		expect(paint([1, 2, 4, 5, 3], true)).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May']);
	});

	it('day-of-week bars (integers 1-7): a named seasonality grain shows every day, Sun through Sat', () => {
		// Named grain → category axis, so all seven day names are labelled (a
		// value axis could tick 2,4,6 and drop Mon/Wed/Fri). Seven short labels
		// fit a 640px axis with room to spare — no rotation, no thinning.
		const rows = Array.from({ length: 7 }, (_, i) => ({ d: i + 1, revenue: 100 + i * 10 }));
		const { labels } = renderAxis({
			width: 640,
			rows,
			columns: [
				{ name: 'd', jsType: 'number' },
				{ name: 'revenue', jsType: 'number' }
			],
			x: 'd',
			y: 'revenue',
			dateGrain: 'day of week',
			fmt: 'ddd',
			seriesType: 'bar'
		});

		expect(labels).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
	});

	it('two-tier labels clear the x-axis title graphic, at any chart height', () => {
		// The title graphic anchors to the container's bottom edge while labels
		// hang from the plot's bottom edge — grid.bottom is what keeps them
		// apart, and it must hold whether the chart is short or tall.
		for (const height of [180, 240, 400]) {
			const { labels, titleClearancePx } = renderAxis({
				width: 640,
				height,
				rows: monthlyRows(2019, 6, 12),
				columns: DATE_COLUMNS,
				x: 'month',
				y: 'revenue',
				dateGrain: 'month',
				title: 'Month'
			});

			// Same labels regardless of height or title presence.
			expect(labels[0]).toBe('Jul\n2019');
			expect(labels).toContain('Jan\n2020');
			expect(titleClearancePx).toBeDefined();
			expect(titleClearancePx!).toBeGreaterThanOrEqual(2);
		}
	});

	it('single-line labels also clear the title (no two-tier)', () => {
		// Day-grain labels are single-line; the tighter titled gutter must
		// still hold.
		const rows = Array.from({ length: 10 }, (_, i) => ({
			day: `2025-06-${String(10 + i).padStart(2, '0')}`,
			revenue: 100 + i
		}));
		const { titleClearancePx } = renderAxis({
			width: 640,
			rows,
			columns: [
				{ name: 'day', jsType: 'date' },
				{ name: 'revenue', jsType: 'number' }
			],
			x: 'day',
			y: 'revenue',
			dateGrain: 'day',
			title: 'Day'
		});

		expect(titleClearancePx).toBeDefined();
		expect(titleClearancePx!).toBeGreaterThanOrEqual(2);
	});

	it('integer years on a line chart: fitted bounds, padded boundary ticks stay blank', () => {
		const rows = Array.from({ length: 20 }, (_, i) => ({ year: 2000 + i, gdp: 1000 + i * 50 }));
		const { labels } = renderAxis({
			width: 640,
			rows,
			columns: [
				{ name: 'year', jsType: 'number' },
				{ name: 'gdp', jsType: 'number' }
			],
			x: 'year',
			y: 'gdp',
			fmt: 'yyyy'
		});

		// No phantom 1999/2020 boundary labels; first and last painted labels
		// are real data years.
		expect(labels[0]).toBe('2000');
		expect(Number(labels[labels.length - 1])).toBeLessThanOrEqual(2019);
	});

	it('integer years WITHOUT x_fmt: auto-detected, no thousands separators', () => {
		// Year-named column + 4-digit integer data → separator-free labels by
		// default ("2000", not "2,000"). No x_fmt needed.
		const rows = Array.from({ length: 20 }, (_, i) => ({ year: 2000 + i, gdp: 1000 + i * 50 }));
		const { labels } = renderAxis({
			width: 640,
			rows,
			columns: [
				{ name: 'year', jsType: 'number' },
				{ name: 'gdp', jsType: 'number' }
			],
			x: 'year',
			y: 'gdp'
		});

		expect(labels.length).toBeGreaterThan(2);
		for (const label of labels) {
			expect(label).toMatch(/^\d{4}$/);
		}
		expect(labels[0]).toBe('2000');
	});

	it('4-digit integers on a non-year column keep default number formatting', () => {
		// Same data shape, column named "score": the heuristic must not fire.
		const rows = Array.from({ length: 20 }, (_, i) => ({ score: 2000 + i, gdp: 1000 + i * 50 }));
		const { labels } = renderAxis({
			width: 640,
			rows,
			columns: [
				{ name: 'score', jsType: 'number' },
				{ name: 'gdp', jsType: 'number' }
			],
			x: 'score',
			y: 'gdp'
		});

		expect(labels.some((l) => l.includes(','))).toBe(true);
	});
});

// ── Timezone invariance (the reason this PR moved to local-everywhere) ────────
//
// A zoneless bucketed date must paint the SAME labels no matter where the
// viewer sits. The whole pipeline now runs on one clock (ECharts parses
// series.data locally, our tick math parses via parseSeriesTimestampMs locally,
// formatters read local components), so parse and format cancel. This block
// renders real datasets under a spread of zones and asserts the painted labels
// are byte-identical — the guardrail against a future partial re-introduction
// of UTC (which is exactly what produced the "4 am / 4 am" and off-by-one-day
// regressions). Correctness of the actual strings is anchored by the exact-
// value tests above (run in the default zone).
describe('rendered x-axis labels are timezone-invariant', () => {
	const ZONES = ['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'];
	const originalTZ = process.env.TZ;
	afterAll(() => {
		if (originalTZ === undefined) delete process.env.TZ;
		else process.env.TZ = originalTZ;
	});

	const dailyRows = Array.from({ length: 27 }, (_, i) => ({
		day: `2025-06-${String(5 + i).padStart(2, '0')}`,
		revenue: 100 + i
	}));
	const DAY_COLUMNS = [
		{ name: 'day', jsType: 'date' },
		{ name: 'revenue', jsType: 'number' }
	];
	const hourlyRows = Array.from({ length: 10 }, (_, i) => {
		const hour = 20 + i; // 2024-06-15 20:00 → 2024-06-16 05:00, crosses midnight
		const day = 15 + Math.floor(hour / 24);
		return {
			ts: `2024-06-${String(day).padStart(2, '0')} ${String(hour % 24).padStart(2, '0')}:00:00`,
			revenue: 100 + i
		};
	});
	const TS_COLUMNS = [
		{ name: 'ts', jsType: 'date' },
		{ name: 'revenue', jsType: 'number' }
	];

	const cases: { name: string; args: RenderArgs; expected?: string[] }[] = [
		{
			name: 'monthly across a year boundary (two-tier)',
			args: {
				width: 640,
				rows: monthlyRows(2019, 6, 12),
				columns: DATE_COLUMNS,
				x: 'month',
				y: 'revenue',
				dateGrain: 'month'
			},
			// Anchored: same array the wide-monthly exact-value test asserts.
			expected: [
				'Jul\n2019',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec',
				'Jan\n2020',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun'
			]
		},
		{
			name: 'daily window (Jun 5 – Jul 1)',
			args: {
				width: 640,
				rows: dailyRows,
				columns: DAY_COLUMNS,
				x: 'day',
				y: 'revenue',
				dateGrain: 'day'
			}
		},
		{
			// Spans US spring-forward (Sun Mar 9, 2025, when 2 am → 3 am in
			// America/New_York). Day-grain ticks land on midnight — never inside
			// the 2-3 am DST gap — so they parse and step cleanly on the local
			// clock and stay identical for every viewer, including the zone that
			// loses an hour that day. The realistic, common case (BI data is
			// mostly daily+); it MUST be invariant.
			name: 'daily across a DST spring-forward (Mar 7–11, 2025)',
			args: {
				width: 640,
				rows: ['2025-03-07', '2025-03-08', '2025-03-09', '2025-03-10', '2025-03-11'].map(
					(day, i) => ({ day, revenue: 100 + i })
				),
				columns: DAY_COLUMNS,
				x: 'day',
				y: 'revenue',
				dateGrain: 'day'
			},
			// Few bars → verbose mode gives every tick full month+day context.
			expected: ['Mar 7', 'Mar 8', 'Mar 9', 'Mar 10', 'Mar 11']
		},
		{
			name: 'hourly window crossing midnight',
			args: {
				width: 640,
				rows: hourlyRows,
				columns: TS_COLUMNS,
				x: 'ts',
				y: 'revenue',
				dateGrain: 'hour'
			}
		}
	];

	for (const c of cases) {
		it(`${c.name}: identical labels in every viewer timezone`, () => {
			const byZone = ZONES.map((tz) => {
				process.env.TZ = tz;
				return { tz, labels: renderAxis(c.args).labels };
			});
			const reference = byZone[0].labels;
			expect(reference.length).toBeGreaterThan(0);
			for (const { tz, labels } of byZone) {
				expect(labels, `TZ=${tz} drifted from ${byZone[0].tz}`).toEqual(reference);
			}
			if (c.expected) expect(reference).toEqual(c.expected);
		});
	}

	// Hour grain across a spring-forward is the one case that is NOT cross-zone
	// identical, and correctly so: the DST-observing viewer's wall clock has no
	// 2 am that day, so grain-walking on the local clock skips it, while a
	// non-DST viewer sees all 24 hours. Each is right for its own zone — the
	// verbatim guarantee is about DATA points, not grain-filled synthetic slots.
	// What must hold for the affected zone: no dropped/duplicated ticks and the
	// skipped hour simply absent (never rendered as a repeat or a phantom).
	it('hourly across NY spring-forward: 2 am is absent, no duplicate labels', () => {
		process.env.TZ = 'America/New_York';
		// A NY-bucketed hourly series jumps 1 am → 3 am on Mar 9, 2025 — there is
		// no 2 am local time. `walkGrainTicks` steps via setHours on the local
		// clock, so the nonexistent hour collapses onto 3 am rather than
		// producing a bogus or duplicate tick.
		const rows = [
			'2025-03-09 00:00:00',
			'2025-03-09 01:00:00',
			'2025-03-09 03:00:00',
			'2025-03-09 04:00:00'
		].map((ts, i) => ({ ts, revenue: 100 + i }));
		const { labels } = renderAxis({
			width: 640,
			rows,
			columns: TS_COLUMNS,
			x: 'ts',
			y: 'revenue',
			dateGrain: 'hour'
		});
		expect(new Set(labels).size).toBe(labels.length); // no duplicates
		expect(labels).toContain('3 am');
		expect(labels).not.toContain('2 am');
	});

	// Offset-bearing ("…Z") data is "same for everyone": the offset is stripped
	// up front (canonicalizeTimeAxisValue for the bar, parseSeriesTimestampMs for
	// the ticks), so a "…04:00:00Z" series is treated EXACTLY like the zoneless
	// "…04:00:00" wall-clock — first bar at 4 am, in every viewer's timezone.
	// This locks in two things at once:
	//   1. Equivalence: the "…Z" series paints identical labels to its zoneless
	//      wall-clock twin (bar, tick, and label all derive from the stripped
	//      value — no drift between them).
	//   2. Invariance: that identical output is the SAME in every timezone (the
	//      offset never leaks a per-viewer conversion into the display).
	// Sparse (≤ CUSTOM_TICK_THRESHOLD) so the pinned-tick regime is exercised.
	it('offset-bearing (…Z) hourly data renders as its verbatim wall-clock, same for everyone', () => {
		const N = 6;
		const utcRows = Array.from({ length: N }, (_, i) => ({
			ts: `2024-06-01T${String(4 + i).padStart(2, '0')}:00:00Z`,
			revenue: 100 + i
		}));
		// Same wall-clock DIGITS as utcRows (04:00…), just with no offset.
		const zonelessRows = Array.from({ length: N }, (_, i) => ({
			ts: `2024-06-01 ${String(4 + i).padStart(2, '0')}:00:00`,
			revenue: 100 + i
		}));
		const base = { width: 640, columns: TS_COLUMNS, x: 'ts', y: 'revenue', dateGrain: 'hour' };

		const byZone = ZONES.map((tz) => {
			process.env.TZ = tz;
			return { tz, labels: renderAxis({ ...base, rows: utcRows }).labels };
		});

		// Invariance: identical painted labels in every timezone.
		const reference = byZone[0].labels;
		expect(reference.length).toBeGreaterThan(0);
		for (const { tz, labels } of byZone) {
			expect(labels, `TZ=${tz} drifted from ${byZone[0].tz}`).toEqual(reference);
		}

		// First bar is the verbatim wall-clock (4 am) — NOT a per-viewer instant.
		expect(reference[0]).toBe('4 am');

		// Equivalence: the "…Z" series paints exactly what its zoneless
		// wall-clock twin does (offset stripped ⇒ same value everywhere).
		process.env.TZ = 'America/New_York';
		const zonelessLabels = renderAxis({ ...base, rows: zonelessRows }).labels;
		expect(renderAxis({ ...base, rows: utcRows }).labels).toEqual(zonelessLabels);
	});
});

/**
 * Stacked charts default to `stacked: true`, so a stacked-by-default area or bar
 * chart on a numeric grain (day of month, …) is coerced to a CATEGORY axis to
 * keep its stacks aligned (stacking sums by data point; a category axis gives
 * every point a discrete, zero-fillable slot). The bug: that category axis used
 * to rotate its 1..31 labels 45°, unlike the same data's line chart (a value
 * axis with clean horizontal ticks). The fix keeps the category axis — so
 * stacking is untouched — but thins the numeric labels HORIZONTALLY instead of
 * rotating them. These tests pin that final rendered behavior.
 */
describe('stacked numeric-grain charts stay on a category axis with horizontal labels', () => {
	const dayOfMonth = (extra: Partial<RenderArgs> = {}): RenderArgs => ({
		width: 940,
		rows: Array.from({ length: 31 }, (_, i) => ({ d: i + 1, revenue: 1000 + i })),
		columns: [
			{ name: 'd', jsType: 'number' },
			{ name: 'revenue', jsType: 'number' }
		],
		x: 'd',
		y: 'revenue',
		dateGrain: 'day of month',
		fmt: 'num0',
		seriesType: 'bar',
		forceCategory: true,
		...extra
	});

	it('never rotates, at any width', () => {
		expect(renderAxis(dayOfMonth({ width: 940 })).rotated).toBe(false);
		expect(renderAxis(dayOfMonth({ width: 360 })).rotated).toBe(false);
	});

	it('shows every day when the axis is wide enough for them all', () => {
		// 31 one/two-digit labels fit horizontally on a 940px axis.
		const { labels, rotated } = renderAxis(dayOfMonth({ width: 940 }));
		expect(rotated).toBe(false);
		expect(labels).toEqual(Array.from({ length: 31 }, (_, i) => String(i + 1)));
	});

	it('thins to horizontal numeric labels when the axis is too narrow for all 31', () => {
		const { labels, rotated } = renderAxis(dayOfMonth({ width: 360 }));
		expect(rotated).toBe(false);
		// All survivors are plain integers (no rotation, no ellipsis).
		expect(labels.every((l) => /^\d+$/.test(l))).toBe(true);
		// Thinned: not all 31 fit, but enough survive to read as a labelled axis.
		expect(labels.length).toBeLessThan(31);
		expect(labels.length).toBeGreaterThan(4);
		// Ascending, matching the data order.
		const nums = labels.map(Number);
		expect([...nums].sort((a, b) => a - b)).toEqual(nums);
	});

	it('a narrower axis thins harder but still stays horizontal', () => {
		const wide = renderAxis(dayOfMonth({ width: 940 }));
		const narrow = renderAxis(dayOfMonth({ width: 360 }));
		expect(narrow.rotated).toBe(false);
		expect(narrow.labels.length).toBeLessThanOrEqual(wide.labels.length);
	});
});
