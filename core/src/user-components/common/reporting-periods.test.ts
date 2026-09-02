import { describe, it, expect } from 'vitest';
import {
	buildReportingPeriods,
	parsePeriodKey,
	isPeriodGrain,
	periodToRangeExpression,
	DEFAULT_PERIOD_COUNT,
	MAX_PERIOD_COUNT,
	PERIOD_GRAINS
} from './reporting-periods';

/** Mid-month anchor: August 2026 is incomplete, July 2026 is the newest complete month. */
const midAugust = new Date(2026, 7, 14);

describe('isPeriodGrain', () => {
	it('accepts the five reporting grains', () => {
		expect(PERIOD_GRAINS).toEqual(['day', 'week', 'month', 'quarter', 'year']);
		for (const grain of PERIOD_GRAINS) expect(isPeriodGrain(grain)).toBe(true);
	});

	it('rejects non-reporting grains and junk', () => {
		// `hour` and the non-temporal grains are real date grains but not reporting periods.
		expect(isPeriodGrain('hour')).toBe(false);
		expect(isPeriodGrain('day of week')).toBe(false);
		expect(isPeriodGrain('monthly')).toBe(false);
		expect(isPeriodGrain(undefined)).toBe(false);
	});
});

describe('buildReportingPeriods — only complete periods', () => {
	it('excludes the in-progress period', () => {
		const periods = buildReportingPeriods({ grain: 'month', count: 3, anchorDate: midAugust });
		expect(periods.map((p) => p.key)).toEqual(['2026-07', '2026-06', '2026-05']);
	});

	it('includes a period that ended exactly yesterday', () => {
		// Anchor on the 1st: July ended yesterday and is complete.
		const periods = buildReportingPeriods({
			grain: 'month',
			count: 1,
			anchorDate: new Date(2026, 7, 1)
		});
		expect(periods[0].key).toBe('2026-07');
	});

	it('excludes a period ending on the anchor date itself', () => {
		// Anchor on Jul 31: July has not finished yet from the report's point of view.
		const periods = buildReportingPeriods({
			grain: 'month',
			count: 1,
			anchorDate: new Date(2026, 6, 31)
		});
		expect(periods[0].key).toBe('2026-06');
	});

	it('returns newest first and honours count', () => {
		const periods = buildReportingPeriods({ grain: 'month', count: 5, anchorDate: midAugust });
		expect(periods).toHaveLength(5);
		expect(periods[0].key).toBe('2026-07');
		expect(periods[4].key).toBe('2026-03');
	});

	it('defaults to 12 monthly periods', () => {
		const periods = buildReportingPeriods({ anchorDate: midAugust });
		expect(periods).toHaveLength(DEFAULT_PERIOD_COUNT);
		expect(periods[0].key).toBe('2026-07');
		expect(periods[11].key).toBe('2025-08');
	});

	it('falls back to month for an unrecognized grain', () => {
		const periods = buildReportingPeriods({ grain: 'fortnight', count: 1, anchorDate: midAugust });
		expect(periods[0].key).toBe('2026-07');
	});

	it('clamps a nonsensical count to at least one period', () => {
		expect(buildReportingPeriods({ count: 0, anchorDate: midAugust })).toHaveLength(1);
		expect(buildReportingPeriods({ count: -5, anchorDate: midAugust })).toHaveLength(1);
	});

	it('caps the count so a typo cannot hang the page', () => {
		expect(buildReportingPeriods({ count: 1e9, anchorDate: midAugust })).toHaveLength(
			MAX_PERIOD_COUNT
		);
	});

	it('falls back to the default count for a non-finite count', () => {
		for (const count of [NaN, Infinity, -Infinity]) {
			expect(buildReportingPeriods({ count, anchorDate: midAugust })).toHaveLength(
				DEFAULT_PERIOD_COUNT
			);
		}
	});
});

