import { describe, expect, it } from 'vitest';
import {
	closestNamedGrain,
	inferGrainMsFromTimestamps
} from './infer-grain-from-timestamps';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function utc(y: number, m: number, d: number, h = 0): number {
	return Date.UTC(y, m, d, h);
}

describe('inferGrainMsFromTimestamps', () => {
	describe('cadence detection', () => {
		it('two hourly ticks → 1 hour cadence', () => {
			const ts = [utc(2025, 5, 5, 10), utc(2025, 5, 5, 11)];
			expect(inferGrainMsFromTimestamps(ts)).toBe(HOUR);
		});

		it('two daily ticks → 1 day cadence', () => {
			const ts = [utc(2025, 5, 5), utc(2025, 5, 6)];
			expect(inferGrainMsFromTimestamps(ts)).toBe(DAY);
		});

		it('daily series with gaps still infers 1 day (min-delta ignores gaps)', () => {
			// Weekend gap: Mon-Tue-Wed-Fri-Sat. Deltas: [1d, 1d, 2d, 1d]. Min = 1d.
			const ts = [utc(2025, 5, 2), utc(2025, 5, 3), utc(2025, 5, 4), utc(2025, 5, 6), utc(2025, 5, 7)];
			expect(inferGrainMsFromTimestamps(ts)).toBe(DAY);
		});

		it('monthly series across variable-length months → ~30 days (smallest month)', () => {
			// Feb→Mar is 28 or 29 days; Jul→Aug is 31 days. Min = 28d (2024 is a leap year → Feb 29d → Feb→Mar is 29d)
			const ts = [
				utc(2024, 1, 1), // Feb 1
				utc(2024, 2, 1), // Mar 1 (29 days after Feb 1 in leap year)
				utc(2024, 3, 1), // Apr 1 (31 days after)
				utc(2024, 4, 1) // May 1 (30 days after)
			];
			const result = inferGrainMsFromTimestamps(ts);
			// Smallest delta is Feb→Mar = 29d in 2024
			expect(result).toBe(29 * DAY);
			// Confirm this classifies as 'month' — the bucket is generous enough
			expect(closestNamedGrain(result!)).toBe('month');
		});

		it('quarterly series → ~90 days', () => {
			const ts = [utc(2025, 0, 1), utc(2025, 3, 1), utc(2025, 6, 1), utc(2025, 9, 1)];
			const result = inferGrainMsFromTimestamps(ts);
			// Q1: Jan 1 → Apr 1 = 90 days. Q2: Apr 1 → Jul 1 = 91 days. Min = 90d.
			expect(result).toBe(90 * DAY);
			expect(closestNamedGrain(result!)).toBe('month');
		});

		it('weekly series → 7 days (buckets to daily grain)', () => {
			const ts = [utc(2025, 5, 1), utc(2025, 5, 8), utc(2025, 5, 15), utc(2025, 5, 22)];
			const result = inferGrainMsFromTimestamps(ts);
			expect(result).toBe(7 * DAY);
			// Weekly falls into 'day' bucket — safe because 1-day padding sits
			// comfortably inside a 7-day slot.
			expect(closestNamedGrain(result!)).toBe('day');
		});
	});

	describe('DST resilience', () => {
		it('a 23h "spring forward" day does not break daily classification', () => {
			// EDT begins Sun Mar 9, 2025. If we were converting to local time, the
			// Mon Mar 10 → Tue Mar 11 delta would be 23h instead of 24h. Since we
			// operate on UTC ms, this doesn't happen — but authors sometimes hand-
			// build test data at local-DST boundaries. Assert we tolerate 23h.
			const ts = [utc(2025, 2, 9), utc(2025, 2, 9) + 23 * HOUR, utc(2025, 2, 10) + 23 * HOUR];
			const result = inferGrainMsFromTimestamps(ts);
			expect(result).toBe(23 * HOUR);
			expect(closestNamedGrain(result!)).toBe('day');
		});
	});

	describe('degenerate inputs', () => {
		it('empty array → undefined', () => {
			expect(inferGrainMsFromTimestamps([])).toBeUndefined();
		});

		it('single timestamp → undefined (caller falls back to single-date inference)', () => {
			expect(inferGrainMsFromTimestamps([utc(2025, 5, 5)])).toBeUndefined();
		});

		it('undefined input → undefined', () => {
			expect(inferGrainMsFromTimestamps(undefined)).toBeUndefined();
		});

		it('duplicate timestamps → undefined (no positive deltas)', () => {
			const t = utc(2025, 5, 5);
			expect(inferGrainMsFromTimestamps([t, t, t])).toBeUndefined();
		});

		it('duplicates mixed with real cadence → cadence wins (zero deltas skipped)', () => {
			// Two series stacked at the same daily timestamps produce zero deltas;
			// they must not shrink the inferred cadence to 0.
			const ts = [utc(2025, 5, 1), utc(2025, 5, 1), utc(2025, 5, 2), utc(2025, 5, 2)];
			expect(inferGrainMsFromTimestamps(ts)).toBe(DAY);
		});
	});

	describe('input ordering', () => {
		it('handles unsorted input (function sorts defensively)', () => {
			const ts = [utc(2025, 5, 5), utc(2025, 5, 3), utc(2025, 5, 4), utc(2025, 5, 6)];
			expect(inferGrainMsFromTimestamps(ts)).toBe(DAY);
		});
	});

	describe('sparse monthly data with gaps', () => {
		it('locks the invariant: min-delta represents cadence, big gaps do NOT collapse into it', () => {
			// Jan/Feb/Mar/Jul/Nov: three sequential months, then two large gaps.
			// The concern this test guards against: inferring some kind of
			// "average cadence" that would tell the axis to render as though
			// bars were evenly spaced. Min-delta must return ~1 month (from the
			// dense Jan/Feb/Mar cluster), NOT the average of ~2.5 months.
			// Downstream the axis stays `type: 'time'`, so the raw timestamps
			// drive x-positioning and the Apr–Jun / Aug–Oct gaps show up as
			// horizontal whitespace, exactly as an author would expect.
			const ts = [
				utc(2025, 0, 1), // Jan
				utc(2025, 1, 1), // Feb (31 days after Jan)
				utc(2025, 2, 1), // Mar (28 days after Feb — smallest gap)
				utc(2025, 6, 1), // Jul (122-day gap)
				utc(2025, 10, 1) // Nov (123-day gap)
			];
			const inferred = inferGrainMsFromTimestamps(ts);
			// Smallest positive delta is Feb→Mar (28 days).
			expect(inferred).toBe(28 * DAY);
			// Buckets to 'month' — the correct grain for label formatting.
			expect(closestNamedGrain(inferred!)).toBe('month');
			// Sanity: the big gaps are still visible in the raw timestamps, so
			// once downstream (XAxisModel) uses these on a `type: 'time'` axis,
			// the horizontal whitespace between clusters is preserved.
			const deltas = ts.slice(1).map((t, i) => t - ts[i]);
			expect(deltas).toEqual([31 * DAY, 28 * DAY, 122 * DAY, 123 * DAY]);
		});
	});
});

describe('closestNamedGrain', () => {
	it('sub-hour cadences (5m, 15m) → hour bucket', () => {
		expect(closestNamedGrain(5 * 60 * 1000)).toBe('hour');
		expect(closestNamedGrain(15 * 60 * 1000)).toBe('hour');
	});

	it('exactly 1 hour → hour', () => {
		expect(closestNamedGrain(HOUR)).toBe('hour');
	});

	it('exactly 1 day → day', () => {
		expect(closestNamedGrain(DAY)).toBe('day');
	});

	it('7 days (weekly) → day', () => {
		// Weekly falls into 'day' bucket. Documented behavior; see file header.
		expect(closestNamedGrain(7 * DAY)).toBe('day');
	});

	it('30 days (monthly) → month', () => {
		expect(closestNamedGrain(30 * DAY)).toBe('month');
	});

	it('90 days (quarterly) → month', () => {
		// Quarterly falls into 'month' bucket. Documented behavior; see file header.
		expect(closestNamedGrain(90 * DAY)).toBe('month');
	});

	it('365 days (yearly) → year', () => {
		expect(closestNamedGrain(365 * DAY)).toBe('year');
	});
});
