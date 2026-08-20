/**
 * Pure decision rules for the combo-chart x-axis. Every function here is a
 * deterministic function of its inputs — no Svelte reactivity, no ECharts, no
 * DOM — so each rule is unit-testable in isolation.
 *
 * X_AXIS_SPEC.md (same directory) is the authoritative description of these
 * rules; section references below point into it. `XAxisModel.svelte.ts` is the
 * reactive assembler that feeds data into these rules and lays the results
 * into ECharts option shape.
 */
import { getEchartsType } from '../../../common/typeConversions';
import { isTemporalDateGrain } from '../../../common/date-options';
import { parseSeriesTimestampMs } from '../../../formatValue';
import type { TimeAxisGrain } from './format-time-axis-label';
import { closestNamedGrain, inferGrainMsFromTimestamps } from './infer-grain-from-timestamps';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// ─────────────────────────────────────────────────────────────────────────────
// Thresholds (spec § 2, 3, 5). Centralized because several of them interact:
// e.g. VERBOSE_LABEL_THRESHOLD only fires inside the CUSTOM_TICK_THRESHOLD
// regime, and GRAIN_FILL_MAX_RATIO exists to protect the tick budget from a
// mis-inferred grain. Tune with the spec open.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Max data positions for the pinned-tick (`customValues`) regime — one label
 * per bar/point. ~15 labels fit on a single line at default card width.
 * Above this, ECharts places and thins its own round-number ticks. (spec § 3)
 */
export const CUSTOM_TICK_THRESHOLD = 15;

/**
 * At or below this many pinned ticks, every label gets full first-tick context
 * ("May 31, Jun 7, Jun 14" instead of "May 31, 7, 14"). (spec § 3)
 */
export const VERBOSE_LABEL_THRESHOLD = 6;

/**
 * Grain-filled tick positions are rejected when they exceed this multiple of
 * the raw data-point count — the guard against a mis-inferred grain ballooning
 * 2 yearly points into 730 daily ticks. Skipped when the grain was explicitly
 * declared via `date_grain`: there's no inference to distrust, and sparse
 * data (3 monthly readings across 11 months) should still label every month.
 * (spec § 3)
 */
export const GRAIN_FILL_MAX_RATIO = 3;

/** Hard cap on grain-walk iterations, catches pathological ranges. (spec § 3) */
export const GRAIN_WALK_ITERATION_CAP = 500;

/**
 * Data spanning less than this with no `date_grain` promotes to hour grain,
 * so raw sub-day timestamps don't flip label vocabulary between day and hour
 * on the same axis. 2 days: daily-or-coarser data never trips it. (spec § 2)
 */
export const SUB_DAY_HOUR_PROMOTION_MS = 2 * DAY_MS;

/**
 * Data spanning at least this renders year rollovers compact ("2025") instead
 * of verbose ("Jan 2025") — repeated rollovers read as rhythmic separators.
 * 400d ≈ 13 months guarantees at least one full rollover. (spec § 5)
 */
export const MULTI_YEAR_SPAN_MS = 400 * DAY_MS;

/**
 * With `fit_to_data`, the value-axis bounds sit this fraction of the data
 * span outside the data min/max (min floored at 0) so the first/last point
 * isn't flush against the chart edge. (spec § 4)
 */
export const FIT_TO_DATA_PAD_RATIO = 0.02;

const TIME_AXIS_GRAINS = new Set<TimeAxisGrain>([
	'hour',
	'day',
	'week',
	'month',
	'quarter',
	'year'
]);

/**
 * Narrow an arbitrary `date_grain` value (which the schema accepts loosely so
 * variables like `{{ grain }}` pass through) to the union the time-axis
 * formatter knows about. Non-temporal grains and typos return `undefined`,
 * letting the caller fall through to grain inference or leave grain unset.
 */
export function asTimeAxisGrain(grain: string | undefined): TimeAxisGrain | undefined {
	return grain && TIME_AXIS_GRAINS.has(grain as TimeAxisGrain)
		? (grain as TimeAxisGrain)
		: undefined;
}

