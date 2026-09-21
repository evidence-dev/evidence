import type { WaterfallStep } from './waterfall-data';

/**
 * Sizing contract for waterfall bars.
 *
 * Bars take a fixed share of their category slot so the connector between two
 * bars always has visible length, and are capped at the same max width as the
 * bar_chart family so a three-bar bridge on a wide page doesn't turn into slabs.
 */
export const BAR_WIDTH_RATIO = 0.68;
export const BAR_MAX_WIDTH_PX = 60;
/** A zero change still draws a hairline at its running-total level. */
export const MIN_BAR_HEIGHT_PX = 1;

/**
 * Connector hairline. Sub-pixel so it reads as a guide, not a bar edge, on
 * both 1x (anti-aliased, faint) and 2x (crisp 1–2 device px) displays.
 */
export const CONNECTOR_WIDTH_PX = 0.75;
export const CONNECTOR_ALPHA = 0.5;

export const LABEL_FONT_SIZE = 11;
/** Vertical gap between a bar's free end and its value label. */
export const LABEL_GAP_PX = 4;
/** Air on either side of a label before it counts as colliding with its neighbour. */
export const LABEL_MIN_SIDE_PADDING_PX = 3;

export function resolveBarWidth(slotWidthPx: number): number {
	if (!Number.isFinite(slotWidthPx) || slotWidthPx <= 0) return 0;
	return Math.min(slotWidthPx * BAR_WIDTH_RATIO, BAR_MAX_WIDTH_PX);
}

/**
 * Labels are all-or-nothing: hiding only the ones that collide reads as
 * missing data. They stay when the widest label fits inside one slot.
 */
export function labelsFit(maxLabelWidthPx: number, slotWidthPx: number): boolean {
	if (!Number.isFinite(slotWidthPx) || slotWidthPx <= 0) return false;
	return maxLabelWidthPx + 2 * LABEL_MIN_SIDE_PADDING_PX <= slotWidthPx;
}

/**
 * A label sits at the bar's free end: above when the bar ends higher than it
 * starts (increases, positive totals), below when it ends lower.
 */
export function labelPlacement(step: Pick<WaterfallStep, 'start' | 'end'>): 'above' | 'below' {
	return step.end >= step.start ? 'above' : 'below';
}

/** Pixels a below-bar label needs between the bar's low end and the axis line. */
export const belowLabelRoomPx = (fontSize: number): number => fontSize + LABEL_GAP_PX + 2;
export const BELOW_LABEL_ROOM_PX = belowLabelRoomPx(LABEL_FONT_SIZE);

/**
 * Axis floor (in data units) needed so that no label drawn below a bar can
 * reach the axis line. Returns undefined when the natural floor already
 * leaves room — the common case — so the axis stays untouched and the chart
 * gutter matches every other chart. Keeping the fix inside the plot, rather
 * than growing the gutter, means side-by-side charts keep aligned baselines
 * whether or not their data happens to include a decrease.
 */
export function requiredAxisFloor(args: {
	steps: readonly Pick<WaterfallStep, 'start' | 'end'>[];
	extentMin: number;
	extentMax: number;
	plotHeightPx: number;
	/** Room a label needs; defaults to the built-in label size. */
	labelRoomPx?: number;
}): number | undefined {
	const { extentMin, extentMax, plotHeightPx, labelRoomPx = BELOW_LABEL_ROOM_PX } = args;
	const span = extentMax - extentMin;
	if (!(span > 0) || !(plotHeightPx > 0)) return undefined;

	const belowEnds = args.steps.filter((s) => labelPlacement(s) === 'below').map((s) => s.end);
	if (belowEnds.length === 0) return undefined;

	const roomUnits = (labelRoomPx / plotHeightPx) * span;
	const floor = Math.min(...belowEnds) - roomUnits;
	return floor < extentMin ? floor : undefined;
}

type Rec = Record<string, unknown>;
const asRecord = (value: unknown): Rec =>
	value && typeof value === 'object' ? (value as Rec) : {};

/**
 * The bars are drawn by a custom renderItem, so ECharts never reads the
 * series-level `itemStyle` / `label` / `lineStyle` an author passes through
 * `echarts_series_options`. These pick those keys up and translate them to
 * zrender element styles, so the escape hatch behaves like it does on bar_chart.
 */
export interface SeriesStyleOverrides {
	bar: Rec;
	label: Rec;
	labelShow: boolean;
	/** ECharts' `label.color: 'inherit'` — each label takes its bar's color. */
	labelInherit: boolean;
	labelFontSize: number | undefined;
	connector: Rec;
	barRadius: number | number[] | undefined;
}

export function resolveSeriesStyleOverrides(
	seriesOptions: Record<string, unknown> | undefined
): SeriesStyleOverrides {
	const itemStyle = asRecord(seriesOptions?.itemStyle);
	const label = asRecord(seriesOptions?.label);
	const lineStyle = asRecord(seriesOptions?.lineStyle);

	const bar: Rec = {};
	if (itemStyle.color !== undefined) bar.fill = itemStyle.color;
	if (itemStyle.opacity !== undefined) bar.opacity = itemStyle.opacity;
	if (itemStyle.borderColor !== undefined) bar.stroke = itemStyle.borderColor;
	if (itemStyle.borderWidth !== undefined) bar.lineWidth = itemStyle.borderWidth;
	if (itemStyle.borderType === 'dashed') bar.lineDash = [4, 4];
	if (itemStyle.borderType === 'dotted') bar.lineDash = [1, 3];

	const labelInherit = label.color === 'inherit';
	const labelStyle: Rec = {};
	for (const key of ['color', 'fontSize', 'fontWeight', 'fontFamily', 'fontStyle', 'opacity']) {
		if (label[key] === undefined || (key === 'color' && labelInherit)) continue;
		labelStyle[key === 'color' ? 'fill' : key] = label[key];
	}

	const connector: Rec = {};
	if (lineStyle.color !== undefined) connector.stroke = lineStyle.color;
	if (lineStyle.width !== undefined) connector.lineWidth = lineStyle.width;
	if (lineStyle.opacity !== undefined) connector.opacity = lineStyle.opacity;
	if (lineStyle.type === 'dashed') connector.lineDash = [4, 4];
	if (lineStyle.type === 'dotted') connector.lineDash = [1, 3];
	if (Array.isArray(lineStyle.type)) connector.lineDash = lineStyle.type;

	const radius = itemStyle.borderRadius;
	return {
		bar,
		label: labelStyle,
		labelShow: label.show !== false,
		labelInherit,
		labelFontSize: typeof label.fontSize === 'number' ? label.fontSize : undefined,
		connector,
		barRadius:
			typeof radius === 'number' || Array.isArray(radius)
				? (radius as number | number[])
				: undefined
	};
}

/**
 * Theme bar radius rounds only a bar's free end — the end that isn't butted up
 * against the connector level it grew from. Returned as [tl, tr, br, bl].
 */
export function barCornerRadius(
	step: Pick<WaterfallStep, 'start' | 'end'>,
	radius: number
): [number, number, number, number] {
	if (!radius || radius <= 0) return [0, 0, 0, 0];
	return labelPlacement(step) === 'above' ? [radius, radius, 0, 0] : [0, 0, radius, radius];
}
