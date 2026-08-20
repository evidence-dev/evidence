import type { TimeAxisGrain } from './format-time-axis-label';

/**
 * Infer the sampling cadence (in ms) from a sorted array of bar-x timestamps.
 *
 * "Cadence" is the smallest positive gap between adjacent ticks — the grain at
 * which the SQL source actually sampled the data. Using the smallest gap (not
 * the mean or median) makes this robust to missing periods: a daily chart with
 * weekend gaps still has plenty of 1-day deltas, so weekends widen *some* gaps
 * but never shrink the minimum.
 *
 * Zero deltas are ignored because they only appear from stacked series sharing
 * an x-value; they signal a stack, not a finer grain.
 *
 * Callers pass `this.barSeriesTimestamps` from `XAxisModel`, which is already
 * sorted and deduped — this function still tolerates unsorted input to keep
 * it testable in isolation.
 *
 * Returns `undefined` when the input has fewer than 2 usable timestamps.
 * Callers should fall back to single-date `inferGrain` (in
 * `format-time-axis-label.ts`) in that case.
 */
export function inferGrainMsFromTimestamps(timestamps: number[] | undefined): number | undefined {
	if (!timestamps || timestamps.length < 2) return undefined;

	// XAxisModel's getter hands us a pre-sorted array; guard against callers
	// (tests) that don't by sorting into a local copy. Cheap at typical n
	// (dozens to low thousands) and worth the isolation.
	const sorted = timestamps.every((t, i) => i === 0 || timestamps[i - 1] <= t)
		? timestamps
		: [...timestamps].sort((a, b) => a - b);

	let minDelta = Infinity;
	for (let i = 1; i < sorted.length; i++) {
		const d = sorted[i] - sorted[i - 1];
		if (d > 0 && d < minDelta) minDelta = d;
	}
	return isFinite(minDelta) ? minDelta : undefined;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Map a cadence in ms to one of the four named grains the label formatter
 * knows how to render (`hour | day | month | year`).
 *
 * Boundaries sit roughly a step below the next grain so common cadences land
 * cleanly. Weekly (7d) buckets to `'day'` and quarterly (90d) buckets to
 * `'month'` — both safe fallbacks because the formatter's first-tick
 * month/year context reads correctly for those cadences without a dedicated
 * case.
 *
 * The `20h` hour→day boundary is deliberate, not 12h or 24h:
 *   - 12h would misclassify 23h DST-spring deltas as `'hour'`.
 *   - 24h would misclassify semidaily (12h) as `'day'`.
 *   Landing at 20h keeps sub-daily cadences (1h/6h/12h) in `'hour'` and
 *   daily-with-DST-slop (23h–25h) in `'day'`.
 *
 * The `200d` month→year boundary lets half-yearly cadences (~180d) still
 * bucket as `'month'`; only genuinely annual+ cadences read as `'year'`.
 */
export function closestNamedGrain(grainMs: number): TimeAxisGrain {
	if (grainMs < 20 * HOUR_MS) return 'hour';
	if (grainMs < 15 * DAY_MS) return 'day';
	if (grainMs < 200 * DAY_MS) return 'month';
	return 'year';
}
