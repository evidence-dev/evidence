import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import {
	CALENDAR_GRAINS,
	grainFitsInside,
	gregorianCalendar,
	parseCalendarGrain,
	rangeFitsGrain,
	rangeNeedsWidening,
	snapBounds,
	snapRangeExpression
} from './period-calendar';
import { parseDateStringAsLocalMidnight } from '../../utils/date-utils';
import { parsePeriodKey } from './reporting-periods';

const d = parseDateStringAsLocalMidnight;
const iso = (date: Date) => format(date, 'yyyy-MM-dd');
// Monday, Nov 2 2026
const ANCHOR = d('2026-11-02');

describe('gregorianCalendar', () => {
	it('finds week bounds from the configured first day of week', () => {
		const wednesday = d('2026-11-04');
		const sunday = gregorianCalendar('sunday');
		expect(iso(sunday.startOf(wednesday, 'week'))).toBe('2026-11-01');
		expect(iso(sunday.endOf(wednesday, 'week'))).toBe('2026-11-07');
		const monday = gregorianCalendar('monday');
		expect(iso(monday.startOf(wednesday, 'week'))).toBe('2026-11-02');
		expect(iso(monday.endOf(wednesday, 'week'))).toBe('2026-11-08');
	});

	it('finds month, quarter and year bounds', () => {
		const calendar = gregorianCalendar();
		const date = d('2024-02-14');
		expect(iso(calendar.startOf(date, 'month'))).toBe('2024-02-01');
		expect(iso(calendar.endOf(date, 'month'))).toBe('2024-02-29');
		expect(iso(calendar.startOf(date, 'quarter'))).toBe('2024-01-01');
		expect(iso(calendar.endOf(date, 'quarter'))).toBe('2024-03-31');
		expect(iso(calendar.startOf(date, 'year'))).toBe('2024-01-01');
		expect(iso(calendar.endOf(date, 'year'))).toBe('2024-12-31');
		expect(iso(calendar.startOf(date, 'day'))).toBe('2024-02-14');
		expect(iso(calendar.endOf(date, 'day'))).toBe('2024-02-14');
	});

	it('returns end dates at local midnight so they compare and format like start dates', () => {
		const end = gregorianCalendar().endOf(d('2026-05-10'), 'month');
		expect(end.getHours()).toBe(0);
		expect(end.getMinutes()).toBe(0);
	});

	it('shifts by whole periods in both directions', () => {
		const calendar = gregorianCalendar();
		expect(iso(calendar.shift(d('2026-01-01'), 'quarter', 1))).toBe('2026-04-01');
		expect(iso(calendar.shift(d('2026-01-01'), 'month', -1))).toBe('2025-12-01');
		expect(iso(calendar.shift(d('2026-11-01'), 'week', 2))).toBe('2026-11-15');
	});

	it('labels periods the way period_selector does', () => {
		const calendar = gregorianCalendar();
		expect(calendar.label(d('2026-03-01'), 'month')).toBe('Mar 2026');
		expect(calendar.label(d('2026-04-01'), 'quarter')).toBe('Q2 2026');
		expect(calendar.label(d('2026-01-01'), 'year')).toBe('2026');
		expect(calendar.label(d('2026-11-01'), 'week')).toBe('Week of Nov 1, 2026');
		expect(calendar.label(d('2026-04-01'), 'quarter')).toBe(
			parsePeriodKey('2026-Q2', 'quarter')?.label
		);
		expect(calendar.label(d('2026-11-01'), 'week')).toBe(
			parsePeriodKey('2026-11-01', 'week')?.label
		);
	});

	it('gives short labels for grids grouped by year', () => {
		const calendar = gregorianCalendar();
		expect(calendar.shortLabel(d('2026-03-01'), 'month')).toBe('Mar');
		expect(calendar.shortLabel(d('2026-04-01'), 'quarter')).toBe('Q2');
		expect(calendar.shortLabel(d('2026-01-01'), 'year')).toBe('2026');
	});
});

