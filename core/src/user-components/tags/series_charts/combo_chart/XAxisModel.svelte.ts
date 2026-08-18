import { formatValue, parseSeriesTimestampMs } from '../../../formatValue';
import { getMinMax } from '../../../getMinMax';
import type { GraphicComponentOption } from 'echarts';
import type { XAXisOption } from 'echarts/types/src/coord/cartesian/AxisModel.js';
import { mode } from 'mode-watcher';
import { TWO_TIER_LABEL_LINE_HEIGHT, X_AXIS_FONT_SIZE } from './constants';
import formatTitle from '../../../formatTitle';
import { z } from 'zod';
import { xAxisOptionsSchema } from './x-axis-options-schema';
import { SvelteDate } from 'svelte/reactivity';
import type { YAxisModel } from './YAxisModel.svelte';
import { getThemeContext } from '../../../../theme/theme.context.svelte';
import { getCardContext } from '../../../common/card-context.svelte';
import { getThemeToken } from '../../../../theme/get-theme-token';
import { coerceBoolean, coerceNumber } from '../../../common/process-variables';
import { escapeHtml } from '../../../common/tooltip-fields';
import {
	getDefaultFormatForDateGrain,
	isCategoryAxisGrain,
	type DateGrain
} from '../../../common/date-options';
import {
	formatTimeAxisLabel,
	formatTimeAxisTooltip,
	type TimeAxisGrain
} from './format-time-axis-label';
import {
	MULTI_YEAR_SPAN_MS,
	asTimeAxisGrain,
	buildTickStrategy,
	coerceAxisValue,
	computeTimeDataRangeMs,
	convertTimeUnitToMs,
	isNonTemporalNumericGrain,
	makeNonNegativeValueAxisMin,
	makeFitToDataValueAxisMax,
	makeIntegerSlotBounds,
	isOutsideDataRange,
	isYearLikeDomain,
	resolveAxisType,
	resolveTimeAxisGrain,
	type TickStrategy
} from './x-axis-rules';

export type XAxisOptions = z.input<typeof xAxisOptionsSchema> & {
	fmt?: string;
	x: string;
	date_grain?: string;
	firstDayOfWeek?: 'sunday' | 'monday';
};

/**
 * Extract the calendar year from any shape a `year`-grain x-value arrives in: a
 * bare integer year column (2015), a truncated date string ("2015-01-01"), a
 * Date, or epoch ms. Returns undefined when the value can't be read as a year,
 * so the caller can fall back to its generic formatter. A small-integer value is
 * treated as the year itself (never an epoch/serial), which is what a
 * `date_grain='year'` on a numeric column always means.
 */
function extractYear(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		if (value >= 1000 && value <= 9999) return Math.trunc(value);
		return new Date(value).getFullYear();
	}
	if (value instanceof Date) return value.getFullYear();
	if (typeof value === 'string') {
		const ms = parseSeriesTimestampMs(value);
		if (!isNaN(ms)) return new Date(ms).getFullYear();
	}
	return undefined;
}

/**
 * Everything the axis pipeline derives from the query result + options, in one
 * place. Both `axisConfig` and the formatter derive from this analysis so
 * there is no read-order dependency between them (a formatter read before an
 * axisConfig read sees the same, current analysis).
 */
interface XAxisAnalysis {
	jsType: string | undefined;
	type: ReturnType<typeof resolveAxisType>;
	/** Coerced user min/max with data-range fallback (formatter context). */
	min: number | null;
	max: number | null;
	dataMinMs: number | undefined;
	timeAxisGrain: TimeAxisGrain | undefined;
	compactYearRollover: boolean;
	/** Data min and max fall in different calendar years (time axes only). */
	spansMultipleYears: boolean;
	ticks: TickStrategy;
}

export class XAxisModel {
	readonly options: XAxisOptions;

	constructor(
		readonly optionsGetter: () => XAxisOptions,
		readonly yAxesGetter: () => { y1: YAxisModel; y2: YAxisModel },
		// Extra CSS appended to the axis-label tooltip's `extraCssText`. The chart
		// passes the floating-chat elevation here so in-pane label tooltips clear
		// the pane; '' (default) keeps ECharts' page/editor stacking.
		readonly elevatedTooltipCssGetter: () => string = () => ''
	) {
		this.options = $derived(this.optionsGetter());
	}

