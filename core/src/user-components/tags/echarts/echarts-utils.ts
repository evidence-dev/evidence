import type { EChartsOption } from 'echarts';
import type { GridComponentOption } from 'echarts/components';
import type { XAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel.js';

const CATEGORY_LABEL_WIDTH_RATIO = 4 / 5;
const AUTO_LABEL_ROTATE = 45;
const AUTO_ROTATED_LABEL_MAX_WIDTH = 180;
const AUTO_ROTATED_LABEL_WIDTH_PADDING = 12;
const AUTO_ROTATED_MIN_PLOT_AREA_HEIGHT = 150;
// A 45°-rotated label line occupies fontSize·√2 of horizontal footprint; the
// extra 2px keeps adjacent rotated labels from kissing.
const ROTATED_LABEL_PITCH_GAP_PX = 2;
// Breathing room between adjacent horizontal category labels when we thin a
// numeric-value category axis (day of month, …) instead of rotating it.
const HORIZONTAL_CATEGORY_LABEL_GAP_PX = 8;

type OptionRecord = Record<string, unknown>;
type AxisLabelOption = OptionRecord & {
	show?: unknown;
	formatter?: unknown;
	fontFamily?: unknown;
	fontSize?: unknown;
	fontStyle?: unknown;
	fontWeight?: unknown;
	margin?: unknown;
	overflow?: unknown;
	rotate?: unknown;
};

let measureCanvas: HTMLCanvasElement | undefined;

const asRecord = (value: unknown): OptionRecord | undefined =>
	value !== null && typeof value === 'object' ? (value as OptionRecord) : undefined;

const firstOption = (value: unknown): OptionRecord | undefined => {
	if (Array.isArray(value)) return asRecord(value[0]);
	return asRecord(value);
};

const getXAxis = (options: EChartsOption): OptionRecord | undefined =>
	firstOption((options as OptionRecord).xAxis);

const getAxisLabel = (axis: OptionRecord | undefined): AxisLabelOption | undefined =>
	asRecord(axis?.axisLabel) as AxisLabelOption | undefined;

const getSeriesArray = (series: unknown): OptionRecord[] => {
	const seriesArray = Array.isArray(series) ? series : [series];
	return seriesArray.map(asRecord).filter((s): s is OptionRecord => Boolean(s));
};

const getCategoryValue = (value: unknown): unknown => {
	if (Array.isArray(value)) return value[0];

	const record = asRecord(value);
	if (!record) return value;

	if (Array.isArray(record.value)) return record.value[0];
	return record.value;
};

const getDistinctXValues = (series: unknown, xAxis: OptionRecord | undefined): unknown[] => {
	const axisData = xAxis?.data;

	// When xAxis.data is explicitly provided it is the authoritative category
	// list — series.data items for non bar/line charts (heatmap uses
	// [xIdx, yIdx, value]) don't carry category strings, and mixing them in
	// pollutes the set with numeric indices that have no relation to the real
	// labels.
	if (Array.isArray(axisData) && axisData.length > 0) {
		return axisData.map((value) => getCategoryValue(value));
	}

	const distinctXValues = new Set<unknown>();
	getSeriesArray(series).forEach((s) => {
		if (!Array.isArray(s.data)) return;
		s.data.forEach((value) => {
			const xValue = getCategoryValue(value);
			if (typeof xValue !== 'undefined') {
				distinctXValues.add(xValue);
			}
		});
	});

	return Array.from(distinctXValues);
};

const formatLabel = (value: unknown, index: number, formatter: unknown): string => {
	if (typeof formatter === 'function') {
		return String((formatter as (value: unknown, index: number) => unknown)(value, index));
	}

	if (typeof formatter === 'string') {
		return formatter.replace(/\{value\}/g, String(value));
	}

	return String(value);
};

const toNumber = (value: unknown, fallback: number): number => {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : fallback;
};

// A category value is "numeric" if it's a finite number or a non-blank string
// that parses to one. Numeric-grain axes (day of month, week of year, …) are
// coerced to a category axis for stacked charts and their x-values arrive as
// numbers or numeric strings; this flags them so their labels thin horizontally
// rather than rotate.
const isNumericValue = (value: unknown): boolean => {
	if (typeof value === 'number') return Number.isFinite(value);
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed !== '' && Number.isFinite(Number(trimmed));
	}
	return false;
};