describe('parseCalendarGrain', () => {
	it('accepts the five grains, case- and whitespace-insensitively', () => {
		for (const grain of CALENDAR_GRAINS) {
			expect(parseCalendarGrain(grain)).toBe(grain);
			expect(parseCalendarGrain(` ${grain.toUpperCase()} `)).toBe(grain);
		}
	});

	it('rejects other date grains, variables and non-strings', () => {
		expect(parseCalendarGrain('hour')).toBeUndefined();
		expect(parseCalendarGrain('day of week')).toBeUndefined();
		expect(parseCalendarGrain('{{grain_selector}}')).toBeUndefined();
		expect(parseCalendarGrain(undefined)).toBeUndefined();
		expect(parseCalendarGrain(3)).toBeUndefined();
	});
});

describe('snapBounds', () => {
	it('widens start back and end forward to whole periods, keeping open ends open', () => {
		const calendar = gregorianCalendar();
		expect(snapBounds({ start: '2025-01-15', end: '2025-02-10' }, 'month', calendar)).toEqual({
			start: '2025-01-01',
			end: '2025-02-28'
		});
		expect(snapBounds({ start: '2025-05-15' }, 'quarter', calendar)).toEqual({
			start: '2025-04-01',
			end: undefined
		});
	});
});

describe('snapRangeExpression', () => {
	const snap = (
		range: string | undefined,
		grain: Parameters<typeof snapRangeExpression>[1],
		firstDayOfWeek: 'sunday' | 'monday' = 'sunday'
	) => snapRangeExpression(range, grain, ANCHOR, firstDayOfWeek);

	it('leaves every range alone at day grain', () => {
		expect(snap('last 30 days', 'day')).toBe('last 30 days');
		expect(snap('2025-01-15 to 2025-02-10', 'day')).toBe('2025-01-15 to 2025-02-10');
	});

	it('keeps a range that already lines up, so a preset keeps its key', () => {
		expect(snap('previous 3 months', 'month')).toBe('previous 3 months');
		expect(snap('this quarter', 'month')).toBe('this quarter');
		expect(snap('previous week', 'week')).toBe('previous week');
		expect(snap('2025-01-01 to 2025-03-31', 'quarter')).toBe('2025-01-01 to 2025-03-31');
	});

	it('widens a rolling range to whole periods', () => {
		// last 3 months on Nov 2 = Aug 3 – Nov 2
		expect(snap('last 3 months', 'month')).toBe('2026-08-01 to 2026-11-30');
		expect(snap('last 30 days', 'quarter')).toBe('2026-10-01 to 2026-12-31');
	});

	it('takes "year to date" through the end of the current period', () => {
		expect(snap('year to date', 'month')).toBe('2026-01-01 to 2026-11-30');
		expect(snap('year to date', 'quarter')).toBe('2026-01-01 to 2026-12-31');
	});

	it('widens literal dates, open-ended ranges included', () => {
		expect(snap('2025-01-15 to 2025-02-10', 'month')).toBe('2025-01-01 to 2025-02-28');
		expect(snap('from 2025-05-15', 'year')).toBe('from 2025-01-01');
		expect(snap('until 2025-05-15', 'quarter')).toBe('until 2025-06-30');
	});

	it('snaps weeks to the configured first day of week', () => {
		expect(snap('2026-11-04 to 2026-11-04', 'week', 'sunday')).toBe('2026-11-01 to 2026-11-07');
		expect(snap('2026-11-04 to 2026-11-04', 'week', 'monday')).toBe('2026-11-02 to 2026-11-08');
	});

	it('passes "all time" and empty input through', () => {
		expect(snap('all time', 'month')).toBe('all time');
		expect(snap(undefined, 'month')).toBeUndefined();
		expect(snap('', 'month')).toBe('');
	});

	it('passes impossible dates through instead of throwing or rolling them over', () => {
		// e.g. a hand-edited URL — left as is, exactly like day grain treats it
		expect(snap('2025-13-01 to 2025-13-31', 'month')).toBe('2025-13-01 to 2025-13-31');
		expect(snap('2025-02-30 to 2025-03-10', 'month')).toBe('2025-02-30 to 2025-03-10');
	});
});

