import { describe, expect, it } from 'vitest';
import {
	CUSTOM_TICK_THRESHOLD,
	GRAIN_WALK_ITERATION_CAP,
	VERBOSE_LABEL_THRESHOLD,
	asTimeAxisGrain,
	buildTickStrategy,
	coerceAxisValue,
	computeTimeDataRangeMs,
	isNonTemporalNumericGrain,
	makeNonNegativeValueAxisMin,
	makeFitToDataValueAxisMax,
	makeIntegerSlotBounds,
	isYearLikeDomain,
	isOutsideDataRange,
	resolveAxisType,
	resolveTimeAxisGrain,
	walkGrainTicks
} from './x-axis-rules';

// Local-midnight timestamps, matching how the axis pipeline parses string
// dates via `standardizeDateString` (X_AXIS_SPEC.md, timezone rules).
const localDate = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

const DAY_MS = 24 * 60 * 60 * 1000;

describe('resolveAxisType', () => {
	it('maps column types to their natural axes', () => {
		expect(resolveAxisType('date', undefined)).toBe('time');
		expect(resolveAxisType('number', undefined)).toBe('value');
		expect(resolveAxisType('string', undefined)).toBe('category');
	});

	it('year grain forces a category axis regardless of column type', () => {
		expect(resolveAxisType('date', 'year')).toBe('category');
		expect(resolveAxisType('number', 'year')).toBe('category');
	});

	it('numeric-labelled seasonality grains stay on their value axis', () => {
		expect(resolveAxisType('number', 'day of month')).toBe('value');
		expect(resolveAxisType('number', 'week of year')).toBe('value');
		expect(resolveAxisType('number', 'day of year')).toBe('value');
	});

	it('named seasonality grains render on a category axis so every label shows', () => {
		// A value axis places round-number ticks (2,4,6,…) and would drop Jan/Mon;
		// these named, bounded, cyclical domains read best as discrete slots.
		expect(resolveAxisType('number', 'month of year')).toBe('category');
		expect(resolveAxisType('number', 'day of week')).toBe('category');
		expect(resolveAxisType('number', 'quarter of year')).toBe('category');
	});
});

describe('isNonTemporalNumericGrain', () => {
	it('true only for numeric columns with a non-temporal grain', () => {
		expect(isNonTemporalNumericGrain('number', 'day of week')).toBe(true);
		expect(isNonTemporalNumericGrain('number', 'week of year')).toBe(true);
		expect(isNonTemporalNumericGrain('number', 'month')).toBe(false);
		expect(isNonTemporalNumericGrain('date', 'day of week')).toBe(false);
		expect(isNonTemporalNumericGrain('number', undefined)).toBe(false);
	});
});

describe('asTimeAxisGrain', () => {
	it('passes through known grains and rejects everything else', () => {
		expect(asTimeAxisGrain('month')).toBe('month');
		expect(asTimeAxisGrain('hour')).toBe('hour');
		expect(asTimeAxisGrain('day of week')).toBeUndefined();
		expect(asTimeAxisGrain('typo')).toBeUndefined();
		expect(asTimeAxisGrain(undefined)).toBeUndefined();
	});
});

describe('coerceAxisValue', () => {
	it('passes numbers through and parses numeric strings', () => {
		expect(coerceAxisValue(5, 'value')).toBe(5);
		expect(coerceAxisValue('5', 'value')).toBe(5);
	});

	it('parses date strings only on time axes, on the LOCAL clock', () => {
		// A user min/max must land on the same clock as the data bars. A bare
		// "2024-06-15" is LOCAL midnight (not `Date.parse`'s UTC midnight), or a
		// user `min` would sit an offset away from the first bar for off-UTC
		// viewers and ECharts would drop the edge tick.
		expect(coerceAxisValue('2024-06-15', 'time')).toBe(new Date(2024, 5, 15).getTime());
		expect(coerceAxisValue('2024-06-15', 'value')).toBeUndefined();
	});

	it('strips an explicit offset on a time axis (same for everyone)', () => {
		// "…Z" (or "±hh:mm") is stripped to its verbatim wall-clock digits and
		// parsed as LOCAL, exactly like the zoneless equivalent and exactly how
		// the bar/tick pipeline reads it — so a user `min` lands on the same
		// instant as the first bar, identical for every viewer's timezone.
		expect(coerceAxisValue('2024-06-15T00:00:00Z', 'time')).toBe(
			coerceAxisValue('2024-06-15T00:00:00', 'time')
		);
		expect(coerceAxisValue('2024-06-15T00:00:00Z', 'time')).toBe(new Date(2024, 5, 15).getTime());
		expect(coerceAxisValue('2024-06-15T04:00:00+05:00', 'time')).toBe(
			new Date(2024, 5, 15, 4).getTime()
		);
	});

	it('returns undefined for unusable values', () => {
		expect(coerceAxisValue(undefined, 'time')).toBeUndefined();
		expect(coerceAxisValue('not a date', 'time')).toBeUndefined();
	});
});

