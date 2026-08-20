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
 * Shared END-TO-END axis-label rendering harness.
 *
 * Runs the REAL `XAxisModel` → assembled ECharts option → the REAL width-aware
 * layout helpers → ECharts' server-side SVG renderer, then reads back exactly
 * which `<text>` labels ECharts painted (and whether they were rotated). This
 * is the ground-truth surface both `x-axis-rendered-labels.test.ts` (scenario
 * deep-dives) and `x-axis-label-matrix.test.ts` (the exhaustive type × grain ×
 * density × span × width matrix) assert against.
 *
 * Fidelity caveat: in Node our label measurement uses the char-count fallback
 * (no canvas) and ECharts uses its built-in measurer, so thin/rotate
 * *breakpoints* can sit a few pixels off from a browser with Geist loaded. The
 * decisions are deterministic — any change to what renders at a given width
 * fails loudly.
 */

export interface RenderArgs {
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

export function makeXAxisModel(args: RenderArgs): XAxisModel {
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
export const X_AXIS_FONT_SIZE = 12;

/** Mirrors the ComboChart pieces the axis pipeline depends on (grid budget, title graphic, series shape). */
function coerceToCategory(axisConfig: EChartsOption['xAxis']): EChartsOption['xAxis'] {
	// Same override ComboChart applies to stacked non-time charts.
	const { boundaryGap: _b, min: _min, max: _max, ...rest } = axisConfig as Record<string, unknown>;
	return { ...rest, type: 'category' } as EChartsOption['xAxis'];
}

function assembleOptions(model: XAxisModel, args: RenderArgs): EChartsOption {
	const titleVisible = Boolean(args.title);
	// Mirror seriesConfig.formatXValue EXACTLY so the series data the harness
	// feeds ECharts matches production: a date column on a real time axis gets
	// its UTC offset stripped (canonicalizeTimeAxisValue); a numeric CATEGORY
	// axis stringifies its values; everything else (strings, value-axis numbers)
	// passes through untouched. Getting this wrong (e.g. canonicalizing a string
	// category) would fabricate labels production never produces.
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

export interface RenderedAxis {
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
export function renderAxis(args: RenderArgs): RenderedAxis {
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

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` (local wall-clock, no offset) `count` days from a start. */
export function isoDate(year: number, month0: number, day: number): string {
	const d = new Date(year, month0, day);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `count` consecutive month-start rows on a date column named `x`. */
export const monthlyRows = (startYear: number, startMonth0: number, count: number) =>
	Array.from({ length: count }, (_, i) => {
		const y = startYear + Math.floor((startMonth0 + i) / 12);
		const mo = (startMonth0 + i) % 12;
		return { x: `${y}-${pad(mo + 1)}-01`, y: 100 + i * 10 };
	});

/** `count` rows stepped by `stepDays` on a date column named `x`. */
export const dailyRows = (startYear: number, startMonth0: number, count: number, stepDays = 1) =>
	Array.from({ length: count }, (_, i) => {
		const d = new Date(startYear, startMonth0, 1 + i * stepDays);
		return { x: isoDate(d.getFullYear(), d.getMonth(), d.getDate()), y: 100 + i };
	});

/** `count` hourly rows on a date column named `x`, starting at a wall-clock hour. */
export const hourlyRows = (
	startYear: number,
	startMonth0: number,
	startDay: number,
	startHour: number,
	count: number
) =>
	Array.from({ length: count }, (_, i) => {
		const d = new Date(startYear, startMonth0, startDay, startHour + i);
		return {
			x: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00:00`,
			y: 100 + i
		};
	});

/** `count` quarter-start rows on a date column named `x`, from a starting quarter. */
export const quarterlyRows = (startYear: number, startQuarter0: number, count: number) =>
	Array.from({ length: count }, (_, i) => {
		const q = startQuarter0 + i;
		const y = startYear + Math.floor(q / 4);
		const mo = (q % 4) * 3;
		return { x: `${y}-${pad(mo + 1)}-01`, y: 100 + i * 10 };
	});

/** `count` year-start rows on a date column named `x`. */
export const yearlyDateRows = (startYear: number, count: number) =>
	Array.from({ length: count }, (_, i) => ({ x: `${startYear + i}-01-01`, y: 100 + i }));

/** Integer rows on a number column named `x` (for value/category numeric grains). */
export const intRows = (start: number, count: number, step = 1) =>
	Array.from({ length: count }, (_, i) => ({ x: start + i * step, y: 100 + i }));

/** String category rows on a string column named `x`. */
export const stringRows = (values: string[]) => values.map((v, i) => ({ x: v, y: 100 + i }));

export const DATE_COL = [
	{ name: 'x', jsType: 'date' },
	{ name: 'y', jsType: 'number' }
];
export const NUMBER_COL = [
	{ name: 'x', jsType: 'number' },
	{ name: 'y', jsType: 'number' }
];
export const STRING_COL = [
	{ name: 'x', jsType: 'string' },
	{ name: 'y', jsType: 'number' }
];
