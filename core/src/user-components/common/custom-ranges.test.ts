import { describe, it, expect } from 'vitest';
import { expandCustomRanges, resolveCustomRangeDefault, type CustomRangeRule } from './custom-ranges';
import { getDateRangeShorthand, processDateRange } from './date-options';

const TODAY = new Date(2026, 5, 23); // 2026-06-23

describe('expandCustomRanges — anchored ranges (explicit start)', () => {
	it('generates fiscal years from a `from` date up to the current one (open end → no future period), named by {end:yyyy}', () => {
		const result = expandCustomRanges(
			[{ label: 'FY{end:yyyy}', range: 'from 2024-02-01', grain: 'year' }],
			TODAY
		);
		// Periods Feb–Jan from 2024; stops at FY2027 (the one containing today) — no future FY2028.
		expect(result).toEqual([
			{ key: '2026-02-01 to 2027-01-31', label: 'FY2027' },
			{ key: '2025-02-01 to 2026-01-31', label: 'FY2026' },
			{ key: '2024-02-01 to 2025-01-31', label: 'FY2025' }
		]);
	});

	it('a closed absolute window anchors to its start and stops at the end (no future period)', () => {
		const result = expandCustomRanges(
			[{ label: 'FY{start:yyyy}', range: '2024-02-01 to 2027-01-31', grain: 'year' }],
			TODAY
		);
		expect(result.map((r) => r.label)).toEqual(['FY2026', 'FY2025', 'FY2024']);
	});

	it('anchors quarters to the given start, up to the current quarter (default label)', () => {
		const result = expandCustomRanges([{ range: 'from 2026-02-01', grain: 'quarter' }], TODAY);
		expect(result.map((r) => r.label)).toEqual(['Q2 2026', 'Q1 2026']);
	});

	it('treats "from X to Y" as a closed anchored window (not the relative fallback)', () => {
		// Regression: "from 2020-04-06 to 2026-04-05" used to fall through to "last 12 months", yielding
		// only two calendar-year presets. It must generate one fiscal year per April-anchored period.
		const result = expandCustomRanges(
			[
				{
					label: 'FY{start:yyyy}/{end:yy}',
					range: 'from 2020-04-06 to 2026-04-05',
					grain: 'year'
				}
			],
			TODAY
		);
		expect(result.map((r) => r.label)).toEqual([
			'FY2025/26',
			'FY2024/25',
			'FY2023/24',
			'FY2022/23',
			'FY2021/22',
			'FY2020/21'
		]);
		expect(result[0].key).toBe('2025-04-06 to 2026-04-05');
		expect(result[5].key).toBe('2020-04-06 to 2021-04-05');
	});
});

describe('expandCustomRanges — sensible default labels for unlabelled, no-grain windows', () => {
	it.each([
		['last 30 days', 'Last 30 Days'],
		['last 5 months', 'Last 5 Months'],
		['last week', 'Last Week'],
		['previous 2 quarters', 'Previous 2 Quarters'],
		['this year', 'This Year'],
		['year to date', 'Year to Date'],
		['2020-01-01 to 2026-04-05', 'Jan 1, 2020 – Apr 5, 2026'],
		['from 2020-04-06', 'From Apr 6, 2020']
	])('labels "%s" as "%s"', (range, label) => {
		expect(expandCustomRanges([{ range }], TODAY).map((r) => r.label)).toEqual([label]);
	});

	it('still honors an explicit label over the default', () => {
		expect(expandCustomRanges([{ label: 'Trailing month', range: 'last 30 days' }], TODAY)).toEqual(
			[{ key: '2026-05-25 to 2026-06-23', label: 'Trailing month' }]
		);
	});
});

