import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatTimeAxisLabel, formatTimeAxisTooltip } from './format-time-axis-label';

/**
 * Timezone-invariance guardrail (local-everywhere model).
 *
 * The real wire format for a bucketed date is a ZONELESS string — "2024-06-15"
 * or "2024-06-15 13:00:00" — with no offset. The whole pipeline runs on one
 * clock: ECharts parses those strings on the local clock (its default, since we
 * no longer pin `useUTC`), our tick math parses them the same way via
 * `standardizeDateString`, and these formatters read local components. Because
 * parse-local and format-local cancel, a zoneless date must render to the SAME
 * calendar label in every timezone. This suite locks that in by feeding
 * zoneless strings and re-running under several zones.
 *
 * What this catches:
 *   - A future edit that reads `.getUTC*` (or re-pins `useUTC`) in one place but
 *     not another, reintroducing the parse/format clock split that produced the
 *     "4 am / 4 am / 4 am" axis bug and off-by-one calendar dates.
 *
 * Offset-bearing STRINGS ("…Z" / "±hh:mm") are ALSO invariant: the offset is
 * stripped up front (`standardizeDateString`), so "2024-06-01T04:00:00Z" is
 * treated exactly like the zoneless "2024-06-01T04:00:00" — 4 am for every
 * viewer. This is the "same for everyone" rule, and the suite locks it in below.
 *
 * What this does NOT assert:
 *   - Invariance for a raw epoch-ms NUMBER. That is a genuine absolute instant
 *     (Unix epoch is UTC-anchored) and is handled by `msTimestampToDate`, not
 *     the string-strip path — it is intentionally out of scope here.
 *
 * `process.env.TZ` is honored by V8 on every subsequent Date method call in
 * Node ≥ 13, so mutating it in a `beforeAll` and restoring in `afterAll` is
 * enough — no subprocess dance required.
 */
const TIMEZONES = [
	'UTC',
	'America/New_York',
	'Europe/Berlin',
	'Asia/Tokyo',
	'Australia/Sydney'
] as const;

const originalTZ = process.env.TZ;
afterAll(() => {
	if (originalTZ === undefined) {
		delete process.env.TZ;
	} else {
		process.env.TZ = originalTZ;
	}
});

describe.each(TIMEZONES)('formatTimeAxisLabel under TZ=%s', (tz) => {
	beforeAll(() => {
		process.env.TZ = tz;
	});

	it('sanity: process.env.TZ mutation actually takes effect', () => {
		// Guard against the whole matrix silently degrading into a no-op if a
		// future Node/V8 upgrade caches the timezone at process start. A fixed
		// UTC millisecond value produces different local hours in each zone, so
		// we assert the wiring by observing that difference. (Sydney omitted
		// because DST makes its offset seasonal; the others prove the mutation.)
		const fixed = new Date(Date.UTC(2025, 5, 15, 12, 0));
		const expectedByTz: Record<string, number> = {
			UTC: 12,
			'America/New_York': 8,
			'Europe/Berlin': 14,
			'Asia/Tokyo': 21
		};
		const expectedLocalHour = expectedByTz[tz];
		if (expectedLocalHour === undefined) return;
		expect(fixed.getHours()).toBe(expectedLocalHour);
	});

	it('formats a zoneless date-only tick as its calendar date, never the previous day', () => {
		// The bug guarded here: a "…Z"/local-parse split turned "2026-06-15" into
		// Jun 14 for a viewer west of UTC. Parse-local + format-local keeps Jun 15
		// everywhere. Feeds the real wire format (a zoneless string), not a fixed
		// UTC instant.
		expect(formatTimeAxisLabel('2026-06-15', 5, 'day')).toBe('15');
		expect(formatTimeAxisTooltip('2026-06-15', 'day')).toBe('Jun 15, 2026');
	});

	it('an offset-bearing (…Z) value renders identically to the same zoneless wall-clock, in every zone', () => {
		// Same-for-everyone: the "Z" offset is stripped before parsing, so
		// "2024-06-01T04:00:00Z" is treated exactly like the zoneless
		// "2024-06-01T04:00:00" — 4 am for every viewer, never converted to the
		// viewer's timezone. Label and tooltip agree because both derive from the
		// one stripped value, and the concrete strings below are the same in every
		// zone (this test block re-runs under UTC/NY/Berlin/Tokyo/Sydney).
		const withZ = '2024-06-01T04:00:00Z';
		const zoneless = '2024-06-01T04:00:00';
		expect(formatTimeAxisTooltip(withZ, 'hour')).toBe(formatTimeAxisTooltip(zoneless, 'hour'));
		expect(formatTimeAxisLabel(withZ, 0, 'hour')).toBe(formatTimeAxisLabel(zoneless, 0, 'hour'));
		expect(formatTimeAxisTooltip(withZ, 'hour')).toBe('Jun 1, 2024 4 am');
		// A "±hh:mm" numeric offset collapses the same way.
		expect(formatTimeAxisTooltip('2024-06-01T04:00:00+05:00', 'hour')).toBe('Jun 1, 2024 4 am');
	});

	it('formats a round-hour, non-midnight zoneless tick as a date, not an hour', () => {
		// Sibling of the "4 am" regression: a daily bucket that lands off-midnight
		// but on the hour must infer a calendar date regardless of the runtime TZ.
		expect(formatTimeAxisLabel('2022-04-05 04:00:00', 5, undefined)).toBe('5');
		expect(formatTimeAxisLabel('2022-04-01 04:00:00', 5, undefined)).toBe('Apr');
	});

	it('renders a monthly sequence identically regardless of runtime timezone', () => {
		// Spans 2024→2025, so the year appears (two-tier at the first tick + Jan).
		const ticks = ['2024-01-01', '2024-07-01', '2025-01-01', '2025-07-01'];
		const t0 = new Date('2024-01-01T00:00:00').getTime();
		const labels = ticks.map((t, i) =>
			formatTimeAxisLabel(t, i, 'month', t0, false, false, /* spansMultipleYears */ true)
		);
		expect(labels).toEqual(['Jan\n2024', 'Jul', 'Jan\n2025', 'Jul']);
	});

	it('renders an hourly sequence identically regardless of runtime timezone', () => {
		const ticks = ['2025-06-15 13:00:00', '2025-06-15 14:00:00', '2025-06-15 15:00:00'];
		const t0 = new Date('2025-06-15T13:00:00').getTime();
		const labels = ticks.map((t, i) => formatTimeAxisLabel(t, i, 'hour', t0));
		// Hour grain: axis-start day marker comes from ECharts' own two-tier
		// rendering, so our formatter emits time-only for every tick unless
		// it's an interior day rollover (see label test suite).
		expect(labels).toEqual(['1 pm', '2 pm', '3 pm']);
	});

	it('week-range tooltips stay anchored to the stored week-start in every zone', () => {
		expect(formatTimeAxisTooltip('2025-06-15', 'week')).toBe('Jun 15–21, 2025');
	});
});