	get title() {
		if (typeof this.options.title !== 'undefined') {
			return this.options.title;
		}
		// Auto-derived from the column name so tooltips and other consumers still get
		// a human-readable label. The visual chart-title graphic is gated separately
		// on `isTitleVisible` — auto-derived titles are hidden by default there.
		return formatTitle(this.options.x);
	}

	// Whether the axis title GRAPHIC should render on the chart. Auto-derived
	// column-name titles read as visual noise on most charts, so they don't paint
	// by default — but they're still available via `.title` for tooltips and
	// exports. Two ways to opt back in: set `title = "..."` explicitly, or set
	// `show_title = true` to render the auto-derived value. Explicit `title = ""`
	// is always an explicit hide.
	get isTitleVisible() {
		if (typeof this.options.title === 'string') return this.options.title !== '';
		return coerceBoolean(this.options.show_title) ?? false;
	}

	// True when the axis renders two-tier labels (month/quarter name with the
	// year on a second line — see formatTimeAxisLabel). The chart uses this to
	// budget an extra label line of grid.bottom; without it the year row lands
	// on the axis title / clips at the container edge.
	get hasTwoTierLabels() {
		const analysis = this.#analysis;
		if (!analysis || analysis.type !== 'time' || this.options.fmt) return false;
		if ((coerceBoolean(this.options.labels) ?? true) === false) return false;
		const grain = analysis.timeAxisGrain;
		if (grain !== 'month' && grain !== 'quarter') return false;
		// Two-tier only exists on a within-~1-year axis that crosses a calendar
		// boundary (so a year line actually appears). A single-calendar-year axis
		// drops the year entirely, and a multi-year span (compactYearRollover)
		// renders single-line year-anchored — neither needs the extra year-line
		// gutter, so reserving it would just leave dead space below the labels.
		return analysis.spansMultipleYears && !analysis.compactYearRollover;
	}

	// Get the first available series' query result for x-axis calculations
	// All series share the same x-axis, so any series' data is valid
	private get firstSeriesQueryResult() {
		const allSeries = Object.values(this.yAxesGetter()).flatMap((axis) => axis.series);
		return allSeries[0]?.query?.result;
	}

	// Without this the axis takes slot order from row order, stranding values a later series adds.
	private get categoryDomain(): (string | number)[] | undefined {
		if (!isCategoryAxisGrain(this.options.date_grain)) return undefined;

		const sortKeys = new Map<string | number, number>();
		const allSeries = Object.values(this.yAxesGetter()).flatMap((axis) => axis.series);
		for (const series of allSeries) {
			for (const row of series.query?.result?.rows ?? []) {
				const value = row[this.options.x];
				if (typeof value !== 'string' && typeof value !== 'number') return undefined;
				const key = coerceNumber(value) ?? parseSeriesTimestampMs(String(value));
				if (!Number.isFinite(key)) return undefined;
				sortKeys.set(value, key);
			}
		}
		if (sortKeys.size === 0) return undefined;

		return [...sortKeys.entries()]
			.sort(([, a], [, b]) => a - b)
			.map(([value]) => (typeof value === 'number' ? String(value) : value));
	}

	// Sorted, deduped x-timestamps across every series on this axis. Drives
	// grain inference and the pinned-tick (`customValues`) path — see
	// X_AXIS_SPEC.md § 2-3. Includes line and scatter series alongside bars:
	// a weekly line chart with 2 points 7 days apart otherwise gets 8
	// day-boundary ticks from ECharts, none of which land on real data.
	private get seriesTimestamps(): number[] | undefined {
		const xField = this.options.x;
		const timestamps = new Set<number>();
		const allSeries = Object.values(this.yAxesGetter()).flatMap((axis) => axis.series);
		for (const series of allSeries) {
			const rows = series.query?.result?.rows;
			if (!rows) continue;
			for (const row of rows) {
				const raw = row[xField];
				let ms: number | undefined;
				if (raw instanceof Date) ms = raw.getTime();
				else if (typeof raw === 'number') ms = raw;
				else if (typeof raw === 'string') {
					// Must match the parse path used by `computeTimeDataRangeMs`,
					// the tooltip formatter, AND how ECharts positions the bar
					// (`canonicalizeTimeAxisValue`): `parseSeriesTimestampMs` strips
					// any UTC offset and reads the wall-clock digits as local. Any
					// mismatch puts customValues on a different clock than the
					// bars/axis-min, and ECharts silently drops customValues entries
					// outside the axis range (ticks vanish).
					const parsed = parseSeriesTimestampMs(raw);
					if (!isNaN(parsed)) ms = parsed;
				}
				if (ms !== undefined) timestamps.add(ms);
			}
		}
		if (timestamps.size === 0) return undefined;
		return Array.from(timestamps).sort((a, b) => a - b);
	}

