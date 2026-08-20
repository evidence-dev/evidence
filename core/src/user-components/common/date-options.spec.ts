import { describe, it, expect } from 'vitest';
import {
	parseDateRange,
	resolveRangeToDates,
	dateRangeToDates,
	processDateRange,
	getDefaultFormatForDateGrain,
	getDateGrainSql,
	getOffsetFunction,
	isRecognizedDateRange,
	DEFAULT_VISIBLE_PRESET_DEFINITIONS,
	PRESET_DEFINITIONS,
	isValidDateRangeExpression
} from './date-options';

describe('parseDateRange', () => {
	it('parses single-day presets', () => {
		const today = parseDateRange('today');
		expect(today).toBeTruthy();
		expect(today!.type).toBe('relative');
		expect(today!.periodGrain).toBe('day');
		expect(today!.periodCount).toBe(1);

		const yesterday = parseDateRange('yesterday');
		expect(yesterday).toBeTruthy();
		expect(yesterday!.type).toBe('previous');
		expect(yesterday!.periodGrain).toBe('day');
		expect(yesterday!.periodCount).toBe(1);
	});

	it('parses to-date presets', () => {
		const parsed = parseDateRange('month to date');
		expect(parsed).toBeTruthy();
		expect(parsed!.type).toBe('to_date');
		expect(parsed!.periodGrain).toBe('month');
	});

	it('parses full-month presets', () => {
		const thisMonth = parseDateRange('this month');
		expect(thisMonth).toBeTruthy();
		expect(thisMonth!.type).toBe('relative');
		expect(thisMonth!.periodGrain).toBe('month');
		expect(thisMonth!.periodCount).toBe(1);

		const nextMonth = parseDateRange('next month');
		expect(nextMonth).toBeTruthy();
		expect(nextMonth!.type).toBe('relative');
		expect(nextMonth!.periodGrain).toBe('month');
		expect(nextMonth!.periodCount).toBe(1);
	});

	it('parses full-period presets for week, quarter, and year', () => {
		const thisWeek = parseDateRange('this week');
		expect(thisWeek).toBeTruthy();
		expect(thisWeek!.type).toBe('relative');
		expect(thisWeek!.periodGrain).toBe('week');
		expect(thisWeek!.periodCount).toBe(1);

		const nextWeek = parseDateRange('next week');
		expect(nextWeek).toBeTruthy();
		expect(nextWeek!.type).toBe('relative');
		expect(nextWeek!.periodGrain).toBe('week');
		expect(nextWeek!.periodCount).toBe(1);

		const thisQuarter = parseDateRange('this quarter');
		expect(thisQuarter).toBeTruthy();
		expect(thisQuarter!.type).toBe('relative');
		expect(thisQuarter!.periodGrain).toBe('quarter');
		expect(thisQuarter!.periodCount).toBe(1);

		const nextQuarter = parseDateRange('next quarter');
		expect(nextQuarter).toBeTruthy();
		expect(nextQuarter!.type).toBe('relative');
		expect(nextQuarter!.periodGrain).toBe('quarter');
		expect(nextQuarter!.periodCount).toBe(1);

		const thisYear = parseDateRange('this year');
		expect(thisYear).toBeTruthy();
		expect(thisYear!.type).toBe('relative');
		expect(thisYear!.periodGrain).toBe('year');
		expect(thisYear!.periodCount).toBe(1);

		const nextYear = parseDateRange('next year');
		expect(nextYear).toBeTruthy();
		expect(nextYear!.type).toBe('relative');
		expect(nextYear!.periodGrain).toBe('year');
		expect(nextYear!.periodCount).toBe(1);
	});

	it('parses relative Last N periods (weeks)', () => {
		const parsed = parseDateRange('Last 18 weeks');
		expect(parsed).toBeTruthy();
		expect(parsed!.type).toBe('relative');
		expect(parsed!.periodGrain).toBe('week');
		expect(parsed!.periodCount).toBe(18);
	});

	it('parses previous period (quarter)', () => {
		const parsed = parseDateRange('Previous quarter');
		expect(parsed).toBeTruthy();
		expect(parsed!.type).toBe('previous');
		expect(parsed!.periodGrain).toBe('quarter');
	});

	it('returns null for all time', () => {
		const parsed = parseDateRange('all time');
		expect(parsed).toBeNull();
	});

	it('parses explicit date ranges for comparison logic', () => {
		// Test the specific case mentioned: 2023-03-14 to 2023-12-06
		const startDate = new Date('2023-03-14');
		const endDate = new Date('2023-12-06');
		const expectedDayCount =
			Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

		const parsed = parseDateRange('2023-03-14 to 2023-12-06');
		expect(parsed).toEqual({
			type: 'relative',
			periodGrain: 'day',
			periodCount: expectedDayCount, // Calculated dynamically: March 14 to Dec 6 inclusive
			isToDate: false
		});

		// Test a shorter range
		const shortStartDate = new Date('2023-01-01');
		const shortEndDate = new Date('2023-01-07');
		const expectedShortDayCount =
			Math.ceil((shortEndDate.getTime() - shortStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		const shortRange = parseDateRange('2023-01-01 to 2023-01-07');
		expect(shortRange).toEqual({
			type: 'relative',
			periodGrain: 'day',
			periodCount: expectedShortDayCount, // Calculated dynamically: 7 days inclusive
			isToDate: false
		});

		// Test single day range
		const singleDay = parseDateRange('2023-05-15 to 2023-05-15');
		expect(singleDay).toEqual({
			type: 'relative',
			periodGrain: 'day',
			periodCount: 1, // 1 day
			isToDate: false
		});
	});

	it('parses prefixed and dynamic closed ranges for comparison logic', () => {
		const originalTimezone = process.env.TZ;
		process.env.TZ = 'America/New_York';
		try {
			const anchor = new Date('2025-06-15T12:00:00Z');

			expect(parseDateRange('from 2024-01-01 to 2024-03-31', anchor)).toEqual({
				type: 'relative',
				periodGrain: 'day',
				periodCount: 91,
				isToDate: false
			});
			expect(processDateRange('2024-01-01 to today', 'order_date', anchor)).toMatchObject({
				type: 'relative',
				periodGrain: 'day',
				periodCount: 532
			});
			expect(parseDateRange('from 2024-01-01 to yesterday', anchor)).toMatchObject({
				periodGrain: 'day',
				periodCount: 531
			});
		} finally {
			if (originalTimezone === undefined) delete process.env.TZ;
			else process.env.TZ = originalTimezone;
		}
	});
});

describe('resolveRangeToDates/dateRangeToDates', () => {
	const fixedToday = new Date('2024-05-15T12:00:00Z');

	it('resolves today and yesterday to single-day ranges', () => {
		expect(resolveRangeToDates('today', fixedToday)).toEqual({
			start: '2024-05-15',
			end: '2024-05-15'
		});
		expect(resolveRangeToDates('yesterday', fixedToday)).toEqual({
			start: '2024-05-14',
			end: '2024-05-14'
		});
	});

	it('resolves last 7 days to concrete ISO dates (inclusive)', () => {
		const r = resolveRangeToDates('last 7 days', fixedToday)!;
		expect(r).toBeTruthy();
		expect(r.end).toBe('2024-05-15');
		expect(r.start).toBe('2024-05-09');
	});

	it('resolves week to date (Sunday start)', () => {
		const r = resolveRangeToDates('week to date', fixedToday)!;
		expect(r.start).toBe('2024-05-12'); // Sunday of that week
		expect(r.end).toBe('2024-05-15');
	});

	it('resolves previous month to first and last day of prior month', () => {
		const r = resolveRangeToDates('previous month', fixedToday)!;
		expect(r.start).toBe('2024-04-01');
		expect(r.end).toBe('2024-04-30');
	});

	it('resolves this month to full current month boundaries', () => {
		const r = resolveRangeToDates('this month', fixedToday)!;
		expect(r.start).toBe('2024-05-01');
		expect(r.end).toBe('2024-05-31');
	});

	it('resolves next month to full upcoming month boundaries', () => {
		const r = resolveRangeToDates('next month', fixedToday)!;
		expect(r.start).toBe('2024-06-01');
		expect(r.end).toBe('2024-06-30');
	});

	it('resolves this and next week to full week boundaries', () => {
		const thisWeek = resolveRangeToDates('this week', fixedToday)!;
		expect(thisWeek.start).toBe('2024-05-12');
		expect(thisWeek.end).toBe('2024-05-18');

		const nextWeek = resolveRangeToDates('next week', fixedToday)!;
		expect(nextWeek.start).toBe('2024-05-19');
		expect(nextWeek.end).toBe('2024-05-25');
	});

	it('resolves this and next quarter to full quarter boundaries', () => {
		const thisQuarter = resolveRangeToDates('this quarter', fixedToday)!;
		expect(thisQuarter.start).toBe('2024-04-01');
		expect(thisQuarter.end).toBe('2024-06-30');

		const nextQuarter = resolveRangeToDates('next quarter', fixedToday)!;
		expect(nextQuarter.start).toBe('2024-07-01');
		expect(nextQuarter.end).toBe('2024-09-30');
	});

	it('resolves this and next year to full year boundaries', () => {
		const thisYear = resolveRangeToDates('this year', fixedToday)!;
		expect(thisYear.start).toBe('2024-01-01');
		expect(thisYear.end).toBe('2024-12-31');

		const nextYear = resolveRangeToDates('next year', fixedToday)!;
		expect(nextYear.start).toBe('2025-01-01');
		expect(nextYear.end).toBe('2025-12-31');
	});

	it('supports closed ISO ranges', () => {
		const r = resolveRangeToDates('2020-01-01 to 2023-04-10', fixedToday)!;
		expect(r.start).toBe('2020-01-01');
		expect(r.end).toBe('2023-04-10');
	});

	it('supports open-ended ranges (from)', () => {
		const r = resolveRangeToDates('from 2020-01-01', fixedToday)!;
		expect(r.start).toBe('2020-01-01');
		expect(r.end).toBeUndefined();
	});

	it('supports open-ended ranges (until)', () => {
		const r = resolveRangeToDates('until 2020-01-01', fixedToday)!;
		expect(r.start).toBeUndefined();
		expect(r.end).toBe('2020-01-01');
	});

	it('alias dateRangeToDates returns same values', () => {
		const r1 = resolveRangeToDates('last 7 days', fixedToday)!;
		const r2 = dateRangeToDates('last 7 days', fixedToday)!;
		expect(r1).toEqual(r2);
	});
});

describe('processDateRange (comprehensive date processing)', () => {
	const dateCol = 'event_date';
	const fixedToday = new Date('2024-05-15T12:00:00Z');

	it('processes today and yesterday', () => {
		const today = processDateRange('today', dateCol, fixedToday);
		expect(today.whereClause).toBe(
			"event_date >= toDate('2024-05-15') AND event_date <= toDate('2024-05-15')"
		);
		expect(today.betweenFragment).toBe("BETWEEN toDate('2024-05-15') AND toDate('2024-05-15')");

		const yesterday = processDateRange('yesterday', dateCol, fixedToday);
		expect(yesterday.whereClause).toBe(
			"event_date >= toDate('2024-05-14') AND event_date <= toDate('2024-05-14')"
		);
		expect(yesterday.betweenFragment).toBe("BETWEEN toDate('2024-05-14') AND toDate('2024-05-14')");
	});

	it('processes closed ISO ranges', () => {
		const res = processDateRange('2020-01-01 to 2020-01-31', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2020-01-01') AND event_date <= toDate('2020-01-31')"
		);
		expect(res.betweenFragment).toBe("BETWEEN toDate('2020-01-01') AND toDate('2020-01-31')");
		expect(res.startDate).toBe('2020-01-01');
		expect(res.endDate).toBe('2020-01-31');
		expect(res.startDateSql).toBe("toDate('2020-01-01')");
		expect(res.endDateSql).toBe("toDate('2020-01-31')");
		expect(res.range).toBe('2020-01-01 to 2020-01-31');
	});

	it('processes open-ended ranges (from)', () => {
		const res = processDateRange('from 2020-01-01', dateCol, fixedToday);
		expect(res.whereClause).toBe("event_date >= toDate('2020-01-01')");
		expect(res.betweenFragment).toBe(">= toDate('2020-01-01')");
		expect(res.startDate).toBe('2020-01-01');
		expect(res.endDate).toBeUndefined();
	});

	it('processes open-ended ranges (until)', () => {
		const res = processDateRange('until 2020-01-01', dateCol, fixedToday);
		expect(res.whereClause).toBe("event_date <= toDate('2020-01-01')");
		expect(res.betweenFragment).toBe("<= toDate('2020-01-01')");
		expect(res.startDate).toBeUndefined();
		expect(res.endDate).toBe('2020-01-01');
	});

	it('processes month to date', () => {
		const res = processDateRange('month to date', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-05-01') AND event_date <= toDate('2024-05-15')"
		);
		expect(res.type).toBe('to_date');
		expect(res.periodGrain).toBe('month');
	});

	it('processes previous month', () => {
		const res = processDateRange('previous month', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-04-01') AND event_date <= toDate('2024-04-30')"
		);
		expect(res.type).toBe('previous');
		expect(res.periodGrain).toBe('month');
	});

	it('processes this month as full month', () => {
		const res = processDateRange('this month', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-05-01') AND event_date <= toDate('2024-05-31')"
		);
		expect(res.type).toBe('relative');
		expect(res.periodGrain).toBe('month');
		expect(res.periodCount).toBe(1);
	});

	it('processes next month as full upcoming month', () => {
		const res = processDateRange('next month', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-06-01') AND event_date <= toDate('2024-06-30')"
		);
		expect(res.type).toBe('relative');
		expect(res.periodGrain).toBe('month');
		expect(res.periodCount).toBe(1);
	});

	it('processes this week as full current week', () => {
		const res = processDateRange('this week', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-05-12') AND event_date <= toDate('2024-05-18')"
		);
		expect(res.type).toBe('relative');
		expect(res.periodGrain).toBe('week');
		expect(res.periodCount).toBe(1);
	});

	it('processes next quarter as full upcoming quarter', () => {
		const res = processDateRange('next quarter', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-07-01') AND event_date <= toDate('2024-09-30')"
		);
		expect(res.type).toBe('relative');
		expect(res.periodGrain).toBe('quarter');
		expect(res.periodCount).toBe(1);
	});

	it('processes next year as full upcoming year', () => {
		const res = processDateRange('next year', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2025-01-01') AND event_date <= toDate('2025-12-31')"
		);
		expect(res.type).toBe('relative');
		expect(res.periodGrain).toBe('year');
		expect(res.periodCount).toBe(1);
	});

	it('processes last 30 days', () => {
		const res = processDateRange('last 30 days', dateCol, fixedToday);
		expect(res.whereClause).toBe(
			"event_date >= toDate('2024-04-16') AND event_date <= toDate('2024-05-15')"
		);
		expect(res.type).toBe('relative');
		expect(res.periodGrain).toBe('day');
		expect(res.periodCount).toBe(30);
	});

	it('handles all time', () => {
		const res = processDateRange('all time', dateCol, fixedToday);
		expect(res.whereClause).toBe('');
		expect(res.betweenFragment).toBe('');
		expect(res.startDate).toBeUndefined();
		expect(res.endDate).toBeUndefined();
		expect(res.type).toBe('all_time');
	});

	it('works without column (no WHERE clause)', () => {
		const res = processDateRange('last 7 days', undefined, fixedToday);
		expect(res.whereClause).toBe('');
		expect(res.betweenFragment).toBe("BETWEEN toDate('2024-05-09') AND toDate('2024-05-15')");
		expect(res.startDate).toBe('2024-05-09');
		expect(res.endDate).toBe('2024-05-15');
	});

	it('handles explicit date ranges for comparison logic (bug fix)', () => {
		// Test the specific bug case: explicit date range should provide correct metadata for comparisons
		const startDate = new Date('2023-03-14');
		const endDate = new Date('2023-12-06');
		const expectedDayCount =
			Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

		const result = processDateRange('2023-03-14 to 2023-12-06', 'date_column', fixedToday);

		// Should have correct metadata for comparison calculations (now flatter)
		expect(result.type).toBe('relative');
		expect(result.periodGrain).toBe('day');
		expect(result.periodCount).toBe(expectedDayCount); // Calculated dynamically: March 14 to Dec 6 inclusive
		expect(result.isToDate).toBe(false);

		// Should have correct dates
		expect(result.startDate).toBe('2023-03-14');
		expect(result.endDate).toBe('2023-12-06');

		// Should have correct formatted dates
		expect(result.startDateSql).toBe("toDate('2023-03-14')");
		expect(result.endDateSql).toBe("toDate('2023-12-06')");

		// Should generate correct WHERE clause
		expect(result.whereClause).toBe(
			"date_column >= toDate('2023-03-14') AND date_column <= toDate('2023-12-06')"
		);
	});
});

describe('getDefaultFormatForDateGrain', () => {
	it('returns mmm for month of year', () => {
		expect(getDefaultFormatForDateGrain('month of year')).toBe('mmm');
	});

	it('returns ddd for day of week', () => {
		expect(getDefaultFormatForDateGrain('day of week')).toBe('ddd');
	});

	it('returns "Q"0 for quarter of year', () => {
		expect(getDefaultFormatForDateGrain('quarter of year')).toBe('"Q"0');
	});

	it('returns num0 for week of year', () => {
		expect(getDefaultFormatForDateGrain('week of year')).toBe('num0');
	});

	it('returns MMM yyyy for month (temporal)', () => {
		expect(getDefaultFormatForDateGrain('month')).toBe('MMM yyyy');
	});

	it('returns undefined when date_grain is undefined', () => {
		expect(getDefaultFormatForDateGrain(undefined)).toBeUndefined();
	});

	it('returns undefined for invalid/unknown grain', () => {
		expect(getDefaultFormatForDateGrain('not_a_grain')).toBeUndefined();
	});
});

describe('DEFAULT_VISIBLE_PRESET_DEFINITIONS', () => {
	it('excludes opt-in single-day and forward-looking presets by default', () => {
		const hiddenKeys = new Set([
			'today',
			'yesterday',
			'this week',
			'next week',
			'this month',
			'next month',
			'this quarter',
			'next quarter',
			'this year',
			'next year'
		]);
		const visibleKeys = DEFAULT_VISIBLE_PRESET_DEFINITIONS.map((p) => p.key);

		for (const key of hiddenKeys) {
			expect(visibleKeys).not.toContain(key);
		}
		expect(visibleKeys).toContain('month to date');
		expect(visibleKeys).toContain('previous month');
		expect(visibleKeys).toContain('all time');
	});

	it('keeps today and yesterday at the top of the full preset list', () => {
		expect(PRESET_DEFINITIONS.slice(0, 2).map((p) => p.key)).toEqual(['today', 'yesterday']);
	});
});

describe('getDateGrainSql', () => {
	it('emits toStartOfHour for hour grain', () => {
		expect(getDateGrainSql('hour', 'order_date')).toBe('toStartOfHour(order_date)');
	});

	it('emits toStartOfDay for day grain', () => {
		expect(getDateGrainSql('day', 'order_date')).toBe('toStartOfDay(order_date)');
	});

	it('emits toStartOfWeek with mode 0 for default (sunday)', () => {
		expect(getDateGrainSql('week', 'order_date')).toBe('toStartOfWeek(order_date, 0)');
	});

	it('emits toStartOfWeek with mode 0 when firstDayOfWeek is sunday', () => {
		expect(getDateGrainSql('week', 'order_date', 'sunday')).toBe('toStartOfWeek(order_date, 0)');
	});

	it('emits toStartOfWeek with mode 5 when firstDayOfWeek is monday', () => {
		expect(getDateGrainSql('week', 'order_date', 'monday')).toBe('toStartOfWeek(order_date, 5)');
	});

	it('emits toStartOfMonth for month grain', () => {
		expect(getDateGrainSql('month', 'order_date')).toBe('toStartOfMonth(order_date)');
	});

	it('emits toStartOfQuarter for quarter grain', () => {
		expect(getDateGrainSql('quarter', 'order_date')).toBe('toStartOfQuarter(order_date)');
	});

	it('emits toStartOfYear for year grain', () => {
		expect(getDateGrainSql('year', 'order_date')).toBe('toStartOfYear(order_date)');
	});

	it('emits toDayOfWeek with mode 3 for sunday-first', () => {
		expect(getDateGrainSql('day of week', 'order_date', 'sunday')).toBe(
			'toDayOfWeek(order_date, 3)'
		);
	});

	it('emits toDayOfWeek with mode 0 for monday-first', () => {
		expect(getDateGrainSql('day of week', 'order_date', 'monday')).toBe(
			'toDayOfWeek(order_date, 0)'
		);
	});

	it('emits toDayOfMonth for day-of-month grain', () => {
		expect(getDateGrainSql('day of month', 'order_date')).toBe('toDayOfMonth(order_date)');
	});

	it('emits toDayOfYear for day-of-year grain', () => {
		expect(getDateGrainSql('day of year', 'order_date')).toBe('toDayOfYear(order_date)');
	});

	it('emits toWeek with mode 0 for week-of-year sunday-first', () => {
		expect(getDateGrainSql('week of year', 'order_date', 'sunday')).toBe('toWeek(order_date, 0)');
	});

	it('emits toWeek with mode 5 for week-of-year monday-first', () => {
		expect(getDateGrainSql('week of year', 'order_date', 'monday')).toBe('toWeek(order_date, 5)');
	});

	it('emits toMonth for month-of-year grain', () => {
		expect(getDateGrainSql('month of year', 'order_date')).toBe('toMonth(order_date)');
	});

	it('emits toQuarter for quarter-of-year grain', () => {
		expect(getDateGrainSql('quarter of year', 'order_date')).toBe('toQuarter(order_date)');
	});

	it('returns the column name unchanged when grain is undefined', () => {
		expect(getDateGrainSql(undefined, 'order_date')).toBe('order_date');
	});

	it('returns the column name unchanged when grain is unknown', () => {
		expect(getDateGrainSql('decade', 'order_date')).toBe('order_date');
	});

	it('preserves complex column expressions', () => {
		expect(getDateGrainSql('month', 'COALESCE(order_date, created_at)')).toBe(
			'toStartOfMonth(COALESCE(order_date, created_at))'
		);
	});
});

describe('getOffsetFunction', () => {
	it('returns addYears for prior year regardless of grain', () => {
		expect(getOffsetFunction('prior year')).toBe('addYears');
		expect(getOffsetFunction('prior year', 'month')).toBe('addYears');
		expect(getOffsetFunction('prior year', 'day')).toBe('addYears');
	});

	it('returns addDays for prior period day', () => {
		expect(getOffsetFunction('prior period', 'day')).toBe('addDays');
	});

	it('returns addWeeks for prior period week', () => {
		expect(getOffsetFunction('prior period', 'week')).toBe('addWeeks');
	});

	it('returns addMonths for prior period month', () => {
		expect(getOffsetFunction('prior period', 'month')).toBe('addMonths');
	});

	it('returns addQuarters for prior period quarter', () => {
		expect(getOffsetFunction('prior period', 'quarter')).toBe('addQuarters');
	});

	it('returns addYears for prior period year', () => {
		expect(getOffsetFunction('prior period', 'year')).toBe('addYears');
	});

	it('defaults to addYears for prior period with unknown grain', () => {
		expect(getOffsetFunction('prior period', 'decade')).toBe('addYears');
		expect(getOffsetFunction('prior period')).toBe('addYears');
	});

	it('defaults to addYears for unknown comparison', () => {
		expect(getOffsetFunction('something else')).toBe('addYears');
	});
});

describe('processDateRange SQL fragments', () => {
	const today = new Date(2026, 3, 27);

	it('wraps resolved start/end in toDate() for SQL', () => {
		const result = processDateRange('2025-01-01 to 2025-03-31', undefined, today, 'sunday');
		expect(result.startDateSql).toBe("toDate('2025-01-01')");
		expect(result.endDateSql).toBe("toDate('2025-03-31')");
	});

	it('builds a BETWEEN where clause when both dates resolve and a column is given', () => {
		const result = processDateRange('2025-01-01 to 2025-03-31', 'order_date', today, 'sunday');
		expect(result.whereClause).toBe(
			"order_date >= toDate('2025-01-01') AND order_date <= toDate('2025-03-31')"
		);
		expect(result.betweenFragment).toBe("BETWEEN toDate('2025-01-01') AND toDate('2025-03-31')");
	});

	it('builds a >= where clause for open-ended from ranges', () => {
		const result = processDateRange('from 2025-01-01', 'order_date', today, 'sunday');
		expect(result.whereClause).toBe("order_date >= toDate('2025-01-01')");
		expect(result.betweenFragment).toBe(">= toDate('2025-01-01')");
	});

	it('builds a <= where clause for open-ended until ranges', () => {
		const result = processDateRange('until 2025-03-31', 'order_date', today, 'sunday');
		expect(result.whereClause).toBe("order_date <= toDate('2025-03-31')");
		expect(result.betweenFragment).toBe("<= toDate('2025-03-31')");
	});

	it('returns empty SQL fragments for all time', () => {
		const result = processDateRange('all time', 'order_date', today, 'sunday');
		expect(result.startDateSql).toBeUndefined();
		expect(result.endDateSql).toBeUndefined();
		expect(result.whereClause).toBe('');
		expect(result.betweenFragment).toBe('');
	});

	it('returns empty whereClause when no column is provided', () => {
		const result = processDateRange('2025-01-01 to 2025-03-31', undefined, today, 'sunday');
		expect(result.whereClause).toBe('');
		expect(result.betweenFragment).toBe("BETWEEN toDate('2025-01-01') AND toDate('2025-03-31')");
	});
});

describe('isValidDateRangeExpression (shared range-entry validator)', () => {
	it('accepts presets, dynamic patterns, ISO ranges, from/until, all time, and variables', () => {
		for (const v of [
			'all time',
			'last 7 days',
			'last 12 months',
			'Last 90 days',
			'Previous quarter',
			'2020-01-01 to 2020-12-31',
			'2024-01-01 to today',
			'from 2024-01-01 to 2024-03-31',
			'from 2022-12-01',
			'until 2022-12-01',
			'until today',
			'Month to Date',
			'This Year',
			'ytd',
			'{{ $var }}'
		]) {
			expect(isValidDateRangeExpression(v)).toBe(true);
		}
	});

	it('rejects garbage and impossible dates', () => {
		for (const v of [
			'',
			'2022', // silently resolved to a bogus window before — now denied
			'last 7 dayz',
			'from 2022-13-99', // month 13 / day 99
			'2021-02-29 to 2021-03-01', // 2021 is not a leap year
			'unbounded' // a range_calendar sentinel, not a range — callers handle it separately
		]) {
			expect(isValidDateRangeExpression(v)).toBe(false);
		}
	});
});

describe('isRecognizedDateRange', () => {
	it('recognizes every preset key', () => {
		const unrecognized = PRESET_DEFINITIONS.map((d) => d.key).filter(
			(key) => !isRecognizedDateRange(key)
		);
		expect(unrecognized).toEqual([]);
	});

	it('recognizes the shorthands parseDateRange handles', () => {
		for (const shorthand of ['td', 'yd', 'mtd', 'qtd', 'wtd', 'ytd', 'tw', 'nm', 'tq', 'ny']) {
			expect(isRecognizedDateRange(shorthand), shorthand).toBe(true);
		}
	});

	it('rejects the "all" shorthand parseDateRange does not handle', () => {
		expect(isRecognizedDateRange('all')).toBe(false);
	});

	it('recognizes dynamic last/previous forms', () => {
		expect(isRecognizedDateRange('last 45 days')).toBe(true);
		expect(isRecognizedDateRange('last week')).toBe(true);
		expect(isRecognizedDateRange('previous 2 quarters')).toBe(true);
		expect(isRecognizedDateRange('Previous Year')).toBe(true);
	});

	it('recognizes explicit and open-ended boundary forms', () => {
		expect(isRecognizedDateRange('2024-01-01 to 2024-03-31')).toBe(true);
		expect(isRecognizedDateRange('from 2024-01-01 to yesterday')).toBe(true);
		expect(isRecognizedDateRange('from 2024-01-01')).toBe(true);
		expect(isRecognizedDateRange('until today')).toBe(true);
	});

	it('is case-insensitive and trims whitespace', () => {
		expect(isRecognizedDateRange('Last 30 Days')).toBe(true);
		expect(isRecognizedDateRange('  this month  ')).toBe(true);
	});

	it('rejects strings the parser would silently mis-resolve', () => {
		for (const bad of ['', '   ', 'West', 'lastt 30 days', 'last 30', '2024-01-01']) {
			expect(isRecognizedDateRange(bad), JSON.stringify(bad)).toBe(false);
		}
	});

	it('rejects impossible calendar dates the resolvers pass through unchecked', () => {
		expect(isRecognizedDateRange('from 2022-13-99')).toBe(false);
		expect(isRecognizedDateRange('2021-02-29 to 2021-03-01')).toBe(false); // 2021 is not a leap year
		expect(isRecognizedDateRange('2024-02-29 to 2024-03-01')).toBe(true); // 2024 is
	});

	it('accepts countless "last days" ("last 1 day") like the parser does', () => {
		expect(isRecognizedDateRange('last days')).toBe(true);
		expect(parseDateRange('last days')).toMatchObject({ periodGrain: 'day', periodCount: 1 });
	});

	it('all-time is case-insensitive in both the recognizer and the resolvers', () => {
		for (const range of ['All time', 'All Time', 'ALL TIME']) {
			expect(isRecognizedDateRange(range), range).toBe(true);
			// Regression: these used to fall through to the last-12-months fallback.
			expect(parseDateRange(range), range).toBeNull();
			expect(resolveRangeToDates(range), range).toBeUndefined();
		}
	});

	it('rejects counts the resolvers mishandle: zero and astronomic', () => {
		// "last 0 days" resolves to an inverted (always-empty) range;
		// counts past ~273k years make date-fns throw on the client.
		expect(isRecognizedDateRange('last 0 days')).toBe(false);
		expect(isRecognizedDateRange('previous 0 weeks')).toBe(false);
		expect(isRecognizedDateRange('last 999999999999999 years')).toBe(false);
		expect(isRecognizedDateRange('last 9999 days')).toBe(true);
	});

	it('stays in lockstep: recognized dynamic forms do not hit the last-12-months fallback', () => {
		// Only "last 12 months" itself may parse to the fallback shape.
		for (const range of ['last 45 days', 'previous 2 quarters', 'this quarter', 'ytd']) {
			const parsed = parseDateRange(range);
			expect(parsed, range).toBeTruthy();
			expect(
				parsed!.periodGrain === 'month' && parsed!.periodCount === 12,
				`${range} fell through to the silent fallback`
			).toBe(false);
		}
	});
});
