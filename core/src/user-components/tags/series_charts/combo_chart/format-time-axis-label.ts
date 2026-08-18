import { parseSeriesTimestampMs } from '../../../formatValue';

/**
 * Grains this formatter supports. Non-temporal grains (day-of-week, month-of-year, etc.)
 * use category axes and don't hit this codepath.
 */
export type TimeAxisGrain = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

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
] as const;

/**
 * Format an ECharts time-axis tick label.
 *
 * Rules (in priority order):
 *  0. Span split (month/quarter, plus the multi-year first tick of every grain):
 *     - A SINGLE calendar year (Apr–Jun 2026, Jan–Dec 2024): the year is
 *       constant, so it's dropped entirely — bare single-line periods.
 *       (`spansMultipleYears` false.)
 *     - ~1 year across a boundary (Jul 2024 – Jun 2025): two-tier ("Jul\n2024"),
 *       the year stated once at the first tick and each January/Q1.
 *     - Multi-year (`compactYearRollover`): a year timeline that reads
 *       single-line and year-anchored — bare year at each January/Q1 boundary,
 *       bare period between, and the first tick inline ("Q3 2023") when it isn't
 *       itself a boundary. Day/week likewise anchor their multi-year first tick
 *       to the year instead of a day-qualified date. See the inline comments.
 *  1. `verbose: true` short-circuits everything — every tick gets full context
 *     (e.g. "Jun 7" instead of just "7"). Used on small-bar-count charts where
 *     each label has room to breathe and "May 31, 7, 14" reads ambiguously.
 *  2. First tick receives enough context to orient the reader
 *     (e.g. "Jun 5" instead of just "5"; "Jan 2025" instead of just "Jan"). Detected
 *     via `index === 0` (covers the common case) OR proximity to `dataMinMs`
 *     (covers cases where ECharts hides a phantom padding tick and the first
 *     visible label lands at index 1+ or slightly before data-min).
 *  3. Year rollover — new calendar year — shows the year.
 *  4. Month rollover (day-1 of a month) shows the month.
 *  5. Everything else shows just the small unit for the grain.
 *
 * Rules 3-5 match ECharts' native hierarchical behavior, so longer time series
 * (multi-month, multi-year) render the same way they did before this formatter existed.
 *
 * All calendar arithmetic is LOCAL-time based, and so is every position in the
 * pipeline. `parseSeriesTimestampMs` (and the value fed to ECharts via
 * `canonicalizeTimeAxisValue`) strips any UTC offset and parses the remaining
 * wall-clock digits on the local clock, so parse-local + format-local cancel.
 * A "2024-06-15" renders verbatim as "Jun 15" — and a "…04:00:00Z" renders as
 * "4 am" — for every viewer, in every timezone. See `formatTimeAxisTooltip`
 * for the full rationale.
 */