describe('expandCustomRanges — {start:CODE} / {end:CODE} value-formatter date codes in labels', () => {
	it('formats the period start/end with value-formatter codes (mmm, mmmm, yyyy, yy, dd)', () => {
		const r = expandCustomRanges(
			[
				{
					label: '{start:mmm} {start:mmmm} {start:yyyy}/{end:yy} {end:dd}',
					range: 'from 2024-04-06 to 2025-04-05',
					grain: 'year'
				}
			],
			TODAY
		);
		expect(r[0].label).toBe('Apr April 2024/25 05');
	});

	it('supports composed codes and is timezone-safe at the year boundary', () => {
		expect(
			expandCustomRanges(
				[{ label: '{start:mmm yyyy}', range: '2024-01-01 to 2024-12-31' }],
				TODAY
			)[0].label
		).toBe('Jan 2024');
		// Jan 1 / Dec 31 are the most timezone-shift-prone; they must round-trip exactly.
		expect(
			expandCustomRanges(
				[{ label: '{start:yyyy-mm-dd} to {end:yyyy-mm-dd}', range: '2024-01-01 to 2024-12-31' }],
				TODAY
			)[0].label
		).toBe('2024-01-01 to 2024-12-31');
	});

	it('composes {start:qq} (bare quarter) with the other {start:CODE} codes', () => {
		expect(
			expandCustomRanges(
				[
					{
						label: '{start:mmmm} {start:qq} {start:yyyy}',
						range: '2024-04-01 to 2024-06-30',
						grain: 'quarter'
					}
				],
				TODAY
			)[0].label
		).toBe('April Q2 2024');
	});

	it('{start:qq} is the bare quarter code (Q#); {start:quarter} is the year-prefixed form', () => {
		const q = { range: '2024-04-01 to 2024-06-30', grain: 'quarter' };
		expect(expandCustomRanges([{ label: '{start:qq}', ...q }], TODAY)[0].label).toBe('Q2');
		expect(expandCustomRanges([{ label: '{start:quarter}', ...q }], TODAY)[0].label).toBe('2024-Q2');
	});
});

describe('expandCustomRanges — relative grain: months/quarters/years snap, weeks anchor', () => {
	it('keeps clean calendar months for "last N months"', () => {
		expect(expandCustomRanges([{ range: 'last 3 months', grain: 'month' }], TODAY)).toEqual([
			{ key: '2026-06-01 to 2026-06-30', label: 'Jun 2026' },
			{ key: '2026-05-01 to 2026-05-31', label: 'May 2026' },
			{ key: '2026-04-01 to 2026-04-30', label: 'Apr 2026' },
			{ key: '2026-03-01 to 2026-03-31', label: 'Mar 2026' }
		]);
	});

	it('anchors "last N weeks" to the window start — N seven-day buckets ending today (not calendar weeks)', () => {
		expect(
			expandCustomRanges([{ range: 'last 2 weeks', grain: 'week' }], TODAY).map((r) => r.key)
		).toEqual(['2026-06-17 to 2026-06-23', '2026-06-10 to 2026-06-16']);
	});

	it('generates one preset per day for day grain', () => {
		expect(
			expandCustomRanges([{ range: 'last 3 days', grain: 'day' }], TODAY).map((r) => r.key)
		).toEqual(['2026-06-23 to 2026-06-23', '2026-06-22 to 2026-06-22', '2026-06-21 to 2026-06-21']);
	});

	it('pins the default day & week grain labels (guards against value-formatter drift)', () => {
		expect(expandCustomRanges([{ range: 'last 3 days', grain: 'day' }], TODAY)[0].label).toBe(
			'Jun 23, 2026'
		);
		expect(expandCustomRanges([{ range: 'last 2 weeks', grain: 'week' }], TODAY)[0].label).toBe(
			'Week of Jun 17, 2026'
		);
	});
});

describe('expandCustomRanges — grain must be explicit (no inference)', () => {
	it('treats a relative window with no grain as a single period (does NOT auto-bucket by unit)', () => {
		expect(expandCustomRanges([{ label: 'Last 8 weeks', range: 'last 8 weeks' }], TODAY)).toEqual([
			{ key: '2026-04-29 to 2026-06-23', label: 'Last 8 weeks' }
		]);
	});

	it('buckets only when grain is given', () => {
		expect(expandCustomRanges([{ range: 'last 8 weeks', grain: 'week' }], TODAY).length).toBe(8);
	});

	it('treats an absolute window with no grain as one preset (a one-off)', () => {
		expect(
			expandCustomRanges(
				[{ label: '2020 Season (COVID)', range: '2020-07-23 to 2020-09-08' }],
				TODAY
			)
		).toEqual([{ key: '2020-07-23 to 2020-09-08', label: '2020 Season (COVID)' }]);
	});

	it('keeps an open "from" preset open so it matches future dates', () => {
		expect(
			expandCustomRanges([{ label: 'Since launch', range: 'from 2024-03-15' }], TODAY)
		).toEqual([{ key: 'from 2024-03-15', label: 'Since launch' }]);
	});

	it('caps a huge window at MAX periods, keeping the newest (drops oldest, not most-recent)', () => {
		const result = expandCustomRanges([{ range: '2018-01-01 to 2026-06-23', grain: 'day' }], TODAY);
		expect(result.length).toBe(1000);
		expect(result[0].key).toBe('2026-06-23 to 2026-06-23'); // newest-first, today is present
		expect(result.some((r) => r.key === '2018-01-01 to 2018-01-01')).toBe(false); // oldest dropped
	});

	it('caps a multi-window rule at MAX too, keeping the newest across windows (a newer window is never starved)', () => {
		// Two huge day-grain windows: the older one alone would fill the cap. The rule must still cap at MAX
		// AND keep the globally-newest periods — the later (newer) window must not be dropped wholesale.
		const result = expandCustomRanges(
			[{ range: ['2000-01-01 to 2010-12-31', '2012-01-01 to 2026-06-23'], grain: 'day' }],
			TODAY
		);
		expect(result.length).toBe(1000);
		expect(result[0].key).toBe('2026-06-23 to 2026-06-23'); // newest survives
		expect(result.every((r) => r.key >= '2012-01-01')).toBe(true); // older window yielded to the newer one
	});

	it('never exceeds MAX even when an earlier window is under the cap (no overflow)', () => {
		const result = expandCustomRanges(
			[{ range: ['2024-01-01 to 2024-12-31', '2000-01-01 to 2020-12-31'], grain: 'day' }],
			TODAY
		);
		expect(result.length).toBe(1000);
	});
});