describe('rangeFitsGrain', () => {
	const fits = (range: string, grain: Parameters<typeof rangeFitsGrain>[1]) =>
		rangeFitsGrain(range, grain, ANCHOR, 'sunday');

	it('accepts whole periods, and a range that runs through today', () => {
		expect(fits('previous 3 months', 'month')).toBe(true);
		expect(fits('this month', 'month')).toBe(true);
		expect(fits('year to date', 'month')).toBe(true);
		expect(fits('year to date', 'quarter')).toBe(true);
		expect(fits('all time', 'month')).toBe(true);
	});

	it('rejects a range whose start or fixed end falls mid-period', () => {
		expect(fits('last 3 months', 'month')).toBe(false);
		expect(fits('month to date', 'quarter')).toBe(false);
		expect(fits('2025-01-01 to 2025-02-10', 'month')).toBe(false);
	});
});

describe('rangeNeedsWidening', () => {
	it('accepts ranges that line up', () => {
		expect(rangeNeedsWidening('last 30 days', 'day')).toBe(false);
		expect(rangeNeedsWidening('previous 3 months', 'month')).toBe(false);
		expect(rangeNeedsWidening('this quarter', 'month')).toBe(false);
		expect(rangeNeedsWidening('previous week', 'week')).toBe(false);
		expect(rangeNeedsWidening('previous 4 quarters', 'quarter')).toBe(false);
		expect(rangeNeedsWidening('2025-01-01 to 2025-03-31', 'quarter')).toBe(false);
		expect(rangeNeedsWidening('from 2022-01-01', 'year')).toBe(false);
		expect(rangeNeedsWidening('all time', 'year')).toBe(false);
	});

	it('accepts a range that ends today: "year to date" at month grain is Jan – this month', () => {
		expect(rangeNeedsWidening('year to date', 'month')).toBe(false);
		expect(rangeNeedsWidening('2025-01-01 to today', 'month')).toBe(false);
	});

	it('accepts literal weeks under either first day of week', () => {
		// Sunday–Saturday and Monday–Sunday
		expect(rangeNeedsWidening('2026-11-01 to 2026-11-07', 'week')).toBe(false);
		expect(rangeNeedsWidening('2026-11-02 to 2026-11-08', 'week')).toBe(false);
	});

	it('flags ranges that would be widened', () => {
		expect(rangeNeedsWidening('last 30 days', 'month')).toBe(true);
		expect(rangeNeedsWidening('last 3 months', 'month')).toBe(true);
		expect(rangeNeedsWidening('previous week', 'month')).toBe(true);
		expect(rangeNeedsWidening('this month', 'week')).toBe(true);
		expect(rangeNeedsWidening('previous 3 months', 'quarter')).toBe(true);
		expect(rangeNeedsWidening('2025-01-15 to 2025-03-31', 'month')).toBe(true);
		expect(rangeNeedsWidening('2025-01-01 to 2025-03-30', 'month')).toBe(true);
		expect(rangeNeedsWidening('2026-11-04 to 2026-11-10', 'week')).toBe(true);
	});

	it('leaves unrecognized input to the existing range validation', () => {
		expect(rangeNeedsWidening('last 7 dayz', 'month')).toBe(false);
	});
});

describe('grainFitsInside', () => {
	it('knows which periods are made of whole smaller periods', () => {
		expect(grainFitsInside('year', 'month')).toBe(true);
		expect(grainFitsInside('quarter', 'month')).toBe(true);
		expect(grainFitsInside('week', 'week')).toBe(true);
		expect(grainFitsInside('month', 'week')).toBe(false);
		expect(grainFitsInside('quarter', 'year')).toBe(false);
		expect(grainFitsInside('week', 'month')).toBe(false);
		expect(grainFitsInside('month', 'day')).toBe(true);
	});
});