describe('buildReportingPeriods — boundaries per grain', () => {
	it('months carry inclusive start and end dates', () => {
		const [july] = buildReportingPeriods({ grain: 'month', count: 1, anchorDate: midAugust });
		expect(july).toMatchObject({
			key: '2026-07',
			label: 'Jul 2026',
			start: '2026-07-01',
			end: '2026-07-31'
		});
	});

	it('handles February in a leap year', () => {
		const periods = buildReportingPeriods({
			grain: 'month',
			count: 1,
			anchorDate: new Date(2024, 2, 15)
		});
		expect(periods[0]).toMatchObject({ key: '2024-02', start: '2024-02-01', end: '2024-02-29' });
	});

	it('rolls over the year going backwards', () => {
		const periods = buildReportingPeriods({
			grain: 'month',
			count: 3,
			anchorDate: new Date(2026, 1, 10)
		});
		expect(periods.map((p) => p.key)).toEqual(['2026-01', '2025-12', '2025-11']);
	});

	it('builds days', () => {
		const [day] = buildReportingPeriods({
			grain: 'day',
			count: 1,
			anchorDate: new Date(2026, 7, 14)
		});
		expect(day).toMatchObject({
			key: '2026-08-13',
			label: 'Aug 13, 2026',
			start: '2026-08-13',
			end: '2026-08-13'
		});
	});

	it('builds quarters', () => {
		const [q] = buildReportingPeriods({ grain: 'quarter', count: 1, anchorDate: midAugust });
		expect(q).toMatchObject({
			key: '2026-Q2',
			label: 'Q2 2026',
			start: '2026-04-01',
			end: '2026-06-30'
		});
	});

	it('builds years', () => {
		const [y] = buildReportingPeriods({ grain: 'year', count: 1, anchorDate: midAugust });
		expect(y).toMatchObject({
			key: '2025',
			label: '2025',
			start: '2025-01-01',
			end: '2025-12-31'
		});
	});
});

describe('buildReportingPeriods — weeks respect first_day_of_week', () => {
	// 2026-08-14 is a Friday.
	it('anchors weeks on Sunday by default', () => {
		const [week] = buildReportingPeriods({ grain: 'week', count: 1, anchorDate: midAugust });
		expect(week).toMatchObject({
			key: '2026-08-02',
			label: 'Week of Aug 2, 2026',
			start: '2026-08-02',
			end: '2026-08-08'
		});
	});

	it('anchors weeks on Monday when configured', () => {
		const [week] = buildReportingPeriods({
			grain: 'week',
			count: 1,
			anchorDate: midAugust,
			firstDayOfWeek: 'monday'
		});
		expect(week).toMatchObject({
			key: '2026-08-03',
			label: 'Week of Aug 3, 2026',
			start: '2026-08-03',
			end: '2026-08-09'
		});
	});

	it('walks back a week at a time', () => {
		const periods = buildReportingPeriods({ grain: 'week', count: 3, anchorDate: midAugust });
		expect(periods.map((p) => p.start)).toEqual(['2026-08-02', '2026-07-26', '2026-07-19']);
	});
});

describe('parsePeriodKey', () => {
	it('round-trips every grain', () => {
		for (const grain of PERIOD_GRAINS) {
			const [built] = buildReportingPeriods({ grain, count: 1, anchorDate: midAugust });
			expect(parsePeriodKey(built.key, grain)).toEqual(built);
		}
	});

	it('round-trips a Monday-anchored week', () => {
		const [built] = buildReportingPeriods({
			grain: 'week',
			count: 1,
			anchorDate: midAugust,
			firstDayOfWeek: 'monday'
		});
		expect(parsePeriodKey(built.key, 'week', 'monday')).toEqual(built);
	});

	it('resolves a key from outside the offered window', () => {
		// The picker only lists N periods, but a bookmarked URL may name an older one.
		expect(parsePeriodKey('2019-03', 'month')).toMatchObject({
			key: '2019-03',
			start: '2019-03-01',
			end: '2019-03-31'
		});
	});

	it('rejects malformed and mismatched keys', () => {
		expect(parsePeriodKey('2026-13', 'month')).toBeUndefined();
		expect(parsePeriodKey('2026-00', 'month')).toBeUndefined();
		expect(parsePeriodKey('2026-Q5', 'quarter')).toBeUndefined();
		expect(parsePeriodKey('2026-02-30', 'day')).toBeUndefined();
		expect(parsePeriodKey('not-a-period', 'month')).toBeUndefined();
		expect(parsePeriodKey('', 'month')).toBeUndefined();
		expect(parsePeriodKey(undefined, 'month')).toBeUndefined();
		// A month key is not a valid day key.
		expect(parsePeriodKey('2026-07', 'day')).toBeUndefined();
	});

	it('snaps a week key that is not on a week boundary', () => {
		// 2026-08-05 is a Wednesday; under Sunday weeks it belongs to the week of Aug 2.
		expect(parsePeriodKey('2026-08-05', 'week')).toMatchObject({
			key: '2026-08-02',
			start: '2026-08-02'
		});
	});
});

describe('periodToRangeExpression', () => {
	it('emits a closed range the existing date parser understands', () => {
		const [july] = buildReportingPeriods({ grain: 'month', count: 1, anchorDate: midAugust });
		expect(periodToRangeExpression(july)).toBe('2026-07-01 to 2026-07-31');
	});
});