describe('computeTimeDataRangeMs', () => {
	it('finds min/max across Date, number, and string values', () => {
		const rows = [{ x: new Date(2024, 5, 15) }, { x: localDate(2024, 1, 1) }, { x: '2024-12-31' }];
		const { dataMinMs, dataMaxMs } = computeTimeDataRangeMs(rows, 'x');
		expect(dataMinMs).toBe(localDate(2024, 1, 1));
		expect(dataMaxMs).toBe(localDate(2024, 12, 31));
	});

	it('string dates parse to local midnight (same as customValues positions)', () => {
		const { dataMinMs } = computeTimeDataRangeMs([{ x: '2024-07-01' }], 'x');
		expect(dataMinMs).toBe(localDate(2024, 7, 1));
	});

	it('returns undefined for empty or unparseable rows', () => {
		expect(computeTimeDataRangeMs([], 'x')).toEqual({
			dataMinMs: undefined,
			dataMaxMs: undefined
		});
		expect(computeTimeDataRangeMs([{ x: 'garbage' }], 'x')).toEqual({
			dataMinMs: undefined,
			dataMaxMs: undefined
		});
	});
});

describe('resolveTimeAxisGrain', () => {
	it('explicit temporal date_grain always wins', () => {
		expect(
			resolveTimeAxisGrain({
				isTimeAxis: true,
				dateGrain: 'month',
				// cadence says daily — explicit declaration overrides
				timestamps: [0, DAY_MS, 2 * DAY_MS],
				dataSpanMs: 2 * DAY_MS
			})
		).toBe('month');
	});

	it('infers grain from data cadence when not declared', () => {
		const monthly = [localDate(2024, 1, 17), localDate(2024, 2, 17), localDate(2024, 3, 17)];
		expect(
			resolveTimeAxisGrain({
				isTimeAxis: true,
				dateGrain: undefined,
				timestamps: monthly,
				dataSpanMs: monthly[2] - monthly[0]
			})
		).toBe('month');
	});

	it('promotes to hour for sub-2-day spans with a single point', () => {
		expect(
			resolveTimeAxisGrain({
				isTimeAxis: true,
				dateGrain: undefined,
				timestamps: [localDate(2024, 6, 15)],
				dataSpanMs: 0
			})
		).toBe('hour');
	});

	it('a non-temporal date_grain suppresses hour promotion', () => {
		expect(
			resolveTimeAxisGrain({
				isTimeAxis: true,
				dateGrain: 'day of week',
				timestamps: [localDate(2024, 6, 15)],
				dataSpanMs: 0
			})
		).toBeUndefined();
	});

	it('returns undefined off time axes (unless explicitly declared)', () => {
		expect(
			resolveTimeAxisGrain({
				isTimeAxis: false,
				dateGrain: undefined,
				timestamps: undefined,
				dataSpanMs: undefined
			})
		).toBeUndefined();
	});
});