describe('expandCustomRanges — today / yesterday tokens in range', () => {
	it('resolves "to today" and "from yesterday"', () => {
		expect(expandCustomRanges([{ label: 'YTD', range: '2026-01-01 to today' }], TODAY)).toEqual([
			{ key: '2026-01-01 to 2026-06-23', label: 'YTD' }
		]);
		expect(expandCustomRanges([{ label: 'Recent', range: 'from yesterday' }], TODAY)).toEqual([
			{ key: 'from 2026-06-22', label: 'Recent' }
		]);
	});

	it('clamps the final period at a `to today` end (today takes priority over the period end)', () => {
		expect(
			expandCustomRanges([{ range: '2024-01-01 to today', grain: 'year' }], TODAY).map((r) => r.key)
		).toEqual(['2026-01-01 to 2026-06-23', '2025-01-01 to 2025-12-31', '2024-01-01 to 2024-12-31']);
	});

	it('does not anchor grain buckets to a dynamic today/yesterday start (no daily drift)', () => {
		// A today/yesterday start would drift the anchor every day; it must snap to the calendar instead.
		expect(
			expandCustomRanges([{ range: 'today to 2026-12-31', grain: 'year' }], TODAY).map((r) => r.key)
		).toEqual(['2026-01-01 to 2026-12-31']);
		// Open `from today` with a grain has no calendar window to snap → no presets (rather than a drifting one).
		expect(expandCustomRanges([{ range: 'from today', grain: 'year' }], TODAY)).toEqual([]);
	});
});

describe('expandCustomRanges — bare "last <unit>" (count defaults to 1)', () => {
	it.each(['day', 'week', 'month', 'quarter', 'year'])(
		'resolves "last %s" to the same window as "last 1 %s"',
		(unit) => {
			// Same resolved dates; only the auto label differs ("Last Week" vs "Last 1 Week"), both sensible.
			expect(expandCustomRanges([{ range: `last ${unit}` }], TODAY).map((r) => r.key)).toEqual(
				expandCustomRanges([{ range: `last 1 ${unit}` }], TODAY).map((r) => r.key)
			);
		}
	);

	it('produces the expected rolling window (and is case-insensitive)', () => {
		expect(expandCustomRanges([{ label: 'Last week', range: 'Last Week' }], TODAY)).toEqual([
			{ key: '2026-06-17 to 2026-06-23', label: 'Last week' }
		]);
	});

	it('defaults the count to 1 in the range shorthand', () => {
		expect(getDateRangeShorthand('last week')).toBe('l1w');
		expect(getDateRangeShorthand('last quarter')).toBe('l1q');
		expect(getDateRangeShorthand('last 5 weeks')).toBe('l5w');
	});
});

