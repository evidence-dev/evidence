/**
 * Calendar periods (week, month, quarter, year) and snapping date ranges to whole periods.
 *
 * Callers ask a `PeriodCalendar` which period contains a date instead of calling date-fns directly,
 * so a fiscal calendar can be added later as another implementation without changing them. The
 * only implementation today is the Gregorian calendar, whose weeks start on `first_day_of_week`.
 */
import {
	addDays,
	addMonths,
	addQuarters,
	addWeeks,
	addYears,
	endOfMonth,
	endOfQuarter,
	endOfWeek,
	endOfYear,
	format,
	startOfDay,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
	startOfYear,
	subDays
} from 'date-fns';
import { isRecognizedDateRange, resolveRangeToDates } from './date-options';
import { parseDateStringAsLocalMidnight } from '../../utils/date-utils';

/** The temporal grains a calendar can divide time into. */
export const CALENDAR_GRAINS = ['day', 'week', 'month', 'quarter', 'year'] as const;

export type CalendarGrain = (typeof CALENDAR_GRAINS)[number];

export type FirstDayOfWeek = 'sunday' | 'monday';

export function isCalendarGrain(value: unknown): value is CalendarGrain {
	return typeof value === 'string' && (CALENDAR_GRAINS as readonly string[]).includes(value);
}

/** A literal grain from an attribute value, or undefined for anything else (including variables). */
export function parseCalendarGrain(value: unknown): CalendarGrain | undefined {
	const grain = typeof value === 'string' ? value.trim().toLowerCase() : value;
	return isCalendarGrain(grain) ? grain : undefined;
}

export interface PeriodCalendar {
	/** First day of the period that contains `date`. */
	startOf(date: Date, grain: CalendarGrain): Date;
	/** Last day of the period that contains `date`. */
	endOf(date: Date, grain: CalendarGrain): Date;
	/** Start of the period `count` periods after the one starting at `start` (negative steps back). */
	shift(start: Date, grain: CalendarGrain, count: number): Date;
	/** Display name of the period starting at `start`, e.g. `Mar 2026`, `Q1 2026`, `2026`. */
	label(start: Date, grain: CalendarGrain): string;
	/** Name within its year, for grids that are already grouped by year: `Mar`, `Q1`; a year stays `2026`. */
	shortLabel(start: Date, grain: CalendarGrain): string;
}

/** The standard calendar: weeks start on `firstDayOfWeek`, quarters and years start in January. */
export function gregorianCalendar(firstDayOfWeek: FirstDayOfWeek = 'sunday'): PeriodCalendar {
	const weekStartsOn = firstDayOfWeek === 'monday' ? 1 : 0;
	return {
		startOf(date, grain) {
			switch (grain) {
				case 'day':
					return startOfDay(date);
				case 'week':
					return startOfWeek(date, { weekStartsOn });
				case 'month':
					return startOfMonth(date);
				case 'quarter':
					return startOfQuarter(date);
				case 'year':
					return startOfYear(date);
			}
		},
		endOf(date, grain) {
			switch (grain) {
				case 'day':
					return startOfDay(date);
				case 'week':
					return startOfDay(endOfWeek(date, { weekStartsOn }));
				case 'month':
					return startOfDay(endOfMonth(date));
				case 'quarter':
					return startOfDay(endOfQuarter(date));
				case 'year':
					return startOfDay(endOfYear(date));
			}
		},
		shift(start, grain, count) {
			switch (grain) {
				case 'day':
					return addDays(start, count);
				case 'week':
					return addWeeks(start, count);
				case 'month':
					return addMonths(start, count);
				case 'quarter':
					return addQuarters(start, count);
				case 'year':
					return addYears(start, count);
			}
		},
		label(start, grain) {
			switch (grain) {
				case 'day':
					return format(start, 'MMM d, yyyy');
				case 'week':
					return `Week of ${format(start, 'MMM d, yyyy')}`;
				case 'month':
					return format(start, 'MMM yyyy');
				case 'quarter':
					return format(start, "'Q'Q yyyy");
				case 'year':
					return format(start, 'yyyy');
			}
		},
		shortLabel(start, grain) {
			switch (grain) {
				case 'day':
					return format(start, 'd');
				case 'week':
					return format(start, 'MMM d');
				case 'month':
					return format(start, 'MMM');
				case 'quarter':
					return format(start, "'Q'Q");
				case 'year':
					return format(start, 'yyyy');
			}
		}
	};
}

export type IsoBounds = { start?: string; end?: string };

const toIso = (date: Date) => format(date, 'yyyy-MM-dd');
const fromIso = parseDateStringAsLocalMidnight;

/** Widen bounds to whole periods: the start moves to its period's first day, the end to its period's last. */
export function snapBounds(
	bounds: IsoBounds,
	grain: CalendarGrain,
	calendar: PeriodCalendar
): IsoBounds {
	return {
		start: bounds.start && toIso(calendar.startOf(fromIso(bounds.start), grain)),
		end: bounds.end && toIso(calendar.endOf(fromIso(bounds.end), grain))
	};
}

/** The whole period containing the ISO date `iso`, as ISO dates. */
export function periodContaining(
	iso: string,
	grain: CalendarGrain,
	calendar: PeriodCalendar
): { start: string; end: string } {
	const date = fromIso(iso);
	return { start: toIso(calendar.startOf(date, grain)), end: toIso(calendar.endOf(date, grain)) };
}

