import {
	addDays,
	endOfMonth,
	endOfQuarter,
	endOfWeek,
	endOfYear,
	format,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
	startOfDay,
	subDays,
	startOfYear,
	subMonths,
	subQuarters,
	subWeeks,
	subYears
} from 'date-fns';
import { parseDateStringAsLocalMidnight } from '../../utils/date-utils';

/**
 * Reporting periods for `workflow.period`. Separate from `date-options.ts`,
 * whose ranges are relative and open-ended ("last 30 days"): a reporting period
 * is a finished calendar bucket, so a report about it never changes.
 */

/** The temporal grains from `DATE_GRAIN_DEFINITIONS`, minus `hour`. */
export const PERIOD_GRAINS = ['day', 'week', 'month', 'quarter', 'year'] as const;

export type PeriodGrain = (typeof PERIOD_GRAINS)[number];

export const DEFAULT_PERIOD_GRAIN: PeriodGrain = 'month';
export const DEFAULT_PERIOD_COUNT = 12;

/** Upper bound on `periods`, so a typo can't build a list big enough to hang the page. */
export const MAX_PERIOD_COUNT = 500;

/**
 * The id of the input a `workflow.period` frontmatter block creates. Fixed
 * rather than configurable so `{{ period.label }}` always means the same thing.
 */
export const WORKFLOW_PERIOD_FILTER_ID = 'period';

export type FirstDayOfWeek = 'sunday' | 'monday';

export type ReportingPeriod = {
	/** Stable, URL-safe identifier, e.g. `2026-07`. Unique within a grain. */
	key: string;
	/** Display label, e.g. `Jul 2026`. */
	label: string;
	/** Inclusive ISO start date, e.g. `2026-07-01`. */
	start: string;
	/** Inclusive ISO end date, e.g. `2026-07-31`. */
	end: string;
};

export function isPeriodGrain(grain: unknown): grain is PeriodGrain {
	return typeof grain === 'string' && (PERIOD_GRAINS as readonly string[]).includes(grain);
}

const toIso = (date: Date) => format(date, 'yyyy-MM-dd');

const weekStartsOn = (firstDayOfWeek: FirstDayOfWeek) => (firstDayOfWeek === 'monday' ? 1 : 0);

function periodStart(date: Date, grain: PeriodGrain, firstDayOfWeek: FirstDayOfWeek): Date {
	switch (grain) {
		case 'day':
			return startOfDay(date);
		case 'week':
			return startOfWeek(date, { weekStartsOn: weekStartsOn(firstDayOfWeek) });
		case 'month':
			return startOfMonth(date);
		case 'quarter':
			return startOfQuarter(date);
		case 'year':
			return startOfYear(date);
	}
}

function periodEnd(start: Date, grain: PeriodGrain, firstDayOfWeek: FirstDayOfWeek): Date {
	switch (grain) {
		case 'day':
			return start;
		case 'week':
			return endOfWeek(start, { weekStartsOn: weekStartsOn(firstDayOfWeek) });
		case 'month':
			return endOfMonth(start);
		case 'quarter':
			return endOfQuarter(start);
		case 'year':
			return endOfYear(start);
	}
}

function previousPeriodStart(start: Date, grain: PeriodGrain): Date {
	switch (grain) {
		case 'day':
			return subDays(start, 1);
		case 'week':
			return subWeeks(start, 1);
		case 'month':
			return subMonths(start, 1);
		case 'quarter':
			return subQuarters(start, 1);
		case 'year':
			return subYears(start, 1);
	}
}

function periodKey(start: Date, grain: PeriodGrain): string {
	switch (grain) {
		case 'day':
			return format(start, 'yyyy-MM-dd');
		// Start date, not a week number: numbering is Monday-based by definition
		// and so cannot round-trip a Sunday-anchored week.
		case 'week':
			return format(start, 'yyyy-MM-dd');
		case 'month':
			return format(start, 'yyyy-MM');
		case 'quarter':
			return format(start, "yyyy-'Q'Q");
		case 'year':
			return format(start, 'yyyy');
	}
}

function periodLabel(start: Date, grain: PeriodGrain): string {
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
}

function toPeriod(
	start: Date,
	grain: PeriodGrain,
	firstDayOfWeek: FirstDayOfWeek
): ReportingPeriod {
	return {
		key: periodKey(start, grain),
		label: periodLabel(start, grain),
		start: toIso(start),
		end: toIso(periodEnd(start, grain, firstDayOfWeek))
	};
}