describe('expandCustomRanges — explicit period lists (range as an array)', () => {
	it('lists explicit periods, auto-labeling from the start year, newest-first', () => {
		expect(
			expandCustomRanges(
				[
					{
						label: '{start:yyyy} Season',
						range: ['2020-03-01 to 2020-10-15', '2021-02-28 to 2021-11-02']
					}
				],
				TODAY
			)
		).toEqual([
			{ key: '2021-02-28 to 2021-11-02', label: '2021 Season' },
			{ key: '2020-03-01 to 2020-10-15', label: '2020 Season' }
		]);
	});

	it('keeps a valid leap day (Feb 29 in a leap year)', () => {
		expect(
			expandCustomRanges([{ label: 'FY{start:yyyy}', range: ['2024-02-29 to 2024-12-31'] }], TODAY)
		).toEqual([{ key: '2024-02-29 to 2024-12-31', label: 'FY2024' }]);
	});

	it('labels 52/53-week accounting calendars by {end:yyyy} straight from the dates', () => {
		expect(
			expandCustomRanges(
				[
					{ label: 'FY{end:yyyy}', range: ['2024-12-29 to 2025-12-27', '2025-12-28 to 2026-12-26'] }
				],
				TODAY
			)
		).toEqual([
			{ key: '2025-12-28 to 2026-12-26', label: 'FY2026' },
			{ key: '2024-12-29 to 2025-12-27', label: 'FY2025' }
		]);
	});

	it('a single-element list equals the equivalent string range (strict superset of the old shape)', () => {
		expect(
			expandCustomRanges([{ label: 'One-off', range: ['2020-07-23 to 2020-09-08'] }], TODAY)
		).toEqual(expandCustomRanges([{ label: 'One-off', range: '2020-07-23 to 2020-09-08' }], TODAY));
	});

	it('applies grain to every window in the list (each window subdivided, concatenated in order)', () => {
		expect(
			expandCustomRanges(
				[{ range: ['2024-01-01 to 2024-12-31', '2026-01-01 to 2026-12-31'], grain: 'quarter' }],
				TODAY
			).map((r) => r.key)
		).toEqual([
			'2026-10-01 to 2026-12-31',
			'2026-07-01 to 2026-09-30',
			'2026-04-01 to 2026-06-30',
			'2026-01-01 to 2026-03-31',
			'2024-10-01 to 2024-12-31',
			'2024-07-01 to 2024-09-30',
			'2024-04-01 to 2024-06-30',
			'2024-01-01 to 2024-03-31'
		]);
	});

	it('mixes relative and absolute windows in one list', () => {
		expect(
			expandCustomRanges(
				[
					{
						label: '{start:yyyy}',
						range: ['last 1 years', '2030-01-01 to 2030-12-31'],
						grain: 'year'
					}
				],
				TODAY
			).map((r) => r.label)
		).toEqual(['2030', '2026', '2025']);
	});

	it('skips a malformed window without dropping its siblings', () => {
		expect(
			expandCustomRanges(
				[
					{
						label: 'FY{start:yyyy}',
						range: [
							'2024-01-01 to 2024-12-31',
							'2025-02-29 to 2025-12-31',
							'2026-01-01 to 2026-12-31'
						]
					}
				],
				TODAY
			).map((r) => r.key)
		).toEqual(['2026-01-01 to 2026-12-31', '2024-01-01 to 2024-12-31']);
	});

	it('skips non-string elements in the list', () => {
		expect(
			expandCustomRanges(
				[{ range: ['2024-01-01 to 2024-12-31', 42 as never, null as never] }],
				TODAY
			).map((r) => r.key)
		).toEqual(['2024-01-01 to 2024-12-31']);
	});

	it('an empty list produces no presets', () => {
		expect(expandCustomRanges([{ label: 'x', range: [] }], TODAY)).toEqual([]);
	});
});

describe('expandCustomRanges — grouping across entries', () => {
	it('keeps each rule together (all FY, then all CY), newest-first within each group', () => {
		const rules: CustomRangeRule[] = [
			{ label: 'FY{end:yyyy}', range: '2024-02-01 to 2026-01-31', grain: 'year' },
			{ label: 'CY {start:yyyy}', range: '2024-01-01 to 2025-12-31', grain: 'year' }
		];
		expect(expandCustomRanges(rules, TODAY).map((r) => r.label)).toEqual([
			'FY2026',
			'FY2025',
			'CY 2025',
			'CY 2024'
		]);
	});
});

describe('expandCustomRanges — malformed input is skipped, never throws', () => {
	it.each([
		['empty range window ("all time")', { label: 'x', range: 'all time' }],
		['unknown grain', { label: 'x', range: 'last 3 months', grain: 'fortnight' }],
		[
			'unknown grain blanks the whole entry (list form)',
			{ range: ['last 3 months'], grain: 'fortnight' }
		],
		['non-string range', { label: 'x', range: 42 as never }],
		['listed period with bad date', { label: 'x', range: ['2020-13-01 to 2020-12-31'] }],
		['Feb 29 in a non-leap year (listed)', { label: 'x', range: ['2025-02-29 to 2025-03-01'] }],
		[
			'Feb 29 in a non-leap year (absolute range)',
			{ label: 'x', range: '2025-02-29 to 2025-12-31' }
		],
		['reversed window (start after end)', { label: 'x', range: '2026-12-31 to 2026-01-01' }],
		['reversed listed period', { label: 'x', range: ['2026-12-31 to 2026-01-01'] }],
		['whitespace-only range', { label: 'x', range: '   ' }],
		['empty range list', { label: 'x', range: [] }],
		['no range at all', { label: 'x' }]
	])('skips: %s', (_name, rule) => {
		expect(expandCustomRanges([rule as CustomRangeRule], TODAY)).toEqual([]);
	});

	it('returns [] for empty/undefined/non-array rules', () => {
		expect(expandCustomRanges(undefined, TODAY)).toEqual([]);
		expect(expandCustomRanges([], TODAY)).toEqual([]);
		expect(expandCustomRanges('nope' as never, TODAY)).toEqual([]);
	});

	it('treats a non-string label as no label (falls back to the default), never crashes on .replace', () => {
		// A numeric label (Markdoc can pass non-strings) must behave exactly like omitting it.
		expect(
			expandCustomRanges([{ label: 42 as never, range: 'last 3 months', grain: 'month' }], TODAY)
		).toEqual(expandCustomRanges([{ range: 'last 3 months', grain: 'month' }], TODAY));
		expect(
			expandCustomRanges([{ label: 42 as never, range: ['2020-03-01 to 2020-10-15'] }], TODAY)
		).toEqual([{ key: '2020-03-01 to 2020-10-15', label: 'Mar 1, 2020 – Oct 15, 2020' }]);
	});
});