// Multi-line labels (e.g. two-tier "Jul\n2019" month labels) occupy the width
// of their widest LINE, not the whole string — that's the entire point of
// stacking the year under the month.
const estimateTextWidth = (text: string, axisLabel: AxisLabelOption | undefined): number => {
	const fontSize = toNumber(axisLabel?.fontSize, 12);
	const lines = text.split('\n');

	if (typeof document !== 'undefined') {
		measureCanvas ??= document.createElement('canvas');
		const context = measureCanvas.getContext('2d');

		if (context) {
			const fontStyle = typeof axisLabel?.fontStyle === 'string' ? axisLabel.fontStyle : 'normal';
			const fontWeight =
				typeof axisLabel?.fontWeight === 'string' ? axisLabel.fontWeight : 'normal';
			const fontFamily =
				typeof axisLabel?.fontFamily === 'string' ? axisLabel.fontFamily : 'sans-serif';
			context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

			return Math.max(...lines.map((line) => context.measureText(line).width));
		}
	}

	return Math.max(...lines.map((line) => line.length * fontSize * 0.58));
};

const getSourceOverflow = (axisLabel: AxisLabelOption | undefined) =>
	axisLabel?.overflow ?? 'truncate';

const parseGridSize = (value: unknown, chartSize: number): number => {
	if (typeof value === 'string' && value.trim().endsWith('%')) {
		const percent = Number(value.trim().slice(0, -1));
		return Number.isFinite(percent) ? (chartSize * percent) / 100 : 0;
	}

	return toNumber(value, 0);
};

const getRotatedLabelHeight = (
	axisLabel: AxisLabelOption | undefined,
	labelWidth: number
): number => {
	const fontSize = toNumber(axisLabel?.fontSize, 12);
	const rotateRadians = (AUTO_LABEL_ROTATE * Math.PI) / 180;

	return Math.sin(rotateRadians) * labelWidth + Math.cos(rotateRadians) * fontSize;
};

const getGridBounds = (
	options: EChartsOption,
	node: HTMLDivElement,
	currentExtraHeight: number
) => {
	const grid = firstOption((options as OptionRecord).grid);
	const chartHeight = Math.max(0, (node?.clientHeight ?? 0) - currentExtraHeight);

	return {
		bottom: parseGridSize(grid?.bottom, chartHeight),
		top: parseGridSize(grid?.top, chartHeight),
		chartHeight
	};
};

const getAutoGridBottom = (
	baseBottom: number,
	axisLabel: AxisLabelOption | undefined,
	labelWidth: number
): number => {
	const fontSize = toNumber(axisLabel?.fontSize, 12);

	return Math.ceil(
		baseBottom + Math.max(0, getRotatedLabelHeight(axisLabel, labelWidth) - fontSize)
	);
};

const getRequiredExtraHeight = (chartHeight: number, gridTop: number, gridBottom: number): number =>
	Math.max(0, gridTop + gridBottom + AUTO_ROTATED_MIN_PLOT_AREA_HEIGHT - chartHeight);

const updateFirstOption = (value: unknown, update: OptionRecord): unknown => {
	if (Array.isArray(value)) {
		const [first, ...rest] = value;
		return [{ ...asRecord(first), ...update }, ...rest];
	}

	return { ...asRecord(value), ...update };
};