	// The axis pipeline (X_AXIS_SPEC.md § 1-3): axis type → effective grain →
	// tick strategy, all via the pure rules in x-axis-rules.ts. `axisConfig`
	// and `#formatter` both derive from this, so neither depends on the other
	// having run first.
	readonly #analysis = $derived.by((): XAxisAnalysis | undefined => {
		const result = this.firstSeriesQueryResult;
		if (!result) return undefined;

		// `result` can be a partially-populated QueryResult mid-load (columns or
		// rows not yet attached). Guard both — an unguarded `.find`/iteration
		// here surfaces as "Cannot read properties of undefined" crashes.
		const rows = result.rows ?? [];
		const jsType = result.columns?.find((c) => c.name === this.options.x)?.jsType;
		const type = resolveAxisType(jsType, this.options.date_grain);

		const range = getMinMax(rows, this.options.x);
		const min = coerceAxisValue(this.options.min, type) ?? range.min;
		const max = coerceAxisValue(this.options.max, type) ?? range.max;

		// `getMinMax` coerces via `Number()` which NaNs on ISO date strings, so
		// time axes re-derive their ms range with date-aware parsing. Used by the
		// label formatter to identify the first *visible* tick (ECharts sometimes
		// places a phantom padding tick at index 0) and by the grain walker.
		const { dataMinMs, dataMaxMs } =
			type === 'time'
				? computeTimeDataRangeMs(rows, this.options.x)
				: { dataMinMs: undefined, dataMaxMs: undefined };
		const dataSpanMs =
			dataMinMs !== undefined && dataMaxMs !== undefined ? dataMaxMs - dataMinMs : undefined;

		const timestamps = type === 'time' ? this.seriesTimestamps : undefined;
		const timeAxisGrain = resolveTimeAxisGrain({
			isTimeAxis: type === 'time',
			dateGrain: this.options.date_grain,
			timestamps,
			dataSpanMs
		});

		// Year-rollover label style: compact "2025" as a rhythmic separator on
		// multi-year charts, verbose "Jan 2025" as a point-in-time on shorter
		// ones. (spec § 5)
		const compactYearRollover =
			type === 'time' && dataSpanMs !== undefined && dataSpanMs >= MULTI_YEAR_SPAN_MS;

		// Does the data straddle a calendar-year boundary? When every tick is in
		// the same year the year is constant context — month/quarter labels drop
		// it (spec § 5). A boundary crossing (Jul 2024 – Jun 2025) turns it back
		// on. Compared on the offset-stripped ms range so it matches the years
		// the formatter reads from each tick.
		const spansMultipleYears =
			type === 'time' &&
			dataMinMs !== undefined &&
			dataMaxMs !== undefined &&
			new Date(dataMinMs).getFullYear() !== new Date(dataMaxMs).getFullYear();

		const ticks = buildTickStrategy({
			isTimeAxis: type === 'time',
			grain: timeAxisGrain,
			grainIsExplicit: asTimeAxisGrain(this.options.date_grain) !== undefined,
			dataMinMs,
			dataMaxMs,
			rawTimestamps: timestamps
		});