// The calendar (RangeCalendar.svelte) applies a generated preset by setting `filter.value.range = preset.key`,
// derives the selected dates with `processDateRange(key)`, and shows the matched preset's `label`. So for EVERY
// generated preset the key must round-trip through `processDateRange` to exactly the dates it encodes, and the
// label must be a clean, fully-resolved string. This battery proves both across the full surface of inputs.
describe('expandCustomRanges — every generated preset selects the right calendar dates and shows a clean label', () => {
	const CONFIGS: Array<[string, CustomRangeRule]> = [
		[
			'fiscal years from an open start',
			{ label: 'FY{end:yyyy}', range: 'from 2024-02-01', grain: 'year' }
		],
		[
			'fiscal years from a "from X to Y" window',
			{
				label: 'FY{start:yyyy}/{end:yy}',
				range: 'from 2020-04-06 to 2026-04-05',
				grain: 'year'
			}
		],
		[
			'closed absolute year window',
			{ label: 'FY{start:yyyy}', range: '2024-02-01 to 2027-01-31', grain: 'year' }
		],
		['quarters from an open start', { range: 'from 2026-02-01', grain: 'quarter' }],
		['relative months snap to the calendar', { range: 'last 12 months', grain: 'month' }],
		['relative weeks anchor to the window start', { range: 'last 8 weeks', grain: 'week' }],
		['one preset per day', { range: 'last 30 days', grain: 'day' }],
		['grain clamped at "to today"', { range: '2024-01-01 to today', grain: 'year' }],
		['month grain spanning a leap February', { range: '2024-01-01 to 2024-03-31', grain: 'month' }],
		[
			'quarters across a list of windows',
			{ range: ['2024-01-01 to 2024-12-31', '2026-01-01 to 2026-12-31'], grain: 'quarter' }
		],
		[
			'retail 52/53-week calendar (list)',
			{ label: 'FY{end:yyyy}', range: ['2024-12-29 to 2025-12-27', '2025-12-28 to 2026-12-26'] }
		],
		[
			'seasons (list, auto-labelled)',
			{
				label: '{start:yyyy} Season',
				range: ['2020-03-01 to 2020-10-15', '2021-02-28 to 2021-11-02']
			}
		],
		['leap day preserved (one-off)', { range: ['2024-02-29 to 2024-12-31'] }],
		['no-grain preset range', { range: 'last 30 days' }],
		['no-grain full-year range', { range: 'this year' }],
		['no-grain to-date range', { range: 'year to date' }],
		['no-grain bare "last <unit>"', { range: 'last quarter' }],
		['open-ended "from" one-off stays open', { label: 'Since launch', range: 'from 2024-03-15' }]
	];

	it.each(CONFIGS)('%s', (_name, rule) => {
		const presets = expandCustomRanges([rule], TODAY);
		expect(presets.length).toBeGreaterThan(0);
		for (const { key, label } of presets) {
			// Label is a clean, fully-resolved string — no leftover {token} placeholders, not blank.
			expect(typeof label).toBe('string');
			expect(label.trim()).not.toBe('');
			expect(label).not.toMatch(/[{}]/);

			// The key round-trips: the dates the calendar selects equal what the key encodes.
			const { startDate, endDate } = processDateRange(key, undefined, TODAY, 'sunday');
			const closed = key.match(/^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/);
			const open = key.match(/^from (\d{4}-\d{2}-\d{2})$/);
			if (closed) {
				expect(startDate).toBe(closed[1]);
				expect(endDate).toBe(closed[2]);
				expect(startDate! <= endDate!).toBe(true); // never a backwards selection
			} else if (open) {
				expect(startDate).toBe(open[1]);
				expect(endDate).toBeUndefined(); // open-ended: calendar shows a start with no end
			} else {
				throw new Error(`generated key is not a calendar-resolvable range: "${key}"`);
			}
		}
	});

	it('a selected preset key resolves to a non-future selection for a `to today` window', () => {
		// The newest period of "… to today" must end exactly on today, never beyond it.
		const presets = expandCustomRanges([{ range: '2024-01-01 to today', grain: 'year' }], TODAY);
		const { endDate } = processDateRange(presets[0].key, undefined, TODAY, 'sunday');
		expect(endDate).toBe('2026-06-23');
	});
});