/**
 * Applies x-axis category label layout before ECharts renders.
 *
 * The category label matrix (X_AXIS_SPEC.md § 6):
 *
 * - **Fits** (widest label ≤ its slot budget): every label renders
 *   horizontal and whole. No width clamp — horizontal category labels are
 *   never ellipsized, because a mid-width band where labels truncate before
 *   the rotate breakpoint reads as arbitrary.
 * - **Doesn't fit, numeric-value category** (a stacked day-of-month/week-of-year
 *   chart coerced to category): stay horizontal and thin uniformly (show every
 *   k-th) so the axis matches the tidy value-axis look of its line-chart twin.
 * - **Doesn't fit, string category**: rotate 45°, clamp at
 *   AUTO_ROTATED_LABEL_MAX_WIDTH with ellipsis + hover tooltip, and grow the
 *   bottom gutter (extraHeight). When slots are narrower than a rotated line's
 *   footprint, thin uniformly instead of letting hideOverlap pick arbitrary
 *   victims.
 *
 * User `rotate` / `overflow: 'break'` (label_wrap) opt out of the automatic
 * branch entirely.
 *
 * @param options The component-provided ECharts options
 * @param node The HTML element containing the chart
 * @param currentExtraHeight Extra height already added by the chart wrapper
 */
export const withAutoXAxisLabelLayout = (
	options: EChartsOption,
	node: HTMLDivElement,
	currentExtraHeight = 0
): { options: EChartsOption; extraHeight: number } => {
	const { series } = options;
	if (!series) return { options, extraHeight: 0 };

	const xAxis = getXAxis(options);
	if (xAxis?.type !== 'category') return { options, extraHeight: 0 };
	// This helper only knows how to budget vertical space *below* the chart
	// (rotate labels into the bottom gutter, request extraHeight to keep the
	// plot area tall enough). For top-positioned axes that's the wrong
	// dimension — padding grid.bottom would collide with whatever else lives
	// there (e.g. heatmap's visualMap legend) and the reported extraHeight
	// would inflate the wrapper for no visible benefit.
	if (xAxis.position === 'top') return { options, extraHeight: 0 };

	const distinctXValues = getDistinctXValues(series, xAxis);
	if (distinctXValues.length === 0) return { options, extraHeight: 0 };

	const clientWidth = node?.clientWidth ?? 0;
	const labelWidth = (clientWidth * CATEGORY_LABEL_WIDTH_RATIO) / distinctXValues.length;
	const axisLabel = getAxisLabel(xAxis);
	const labelsVisible = axisLabel?.show !== false;
	const hasUserRotate = typeof axisLabel?.rotate !== 'undefined';
	const isWrapping = axisLabel?.overflow === 'break';
	const formattedLabels = distinctXValues.map((value, index) =>
		formatLabel(value, index, axisLabel?.formatter)
	);
	const labelWidths = formattedLabels.map((label) => estimateTextWidth(label, axisLabel));
	if (labelWidths.length === 0) return { options, extraHeight: 0 };

	const maxLabelWidth = Math.max(...labelWidths);
	const overflowsSlots =
		labelsVisible && !hasUserRotate && !isWrapping && maxLabelWidth > labelWidth;

	// Numeric-value category axes (a stacked "day of month"/"week of year" bar or
	// area chart, coerced to category so its stacks stay aligned) read cleanly
	// horizontally — thin to every k-th label instead of rotating, so they match
	// the tidy look of the same grain's non-stacked line chart (a value axis).
	// String categories still rotate: skipping labels to abbreviate arbitrary
	// text is more confusing than tilting it.
	const isNumericCategory = distinctXValues.every(isNumericValue);
	const shouldAutoRotate = overflowsSlots && !isNumericCategory;
	const shouldThinHorizontal = overflowsSlots && isNumericCategory;

	const gridBounds = getGridBounds(options, node, currentExtraHeight);
	const effectiveLabelWidth = shouldAutoRotate
		? Math.min(maxLabelWidth + AUTO_ROTATED_LABEL_WIDTH_PADDING, AUTO_ROTATED_LABEL_MAX_WIDTH)
		: labelWidth;
	const autoGridBottom = shouldAutoRotate
		? getAutoGridBottom(gridBounds.bottom, axisLabel, effectiveLabelWidth)
		: undefined;
	const extraHeight = autoGridBottom
		? getRequiredExtraHeight(gridBounds.chartHeight, gridBounds.top, autoGridBottom)
		: 0;

	// Thin uniformly (show every k-th) so the survivors keep a steady rhythm
	// instead of letting ECharts' greedy hideOverlap pick arbitrary victims.
	// Rotated labels stack diagonally, so each only needs fontSize·√2 of pitch;
	// horizontal labels need the full widest-label width plus a small gap.
	const fontSize = toNumber(axisLabel?.fontSize, 12);
	const rotatedPitch = fontSize * Math.SQRT2 + ROTATED_LABEL_PITCH_GAP_PX;
	const labelInterval = shouldAutoRotate
		? Math.max(0, Math.ceil(rotatedPitch / labelWidth) - 1)
		: shouldThinHorizontal
			? Math.max(0, Math.ceil((maxLabelWidth + HORIZONTAL_CATEGORY_LABEL_GAP_PX) / labelWidth) - 1)
			: 0;

	return {
		extraHeight,
		options: {
			...options,
			grid: autoGridBottom
				? (updateFirstOption((options as OptionRecord).grid, {
						bottom: autoGridBottom
					}) as GridComponentOption | GridComponentOption[])
				: options.grid,
			xAxis: updateFirstOption((options as OptionRecord).xAxis, {
				axisLabel: {
					...axisLabel,
					interval: labelInterval,
					rotate: shouldAutoRotate ? AUTO_LABEL_ROTATE : (axisLabel?.rotate ?? 0),
					// Width (ECharts' truncation/wrap trigger) is only set where the
					// matrix calls for it: the rotated ellipsis cap, or the slot
					// budget when the user opted into wrapping. Horizontal labels
					// get no width, so they can never ellipsize — the fits/rotates
					// branch above is the only fit decision.
					...(shouldAutoRotate
						? {
								width: effectiveLabelWidth,
								overflow: 'truncate',
								margin: 8,
								hideOverlap: false
							}
						: isWrapping
							? { width: labelWidth, overflow: getSourceOverflow(axisLabel) }
							: {})
				}
			}) as XAXisOption | XAXisOption[]
		}
	};
};