describe('walkGrainTicks', () => {
	it('walks months calendar-aware across a year boundary', () => {
		const ticks = walkGrainTicks(localDate(2024, 11, 1), localDate(2025, 2, 1), 'month');
		expect(ticks).toEqual([
			localDate(2024, 11, 1),
			localDate(2024, 12, 1),
			localDate(2025, 1, 1),
			localDate(2025, 2, 1)
		]);
	});

	it('includes both endpoints', () => {
		const ticks = walkGrainTicks(localDate(2024, 6, 1), localDate(2024, 6, 3), 'day');
		expect(ticks).toHaveLength(3);
		expect(ticks[0]).toBe(localDate(2024, 6, 1));
		expect(ticks[2]).toBe(localDate(2024, 6, 3));
	});

	it('caps runaway walks at the iteration limit', () => {
		// 10 years of hourly ticks would be ~87,600 — the cap stops it.
		const ticks = walkGrainTicks(localDate(2020, 1, 1), localDate(2030, 1, 1), 'hour');
		expect(ticks).toHaveLength(GRAIN_WALK_ITERATION_CAP);
	});

	it('returns empty for invalid ranges', () => {
		expect(walkGrainTicks(NaN, localDate(2024, 6, 1), 'day')).toEqual([]);
		expect(walkGrainTicks(localDate(2024, 6, 2), localDate(2024, 6, 1), 'day')).toEqual([]);
	});
});

describe('buildTickStrategy', () => {
	// The 11 monthly data positions from the original bug report:
	// Feb 2024 – Jan 2025 with July missing from the query result.
	const monthsWithJulyGap = [
		localDate(2024, 2, 1),
		localDate(2024, 3, 1),
		localDate(2024, 4, 1),
		localDate(2024, 5, 1),
		localDate(2024, 6, 1),
		localDate(2024, 8, 1),
		localDate(2024, 9, 1),
		localDate(2024, 10, 1),
		localDate(2024, 11, 1),
		localDate(2024, 12, 1),
		localDate(2025, 1, 1)
	];

	it('grain-fills gaps so a monthly chart missing July still labels July', () => {
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'month',
			grainIsExplicit: true,
			dataMinMs: monthsWithJulyGap[0],
			dataMaxMs: monthsWithJulyGap[monthsWithJulyGap.length - 1],
			rawTimestamps: monthsWithJulyGap
		});
		expect(strategy.useCustomTicks).toBe(true);
		expect(strategy.tickValues).toHaveLength(12);
		expect(strategy.tickValues).toContain(localDate(2024, 7, 1));
	});

	it('rejects grain fill that would blow the tick budget', () => {
		// 3 daily points spanning a year: grain fill would be 366 ticks.
		const raw = [localDate(2024, 1, 1), localDate(2024, 1, 2), localDate(2025, 1, 1)];
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'day',
			grainIsExplicit: true,
			dataMinMs: raw[0],
			dataMaxMs: raw[2],
			rawTimestamps: raw
		});
		expect(strategy.tickValues).toEqual(raw);
	});

	it('rejects grain fill from a mis-inferred grain (ratio guard)', () => {
		// 4 points at a ~quarterly cadence, but grain mis-resolved to 'week':
		// fill would be ~14 ticks — inside the budget, but 3.5x the raw count.
		const raw = [
			localDate(2024, 1, 1),
			localDate(2024, 4, 1),
			localDate(2024, 7, 1),
			localDate(2024, 4, 8) // one weekly delta so inference could plausibly land on week
		].sort((a, b) => a - b);
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'week',
			grainIsExplicit: false,
			dataMinMs: raw[0],
			dataMaxMs: raw[raw.length - 1],
			rawTimestamps: raw
		});
		expect(strategy.tickValues).toEqual(raw);
	});

	it('explicit grain skips the ratio guard: sparse data labels every grain slot', () => {
		// 3 monthly readings across 11 months. Fill (11 ticks) is 3.7x the raw
		// count — an inferred grain would be rejected, but the author declared
		// date_grain="month", so every month gets a labeled slot.
		const raw = [localDate(2024, 2, 1), localDate(2024, 7, 1), localDate(2024, 12, 1)];
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'month',
			grainIsExplicit: true,
			dataMinMs: raw[0],
			dataMaxMs: raw[2],
			rawTimestamps: raw
		});
		expect(strategy.tickValues).toHaveLength(11);
		expect(strategy.tickValues).toContain(localDate(2024, 5, 1));
	});

	it('inferred grain with the same sparse shape falls back to raw positions', () => {
		const raw = [localDate(2024, 2, 1), localDate(2024, 7, 1), localDate(2024, 12, 1)];
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'month',
			grainIsExplicit: false,
			dataMinMs: raw[0],
			dataMaxMs: raw[2],
			rawTimestamps: raw
		});
		expect(strategy.tickValues).toEqual(raw);
	});

	it('falls back to ECharts-native ticks above the budget', () => {
		const raw = Array.from({ length: CUSTOM_TICK_THRESHOLD + 1 }, (_, i) =>
			localDate(2024, 1, 1 + i)
		);
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'day',
			grainIsExplicit: true,
			dataMinMs: raw[0],
			dataMaxMs: raw[raw.length - 1],
			rawTimestamps: raw
		});
		expect(strategy.useCustomTicks).toBe(false);
		expect(strategy.tickValues).toEqual(raw);
	});

	it('verbose labels at very small counts', () => {
		const raw = Array.from({ length: VERBOSE_LABEL_THRESHOLD }, (_, i) =>
			localDate(2024, 1 + i, 1)
		);
		const strategy = buildTickStrategy({
			isTimeAxis: true,
			grain: 'month',
			grainIsExplicit: true,
			dataMinMs: raw[0],
			dataMaxMs: raw[raw.length - 1],
			rawTimestamps: raw
		});
		expect(strategy.useVerboseLabels).toBe(true);
	});

	it('no strategy off time axes or without data', () => {
		expect(
			buildTickStrategy({
				isTimeAxis: false,
				grain: undefined,
				grainIsExplicit: false,
				dataMinMs: undefined,
				dataMaxMs: undefined,
				rawTimestamps: undefined
			})
		).toEqual({ tickValues: undefined, useCustomTicks: false, useVerboseLabels: false });
	});
});