export function formatTimeAxisLabel(
	value: number | string | Date,
	index: number,
	grain: TimeAxisGrain | undefined,
	dataMinMs?: number,
	verbose?: boolean,
	compactYearRollover?: boolean,
	spansMultipleYears?: boolean
): string {
	const date = toDate(value);
	if (!date) return String(value);

	// Best-effort grain inference when the caller didn't pass one. Rare — most call
	// sites know the grain — but ECharts may pass us auto-generated tick timestamps
	// for un-grained series.
	const g = grain ?? inferGrain(date);

	// Month/quarter labels split on span (see the "≤1yr vs multi-year" split
	// that runs across all grains — spec § 5):
	//
	// - Multi-year (`compactYearRollover`): the axis is a year timeline, so it
	//   reads single-line and year-anchored. ECharts thins it to ~yearly ticks
	//   that all land on January/Q1; those show the BARE year ("2022 2023 …") —
	//   stacking an identical "Jan"/"Q1" over every one is pure noise. Interior
	//   ticks keep their bare period ("Apr", "Q3"); the first tick, if it isn't
	//   a year boundary, shows an inline "Q3 2023" to anchor the start year.
	//
	// - Within ~1 year spanning TWO calendar years (e.g. Jul 2024 – Jun 2025):
	//   two-tier — period name on top, year on a second line at the first tick
	//   and each January/Q1 ("Jul\n2024", "Jan\n2025"). This is the
	//   "super-category" publication pattern (year stated once, periods
	//   horizontal); the two-line form keeps the label's horizontal footprint at
	//   period-name width, so a wide "Jan 2025" anchor never forces the whole
	//   12-month axis to thin or rotate. Ignores `verbose` (period names are
	//   already unambiguous).
	// - Within a SINGLE calendar year (e.g. Apr–Jun 2026, or Jan–Dec 2024): the
	//   year is constant across every tick, so it's redundant context — labels
	//   stay single-line bare periods ("Apr", "May", "Jun"). No first-tick
	//   anchor, no reserved year gutter (hasTwoTierLabels is false).
	if (g === 'month' || g === 'quarter') {
		const periodName =
			g === 'month'
				? MONTH_NAMES[date.getMonth()]
				: quarterLabel(date, /* includeYear */ false);
		if (compactYearRollover) {
			// Collapse to a bare year ONLY at the exact period boundary that opens
			// the year — Jan 1 (which is also the Q1 start). Above the custom-tick
			// threshold ECharts owns tick placement, and a tick landing elsewhere
			// in January (not the Q1/month boundary) must keep its period label:
			// matching the whole month would drop the quarter and make that tick
			// read as a stray year separator instead of its actual position.
			if (isJanuary1(date)) return String(date.getFullYear());
			if (isFirstTick(date, index, g, dataMinMs)) {
				return `${periodName} ${date.getFullYear()}`;
			}
			return periodName;
		}
		if (spansMultipleYears && (isFirstTick(date, index, g, dataMinMs) || isJanuary(date))) {
			return `${periodName}\n${date.getFullYear()}`;
		}
		return periodName;
	}

	if (verbose || isFirstTick(date, index, g, dataMinMs)) {
		// Multi-year day/week: anchor the first tick to its YEAR, matching the
		// bare-year separators the rest of the axis uses. Without this the first
		// tick falls to the day-qualified `firstTickLabel` ("Jan 1") and reads as
		// a stray date sitting next to "2023"/"2024" — the exact inconsistency
		// we're removing. A mid-year start shows "Mar 2022" so the start year is
		// still stated. (hour/year grains keep their own first-tick handling.)
		if (compactYearRollover && !verbose && (g === 'day' || g === 'week')) {
			if (isJanuary1(date)) return String(date.getFullYear());
			return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
		}
		return firstTickLabel(date, g);
	}

	// Year rollover format switches on how often it appears in this chart.
	// Verbose ("Jan 2025") reads as a point-in-time — good when standalone
	// on a <= 1-year chart. Compact ("2025") reads as a year separator —
	// good when repeated on a multi-year chart, and dodges the uneven
	// visual weight of an unusually-wide "Jan 2025" between short month
	// siblings. Caller passes `compactYearRollover = true` when the data
	// span implies multiple rollovers (>= ~13 months).
	const yearLabel = (d: Date) =>
		compactYearRollover ? String(d.getFullYear()) : `${MONTH_NAMES[0]} ${d.getFullYear()}`;

	if (g === 'year') return String(date.getFullYear());

	// Hour grain is handled separately: the day/week scaffolding below (which
	// runs `isFirstOfMonth` before any hour-specific check) would otherwise
	// swallow every non-midnight hour on day-1 of a month and label it "Jun",
	// losing all sub-day context on charts that happen to cross a month
	// boundary. For hour grain we surface month/year context AT midnight;
	// interior hours always show the small hour unit.
	//
	// Day rollovers use "${month} ${date}" uniformly (Jun 1, Jul 15, Dec 31)
	// so the label reads as a time-anchored moment alongside neighboring
	// hour ticks. Special-casing day-1-of-month to just "Jun" made the
	// month-rollover tick read as a floating month title instead of a
	// timestamp — visually jarring next to "4 am / 8 am / 12 pm".
	// January 1 midnight collapses to just the year — the strong year-
	// rollover context reads more clearly than "Jan 1".
	if (g === 'hour') {
		if (date.getHours() === 0) {
			if (isJanuary1(date)) return String(date.getFullYear());
			return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
		}
		return hourLabel(date);
	}

	// day / week share the same "small unit" scaffolding: year > month > small.
	// Year rollover uses `yearLabel` — same compact-vs-verbose logic as month
	// grain: verbose "Jan 2025" reads as a point in time on single-rollover
	// charts, compact "2025" reads as a repeating year separator on multi-
	// year charts.
	if (isJanuary1(date)) return yearLabel(date);

	// Weekly month rollover: real weekly buckets almost never land on day-1
	// of a month (`DATE_TRUNC('week', ...)` aligns to Mon or Sun), so we
	// treat the tick whose *start* falls in the first 7 days of a calendar
	// month as the natural month-rollover marker.
	//
	// Three sub-cases, in priority order:
	//   1. First week of January → "Jan 2025". Year context is the strongest
	//      anchor across a year boundary; combining it with the month name
	//      makes the tick self-describing rather than range-implying.
	//   2. Tick that lands exactly on day-1 → just the month name ("Jul").
	//      The "1" suffix is redundant when the tick already IS the boundary,
	//      and the whole point of the day suffix in case 3 is to disambiguate
	//      *which* week of the month a non-day-1 tick starts on.
	//   3. Non-day-1 tick in the first week → "May 7" (day-qualified). Weekly
	//      ticks land on non-1 days; "May" alone reads as ambiguous next to
	//      numeric day siblings ("23, 30, May, 14").
	//
	// Runs BEFORE `isFirstOfMonth` so that day-1 weekly ticks flow through
	// case 2 here (identical output) instead of the generic month-only branch.
	if (g === 'week' && date.getDate() <= 7) {
		if (date.getMonth() === 0) return yearLabel(date);
		if (date.getDate() === 1) return MONTH_NAMES[date.getMonth()];
		return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
	}
	if (isFirstOfMonth(date)) return MONTH_NAMES[date.getMonth()];
	return String(date.getDate());
}