/**
 * Non-temporal numeric grains (day of week 1–7, day of month 1–31, week of
 * year 1–53, …) render on a value axis and need `minInterval: 1` so ECharts
 * doesn't subdivide to 2.5 or 7.5 on wide charts. (spec § 1)
 */
export function isNonTemporalNumericGrain(
	jsType: string | undefined,
	dateGrain: string | undefined
): boolean {
	return Boolean(dateGrain && !isTemporalDateGrain(dateGrain) && jsType === 'number');
}

/**
 * Seasonality grains whose labels are NAMES, not numbers ("Mon", "Jan", "Q1").
 * A value axis places round-number ticks (2, 4, 6, …), so it would label only
 * every other month/day and never anchor at the first one — a "month of year"
 * chart would read "Feb, Apr, …, Dec" with no Jan. These are small, bounded,
 * cyclical domains (7 days, 12 months, 4 quarters) that read best as discrete
 * category slots, where every label shows. Their numeric siblings (day of
 * month, week of year, day of year) stay on a value axis: their labels ARE
 * numbers, so uniform nice-ticks read naturally and preserve gaps between
 * sparse points. (spec § 1)
 */
const NAMED_SEASONALITY_GRAINS = new Set(['day of week', 'month of year', 'quarter of year']);

/**
 * Axis type from column type + grain. (spec § 1)
 *
 * Year grain returns full dates but reads best as a handful of discrete
 * buckets, so it stays on a category axis. Named seasonality grains (day of
 * week, month of year, quarter of year) likewise render on a category axis so
 * every named label shows. Numeric non-temporal grains (day of month, week of
 * year, day of year) fall through to their natural value axis — ECharts'
 * native nice-tick placement gives uniform integer intervals, and value-axis
 * geometry preserves the meaningful gaps between sparse points that a category
 * axis would smooth over.
 */
export function resolveAxisType(
	jsType: string | undefined,
	dateGrain: string | undefined
): ReturnType<typeof getEchartsType> {
	if (dateGrain === 'year') return 'category';
	if (dateGrain && NAMED_SEASONALITY_GRAINS.has(dateGrain)) return 'category';
	return getEchartsType(jsType);
}

/**
 * Coerce a user-provided min/max to a form ECharts accepts as an axis bound.
 * Numbers pass through; numeric strings parse; date strings parse only on
 * time axes. Returns undefined when the value can't be used.
 */
export function coerceAxisValue(
	value: string | number | undefined,
	axisType: string | undefined
): number | undefined {
	if (value === undefined || value === null) return undefined;

	if (typeof value === 'number') return value;

	const num = Number(value);
	if (!isNaN(num)) return num;

	if (axisType === 'time' && typeof value === 'string') {
		// Parse on the same one clock as the data: strip any UTC offset and read
		// the wall-clock digits as local. Bare `Date.parse("2024-06-01")` would
		// read UTC midnight, putting a user `min`/`max` an offset away from the bars.
		const timestamp = parseSeriesTimestampMs(value);
		if (!isNaN(timestamp)) return timestamp;
	}

	return undefined;
}

/** Named grain / interval unit to approximate milliseconds. */
export function convertTimeUnitToMs(value: string | undefined): number | undefined {
	switch (value) {
		case 'year':
			return 365 * DAY_MS;
		case 'quarter':
			return 90 * DAY_MS;
		case 'month':
			return 30 * DAY_MS;
		case 'week':
			return 7 * DAY_MS;
		case 'day':
			return DAY_MS;
		case 'hour':
			return HOUR_MS;
		default:
			return undefined;
	}
}

/**
 * Min/max x-timestamp across query rows, parsed the same way as `customValues`
 * positions and the bars themselves: `parseSeriesTimestampMs` strips any UTC
 * offset and parses the wall-clock digits as local, matching the value fed to
 * ECharts via `canonicalizeTimeAxisValue`. A parse mismatch between axis bounds
 * and customValues silently drops edge ticks — ECharts discards customValues
 * outside the axis range. (spec § timezone rules)
 */
