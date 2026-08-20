import { describe, it, expect } from 'vitest';
import {
	formatTimeAxisLabel,
	formatTimeAxisTooltip,
	type TimeAxisGrain
} from './format-time-axis-label';

/**
 * Runs a sequence of ticks through the formatter — the way ECharts calls it during
 * a real render pass — and collects the emitted labels. The first tick's timestamp
 * is passed as `dataMinMs`, matching runtime wiring.
 */
function labelSequence(ticks: Date[], grain: TimeAxisGrain): string[] {
	const dataMinMs = ticks[0]?.getTime();
	// Mirror XAxisModel: the year only appears on month/quarter labels when the
	// data straddles a calendar-year boundary. Derive it from the ticks the same
	// way the model derives it from the data range.
	const spansMultipleYears =
		ticks.length > 0 && ticks[0].getFullYear() !== ticks[ticks.length - 1].getFullYear();
	return ticks.map((t, i) =>
		formatTimeAxisLabel(t, i, grain, dataMinMs, false, false, spansMultipleYears)
	);
}

/**
 * Terse LOCAL date constructor — the formatter reads local parts (see the
 * file header on format-time-axis-label.ts), so constructing local + reading
 * local keeps these assertions timezone-invariant: the same y/m/d always reads
 * back as the same y/m/d regardless of `process.env.TZ`. (The dedicated tz
 * suite in format-time-axis-label.tz.test.ts proves that invariance for the
 * real wire format — zoneless date strings.)
 */
function dt(y: number, m: number, d: number, h = 0): Date {
	return new Date(y, m, d, h);
}