// Exhaustive combinatorial sweep: the Cartesian product of every range grammar class × every grain
// (valid, invalid, and mis-cased) × every label shape (token combos, plain, missing, non-string) × both
// first-day-of-week settings — single-window, list, and multi-entry. For EVERY permutation the universal
// invariants below must hold, which together guarantee the picker renders a clean label and selects the
// exact encoded dates, and never throws, exceeds the cap, emits a duplicate, or orders a group wrong.
describe('expandCustomRanges — exhaustive permutations uphold the calendar invariants', () => {
	const MAX = 1000; // mirrors MAX_GENERATED_PERIODS

	// One representative per grammar class the date-range parser accepts (windows kept ≤ ~1 year so day grain
	// stays well under the cap), plus the invalid classes that must yield nothing.
	const RANGE_FORMS = [
		'last 7 days',
		'last 30 days',
		'last 3 months',
		'last 6 months',
		'last 12 months',
		'last 1 day',
		'last 2 weeks',
		'last 5 months',
		'last 3 quarters',
		'last 1 year',
		'last day',
		'last week',
		'last month',
		'last quarter',
		'last year',
		'previous week',
		'previous month',
		'previous quarter',
		'previous year',
		'previous 2 weeks',
		'previous 3 months',
		'this week',
		'this month',
		'this quarter',
		'this year',
		'next week',
		'next month',
		'next quarter',
		'next year',
		'week to date',
		'month to date',
		'quarter to date',
		'year to date',
		'today',
		'yesterday',
		'from 2025-08-01',
		'from today',
		'from yesterday',
		'until 2030-12-31',
		'2025-08-01 to 2026-05-31',
		'from 2025-08-01 to 2026-05-31',
		'2026-01-01 to today',
		'2024-02-29 to 2024-12-31',
		'from yesterday to today',
		// invalid classes — must produce no presets
		'all time',
		'2026-12-31 to 2026-01-01',
		'2025-02-29 to 2025-12-31',
		'   ',
		'not a range at all'
	];
	const GRAINS = [
		undefined,
		'day',
		'week',
		'month',
		'quarter',
		'year',
		'Year',
		' month ',
		'fortnight'
	];
	const LABELS = [
		undefined,
		'Custom Preset',
		'FY{end:yyyy}',
		'FY{start:yyyy}/{end:yy}',
		'{start:yy}-{end:yy}',
		'{start:mmm} {start:d}, {start:yyyy}',
		'{start:qq} {start:yyyy}',
		42 as never,
		null as never,
		{ nope: 1 } as never
	];
	const FDW: Array<'sunday' | 'monday'> = ['sunday', 'monday'];

	// Returns a message for the first broken invariant in `presets`, or null if all hold. Plain JS, no
	// per-check `expect()`: the matrix produces ~140k presets and a matcher per check would dominate runtime,
	// so the loop tests collect violations and assert once. The work itself (generate + round-trip) is ~200ms.
	const firstViolation = (
		presets: ReturnType<typeof expandCustomRanges>,
		ctx: string
	): string | null => {
		if (presets.length > MAX) return `${ctx}: exceeded cap (${presets.length})`;
		const keys = new Set<string>();
		for (const { key, label } of presets) {
			if (keys.has(key)) return `${ctx}: duplicate key ${key}`;
			keys.add(key);
			// Label: a clean, fully-resolved, non-empty string (no leftover {token}).
			if (typeof label !== 'string' || label.trim() === '')
				return `${ctx}: bad label ${JSON.stringify(label)}`;
			if (/[{}]/.test(label)) return `${ctx}: unresolved token in "${label}"`;
			// Key: calendar-resolvable and round-trips to exactly the encoded dates.
			const closed = key.match(/^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/);
			const open = key.match(/^from (\d{4}-\d{2}-\d{2})$/);
			const { startDate, endDate } = processDateRange(key, undefined, TODAY, 'sunday');
			if (closed) {
				if (startDate !== closed[1] || endDate !== closed[2])
					return `${ctx}: ${key} did not round-trip (got ${startDate}..${endDate})`;
				if (!(closed[1] <= closed[2])) return `${ctx}: ${key} is backwards`;
			} else if (open) {
				if (startDate !== open[1] || endDate !== undefined)
					return `${ctx}: ${key} open did not round-trip (got ${startDate}..${endDate})`;
			} else {
				return `${ctx}: key "${key}" is not a calendar-resolvable range`;
			}
		}
		return null;
	};

	// A preset's key/dates are a function of (range, grain, fdw) ALONE — the label never moves them — so the
	// date, ordering, cap and dedup invariants are exhausted over that product, not the full label cross-product
	// (which would re-run identical date math 10× per label). A token-bearing label is used throughout so
	// label-filling is still exercised on every generated period; label SHAPES are swept separately below.
	it('date/structure invariants hold for every range × grain × first-day-of-week', () => {
		const failures: string[] = [];
		let permutations = 0;
		for (const range of RANGE_FORMS) {
			for (const grain of GRAINS) {
				for (const fdw of FDW) {
					permutations++;
					const ctx = `range="${range}" grain="${grain}" fdw=${fdw}`;
					let presets: ReturnType<typeof expandCustomRanges>;
					try {
						presets = expandCustomRanges(
							[{ label: 'FY{start:yyyy}/{end:yy}', range, grain }],
							TODAY,
							fdw
						);
					} catch (e) {
						failures.push(`${ctx}: threw ${e}`);
						continue;
					}
					const violation = firstViolation(presets, ctx);
					if (violation) {
						failures.push(violation);
						continue;
					}
					// A single entry is one group: it must be strictly newest-first and deduped.
					const keys = presets.map((p) => p.key);
					const sorted = [...keys].sort((a, b) => b.localeCompare(a));
					if (keys.join('|') !== sorted.join('|')) failures.push(`${ctx}: wrong ordering`);
				}
			}
		}
		expect(failures).toEqual([]);
		expect(permutations).toBe(RANGE_FORMS.length * GRAINS.length * FDW.length);
	});

	it('label invariants hold for every label shape × grain, and every range default', () => {
		const failures: string[] = [];
		// Labels are applied uniformly per period, so a window that yields one period of each stepping path
		// (anchored, snapped, week, no-grain) renders a token exactly as a longer one would. These stay short
		// so the full label × grain product is cheap; multi-period date correctness is covered by the test above.
		const PATH_RANGES = [
			'from 2026-02-01 to 2026-06-30',
			'last 3 months',
			'last 2 weeks',
			'2026-05-01 to 2026-05-31',
			'from 2026-06-01'
		];
		for (const label of LABELS) {
			for (const grain of GRAINS) {
				for (const range of PATH_RANGES) {
					const ctx = `label=${JSON.stringify(label)} grain="${grain}" range="${range}"`;
					const violation = firstViolation(
						expandCustomRanges([{ label, range, grain }], TODAY),
						ctx
					);
					if (violation) failures.push(violation);
				}
			}
		}
		// The default (unlabelled, no-grain) label — defaultWindowLabel — across every range grammar class.
		for (const range of RANGE_FORMS) {
			const violation = firstViolation(
				expandCustomRanges([{ range }], TODAY),
				`default range="${range}"`
			);
			if (violation) failures.push(violation);
		}
		expect(failures).toEqual([]);
	});

	it('list windows: every pair of ranges × grain stays valid and never throws', () => {
		// Adjacent pairs keep the matrix bounded while still exercising every form in a list, mixing
		// valid+invalid windows (a bad sibling must drop without taking the others down).
		const failures: string[] = [];
		for (let i = 0; i < RANGE_FORMS.length; i++) {
			const pair = [RANGE_FORMS[i], RANGE_FORMS[(i + 1) % RANGE_FORMS.length]];
			for (const grain of GRAINS) {
				for (const label of [undefined, 'FY{end:yyyy}', 'Set'] as Array<string | undefined>) {
					const ctx = `list=${JSON.stringify(pair)} grain="${grain}" label=${JSON.stringify(label)}`;
					let presets: ReturnType<typeof expandCustomRanges>;
					try {
						presets = expandCustomRanges([{ label, range: pair, grain }], TODAY);
					} catch (e) {
						failures.push(`${ctx}: threw ${e}`);
						continue;
					}
					const violation = firstViolation(presets, ctx);
					if (violation) failures.push(violation);
				}
			}
		}
		expect(failures).toEqual([]);
	});

	it('multi-entry: many rules at once stay valid, deduped, and grouped per rule', () => {
		const rules: CustomRangeRule[] = [
			{ label: 'FY{end:yyyy}', range: 'from 2024-02-01', grain: 'year' },
			{ label: 'CY {start:yyyy}', range: '2024-01-01 to 2025-12-31', grain: 'year' },
			{ range: 'last 6 months', grain: 'month' },
			{
				label: '{start:yyyy} Season',
				range: ['2020-03-01 to 2020-10-15', '2021-02-28 to 2021-11-02']
			},
			{ range: 'last 30 days' },
			{ label: 'Since launch', range: 'from 2024-03-15' }
		];
		const all = expandCustomRanges(rules, TODAY);
		expect(firstViolation(all, 'multi-entry')).toBeNull();
		// Each rule's presets stay contiguous (groups never interleave): the group boundaries equal the
		// concatenation of each rule expanded alone (minus cross-rule duplicates, of which there are none here).
		const expectedKeys = rules.flatMap((r) => expandCustomRanges([r], TODAY).map((p) => p.key));
		expect(all.map((p) => p.key)).toEqual(expectedKeys);
	});

	it('week grain honors first-day-of-week where the window itself is relative to the calendar week', () => {
		// "this week" resolves differently under sunday vs monday; the generated week buckets must follow.
		const sun = expandCustomRanges([{ range: 'this week', grain: 'week' }], TODAY, 'sunday');
		const mon = expandCustomRanges([{ range: 'this week', grain: 'week' }], TODAY, 'monday');
		expect(sun[0].key).not.toBe(mon[0].key);
		expect(firstViolation(sun, 'this week / sunday')).toBeNull();
		expect(firstViolation(mon, 'this week / monday')).toBeNull();
	});
});