export function computeTimeDataRangeMs(
	rows: Iterable<Record<string, unknown>>,
	xField: string
): { dataMinMs: number | undefined; dataMaxMs: number | undefined } {
	let lo = Infinity;
	let hi = -Infinity;
	for (const row of rows) {
		const v = row[xField];
		let ts = NaN;
		if (v instanceof Date) ts = v.getTime();
		else if (typeof v === 'number') ts = v;
		else if (typeof v === 'string') ts = parseSeriesTimestampMs(v);
		if (!isNaN(ts)) {
			if (ts < lo) lo = ts;
			if (ts > hi) hi = ts;
		}
	}
	return {
		dataMinMs: isFinite(lo) ? lo : undefined,
		dataMaxMs: isFinite(hi) ? hi : undefined
	};
}

/**
 * Effective grain for a time axis — the single source of truth for both the
 * tick strategy and the label formatter. Priority (spec § 2):
 *   1. Explicit `date_grain` (author declared — trust it).
 *   2. Inferred from the data's cadence: smallest positive delta between
 *      adjacent x-timestamps, snapped to a named grain. Without this, a
 *      monthly chart with data on the 17th of each month falls through to the
 *      formatter's single-date fallback, which sees "day 17" on every tick
 *      and labels the chart "Feb 17, 17, 17, 17…".
 *   3. Short-span promotion to 'hour' for sub-2-day data with no grain.
 */
export function resolveTimeAxisGrain(args: {
	isTimeAxis: boolean;
	dateGrain: string | undefined;
	timestamps: number[] | undefined;
	dataSpanMs: number | undefined;
}): TimeAxisGrain | undefined {
	const explicit = asTimeAxisGrain(args.dateGrain);
	if (explicit) return explicit;
	if (!args.isTimeAxis) return undefined;

	const inferredMs = inferGrainMsFromTimestamps(args.timestamps);
	if (inferredMs !== undefined) return closestNamedGrain(inferredMs);

	// A non-temporal grain string (e.g. "day of week") suppresses hour
	// promotion: the author said something about grain, just not a temporal
	// one, so silently promoting would contradict them.
	if (
		!args.dateGrain &&
		args.dataSpanMs !== undefined &&
		args.dataSpanMs < SUB_DAY_HOUR_PROMOTION_MS
	) {
		return 'hour';
	}
	return undefined;
}

/**
 * Walk from `minMs` to `maxMs` inclusive, emitting one timestamp per grain
 * unit. Local-time Date arithmetic (setMonth / setDate / setHours) so
 * month/year stepping stays calendar-aware AND DST transitions roll over
 * cleanly: `minMs`/`maxMs` come from `parseSeriesTimestampMs` (zoneless → local
 * midnight), and setMonth+1 keeps subsequent ticks on local midnight even
 * across a DST boundary. UTC arithmetic would drift by an hour there. (spec § 3)
 */
export function walkGrainTicks(minMs: number, maxMs: number, grain: TimeAxisGrain): number[] {
	const ticks: number[] = [];
	if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || minMs > maxMs) return ticks;
	const d = new Date(minMs);
	for (let i = 0; i < GRAIN_WALK_ITERATION_CAP && d.getTime() <= maxMs; i++) {
		ticks.push(d.getTime());
		switch (grain) {
			case 'hour':
				d.setHours(d.getHours() + 1);
				break;
			case 'day':
				d.setDate(d.getDate() + 1);
				break;
			case 'week':
				d.setDate(d.getDate() + 7);
				break;
			case 'month':
				d.setMonth(d.getMonth() + 1);
				break;
			case 'quarter':
				d.setMonth(d.getMonth() + 3);
				break;
			case 'year':
				d.setFullYear(d.getFullYear() + 1);
				break;
		}
	}
	return ticks;
}

export interface TickStrategy {
	/** Positions for `axisLabel.customValues` / `axisTick.customValues`. */
	tickValues: number[] | undefined;
	/** True when ticks are pinned to data positions (spec § 3 pinned regime). */
	useCustomTicks: boolean;
	/** True when every label gets full first-tick context (spec § 3 verbose). */
	useVerboseLabels: boolean;
}

