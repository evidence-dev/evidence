import { format } from 'date-fns';
import { PRESET_DEFINITIONS } from '../../common/date-options';
import type { CalendarGrain, IsoBounds, PeriodCalendar } from '../../common/period-calendar';
import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';

type Preset = { key: string; label: string };

/**
 * Default presets per grain, in whole periods. Rolling presets ("Last 30 Days") don't line up with
 * a grain, so `previous N <unit>` (complete periods) stands in for them. The current period is
 * offered as "This …", since it's selected whole either way.
 */
const GRAIN_PRESET_KEYS: Record<Exclude<CalendarGrain, 'day'>, string[]> = {
	week: [
		'this week',
		'previous week',
		'previous 4 weeks',
		'previous 13 weeks',
		'previous 52 weeks',
		'all time'
	],
	month: [
		'this month',
		'previous month',
		'previous 3 months',
		'previous 6 months',
		'previous 12 months',
		'year to date',
		'all time'
	],
	quarter: [
		'this quarter',
		'previous quarter',
		'previous 4 quarters',
		'year to date',
		'previous year',
		'all time'
	],
	year: ['this year', 'previous year', 'previous 3 years', 'previous 5 years', 'all time']
};

const PRESET_LABELS = new Map<string, string>(PRESET_DEFINITIONS.map((p) => [p.key, p.label]));
const titleCase = (text: string) => text.replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** The default preset list for a grain other than day. */
export function presetsForGrain(grain: Exclude<CalendarGrain, 'day'>): Preset[] {
	return GRAIN_PRESET_KEYS[grain].map((key) => ({
		key,
		label: PRESET_LABELS.get(key) ?? titleCase(key)
	}));
}

/** Label for the button that selects the current period ("Today" at day grain). */
export const CURRENT_PERIOD_LABEL: Record<CalendarGrain, string> = {
	day: 'Today',
	week: 'This Week',
	month: 'This Month',
	quarter: 'This Quarter',
	year: 'This Year'
};

const fromIso = parseDateStringAsLocalMidnight;
const longDate = (iso: string) => format(fromIso(iso), 'MMM d, yyyy');

/**
 * Button text for a selection of whole periods: `Mar 2026`, `Mar 2026 – May 2026`, `Q4 2025 – Q1
 * 2026`, `From 2024`. A single week reads `Week of Mar 1, 2026`; several weeks show their dates.
 */
export function selectionLabel(
	{ start, end }: IsoBounds,
	grain: Exclude<CalendarGrain, 'day'>,
	calendar: PeriodCalendar
): string | undefined {
	const label = (iso: string) => calendar.label(calendar.startOf(fromIso(iso), grain), grain);
	if (start && end) {
		const first = label(start);
		const last = label(end);
		if (first === last) return first;
		return grain === 'week' ? `${longDate(start)} – ${longDate(end)}` : `${first} – ${last}`;
	}
	if (start) return `From ${grain === 'week' ? longDate(start) : label(start)}`;
	if (end) return `Until ${grain === 'week' ? longDate(end) : label(end)}`;
	return undefined;
}