		return {
			jsType,
			type,
			min,
			max,
			dataMinMs,
			timeAxisGrain,
			compactYearRollover,
			spansMultipleYears,
			ticks
		};
	});

	// Formatter used for tooltip full-value lookup AND for axis labels on
	// non-time / user-fmt'd axes. Time axes without a user `fmt` get the fuller
	// tooltip-appropriate form here (grain-aware ranges like "Jun 15 – Jun 21,
	// 2025"); their axis LABELS use the compact `formatTimeAxisLabel` inside
	// `axisConfig`. Derived (not assigned inside axisConfig) so reading it
	// never depends on axisConfig having been read first. Returns the format
	// function plus the truncated→full lookup that formatting populates; the
	// map is scoped to this derivation, so stale entries can't leak across
	// reconfigurations.
	readonly #formatter = $derived.by(() => {
		const analysis = this.#analysis;
		const fullValueMap = new Map<string, string>();
		if (!analysis) return { format: undefined, fullValueMap };

		const { type, jsType, min, max, timeAxisGrain } = analysis;
		const labelRotate = coerceNumber(this.options.label_rotate);
		const maxLabelLength =
			coerceNumber(this.options.max_label_length) ?? (labelRotate ? 20 : undefined);
		// Capture option values NOW rather than reading `this.options` inside the
		// closure: ECharts invokes `format` at render/tooltip/layout time, which
		// can be after the owning component is destroyed (deferred updates,
		// lingering tooltips). Reading a derived then triggers Svelte's
		// derived_inert warning; reading captured plain values is always safe.
		// Integer year columns default to separator-free formatting ("2005",
		// not "2,005") — x-axis-rules.ts: isYearLikeDomain. Lives here (not in
		// the axis-label formatter) so tooltips show the same value.
		const dateGrain = this.options.date_grain;
		// Only TIME axes run the grain-aware time formatter; every other grain
		// (seasonality on a value or category axis) must take its label
		// vocabulary from the grain's canonical format (date-options: 'mmm',
		// 'ddd', 'Q0', 'num0', …). Without this a grain with no user `fmt` fell
		// through to raw `formatValue` and rendered the underlying value — a
		// category month-of-year as "1"…"12", a value-axis day-of-month as
		// "5.0"…"30.0". `year` is handled separately in the body — its 'yyyy'
		// code misreads an integer year column as an Excel serial and can't
		// format a bare ISO string without a Date. (spec § 6)
		const grainDefaultFmt =
			!this.options.fmt && type !== 'time' && dateGrain && dateGrain !== 'year'
				? getDefaultFormatForDateGrain(dateGrain as DateGrain)
				: undefined;
		const fmt =
			this.options.fmt ??
			(type === 'value' && isYearLikeDomain(this.options.x, min, max)
				? '0'
				: (grainDefaultFmt ?? undefined));
		const firstDayOfWeek = this.options.firstDayOfWeek;

		const format = (value: unknown): string => {
			// Year grain reads as a discrete category bucket, but its label is
			// always the plain 4-digit year — whether the value arrives as a
			// truncated date ("2015-01-01"), a Date, epoch ms, or an integer year
			// column (2015). Extract it directly so tooltips and axis labels agree
			// and neither picks up thousands separators or a rotated ISO string.
			if (type === 'category' && dateGrain === 'year') {
				const year = extractYear(value);
				if (year !== undefined) return String(year);
			}
			if (type === 'time' && !fmt) {
				return formatTimeAxisTooltip(value as number | string | Date, timeAxisGrain);
			}
			if (type === 'time') {
				if (typeof value === 'number') {
					value = new SvelteDate(value);
				} else if (typeof value === 'string') {
					// Same one-clock parse as customValues/tooltip: any UTC offset
					// stripped, wall-clock digits read as local, so a user `fmt`
					// renders the same instant the bar sits at (same for everyone).
					const ms = parseSeriesTimestampMs(value);
					value = isNaN(ms) ? value : new SvelteDate(ms);
				}
			}
			const formatted = formatValue(
				value,
				fmt,
				value?.toString(),
				{ min, max },
				jsType,
				firstDayOfWeek
			);

			if (maxLabelLength && formatted.length > maxLabelLength) {
				const truncated = formatted.substring(0, maxLabelLength - 1) + '…';
				// Store mapping of truncated -> full value for tooltip
				fullValueMap.set(truncated, formatted);
				return truncated;
			}
			return formatted;
		};

		return { format, fullValueMap };
	});

	get formatter() {
		return this.#formatter.format;
	}

	// Get full value for tooltips (bypasses truncation)
	getFullValue(value: unknown): string {
		const { format, fullValueMap } = this.#formatter;
		if (!format) return String(value);

		const formatted = format(value);
		return fullValueMap.get(formatted) ?? formatted;
	}

	get axisTitleGraphic(): GraphicComponentOption {
		const themeContext = getThemeContext();
		const theme = themeContext.activeTheme;
		const cardContext = getCardContext();

		// Use card colors when inside a card, otherwise use page colors;
		// the axisLabelColor theme token wins so titles match axis labels
		const useCardColors = Boolean(cardContext?.insideCard);
		const bgColor = getThemeToken(theme, 'background', useCardColors);
		const textColor =
			theme.chart?.axisLabelColor ?? getThemeToken(theme, 'mutedForeground', useCardColors);

		const titleVisible = this.isTitleVisible;
		return {
			// x-axis title. Needs to be custom graphic to position correctly (helps with rotated axis labels and charts with negative values)
			id: 'x-axis-title',
			type: 'text',
			z: 100,
			// Mark hidden titles as invisible so the graphic slot in the chart config is
			// stable across re-renders (avoids a full graphic diff), and ECharts skips
			// painting the text entirely.
			invisible: !titleVisible,
			style: {
				fill: textColor,
				text: !titleVisible
					? ''
					: (coerceBoolean(this.options.title_arrow) ?? true)
						? `${this.title} →`
						: this.title,
				fontSize: X_AXIS_FONT_SIZE,
				fontFamily: theme.chart?.fontFamily ?? theme.fonts?.body ?? 'Geist, sans-serif',
				// Sticker-style: only apply the background pill + padding when axis labels
				// are user-rotated. On non-rotated axes the pill just makes the arrow look
				// boxed-in against the plot area, so we skip it and let the title sit as
				// plain text.
				...(coerceNumber(this.options.label_rotate)
					? {
							backgroundColor: bgColor + (mode.current === 'dark' ? 'b3' : 'cc'), // 70% dark, 80% light
							borderRadius: 2,
							padding: [3, 4]
						}
					: {})
			},
			cursor: 'auto',
			right: '1',
			top: undefined,
			// Sits at the container's bottom edge so the title clears the extra breathing
			// room we now give axis labels (the baseline reads lighter, so labels can float
			// a touch further from the axis without looking detached). The grid.bottom in
			// ComboChart reserves enough vertical zone for both labels and title graphic.
			bottom: 0
		};
	}

	// Assemble the ECharts option from the analysis. Layout-only decisions
	// (boundaryGap, hideOverlap, showMin/MaxLabel) live here; every data-driven
	// decision comes from #analysis / x-axis-rules.ts. (X_AXIS_SPEC.md § 3-5)
	readonly axisConfig = $derived.by((): XAXisOption => {
		const analysis = this.#analysis;
		if (!analysis) return {};

		const { jsType, type, dataMinMs, timeAxisGrain, compactYearRollover, ticks } = analysis;
		const { spansMultipleYears } = analysis;
		const { min: dataMin, max: dataMax } = analysis;
		const { tickValues, useCustomTicks, useVerboseLabels } = ticks;

		const labelRotate = coerceNumber(this.options.label_rotate);
		const maxLabelLengthOption = coerceNumber(this.options.max_label_length);
		const interval = coerceNumber(this.options.interval);
		const labelWrap = coerceBoolean(this.options.label_wrap) ?? false;

		const userMinIntervalMs = convertTimeUnitToMs(this.options.min_interval);
		// Integer-only tick floor for discrete integer domains: numeric grains
		// (week 26.5 doesn't exist) and year-like columns (a fractional tick
		// would round to a duplicate "2001 2001" under the year formatter).
		const isIntegerDomain =
			isNonTemporalNumericGrain(jsType, this.options.date_grain) ||
			(type === 'value' && isYearLikeDomain(this.options.x, dataMin, dataMax));
		const minInterval = userMinIntervalMs ?? (isIntegerDomain ? 1 : undefined);

		const userMin = coerceAxisValue(this.options.min, type);
		// Value x-axes hug the data by default. The x-axis is the *domain*, not
		// the measure — anchoring it at zero turns years 1995-2002 into an axis
		// spanning 0-2500 with all the data crammed into the last 2%. The
		// bars-must-start-at-zero rule lives on the value axis of the MEASURE
		// (y here; horizontal bar charts build their value axis from YAxisModel,
		// so they're unaffected). `fit_to_data=false` opts back into
		// zero-inclusion.
		const fitToData = coerceBoolean(this.options.fit_to_data) ?? type === 'value';
		// With a user `interval`, ECharts anchors ticks at the axis min — a
		// padded min of 1999 makes `interval=2` tick odd years against
		// even-year data. Exact data bounds keep the sequence data-anchored.
		const padFitBounds = interval === undefined;
		// Non-temporal integer grains (month of year, day of week, …) are
		// discrete slot domains: half a unit of pad per side, never the
		// proportional pad + integer snap (which appends phantom slots —
		// ceil(12 + 2%) = a 13th month labeled "Jan").
		const slotBounds = isNonTemporalNumericGrain(jsType, this.options.date_grain)
			? makeIntegerSlotBounds()
			: undefined;
		const nonNegativeMin =
			type === 'value' && userMin === undefined && !slotBounds
				? makeNonNegativeValueAxisMin(fitToData, padFitBounds)
				: undefined;
		const userMax = coerceAxisValue(this.options.max, type);
		const fitMax =
			type === 'value' && userMax === undefined && fitToData && !slotBounds
				? makeFitToDataValueAxisMax(padFitBounds)
				: undefined;
		// Fit pad puts the axis boundary ticks slightly outside the data; blank
		// their labels so a fitted domain axis never labels a value the data
		// doesn't reach (x-axis-rules.ts: isOutsideDataRange). Only when the
		// pad is ours: user min/max or zero-pinned axes label their full range.
		// Slot-bounded axes always blank — their .5 boundaries are geometry,
		// not domain positions.
		const blankOutsideData =
			type === 'value' && ((fitToData && padFitBounds) || slotBounds !== undefined);

		const formatterBundle = this.#formatter;
		const valueAxisLabelFormatter = blankOutsideData
			? (value: unknown) =>
					isOutsideDataRange(value, dataMin, dataMax)
						? ''
						: (formatterBundle.format?.(value) ?? String(value))
			: formatterBundle.format;

		return {
			type,
			data: this.categoryDomain,
			// min/max don't apply to category axes
			min: type !== 'category' ? (userMin ?? slotBounds?.min ?? nonNegativeMin) : undefined,
			max: type !== 'category' ? (userMax ?? slotBounds?.max ?? fitMax) : undefined,
			scale: fitToData,
			animation: false,
			// Category axes need proper boundary gap for grouped bars. Time /
			// value axes get a small pad on both sides so the first/last data
			// point isn't flush against the y-axis or right edge. When we
			// pin ticks to data (`customValues`), symmetric 2% padding is
			// required — the asymmetric `['1%', '2%']` default leaves the
			// first custom-tick label ~1% into the plot area (a handful of
			// pixels next to `grid.left: 3`), which ECharts silently drops
			// via its container-clip guardrail even with `showMinLabel` and
			// `hideOverlap: false`. Symmetric padding gives every custom
			// tick enough room for its label on both sides.
			boundaryGap: type === 'category' ? true : useCustomTicks ? ['2%', '2%'] : ['1%', '2%'],
			minInterval,
			maxInterval: convertTimeUnitToMs(this.options.max_interval),
			interval,
			tooltip: {
				show: true,
				// @ts-expect-error ECharts types are incomplete https://echarts.apache.org/en/option.html#xAxis.tooltip
				position: 'inside',
				formatter: (p: { value?: number | string; name?: string; isTruncated: () => boolean }) => {
					// EITHER: ECharts detected truncation (category axes only with width/overflow settings)
					if (type === 'category' && p.isTruncated() && p.name) {
						return escapeHtml(p.name);
					}

					// OR: Check if our formatter truncated this value (by looking up in our map)
					const maxLabelLength = maxLabelLengthOption ?? (labelRotate ? 20 : undefined);

					if (maxLabelLength) {
						const displayedValue = type === 'category' ? p.name : p.value?.toString();

						// Check if we have the full value for this truncated label
						const fullValue =
							displayedValue !== undefined
								? formatterBundle.fullValueMap.get(displayedValue)
								: undefined;
						if (fullValue) return escapeHtml(fullValue);
					}

					return ''; // No tooltip if not truncated
				},
				confine: true,
				// The axis-label tooltip shares ECharts' body-appended tooltip element,
				// so — like chart-area tooltips — it must clear the floating chat pane
				// when rendered inside it. The elevation CSS is appended last so its
				// `z-index` overrides the default `z-index: 1` (later inline wins);
				// outside the pane it's '' and the default stands.
				extraCssText:
					'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1; font-feature-settings: "cv02", "tnum";' +
					this.elevatedTooltipCssGetter()
			},
			axisLabel: {
				show: coerceBoolean(this.options.labels) ?? true,
				overflow: labelRotate ? 'none' : labelWrap ? 'break' : 'truncate',
				margin: 8,
				// Two-tier month/quarter labels: open up the pitch between the
				// period line and the year line. ECharts aligns single-line
				// siblings with the first line of a multi-line label, so this
				// only pushes the year tier down. Gated on the same signal
				// ComboChart budgets grid.bottom from (hasTwoTierLabels), so a
				// multi-year axis that collapsed to single-line bare years gets
				// neither the widened pitch nor the reserved gutter.
				...(this.hasTwoTierLabels ? { lineHeight: TWO_TIER_LABEL_LINE_HEIGHT } : {}),
				// `hideOverlap` is ECharts' greedy collision dropper — only wanted
				// where ECharts also OWNS tick placement (value axes, time axes
				// above the custom-tick threshold), because there its victims are
				// its own auto ticks. Where WE own label layout it picks arbitrary
				// victims (drops "28" between "21" and "Jun 4" because "Jun 4" is
				// wider) producing uneven spacing, so it's off for pinned
				// `customValues` ticks (withAutoTimeAxisLabelThinning does uniform
				// stride thinning) and for category axes
				// (withAutoXAxisLabelLayout does fit → rotate → uniform interval).
				hideOverlap: type !== 'category' && !useCustomTicks,
				// Time axes without a user-provided `fmt` use the compact
				// grain-aware axis formatter (X_AXIS_SPEC.md § 5): hierarchical
				// rollover plus month/year context on the first *visible* tick.
				// `dataMinMs` lets the formatter identify that first visible tick
				// even when ECharts places a phantom padding tick at index 0.
				formatter:
					type === 'time' && !this.options.fmt
						? (value: number | string | Date, index: number) =>
								formatTimeAxisLabel(
									value,
									index,
									timeAxisGrain,
									dataMinMs,
									useVerboseLabels,
									compactYearRollover,
									spansMultipleYears
								)
						: valueAxisLabelFormatter,
				// Time axes normally let ECharts' hierarchical labeling own the
				// edge ticks. When we've explicitly pinned ticks via
				// `customValues`, we want both edges to render even under
				// narrow-width label thinning — they carry the strongest
				// orientation context (first tick is the anchor, last tick
				// includes month/year rollover). Without the min-side force,
				// `hideOverlap: true` drops the leftmost tick's label first
				// when it starts collapsing on narrow screens, leaving the
				// chart reading e.g. "Mar, Apr, …, Jan 2025" with no anchor
				// for what year "Mar" is in.
				showMinLabel: type !== 'time' || useCustomTicks,
				showMaxLabel: type !== 'time' || useCustomTicks,
				rotate: labelRotate,
				...(useCustomTicks ? { customValues: tickValues } : {})
			},
			// Only set when the chart explicitly configures baseline; otherwise the
			// ECharts theme's axisLine default decides (the chart.baselines token).
			// Setting show here unconditionally would override the theme.
			...(coerceBoolean(this.options.baseline) !== undefined
				? { axisLine: { show: coerceBoolean(this.options.baseline) } }
				: {}),
			axisTick: {
				show: coerceBoolean(this.options.ticks) ?? false,
				...(useCustomTicks ? { customValues: tickValues } : {})
			},
			splitLine: {
				show: coerceBoolean(this.options.gridlines) ?? false // Default: gridlines OFF for x-axis
			}
		};
	});
}