describe('makeNonNegativeValueAxisMin', () => {
	it('pins min to 0 for non-negative data by default', () => {
		expect(makeNonNegativeValueAxisMin(false)({ min: 1, max: 195 })).toBe(0);
	});

	it('fit_to_data hugs the data with a pad, floored at 0', () => {
		const min = makeNonNegativeValueAxisMin(true)({ min: 100, max: 200 });
		expect(min).toBe(98); // 100 - 2% of span (100)
		expect(makeNonNegativeValueAxisMin(true)({ min: 1, max: 200 })).toBe(0);
	});

	it('snaps the padded min down to a whole number on integer domains', () => {
		// Years 2000-2019: pad = 2% of 19 = 0.38 → 1999.62 → floor → 1999.
		// A fractional bound gets labelled inconsistently (yyyy truncates to
		// "1999", plain formatting rounds to "2,000").
		expect(makeNonNegativeValueAxisMin(true)({ min: 2000, max: 2019 })).toBe(1999);
	});

	it('keeps fractional bounds for non-integer domains', () => {
		const min = makeNonNegativeValueAxisMin(true)({ min: 10.5, max: 20.5 });
		expect(min).toBeCloseTo(10.3); // 10.5 - 2% of span (10)
	});

	it('uses exact data min when padding is disabled (user interval)', () => {
		// ECharts anchors explicit-interval ticks at the axis min: a padded min
		// of 1999 makes interval=2 tick odd years against even-year data.
		expect(makeNonNegativeValueAxisMin(true, false)({ min: 2000, max: 2019 })).toBe(2000);
	});

	it('leaves mixed-sign data to ECharts defaults', () => {
		expect(makeNonNegativeValueAxisMin(false)({ min: -5, max: 10 })).toBeUndefined();
		expect(makeNonNegativeValueAxisMin(true)({ min: -5, max: 10 })).toBeUndefined();
	});
});