// Minimum horizontal gap between adjacent labels in pixels. Kept tight so we
// don't thin more aggressively than necessary; ECharts already reserves a bit
// of internal padding around each label glyph.
const MIN_TIME_LABEL_GAP_PX = 8;

/**
 * Thin `axisLabel.customValues` on a time axis when the labels no longer fit
 * horizontally. Time axes never auto-rotate — for every mark type, bars
 * included: on a time axis a bar is a time bucket, not a category, so readers
 * interpolate unlabeled ticks the same way they do on a line, and rotated
 * labels are ~52% slower to read (Wigdor & Balakrishnan 2005; Datawrapper and
 * Storytelling with Data both avoid them on time axes). Two-tier month labels
 * stay horizontal and thin instead, keeping one visual grammar across bar,
 * line, and area charts. (Category axes — true categorical bars — still
 * rotate via `withAutoXAxisLabelLayout`.)
 *
 * Stride thinning keeps every k-th tick (smallest k that fits the width
 * budget), giving the axis a steady calendar rhythm — "Feb, Apr, Jun, Aug" —
 * rather than the irregular clusters a greedy closest-fit pick produces.
 *
 * Always preserved: the first and last customValues (strongest orientation
 * context) and any two-tier label carrying a year line ("Jan\n2020") —
 * dropping a year rollover would orphan the reader's sense of which year the
 * surrounding months belong to. Stride picks landing within half a stride of
 * a preserved anchor are dropped so anchors never gain adjacent siblings.
 */