describe('formatTimeAxisLabel', () => {
	describe('first-tick context', () => {
		it('day grain: first tick shows month + day, subsequent days show just the day', () => {
			// Scenario 1: Jun 5 - Jul 5, daily. Matches the screenshot the user reported.
			const ticks = [
				dt(2025, 5, 5),
				dt(2025, 5, 9),
				dt(2025, 5, 13),
				dt(2025, 5, 17),
				dt(2025, 5, 21),
				dt(2025, 5, 25),
				dt(2025, 5, 29),
				dt(2025, 6, 1)
			];
			expect(labelSequence(ticks, 'day')).toEqual([
				'Jun 5',
				'9',
				'13',
				'17',
				'21',
				'25',
				'29',
				'Jul'
			]);
		});

		it('week grain: first tick shows month + day, subsequent weeks just the day', () => {
			const ticks = [dt(2025, 5, 5), dt(2025, 5, 12), dt(2025, 5, 19), dt(2025, 5, 26)];
			expect(labelSequence(ticks, 'week')).toEqual(['Jun 5', '12', '19', '26']);
		});

		it('month grain within a single calendar year: bare months, no redundant year', () => {
			// Every tick is in 2025, so the year is constant context — dropped
			// entirely (no two-tier anchor). Only a boundary-crossing span shows it.
			const ticks = [dt(2025, 0, 1), dt(2025, 1, 1), dt(2025, 2, 1), dt(2025, 11, 1)];
			expect(labelSequence(ticks, 'month')).toEqual(['Jan', 'Feb', 'Mar', 'Dec']);
		});

		it('quarter grain within a single calendar year: bare Q labels, no year', () => {
			const ticks = [dt(2025, 0, 1), dt(2025, 3, 1), dt(2025, 6, 1), dt(2025, 9, 1)];
			expect(labelSequence(ticks, 'quarter')).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
		});

		it('quarter grain across a year boundary: two-tier — year under the first tick and each Q1', () => {
			const ticks = [dt(2024, 6, 1), dt(2024, 9, 1), dt(2025, 0, 1), dt(2025, 3, 1)];
			expect(labelSequence(ticks, 'quarter')).toEqual(['Q3\n2024', 'Q4', 'Q1\n2025', 'Q2']);
		});

		it('year grain: every tick is just the year', () => {
			const ticks = [
				dt(2020, 0, 1),
				dt(2021, 0, 1),
				dt(2022, 0, 1),
				dt(2023, 0, 1),
				dt(2024, 0, 1)
			];
			expect(labelSequence(ticks, 'year')).toEqual(['2020', '2021', '2022', '2023', '2024']);
		});

		it('hour grain: first tick shows just the hour (ECharts handles axis-start day marker), interior midnights resurface the date', () => {
			const ticks = [
				dt(2025, 5, 5, 9),
				dt(2025, 5, 5, 12),
				dt(2025, 5, 5, 15),
				dt(2025, 5, 5, 18),
				dt(2025, 5, 5, 21),
				dt(2025, 5, 6, 0)
			];
			const seq = labelSequence(ticks, 'hour');
			// First tick: just "9 am" — ECharts's native two-tier time-axis
			// injects a "Jun 5" primary marker at the axis start on its own,
			// so emitting "Jun 5 9 am" here stacked a second date label
			// alongside it.
			expect(seq[0]).toBe('9 am');
			expect(seq[1]).toBe('12 pm');
			// Interior day rollover: restore the date so a multi-day hour
			// axis doesn't have two ambiguous "12 am" labels.
			expect(seq[seq.length - 1]).toBe('Jun 6');
		});
	});

	describe('long-range series (regression: keep ECharts-style hierarchy)', () => {
		it('day grain across a year: month rollovers show month, January shows year', () => {
			// Scenario 2: full calendar year of daily data, ECharts thins ticks to monthly.
			const ticks = [
				dt(2025, 0, 1),
				dt(2025, 1, 1),
				dt(2025, 2, 1),
				dt(2025, 5, 1),
				dt(2025, 11, 1),
				dt(2026, 0, 1)
			];
			expect(labelSequence(ticks, 'day')).toEqual([
				'Jan 1', // first tick still gets its full context via the first-tick rule
				'Feb',
				'Mar',
				'Jun',
				'Dec',
				'Jan 2026' // year rollover carries the month — self-describing, not range-implying
			]);
		});

		it('day grain across two years: year rollovers surface the year', () => {
			// Scenario 3: 2+ years of daily data, ECharts thins ticks to quarterly-ish.
			const ticks = [
				dt(2024, 0, 1),
				dt(2024, 3, 1),
				dt(2024, 6, 1),
				dt(2024, 9, 1),
				dt(2025, 0, 1),
				dt(2025, 3, 1),
				dt(2025, 6, 1),
				dt(2025, 9, 1),
				dt(2026, 0, 1)
			];
			expect(labelSequence(ticks, 'day')).toEqual([
				'Jan 1',
				'Apr',
				'Jul',
				'Oct',
				'Jan 2025',
				'Apr',
				'Jul',
				'Oct',
				'Jan 2026'
			]);
		});

		it('week grain across 6 months: month rollovers show month', () => {
			const ticks = [
				dt(2025, 5, 1),
				dt(2025, 6, 1),
				dt(2025, 7, 1),
				dt(2025, 8, 1),
				dt(2025, 9, 1),
				dt(2025, 10, 1),
				dt(2025, 11, 1)
			];
			expect(labelSequence(ticks, 'week')).toEqual([
				'Jun 1', // first tick — full context via first-tick rule
				// Day-1 ticks in weekly grain: no "1" suffix, the tick IS the boundary.
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec'
			]);
		});

		it('week grain from Mon-aligned weeks: first-week-of-month ticks surface the month even though they land mid-week', () => {
			// Real `DATE_TRUNC('week', ...)` output from a June→September window.
			// Weeks land on Mondays; none of the interior ticks fall on day-1, so the
			// generic first-of-month rollover check misses them. The Mondays that
			// start in the first 7 days of a calendar month (Jul 7, Aug 4, Sep 1)
			// are the natural month-rollover markers.
			const ticks = [
				dt(2025, 5, 2), // Mon Jun  2
				dt(2025, 5, 9),
				dt(2025, 5, 16),
				dt(2025, 5, 23),
				dt(2025, 5, 30),
				dt(2025, 6, 7), // Mon Jul  7 — first Mon landing in Jul's first 7 days
				dt(2025, 6, 14),
				dt(2025, 6, 21),
				dt(2025, 6, 28),
				dt(2025, 7, 4), // Mon Aug  4
				dt(2025, 7, 11),
				dt(2025, 7, 18),
				dt(2025, 7, 25),
				dt(2025, 8, 1) // Mon Sep  1
			];
			expect(labelSequence(ticks, 'week')).toEqual([
				'Jun 2',
				'9',
				'16',
				'23',
				'30',
				'Jul 7',
				'14',
				'21',
				'28',
				'Aug 4',
				'11',
				'18',
				'25',
				'Sep' // day-1 weekly tick — no "1" suffix
			]);
		});

		it('week grain crossing January: the first week of January surfaces month + year', () => {
			// Mon Dec 30, 2024 → Mon Jan 6, 2025 → Mon Jan 13. The Jan 6 tick lands
			// in Jan's first 7 days, so it's both the month and year rollover.
			// Combined "Jan 2025" reads as a point in time (like the other ticks)
			// rather than a range label — a lone "2025" was ambiguous.
			const ticks = [
				dt(2024, 11, 30), // Mon Dec 30, 2024
				dt(2025, 0, 6),
				dt(2025, 0, 13)
			];
			expect(labelSequence(ticks, 'week')).toEqual(['Dec 30', 'Jan 2025', '13']);
		});

		it('hour grain across a day boundary: midnight surfaces the date, other hours stay time-only', () => {
			// A 24-hour axis from Jun 15 00:00 through Jun 16 00:00. The last tick is
			// a genuine day rollover — the reader shouldn't see two identical "12 am"
			// labels bracketing the axis with no way to tell they're different days.
			const ticks = [
				dt(2024, 5, 15, 0),
				dt(2024, 5, 15, 4),
				dt(2024, 5, 15, 8),
				dt(2024, 5, 15, 12),
				dt(2024, 5, 15, 16),
				dt(2024, 5, 15, 20),
				dt(2024, 5, 16, 0)
			];
			// First tick emits just "12 am" — ECharts's native two-tier
			// axis marks the axis-start day on its own; we only surface
			// the date at INTERIOR day rollovers.
			expect(labelSequence(ticks, 'hour')).toEqual([
				'12 am',
				'4 am',
				'8 am',
				'12 pm',
				'4 pm',
				'8 pm',
				'Jun 16'
			]);
		});

		it('hour grain crossing month boundary: non-midnight hours on day-1 stay time-only', () => {
			// Regression for the "3.5 hourly across midnight" bug: previously the
			// first-of-month check ran before hour-grain handling, so every non-
			// midnight hour landing on day-1 of a month (e.g. Jun 1 04:00) got
			// labeled just "Jun" instead of "4 am", collapsing every sub-day tick
			// on a month-crossing chart into repeated month labels. Only the
			// midnight tick that actually IS the month rollover should show
			// month/day context; interior hours keep their small-unit label.
			const ticks = [
				dt(2024, 4, 31, 20), // May 31, 8 pm
				dt(2024, 5, 1, 0), // Jun 1, midnight — month rollover
				dt(2024, 5, 1, 4), // Jun 1, 4 am
				dt(2024, 5, 1, 8), // Jun 1, 8 am
				dt(2024, 5, 1, 12), // Jun 1, noon
				dt(2024, 5, 1, 16), // Jun 1, 4 pm
				dt(2024, 5, 1, 20) // Jun 1, 8 pm
			];
			expect(labelSequence(ticks, 'hour')).toEqual([
				'8 pm', // first tick — hour only per firstTickLabel('hour')
				'Jun 1', // midnight day-rollover → full date (matches Jun 16 in the neighboring test)
				'4 am',
				'8 am',
				'12 pm',
				'4 pm',
				'8 pm'
			]);
		});

		it('month grain across 3+ years: January rollovers are two-tier (month over year)', () => {
			const ticks = [
				dt(2024, 0, 1),
				dt(2024, 6, 1),
				dt(2025, 0, 1),
				dt(2025, 6, 1),
				dt(2026, 0, 1),
				dt(2026, 6, 1)
			];
			expect(labelSequence(ticks, 'month')).toEqual([
				'Jan\n2024',
				'Jul',
				'Jan\n2025',
				'Jul',
				'Jan\n2026',
				'Jul'
			]);
		});

		it('month grain, multi-year span: year-boundary ticks collapse to just the year, interior months keep their name', () => {
			// On a multi-year monthly axis ECharts thins to ~yearly ticks. When
			// compactYearRollover is set the January ticks drop the redundant "Jan"
			// and read as clean year separators; interior months (Jul) still show.
			const ticks = [
				dt(2024, 0, 1),
				dt(2024, 6, 1),
				dt(2025, 0, 1),
				dt(2025, 6, 1),
				dt(2026, 0, 1),
				dt(2026, 6, 1)
			];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(
					t,
					i,
					'month',
					ticks[0].getTime(),
					/* verbose */ false,
					/* compactYearRollover */ true
				)
			);
			expect(labels).toEqual(['2024', 'Jul', '2025', 'Jul', '2026', 'Jul']);
		});

		it('month grain, multi-year span thinned to yearly (all-January) ticks: reads as a bare year axis, no repeated "Jan"', () => {
			// The exact production case: a 5-year monthly chart ECharts thins down
			// to one tick per year, all landing on January. Two-tier would stack an
			// identical "Jan" over every year — pure noise. Collapse to the year.
			const ticks = [dt(2022, 0, 1), dt(2023, 0, 1), dt(2024, 0, 1), dt(2025, 0, 1), dt(2026, 0, 1)];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(
					t,
					i,
					'month',
					ticks[0].getTime(),
					/* verbose */ false,
					/* compactYearRollover */ true
				)
			);
			expect(labels).toEqual(['2022', '2023', '2024', '2025', '2026']);
		});

		it('quarter grain, multi-year span: Q1 ticks collapse to the year, other quarters keep their label', () => {
			const ticks = [
				dt(2024, 0, 1),
				dt(2024, 6, 1),
				dt(2025, 0, 1),
				dt(2025, 6, 1),
				dt(2026, 0, 1)
			];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(
					t,
					i,
					'quarter',
					ticks[0].getTime(),
					/* verbose */ false,
					/* compactYearRollover */ true
				)
			);
			expect(labels).toEqual(['2024', 'Q3', '2025', 'Q3', '2026']);
		});

		it('month grain, multi-year span with a non-January start: first tick is inline "Period Year", not two-tier', () => {
			// A year timeline reads single-line. The first tick isn't a year
			// boundary, so it states its start year inline ("Jul 2023") rather than
			// stacking a two-tier anchor; year boundaries stay bare.
			const ticks = [dt(2023, 6, 1), dt(2024, 0, 1), dt(2024, 6, 1), dt(2025, 0, 1)];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(t, i, 'month', ticks[0].getTime(), false, /* compactYearRollover */ true)
			);
			expect(labels).toEqual(['Jul 2023', '2024', 'Jul', '2025']);
		});

		it('day grain, multi-year span: first tick anchors to its year (fix B)', () => {
			// Jan-1 start → bare year; a mid-year start → "Mon Year". Either way the
			// first tick reads as a year anchor, never a stray day-qualified date.
			expect(formatTimeAxisLabel(dt(2022, 0, 1), 0, 'day', dt(2022, 0, 1).getTime(), false, true)).toBe(
				'2022'
			);
			expect(
				formatTimeAxisLabel(dt(2022, 2, 15), 0, 'day', dt(2022, 2, 15).getTime(), false, true)
			).toBe('Mar 2022');
		});

		it('month grain, single calendar year: no year at all (it is constant context)', () => {
			// Every tick is in 2025 — the year adds nothing per-tick, so labels are
			// bare month names. The two-tier anchor is reserved for spans that
			// actually cross a calendar boundary.
			const ticks = [dt(2025, 0, 1), dt(2025, 3, 1), dt(2025, 6, 1), dt(2025, 9, 1)];
			expect(labelSequence(ticks, 'month')).toEqual(['Jan', 'Apr', 'Jul', 'Oct']);
		});

		it('month grain, within ~1 year but crossing a boundary: two-tier anchor + January year', () => {
			// Jul 2024 – Apr 2025 spans two calendar years, so the year returns:
			// stated once at the first tick and again at the January rollover.
			const ticks = [dt(2024, 6, 1), dt(2024, 9, 1), dt(2025, 0, 1), dt(2025, 3, 1)];
			expect(labelSequence(ticks, 'month')).toEqual(['Jul\n2024', 'Oct', 'Jan\n2025', 'Apr']);
		});
	});

	describe('first-tick detection under ECharts tick placement variance', () => {
		it('handles a hidden phantom tick BEFORE data-min — the first visible tick at data-min gets context', () => {
			// Simulates ECharts generating a phantom padding tick before the data range
			// (from boundaryGap) that gets hidden. The phantom sits at index 0 and would
			// naively steal the "first-tick" slot; our dataMin-distance rule fixes that
			// by ALSO marking the tick at data-min (index 1) as first. Since the phantom
			// is hidden, the user sees "Jun 5" on the leftmost visible label.
			// Data starts Jun 5; ticks: [phantom Jun 3 (idx 0), Jun 5 (idx 1), Jun 9, Jun 13].
			const dataMin = dt(2025, 5, 5).getTime();
			const ticks = [dt(2025, 5, 3), dt(2025, 5, 5), dt(2025, 5, 9), dt(2025, 5, 13)];
			const labels = ticks.map((t, i) => formatTimeAxisLabel(t, i, 'day', dataMin));
			expect(labels[0]).toBe('Jun 3'); // hidden phantom, still labeled defensively
			expect(labels[1]).toBe('Jun 5'); // the label the user actually sees
			expect(labels[2]).toBe('9');
			expect(labels[3]).toBe('13');
		});

		it('handles a tick placed slightly BEFORE data-min (weekly-in-a-narrow-card case)', () => {
			// The card-view screenshot: weekly data starting May 31 rendered narrow, ECharts
			// places its first tick at May 29 (2 days before data-min). No hidden phantom
			// this time — May 29 is index 0 and wins first-tick context by virtue of that,
			// reading "May 29" instead of "29". Jun 5 also surfaces its month via the
			// weekly first-week-of-month rule (day ≤ 7), which is what we want on a
			// narrow card too — the reader now has clear month anchors along the axis.
			const dataMin = dt(2025, 4, 31).getTime();
			const ticks = [
				dt(2025, 4, 29),
				dt(2025, 5, 5),
				dt(2025, 5, 9),
				dt(2025, 5, 13),
				dt(2025, 5, 17),
				dt(2025, 5, 21),
				dt(2025, 5, 25),
				dt(2025, 5, 29)
			];
			const labels = ticks.map((t, i) => formatTimeAxisLabel(t, i, 'week', dataMin));
			expect(labels[0]).toBe('May 29');
			expect(labels[1]).toBe('Jun 5');
			expect(labels[2]).toBe('9');
			expect(labels[3]).toBe('13');
			expect(labels[7]).toBe('29');
		});

		it('second real tick — one full grain-unit past data-min — falls through to rollover, not first-tick', () => {
			// Guards against the "two ticks side by side both wearing month prefixes" bug
			// that a too-wide first-tick window would cause. The half-grain-unit threshold
			// keeps the second real tick out.
			const dataMin = dt(2025, 5, 5).getTime();
			const ticks = [dt(2025, 5, 5), dt(2025, 5, 12), dt(2025, 5, 19)];
			const labels = ticks.map((t, i) => formatTimeAxisLabel(t, i, 'week', dataMin));
			expect(labels[0]).toBe('Jun 5');
			expect(labels[1]).toBe('12');
			expect(labels[2]).toBe('19');
		});
	});

	describe('formatTimeAxisLabel (pure function)', () => {
		it('accepts numeric timestamps', () => {
			const ts = dt(2025, 5, 5).getTime();
			expect(formatTimeAxisLabel(ts, 0, 'day')).toBe('Jun 5');
		});

		it('accepts ISO date strings', () => {
			expect(formatTimeAxisLabel('2025-06-09T00:00:00', 5, 'day')).toBe('9');
		});

		it('returns the raw string when the value is unparseable', () => {
			expect(formatTimeAxisLabel('not-a-date', 0, 'day')).toBe('not-a-date');
		});
	});

	describe('verbose mode (small-bar-count charts)', () => {
		// When bar count is low enough that every tick has room to breathe, verbose
		// mode gives each one full context — otherwise "May 31, 7, 14, 21, 28"
		// reads ambiguously.
		it('week grain: every tick shows month + day', () => {
			const ticks = [
				dt(2025, 4, 31),
				dt(2025, 5, 7),
				dt(2025, 5, 14),
				dt(2025, 5, 21),
				dt(2025, 5, 28)
			];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(t, i, 'week', ticks[0].getTime(), /* verbose */ true)
			);
			expect(labels).toEqual(['May 31', 'Jun 7', 'Jun 14', 'Jun 21', 'Jun 28']);
		});

		it('day grain: every tick shows month + day', () => {
			const ticks = [dt(2025, 5, 5), dt(2025, 5, 6), dt(2025, 5, 7)];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(t, i, 'day', ticks[0].getTime(), true)
			);
			expect(labels).toEqual(['Jun 5', 'Jun 6', 'Jun 7']);
		});

		it('month grain ignores verbose: single-year stays bare (year is constant context)', () => {
			// verbose (7th arg) has no effect on month/quarter; single-calendar-year
			// (spansMultipleYears omitted → false) drops the year regardless.
			const ticks = [dt(2025, 5, 1), dt(2025, 6, 1), dt(2025, 7, 1)];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(t, i, 'month', ticks[0].getTime(), true)
			);
			expect(labels).toEqual(['Jun', 'Jul', 'Aug']);
		});

		it('quarter grain ignores verbose: single-year stays bare', () => {
			const ticks = [dt(2025, 0, 1), dt(2025, 3, 1)];
			const verboseLabels = ticks.map((t, i) =>
				formatTimeAxisLabel(t, i, 'quarter', ticks[0].getTime(), true)
			);
			expect(verboseLabels).toEqual(['Q1', 'Q2']);
		});

		it('month grain, verbose + boundary crossing: year returns two-tier', () => {
			// The suppression is single-year only; a boundary-crossing verbose span
			// still anchors the year at the first tick and the January rollover.
			const ticks = [dt(2024, 10, 1), dt(2024, 11, 1), dt(2025, 0, 1)];
			const labels = ticks.map((t, i) =>
				formatTimeAxisLabel(t, i, 'month', ticks[0].getTime(), true, false, true)
			);
			expect(labels).toEqual(['Nov\n2024', 'Dec', 'Jan\n2025']);
		});
	});

	describe('grain inference (used when caller passes no grain)', () => {
		it('infers year when tick is Jan 1 midnight', () => {
			expect(formatTimeAxisLabel(dt(2025, 0, 1), 5, undefined)).toBe('2025');
		});

		it('infers month when tick is first-of-month midnight', () => {
			expect(formatTimeAxisLabel(dt(2025, 5, 1), 5, undefined)).toBe('Jun');
		});

		it('infers day when tick is midnight but not first-of-month', () => {
			expect(formatTimeAxisLabel(dt(2025, 5, 15), 5, undefined)).toBe('15');
		});

		it('infers hour ONLY when tick has sub-hour precision (real hourly data)', () => {
			// Genuine hourly ticks tend to carry sub-hour precision (from ECharts'
			// tick generator or from actual hh:mm:ss data). A minute or second
			// component is a strong hourly signal.
			expect(formatTimeAxisLabel(new Date(2025, 5, 5, 14, 30), 5, undefined)).toBe('2 pm');
		});

		it('infers day (not hour) for a round-hour, non-midnight tick', () => {
			// A tick that lands exactly on the hour with no minutes/seconds is
			// treated as a calendar date, not an hour: daily-grained values that
			// carry an offset land off-midnight but on the hour, and promoting
			// them to hourly rendered "4 am / 4 am / 4 am" across the axis.
			// See `inferGrain` for the rationale.
			expect(formatTimeAxisLabel(dt(2022, 3, 5, 4), 5, undefined)).toBe('5');
			expect(formatTimeAxisLabel(dt(2022, 3, 1, 4), 5, undefined)).toBe('Apr');
			expect(formatTimeAxisLabel(dt(2022, 0, 1, 4), 5, undefined)).toBe('2022');
		});
	});

	describe('formatTimeAxisTooltip (fuller context than axis labels)', () => {
		// Dates are constructed LOCAL because the tooltip formatter reads local
		// parts — see the block comment on `formatTimeAxisTooltip` for why.
		it('day grain: includes year', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 5, 15), 'day')).toBe('Jun 15, 2025');
		});

		describe('week grain: renders the 7-day range so the tooltip is unambiguous', () => {
			it('same month: collapses to a single month + range', () => {
				// Week starting Sun Jun 15 → ends Sat Jun 21.
				expect(formatTimeAxisTooltip(new Date(2025, 5, 15), 'week')).toBe('Jun 15–21, 2025');
			});

			it('crosses a month boundary: expands both months, single year', () => {
				// Week starting Sun Jun 29 → ends Sat Jul 5.
				expect(formatTimeAxisTooltip(new Date(2025, 5, 29), 'week')).toBe('Jun 29 – Jul 5, 2025');
			});

			it('crosses a year boundary: renders each side fully qualified', () => {
				// Week starting Mon Dec 29, 2025 → ends Sun Jan 4, 2026.
				expect(formatTimeAxisTooltip(new Date(2025, 11, 29), 'week')).toBe(
					'Dec 29, 2025 – Jan 4, 2026'
				);
			});
		});

		it('hour grain: includes year AND hour', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 5, 15, 14, 0), 'hour')).toBe(
				'Jun 15, 2025 2 pm'
			);
		});

		it('month grain: month + year', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 5, 1), 'month')).toBe('Jun 2025');
		});

		it('quarter grain: Q + year', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 3, 1), 'quarter')).toBe('Q2 2025');
		});

		it('year grain: just the year', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 0, 1), 'year')).toBe('2025');
		});

		it('unparseable values return the raw string', () => {
			expect(formatTimeAxisTooltip('not-a-date', 'day')).toBe('not-a-date');
		});

		it('accepts zoneless ISO date-time strings', () => {
			// Zoneless (no offset) → parsed on the local clock, so the calendar
			// date renders verbatim in any runtime timezone.
			expect(formatTimeAxisTooltip('2025-06-15T09:30:00', 'day')).toBe('Jun 15, 2025');
		});

		it('accepts numeric timestamps', () => {
			const ts = new Date(2025, 5, 15).getTime();
			expect(formatTimeAxisTooltip(ts, 'day')).toBe('Jun 15, 2025');
		});

		it('an offset-bearing value is shown as its verbatim wall-clock, same for everyone', () => {
			// Same-for-everyone: the "Z" (or "±hh:mm") offset is stripped before
			// parsing, so "2026-06-15T00:00:00Z" is treated exactly like the
			// zoneless "2026-06-15T00:00:00" — Jun 15 for every viewer, never
			// converted to the viewer's timezone. A fixed label is therefore valid
			// in any runtime timezone (see format-time-axis-label.tz.test.ts for
			// the cross-zone guardrail). The tooltip (raw string) and axis label
			// (also the raw string here) both derive from the one stripped value.
			expect(formatTimeAxisTooltip('2026-06-15T00:00:00Z', 'day')).toBe('Jun 15, 2026');
			expect(formatTimeAxisTooltip('2026-06-15T00:00:00Z', 'day')).toBe(
				formatTimeAxisTooltip('2026-06-15T00:00:00', 'day')
			);
			expect(formatTimeAxisLabel('2026-06-15T00:00:00Z', 5, 'day')).toBe('15');
		});
	});
});