export type BuildReportingPeriodsOptions = {
	/** Falls back to `month` when absent or unrecognized. */
	grain?: string;
	count?: number;
	/** "Now" for the purpose of deciding which periods have finished. */
	anchorDate?: Date;
	firstDayOfWeek?: FirstDayOfWeek;
};

/**
 * The most recent complete periods, newest first. A period counts as complete
 * only once the anchor has passed its last day — a report for "this month"
 * would otherwise change under the reader.
 */
export function buildReportingPeriods({
	grain,
	count = DEFAULT_PERIOD_COUNT,
	anchorDate = new Date(),
	firstDayOfWeek = 'sunday'
}: BuildReportingPeriodsOptions = {}): ReportingPeriod[] {
	const resolvedGrain = isPeriodGrain(grain) ? grain : DEFAULT_PERIOD_GRAIN;
	const requested = Number.isFinite(count) ? Math.floor(count) : DEFAULT_PERIOD_COUNT;
	const total = Math.min(MAX_PERIOD_COUNT, Math.max(1, requested));

	// Step back one from the anchor's own period, which is still in progress.
	let start = previousPeriodStart(
		periodStart(anchorDate, resolvedGrain, firstDayOfWeek),
		resolvedGrain
	);

	const periods: ReportingPeriod[] = [];
	for (let i = 0; i < total; i++) {
		periods.push(toPeriod(start, resolvedGrain, firstDayOfWeek));
		start = previousPeriodStart(start, resolvedGrain);
	}
	return periods;
}

const KEY_PATTERNS: Record<PeriodGrain, RegExp> = {
	day: /^\d{4}-\d{2}-\d{2}$/,
	week: /^\d{4}-\d{2}-\d{2}$/,
	month: /^\d{4}-\d{2}$/,
	quarter: /^\d{4}-Q[1-4]$/,
	year: /^\d{4}$/
};

/**
 * Resolve a period key, including keys outside the offered window so a shared
 * URL still works. Undefined for anything that isn't a real date at this grain.
 */
export function parsePeriodKey(
	key: string | undefined,
	grain: string | undefined,
	firstDayOfWeek: FirstDayOfWeek = 'sunday'
): ReportingPeriod | undefined {
	const resolvedGrain = isPeriodGrain(grain) ? grain : DEFAULT_PERIOD_GRAIN;
	if (!key || !KEY_PATTERNS[resolvedGrain].test(key)) return undefined;

	const isoDate =
		resolvedGrain === 'month'
			? `${key}-01`
			: resolvedGrain === 'year'
				? `${key}-01-01`
				: resolvedGrain === 'quarter'
					? `${key.slice(0, 4)}-${String((Number(key.slice(6)) - 1) * 3 + 1).padStart(2, '0')}-01`
					: key;

	const parsed = parseDateStringAsLocalMidnight(isoDate);
	if (Number.isNaN(parsed.getTime())) return undefined;
	// Impossible dates roll over (Feb 30 -> Mar 2); reject rather than resolve.
	if (toIso(parsed) !== isoDate) return undefined;

	return toPeriod(
		periodStart(parsed, resolvedGrain, firstDayOfWeek),
		resolvedGrain,
		firstDayOfWeek
	);
}

/** A period boundary formatted for prose, e.g. `Jul 1, 2026`. */
export function periodBoundaryLabel(isoDate: string): string {
	return format(parseDateStringAsLocalMidnight(isoDate), 'MMM d, yyyy');
}

/**
 * A period as a closed range (`2026-07-01 to 2026-07-31`) — valid input to
 * `processDateRange`, which is where the dialect-aware SQL comes from.
 */
export function periodToRangeExpression(period: ReportingPeriod): string {
	return `${period.start} to ${period.end}`;
}

/** The period immediately before `period`, at the same grain. */
export function previousPeriod(
	period: ReportingPeriod,
	grain: PeriodGrain,
	firstDayOfWeek: FirstDayOfWeek = 'sunday'
): ReportingPeriod {
	const start = previousPeriodStart(parseDateStringAsLocalMidnight(period.start), grain);
	return toPeriod(start, grain, firstDayOfWeek);
}

/** The period immediately after `period`, at the same grain. */
export function nextPeriod(
	period: ReportingPeriod,
	grain: PeriodGrain,
	firstDayOfWeek: FirstDayOfWeek = 'sunday'
): ReportingPeriod {
	const start = addDays(parseDateStringAsLocalMidnight(period.end), 1);
	return toPeriod(periodStart(start, grain, firstDayOfWeek), grain, firstDayOfWeek);
}