/**
 * Decide the tick regime for a time axis. (spec § 3)
 *
 * Tick positions come from raw query rows, grain-filled when an effective
 * grain exists: walk every grain-aligned position between data min and max so
 * genuine gaps in the raw data (e.g. a monthly chart missing July) still show
 * a labeled empty slot. Orthogonal to `handle_missing` — whether a bar renders
 * at the synthetic tick is the series layer's business; the label appears
 * either way.
 *
 * Grain-fill output is rejected (falling back to raw positions) when it
 * exceeds the tick budget, or — for *inferred* grains only — when it exceeds
 * GRAIN_FILL_MAX_RATIO × raw count, the guard against a mis-inferred grain
 * ballooning a small raw set into hundreds of ticks. An explicitly declared
 * `date_grain` skips the ratio guard: there's no inference to distrust, and
 * sparse data (3 monthly readings across 11 months) should still label every
 * month. The tick budget and walker iteration cap still apply.
 */
export function buildTickStrategy(args: {
	isTimeAxis: boolean;
	grain: TimeAxisGrain | undefined;
	grainIsExplicit: boolean;
	dataMinMs: number | undefined;
	dataMaxMs: number | undefined;
	rawTimestamps: number[] | undefined;
}): TickStrategy {
	const { isTimeAxis, grain, grainIsExplicit, dataMinMs, dataMaxMs, rawTimestamps } = args;

	if (!isTimeAxis || rawTimestamps === undefined || rawTimestamps.length === 0) {
		return { tickValues: undefined, useCustomTicks: false, useVerboseLabels: false };
	}

	let tickValues = rawTimestamps;
	if (grain !== undefined && dataMinMs !== undefined && dataMaxMs !== undefined) {
		const filled = walkGrainTicks(dataMinMs, dataMaxMs, grain);
		const withinBudget = filled.length > 0 && filled.length <= CUSTOM_TICK_THRESHOLD;
		const withinRatio =
			grainIsExplicit || filled.length <= rawTimestamps.length * GRAIN_FILL_MAX_RATIO;
		if (withinBudget && withinRatio) {
			tickValues = filled;
		}
	}

	const useCustomTicks = tickValues.length <= CUSTOM_TICK_THRESHOLD;
	return {
		tickValues: useCustomTicks ? tickValues : rawTimestamps,
		useCustomTicks,
		useVerboseLabels: useCustomTicks && tickValues.length <= VERBOSE_LABEL_THRESHOLD
	};
}

/**
 * Integer domains (years, counts, ranks) get their padded bounds snapped to
 * whole numbers. The forced min/max labels sit on the raw axis extent, so a
 * fractional bound like 1999.62 gets *labelled* — and different formatters
 * disagree about it (`yyyy` truncates to "1999", plain numbers round to
 * "2,000"). Snapping makes the boundary labels truthful and format-agnostic.
 */
function snapToIntegerDomain(padded: number, v: { min: number; max: number }, dir: 1 | -1) {
	if (!Number.isInteger(v.min) || !Number.isInteger(v.max)) return padded;
	return dir === -1 ? Math.floor(padded) : Math.ceil(padded);
}

/**
 * Value axes with entirely non-negative data never get a negative min.
 * ECharts' default `boundaryGap: ['1%','2%']` nudges the computed min a hair
 * below the data min and `nice()` rounds down a full tick — turning data in
 * [1, 195] into an axis spanning -50 → 200. `scale: true` (`fit_to_data`)
 * does not rescue this. (spec § 4)
 *
 * Returns an ECharts min-callback:
 * - default: pin min to 0 (bars-start-at-zero mental model).
 * - `fit_to_data`: hug the data with a small proportional pad, floored at 0
 *   (snapped to an integer on integer domains).
 * - `pad: false` (user set an explicit `interval`): exact data min. ECharts
 *   anchors explicit-interval ticks at the axis min, so a padded min of 1999
 *   makes `interval=2` tick odd years (2001, 2003…) against even-year data.
 * - mixed-sign data: `undefined`, ECharts default behavior untouched.
 */
export function makeNonNegativeValueAxisMin(fitToData: boolean, pad = true) {
	return (v: { min: number; max: number }): number | undefined => {
		if (!Number.isFinite(v.min) || v.min < 0) return undefined;
		if (!fitToData) return 0;
		if (!pad) return v.min;
		const span = Number.isFinite(v.max) ? v.max - v.min : 0;
		const padded = snapToIntegerDomain(v.min - span * FIT_TO_DATA_PAD_RATIO, v, -1);
		return Math.max(0, padded);
	};
}