/** Bounds as a range expression the date-range grammar understands. */
export function boundsToRangeExpression({ start, end }: IsoBounds): string {
	if (start && end) return `${start} to ${end}`;
	if (start) return `from ${start}`;
	if (end) return `until ${end}`;
	return 'all time';
}

// Real calendar dates only: the grammar passes literal dates through unchecked, so a hand-edited
// URL can carry "2025-13-01" or "2025-02-30", which date math would reject or roll over.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function isRealDate(iso: string | undefined): boolean {
	if (iso === undefined) return true;
	if (!ISO_DATE.test(iso)) return false;
	const date = fromIso(iso);
	return !Number.isNaN(date.getTime()) && toIso(date) === iso;
}

// The range's bounds when they can be snapped, else undefined ("all time", or an impossible date).
function snappableBounds(
	range: string,
	anchorDate: Date,
	firstDayOfWeek: FirstDayOfWeek
): IsoBounds | undefined {
	const bounds = resolveRangeToDates(range, anchorDate, firstDayOfWeek);
	if (!bounds || (!bounds.start && !bounds.end)) return undefined;
	return isRealDate(bounds.start) && isRealDate(bounds.end) ? bounds : undefined;
}

/**
 * Snap a range expression to whole periods. A range that already lines up is returned unchanged,
 * so a preset like "previous 3 months" keeps its key (and its label in the picker). Otherwise the
 * widened range comes back as an absolute expression ("2026-08-01 to 2026-10-31", "from …",
 * "until …"). "all time", empty input and impossible dates pass through, as at day grain.
 */
export function snapRangeExpression(
	range: string | undefined,
	grain: CalendarGrain,
	anchorDate: Date,
	firstDayOfWeek: FirstDayOfWeek,
	calendar: PeriodCalendar = gregorianCalendar(firstDayOfWeek)
): string | undefined {
	if (!range || grain === 'day') return range;
	const bounds = snappableBounds(range, anchorDate, firstDayOfWeek);
	if (!bounds) return range;
	const snapped = snapBounds(bounds, grain, calendar);
	if (snapped.start === bounds.start && snapped.end === bounds.end) return range;
	return boundsToRangeExpression(snapped);
}

/**
 * Whether `range`, resolved against `anchorDate`, already covers whole `grain` periods. An end at
 * the anchor or the day before counts as fitting: "year to date" at month grain is meant to run
 * January through the current month, so it isn't treated as a range that had to be widened.
 */
export function rangeFitsGrain(
	range: string,
	grain: CalendarGrain,
	anchorDate: Date,
	firstDayOfWeek: FirstDayOfWeek,
	calendar: PeriodCalendar = gregorianCalendar(firstDayOfWeek)
): boolean {
	if (grain === 'day') return true;
	const bounds = snappableBounds(range, anchorDate, firstDayOfWeek);
	if (!bounds) return true;
	const snapped = snapBounds(bounds, grain, calendar);
	const endFollowsAnchor =
		bounds.end === toIso(anchorDate) || bounds.end === toIso(subDays(anchorDate, 1));
	return snapped.start === bounds.start && (endFollowsAnchor || snapped.end === bounds.end);
}

// Whether every `outer` period is made of whole `inner` periods.
function isMadeOf(outer: CalendarGrain, inner: CalendarGrain): boolean {
	if (inner === 'day' || outer === inner) return true;
	// Months, quarters and years don't divide into whole weeks, and weeks only divide into days.
	if (inner === 'week' || outer === 'week' || outer === 'day') return false;
	const nested: CalendarGrain[] = ['month', 'quarter', 'year'];
	return nested.indexOf(outer) >= nested.indexOf(inner);
}

// "Today" values to resolve a range against: period starts, middles and ends, a leap day, and a
// Sunday and a Monday, so a relative range that only lines up on some days still gets caught.
const PROBE_ANCHORS = [
	'2025-01-01',
	'2025-02-14',
	'2025-03-31',
	'2025-05-15',
	'2025-08-31',
	'2025-11-03',
	'2024-02-29',
	'2026-06-07',
	'2026-06-08',
	'2026-12-31'
].map(fromIso);

/**
 * Whether `range` has to be widened to fit whole `grain` periods on some day (see
 * `rangeFitsGrain`). Authors get a warning for these, because the range applied won't be the range
 * they wrote. Project settings aren't available while authoring, so a range is only flagged when
 * it misses under both a Sunday and a Monday week start.
 */
export function rangeNeedsWidening(range: string, grain: CalendarGrain): boolean {
	if (grain === 'day' || !isRecognizedDateRange(range)) return false;
	return (['sunday', 'monday'] as const).every((firstDayOfWeek) => {
		const calendar = gregorianCalendar(firstDayOfWeek);
		return PROBE_ANCHORS.some(
			(anchor) => !rangeFitsGrain(range, grain, anchor, firstDayOfWeek, calendar)
		);
	});
}

/** Whether ranges sliced into `sliceGrain` periods (e.g. a `custom_ranges` entry) can line up with `grain`. */
export function grainFitsInside(sliceGrain: CalendarGrain, grain: CalendarGrain): boolean {
	return isMadeOf(sliceGrain, grain);
}