export const withAutoTimeAxisLabelThinning = (
	options: EChartsOption,
	node: HTMLDivElement
): { options: EChartsOption } => {
	const xAxis = getXAxis(options);
	if (xAxis?.type !== 'time') return { options };

	const axisLabel = getAxisLabel(xAxis);
	const customValues = axisLabel?.customValues;
	if (!Array.isArray(customValues) || customValues.length <= 2) {
		return { options };
	}

	// Only touch when values are numeric ms timestamps — matches what
	// XAxisModel emits via `seriesTimestamps`. Anything else is a caller
	// customization we shouldn't second-guess.
	const numericValues = customValues.filter((v): v is number => typeof v === 'number');
	if (numericValues.length !== customValues.length) return { options };

	const clientWidth = node?.clientWidth ?? 0;
	if (clientWidth <= 0) return { options };

	// Format each value to its rendered label and measure the widest one —
	// that's the constraint the thinning has to respect. Using the max
	// (not mean) avoids the "everything fit on average, but the two-line
	// year-rollover label collides with its neighbor" case.
	const formatter = axisLabel?.formatter;
	const formattedLabels = numericValues.map((v, i) => formatLabel(v, i, formatter));
	const maxLabelWidth = Math.max(...formattedLabels.map((l) => estimateTextWidth(l, axisLabel)));
	if (!Number.isFinite(maxLabelWidth) || maxLabelWidth <= 0) {
		return { options };
	}

	// Plot area = container minus grid.left/right padding. Approximate — we
	// don't care about single-pixel accuracy, just about whether the labels
	// fit.
	const grid = firstOption((options as OptionRecord).grid);
	const gridLeft = parseGridSize(grid?.left, clientWidth);
	const gridRight = parseGridSize(grid?.right, clientWidth);
	const plotWidth = Math.max(0, clientWidth - gridLeft - gridRight);
	if (plotWidth <= 0) return { options };

	const horizontalPerLabelBudget = maxLabelWidth + MIN_TIME_LABEL_GAP_PX;
	const maxLabelsThatFitHorizontal = Math.max(2, Math.floor(plotWidth / horizontalPerLabelBudget));

	// Case 1: everything fits horizontally, no changes needed.
	if (maxLabelsThatFitHorizontal >= numericValues.length) {
		return { options };
	}

	// Case 2: stride-based thinning.
	//
	// Pick every k-th datapoint (k = smallest stride that fits the budget),
	// anchored at the first tick. A fixed stride gives the axis a steady
	// calendar rhythm — "Feb, Apr, Jun, Aug" — where the previous
	// closest-to-pixel-target selection produced runs of adjacent labels
	// with irregular skips ("Mar, Apr, Jun, Jul, Aug, Sep, Nov") on gappy
	// or forced-anchor data.
	//
	// Forced anchors are always kept: the last tick and every two-tier year
	// label ("Jan\n2020") — dropping a year rollover orphans the reader's
	// sense of which year the surrounding ticks belong to. Stride picks
	// closer than half a stride to a forced anchor are dropped, so an anchor
	// never gains an adjacent sibling ("... Oct, Dec, Jan 2025" yields to
	// "... Oct, Jan 2025") while picks a comfortable distance away survive.
	const sorted = [...numericValues].sort((a, b) => a - b);
	const n = sorted.length;
	const sortedLabels = sorted.map((v, i) => formatLabel(v, i, formatter));
	const stride = Math.ceil((n - 1) / (maxLabelsThatFitHorizontal - 1));
	const tooClose = Math.ceil(stride / 2);

	const forced = new Set<number>([0, n - 1]);
	sortedLabels.forEach((label, i) => {
		if (label.includes('\n')) forced.add(i);
	});

	const picked = new Set<number>(forced);
	for (let i = 0; i < n; i += stride) {
		if (forced.has(i)) continue;
		const nearForced = [...forced].some((f) => Math.abs(i - f) <= tooClose);
		if (!nearForced) picked.add(i);
	}

	const thinned = Array.from(picked)
		.sort((a, b) => a - b)
		.map((i) => sorted[i]);

	return {
		options: {
			...options,
			xAxis: updateFirstOption((options as OptionRecord).xAxis, {
				axisLabel: {
					...axisLabel,
					customValues: thinned
				}
			}) as XAXisOption | XAXisOption[]
		}
	};
};