/**
 * On a fitted domain axis, never label a position outside the data's range.
 * The fit pad puts the axis boundary ticks slightly outside the data
 * (2000-2019 → bounds 1999/2020), and ECharts labels them — phantom years
 * the data doesn't contain, plus the forced boundary label crowds out the
 * real first tick ("1999" survives `hideOverlap`, "2000" gets dropped).
 * Blanking the label keeps the padding without lying about the domain.
 */
export function isOutsideDataRange(
	value: unknown,
	dataMin: number | null | undefined,
	dataMax: number | null | undefined
): boolean {
	if (typeof value !== 'number') return false;
	return (
		(typeof dataMin === 'number' && value < dataMin) ||
		(typeof dataMax === 'number' && value > dataMax)
	);
}

/**
 * Max-side counterpart for `fit_to_data` value axes. Without an explicit max,
 * ECharts takes the padded data max and rounds UP to the next whole tick —
 * with a 3-year tick interval, data ending at 2019 produces an axis ending at
 * 2022 (≈3 years of dead space vs. the min side's tight 2% pad, so the chart
 * reads lopsided). Pinning the max keeps both sides symmetric. (spec § 4)
 *
 * `pad: false` (user set an explicit `interval`): exact data max, mirroring
 * the min side so the tick sequence stays anchored to the data.
 */
export function makeFitToDataValueAxisMax(pad = true) {
	return (v: { min: number; max: number }): number | undefined => {
		if (!Number.isFinite(v.min) || !Number.isFinite(v.max)) return undefined;
		if (!pad) return v.max;
		const span = v.max - v.min;
		return snapToIntegerDomain(v.max + span * FIT_TO_DATA_PAD_RATIO, v, 1);
	};
}

/**
 * Integer year columns ("year", "fiscal_year", "order_yr") plotted as plain
 * numbers get thousands separators by default — "2,000 2,005 2,010" — which
 * reads as a quantity, not a calendar. When BOTH signals agree, the axis
 * defaults to separator-free integer formatting (user `fmt` always wins):
 *
 * - the column NAME ends in year/yr(s) (case-insensitive), and
 * - the data min AND max are integers within [1000, 3000].
 *
 * Requiring both makes false positives essentially impossible: a value-range
 * check alone would reclassify scores/elevations/IDs that happen to live in
 * the 4-digit range, and a name check alone would mangle a "year" column
 * holding something else (durations in days, fractional fiscal years).
 */
export function isYearLikeDomain(
	columnName: string | undefined,
	dataMin: number | null | undefined,
	dataMax: number | null | undefined
): boolean {
	if (!columnName || !/(year|yr)s?$/i.test(columnName)) return false;
	if (typeof dataMin !== 'number' || typeof dataMax !== 'number') return false;
	if (!Number.isInteger(dataMin) || !Number.isInteger(dataMax)) return false;
	return dataMin >= 1000 && dataMax <= 3000;
}

/**
 * Bounds for non-temporal integer grains (`month of year` 1-12, `day of week`
 * 1-7, `quarter of year` 1-4, …). These are discrete slot domains, not
 * continuous measures — the proportional pad + integer snap that suits year
 * axes misfires here: ceil(12 + 2%·span) = 13 appends a phantom 13th-month
 * slot whose tick label wraps around to "Jan" (the SSF month formatter is
 * modular). Half a unit of pad on each side instead gives the extreme bars a
 * full slot to occupy — the same geometry a category axis would produce —
 * without inventing a domain position. The x.5 boundary ticks fall outside
 * the data range, so `isOutsideDataRange` blanking leaves them unlabeled.
 * (spec § 4)
 */
export function makeIntegerSlotBounds() {
	return {
		min: (v: { min: number; max: number }): number | undefined =>
			Number.isFinite(v.min) ? v.min - 0.5 : undefined,
		max: (v: { min: number; max: number }): number | undefined =>
			Number.isFinite(v.max) ? v.max + 0.5 : undefined
	};
}