describe('resolveCustomRangeDefault — a custom range as default_range', () => {
	const rules: CustomRangeRule[] = [
		{ label: 'FY{start:yyyy}', range: 'from 2024-02-01', grain: 'year' }
	];

	it('rewrites a custom-range label to its absolute key', () => {
		expect(resolveCustomRangeDefault('FY2025', rules, TODAY)).toBe('2025-02-01 to 2026-01-31');
	});

	it('matches the rendered token label (`FY {end:yy}` → `FY 26`), not the raw template', () => {
		const fy: CustomRangeRule[] = [
			{ label: 'FY {end:yy}', range: 'from 2024-02-01', grain: 'year' }
		];
		// The token is filled per period, so the picker shows "FY 26"; default_range uses that rendered form.
		expect(expandCustomRanges(fy, TODAY).map((p) => p.label)).toContain('FY 26');
		expect(resolveCustomRangeDefault('FY 26', fy, TODAY)).toBe('2025-02-01 to 2026-01-31');
		// The unrendered template is not a real label, so it is left untouched (never guessed).
		expect(resolveCustomRangeDefault('FY {end:yy}', fy, TODAY)).toBe('FY {end:yy}');
	});

	it('passes a built-in preset key through unchanged', () => {
		expect(resolveCustomRangeDefault('last 30 days', rules, TODAY)).toBe('last 30 days');
	});

	it('a built-in preset key wins over a custom range that shares its label', () => {
		const collide: CustomRangeRule[] = [
			{ label: 'last 30 days', range: 'from 2024-02-01', grain: 'year' }
		];
		expect(resolveCustomRangeDefault('last 30 days', collide, TODAY)).toBe('last 30 days');
	});

	it('a label shared by several periods resolves to the first-declared one', () => {
		const dupes: CustomRangeRule[] = [
			{ label: 'Fiscal', range: '2024-01-01 to 2024-12-31' },
			{ label: 'Fiscal', range: '2025-01-01 to 2025-12-31' }
		];
		expect(resolveCustomRangeDefault('Fiscal', dupes, TODAY)).toBe('2024-01-01 to 2024-12-31');
	});

	it('passes a raw absolute range through unchanged', () => {
		expect(resolveCustomRangeDefault('2020-01-01 to 2020-12-31', rules, TODAY)).toBe(
			'2020-01-01 to 2020-12-31'
		);
	});

	it('leaves an unmatched label untouched (never guesses)', () => {
		expect(resolveCustomRangeDefault('FY1999', rules, TODAY)).toBe('FY1999');
	});

	it('returns the value unchanged when there are no custom_ranges', () => {
		expect(resolveCustomRangeDefault('FY2025', undefined, TODAY)).toBe('FY2025');
		expect(resolveCustomRangeDefault('FY2025', [], TODAY)).toBe('FY2025');
	});

	it('the resolved key drives the date pipeline to the right window (end-to-end)', () => {
		// The raw label alone would silently fall back to "last 12 months"; the resolved key does not.
		const key = resolveCustomRangeDefault('FY2025', rules, TODAY);
		const processed = processDateRange(key, undefined, TODAY);
		expect(processed.startDate).toBe('2025-02-01');
		expect(processed.endDate).toBe('2026-01-31');
	});
});