function hourLabel(date: Date): string {
	const h24 = date.getHours();
	const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
	const ampm = h24 < 12 ? 'am' : 'pm';
	return `${h12} ${ampm}`;
}

function isFirstTick(
	date: Date,
	index: number,
	grain: TimeAxisGrain,
	dataMinMs: number | undefined
): boolean {
	if (index === 0) return true;
	if (dataMinMs === undefined) return false;
	// Match any tick within half a grain-unit of data start — on EITHER side.
	// - Same-side (after data-min) catches the common case where ECharts hides a
	//   phantom pre-data tick and the first visible label lands at index 1 exactly
	//   at data-min (e.g. Jun 5 for daily data).
	// - Other-side (before data-min) catches narrow-chart cases where ECharts
	//   places its first visible tick 1-3 days before data-min (e.g. May 29 for
	//   weekly data starting May 31, rendered in a narrow card).
	// Using HALF a grain unit keeps the second real tick — always at least one
	// full grain-unit away from data-min — from accidentally being marked "first".
	const deltaMs = Math.abs(date.getTime() - dataMinMs);
	return deltaMs < firstTickToleranceMs(grain);
}

function firstTickToleranceMs(grain: TimeAxisGrain): number {
	const HOUR = 60 * 60 * 1000;
	const DAY = 24 * HOUR;
	switch (grain) {
		case 'hour':
			return HOUR / 2;
		case 'day':
			return DAY / 2;
		case 'week':
			return (7 * DAY) / 2;
		case 'month':
			return (28 * DAY) / 2; // shortest month is Feb; half of that keeps us conservative
		case 'quarter':
			return (89 * DAY) / 2; // Q1 (Jan-Mar in non-leap) is 90 days; half stays safe
		case 'year':
			return (365 * DAY) / 2;
	}
}

function firstTickLabel(date: Date, grain: TimeAxisGrain): string {
	const m = MONTH_NAMES[date.getMonth()];
	const d = date.getDate();
	const y = date.getFullYear();
	switch (grain) {
		case 'hour':
			// Hour-grain first tick shows JUST the time — ECharts' native
			// two-tier time-axis rendering already injects a day marker at
			// the first period boundary via its built-in `{primary|Jun 15}`
			// rich text, so an axis-start "Jun 15 12 am" from us stacks a
			// second "Jun 15" alongside ECharts' own. Interior day
			// rollovers still surface the date via the midnight rule in
			// `formatTimeAxisLabel`; that path is not a duplicate because
			// ECharts only tiers up on the FIRST occurrence of each unit.
			return hourLabel(date);
		case 'day':
		case 'week':
			return `${m} ${d}`;
		case 'month':
			// Unreachable from formatTimeAxisLabel (month and quarter grains
			// short-circuit to the two-tier branch); kept consistent with it
			// for any other caller.
			return `${m}\n${y}`;
		case 'quarter':
			return `${quarterLabel(date, /* includeYear */ false)}\n${y}`;
		case 'year':
			return String(y);
	}
}

/**
 * Format a time value for display in a tooltip. Unlike the axis label formatter
 * — which optimizes for compact, hierarchical rollovers along the axis — the
 * tooltip is anchored to a single hovered point and should carry full context
 * (year, day-of-month, etc.) so the reader isn't left cross-referencing the
 * axis labels.
 *
 * Formats in LOCAL time, matching every position in the pipeline. ECharts
 * parses the raw values in `series.data` on the local clock (its default), and
 * so does `toDate`. Because parsing and formatting share one clock, a zoneless
 * "2026-06-15" round-trips to "Jun 15, 2026" for every viewer, regardless of
 * their timezone — the calendar date the DB stored is shown verbatim, and the
 * tooltip agrees with the axis label ECharts places for the same bar.
 *
 * A value carrying a real offset ("…Z" / "±hh:mm") is a genuine instant, not a
 * calendar date. ECharts honors the offset and draws it at the instant mapped
 * onto the local axis, so `toDate` honors it too (see there) — the tooltip
 * therefore shows the same local wall-clock the bar sits at (a "…04:00:00Z"
 * point reads "12 am" for an EDT viewer, not the verbatim "4 am"). Such values
 * legitimately shift by viewer timezone; only zoneless dates are invariant.
 */