describe('makeFitToDataValueAxisMax', () => {
	it('pads the max by 2% of span, snapped up on integer domains', () => {
		// Years 2000-2019: without a pinned max, ECharts rounds the padded max
		// up to the next whole tick (2022 with a 3-year interval) — ~3 years of
		// dead space vs. the min side's tight 0.38. Ceil(2019.38) = 2020.
		expect(makeFitToDataValueAxisMax()({ min: 2000, max: 2019 })).toBe(2020);
	});

	it('keeps fractional bounds for non-integer domains', () => {
		const max = makeFitToDataValueAxisMax()({ min: 10.5, max: 20.5 });
		expect(max).toBeCloseTo(20.7); // 20.5 + 2% of span (10)
	});

	it('uses exact data max when padding is disabled (user interval)', () => {
		expect(makeFitToDataValueAxisMax(false)({ min: 2000, max: 2019 })).toBe(2019);
	});

	it('applies to negative domains too (max side has no zero clamp)', () => {
		expect(makeFitToDataValueAxisMax()({ min: -20, max: -10 })).toBe(-9); // ceil(-9.8)
	});
});

describe('isYearLikeDomain', () => {
	it('detects year-named columns with 4-digit integer data', () => {
		expect(isYearLikeDomain('year', 2000, 2019)).toBe(true);
		expect(isYearLikeDomain('fiscal_year', 1995, 2002)).toBe(true);
		expect(isYearLikeDomain('order_yr', 2010, 2026)).toBe(true);
		expect(isYearLikeDomain('Years', 1900, 2100)).toBe(true);
	});

	it('requires the column NAME to look like a year', () => {
		// Same data range, non-year name: could be scores, elevations, IDs.
		expect(isYearLikeDomain('score', 2000, 2019)).toBe(false);
		expect(isYearLikeDomain('elevation_m', 1000, 3000)).toBe(false);
		expect(isYearLikeDomain(undefined, 2000, 2019)).toBe(false);
	});

	it('requires the DATA to look like years', () => {
		// Year-named column holding something else.
		expect(isYearLikeDomain('year', 1, 12)).toBe(false); // month buckets
		expect(isYearLikeDomain('years', 0.5, 4.5)).toBe(false); // durations
		expect(isYearLikeDomain('year', 2000, 9999)).toBe(false); // out of range
		expect(isYearLikeDomain('year', 2000.5, 2019)).toBe(false); // fractional
		expect(isYearLikeDomain('year', null, 2019)).toBe(false);
	});
});

describe('makeIntegerSlotBounds', () => {
	it('pads exactly half a slot on each side — never a whole phantom slot', () => {
		// Month of year (1-12): the proportional pad + integer snap produced
		// ceil(12 + 2%·11) = 13, a phantom 13th slot labeled "Jan" (modular
		// month formatting). Half-slot bounds give the extreme bars room
		// without inventing a domain position.
		const { min, max } = makeIntegerSlotBounds();
		expect(min({ min: 1, max: 12 })).toBe(0.5);
		expect(max({ min: 1, max: 12 })).toBe(12.5);
	});

	it('handles day-of-week and quarter domains identically', () => {
		const { min, max } = makeIntegerSlotBounds();
		expect(min({ min: 1, max: 7 })).toBe(0.5);
		expect(max({ min: 1, max: 7 })).toBe(7.5);
		expect(min({ min: 1, max: 4 })).toBe(0.5);
		expect(max({ min: 1, max: 4 })).toBe(4.5);
	});

	it('returns undefined on non-finite extents', () => {
		const { min, max } = makeIntegerSlotBounds();
		expect(min({ min: NaN, max: 12 })).toBeUndefined();
		expect(max({ min: 1, max: Infinity })).toBeUndefined();
	});
});

describe('isOutsideDataRange', () => {
	it('flags padded boundary ticks outside the data', () => {
		expect(isOutsideDataRange(1999, 2000, 2019)).toBe(true);
		expect(isOutsideDataRange(2020, 2000, 2019)).toBe(true);
	});

	it('keeps every tick inside the data range', () => {
		expect(isOutsideDataRange(2000, 2000, 2019)).toBe(false);
		expect(isOutsideDataRange(2010, 2000, 2019)).toBe(false);
		expect(isOutsideDataRange(2019, 2000, 2019)).toBe(false);
	});

	it('never flags non-numeric values or missing bounds', () => {
		expect(isOutsideDataRange('2020', 2000, 2019)).toBe(false);
		expect(isOutsideDataRange(1999, null, null)).toBe(false);
		expect(isOutsideDataRange(1999, undefined, 2019)).toBe(false);
	});
});