export function formatTimeAxisTooltip(
	value: number | string | Date,
	grain: TimeAxisGrain | undefined
): string {
	const date = toDate(value);
	if (!date) return String(value);

	const g = grain ?? inferGrain(date);
	const m = MONTH_NAMES[date.getMonth()];
	const d = date.getDate();
	const y = date.getFullYear();
	switch (g) {
		case 'hour': {
			const h24 = date.getHours();
			const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
			const ampm = h24 < 12 ? 'am' : 'pm';
			return `${m} ${d}, ${y} ${h12} ${ampm}`;
		}
		case 'day':
			return `${m} ${d}, ${y}`;
		case 'week':
			return weekRangeLabel(date);
		case 'month':
			return `${m} ${y}`;
		case 'quarter':
			return `Q${Math.floor(date.getMonth() / 3) + 1} ${y}`;
		case 'year':
			return String(y);
	}
}

/**
 * Weekly aggregations arrive as the week-start (SQL `DATE_TRUNC('week', ...)`).
 * A bare "Jun 15, 2025" tooltip on weekly data is ambiguous — is that the whole
 * week? which day of it? — so we render the full range. Collapses common cases
 * to stay short:
 *  - Same month:      Jun 15–21, 2025
 *  - Cross-month:     Jun 29 – Jul 5, 2025
 *  - Cross-year:      Dec 29, 2025 – Jan 4, 2026
 */
function weekRangeLabel(startDate: Date): string {
	const endMs = startDate.getTime() + 6 * 24 * 60 * 60 * 1000;
	const endDate = new Date(endMs);

	const sm = MONTH_NAMES[startDate.getMonth()];
	const sd = startDate.getDate();
	const sy = startDate.getFullYear();
	const em = MONTH_NAMES[endDate.getMonth()];
	const ed = endDate.getDate();
	const ey = endDate.getFullYear();

	if (sy !== ey) return `${sm} ${sd}, ${sy} – ${em} ${ed}, ${ey}`;
	if (sm !== em) return `${sm} ${sd} – ${em} ${ed}, ${sy}`;
	return `${sm} ${sd}–${ed}, ${sy}`;
}

function quarterLabel(date: Date, includeYear: boolean): string {
	const q = Math.floor(date.getMonth() / 3) + 1;
	return includeYear ? `Q${q} ${date.getFullYear()}` : `Q${q}`;
}

function isJanuary1(date: Date): boolean {
	return date.getMonth() === 0 && date.getDate() === 1;
}

function isJanuary(date: Date): boolean {
	return date.getMonth() === 0;
}

function isFirstOfMonth(date: Date): boolean {
	return date.getDate() === 1;
}

function toDate(value: number | string | Date): Date | null {
	if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
	if (typeof value === 'number') {
		const d = new Date(value);
		return isNaN(d.getTime()) ? null : d;
	}
	// Parse the raw string the SAME way ECharts positions it (and the tick
	// pipeline computes bounds/customValues) via the one shared helper, then
	// read local components below. Any UTC offset is stripped and the wall-clock
	// digits parsed as local, so the label (from ECharts' tick ms) and the
	// tooltip (from this raw value) resolve to the same instant the bar sits at,
	// identical for every viewer. See `parseSeriesTimestampMs`.
	const ms = parseSeriesTimestampMs(value);
	return isNaN(ms) ? null : new Date(ms);
}

// Fallback used when the caller didn't pass a grain (rare — most series set
// date_grain; this fires only for un-grained series or an unrecognized value).
//
// A non-zero hour that lands exactly on the hour boundary (e.g. 04:00:00)
// almost always signals a **calendar-date value carrying an offset**, not a
// genuinely hour-grained bucket. Real hour-grained data ships with an explicit
// `date_grain='hour'` from the SQL layer, so we never rely on this path for it.
// If we promoted to 'hour' whenever the hour was non-zero, a daily series whose
// values happened to land off-midnight would render "4 am / 5 am / …" across
// the axis instead of dates. Only sub-hour precision (minutes or seconds set)
// is a strong enough signal of real hourly-or-finer data to promote.
//
// Never returns 'week' or 'quarter': a single timestamp can't disambiguate a
// Monday-week-start from a daily point that happened to land on a Monday, or
// Apr 1 quarterly from Apr 1 monthly. Guessing those grains from one date
// would introduce more false positives than the current false negatives, so
// weekly falls back to 'day' and quarterly to 'month'. Local-time based to
// match the rest of the formatter (see file header).
function inferGrain(date: Date): TimeAxisGrain {
	if (date.getMinutes() !== 0 || date.getSeconds() !== 0) return 'hour';
	if (date.getDate() !== 1) return 'day';
	if (date.getMonth() !== 0) return 'month';
	return 'year';
}
