import { describe, expect, it } from 'vitest';
import {
	renderAxis,
	DATE_COL,
	NUMBER_COL,
	STRING_COL,
	monthlyRows,
	dailyRows,
	hourlyRows,
	quarterlyRows,
	yearlyDateRows,
	intRows,
	stringRows,
	type RenderArgs
} from './x-axis-test-harness';

/**
 * THE X-AXIS LABEL MATRIX.
 *
 * One enforced cell per (column type × date grain × density × span × width)
 * combination the axis pipeline can hit, plus the cross-cutting knobs that
 * change label text or rotation: user `fmt` (bypasses the grain/span logic),
 * stacked coercion to a category axis (`forceCategory`), gappy data (grain-fill
 * labels the empty slot), and a mid (~520px) width in the fit→thin transition
 * band. Each cell pins the EXACT labels ECharts paints (and whether they rotate)
 * via the real end-to-end harness, so every grain maps to a known, tested
 * outcome and no unhandled case can ship silently. If you add a grain, an
 * axis-type rule, or a formatting branch, add its cells here. `X_AXIS_SPEC.md`
 * § 6 is the prose mirror of this table.
 *
 * Fidelity caveat (see x-axis-test-harness.ts): label WIDTH is char-count in
 * Node, so the exact thin/rotate breakpoint can sit a few px off a real browser.
 * These cells lock label VOCABULARY + ROTATION deterministically; the precise
 * survivor count at a given width is approximate.
 *
 * Axis-type routing (spec § 1): date column → time axis (unless grain forces
 * category); numeric seasonality grain → value axis; named seasonality grain
 * and `year` grain → category; number column → value; string column → category.
 */

interface MatrixCase {
	id: string;
	args: RenderArgs;
	expected: string[];
	rotated?: boolean;
}

const W = { wide: 700, mid: 520, phone: 375 } as const;

const CASES: MatrixCase[] = [
	// ── TIME axis · hour grain (date column) ────────────────────────────────
	{
		id: 'hour · 6h same day · wide',
		args: {
			width: W.wide,
			rows: hourlyRows(2025, 5, 15, 8, 6),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'hour'
		},
		expected: ['8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm']
	},
	{
		id: 'hour · 24h across a day · wide',
		args: {
			width: W.wide,
			rows: hourlyRows(2025, 5, 15, 0, 24),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'hour'
		},
		expected: ['12 am', '4 am', '8 am', '12 pm', '4 pm', '8 pm']
	},
	{
		id: 'hour · 24h across a day · phone',
		args: {
			width: W.phone,
			rows: hourlyRows(2025, 5, 15, 0, 24),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'hour'
		},
		expected: ['12 am', '4 am', '8 am', '12 pm', '4 pm', '8 pm']
	},
	{
		id: 'hour · 48h crossing month boundary · wide (date at midnight)',
		args: {
			width: W.wide,
			rows: hourlyRows(2025, 4, 30, 12, 48),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'hour'
		},
		expected: ['12 pm', '6 pm', 'May 31', '6 am', '12 pm', '6 pm', 'Jun 1', '6 am']
	},

	// ── TIME axis · day grain ───────────────────────────────────────────────
	{
		id: 'day · 5 days · wide (verbose: every tick month-qualified)',
		args: {
			width: W.wide,
			rows: dailyRows(2025, 5, 5),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day'
		},
		expected: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5']
	},
	{
		id: 'day · 10 days · wide (first tick anchored, rest bare)',
		args: {
			width: W.wide,
			rows: dailyRows(2025, 5, 10),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day'
		},
		expected: ['Jun 1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
	},
	{
		id: 'day · 40 days crossing months · wide (ECharts ticks, month at rollover)',
		args: {
			width: W.wide,
			rows: dailyRows(2025, 5, 40),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day'
		},
		expected: ['2', '5', '9', '13', '17', '21', '25', '29', 'Jul', '3', '5', '9']
	},
	{
		id: 'day · 40 days crossing months · phone (thinned)',
		args: {
			width: W.phone,
			rows: dailyRows(2025, 5, 40),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day'
		},
		expected: ['2', '5', '9', '13', '17', '21', '25', '29', '3', '5', '9']
	},
	{
		id: 'day · 40 days crossing months · mid ~520 (transition band)',
		args: {
			width: W.mid,
			rows: dailyRows(2025, 5, 40),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day'
		},
		expected: ['2', '5', '9', '13', '17', '21', '25', '29', 'Jul', '3', '5', '9']
	},
	{
		id: 'day · 3 years · wide (multi-year: year-anchored first tick)',
		args: {
			width: W.wide,
			rows: dailyRows(2022, 0, 1095),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day'
		},
		expected: ['2022', 'Jul', '2023', 'Jul', '2024', 'Jul', '2025']
	},

	// ── TIME axis · week grain ──────────────────────────────────────────────
	{
		id: 'week · 2 weeks, single year · wide (sparse verbose, day-qualified)',
		args: {
			width: W.wide,
			rows: dailyRows(2025, 5, 2, 7),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'week'
		},
		expected: ['Jun 1', 'Jun 8']
	},
	{
		id: 'week · 4 weeks · wide (day-qualified)',
		args: {
			width: W.wide,
			rows: dailyRows(2025, 5, 4, 7),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'week'
		},
		expected: ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22']
	},
	{
		id: 'week · 12 weeks · wide (month at rollover, day within)',
		args: {
			width: W.wide,
			rows: dailyRows(2025, 0, 12, 7),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'week'
		},
		expected: ['Jan 1', '8', '15', '22', '29', 'Feb 5', '12', '19', '26', 'Mar 5', '12', '19']
	},
	{
		id: 'week · 3 years · wide (multi-year: year-anchored first tick)',
		args: {
			width: W.wide,
			rows: dailyRows(2022, 0, 156, 7),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'week'
		},
		expected: ['2022', 'Jul', '2023', 'Jul', '2024', 'Jul', '2025']
	},

	// ── TIME axis · month grain ─────────────────────────────────────────────
	{
		id: 'month · 3 months mid-year, single calendar year · wide (no year — it is redundant)',
		args: {
			width: W.wide,
			rows: monthlyRows(2026, 3, 3),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: ['Apr', 'May', 'Jun']
	},
	{
		id: 'month · 4 months, single calendar year · wide (bare months, no year)',
		args: {
			width: W.wide,
			rows: monthlyRows(2025, 0, 4),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: ['Jan', 'Feb', 'Mar', 'Apr']
	},
	{
		id: 'month · 12 months, single calendar year · wide (bare months, no year anywhere)',
		args: {
			width: W.wide,
			rows: monthlyRows(2024, 0, 12),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		]
	},
	{
		id: 'month · 12 months, single calendar year · mid ~520 (transition band)',
		args: {
			width: W.mid,
			rows: monthlyRows(2024, 0, 12),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		]
	},
	{
		id: 'month · 11 months with July missing, single year · wide (grain-fill labels the gap)',
		args: {
			width: W.wide,
			// Jan–Jun + Aug–Dec 2024: July is absent from the data. The grain
			// walker still emits a labeled July slot (spec § 3 grain-fill).
			rows: [...monthlyRows(2024, 0, 6), ...monthlyRows(2024, 7, 5)],
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		]
	},
	{
		id: 'month · single year · wide · user fmt "mmm yyyy" (fmt overrides year suppression)',
		args: {
			width: W.wide,
			rows: monthlyRows(2026, 3, 3),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month',
			fmt: 'mmm yyyy'
		},
		expected: ['Apr 2026', 'May 2026', 'Jun 2026']
	},
	{
		id: 'month · 12 months, single calendar year · phone',
		args: {
			width: W.phone,
			rows: monthlyRows(2024, 0, 12),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		]
	},
	{
		id: 'month · 12 months across a year boundary · wide (two-tier: year returns at first + Jan)',
		args: {
			width: W.wide,
			rows: monthlyRows(2019, 6, 12),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: [
			'Jul\n2019',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
			'Jan\n2020',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun'
		]
	},
	{
		id: 'month · 3 years · wide (single-line, bare-year boundaries)',
		args: {
			width: W.wide,
			rows: monthlyRows(2024, 0, 36),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: ['2024', 'Jul', '2025', 'Jul', '2026', 'Jul']
	},
	{
		id: 'month · 5 years · wide (bare year axis, no repeated Jan)',
		args: {
			width: W.wide,
			rows: monthlyRows(2022, 0, 60),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: ['2022', '2023', '2024', '2025', '2026', '2027']
	},
	{
		id: 'month · 5 years mid-year start · wide (bare years, no dead space)',
		args: {
			width: W.wide,
			rows: monthlyRows(2020, 6, 60),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month'
		},
		expected: ['2021', '2022', '2023', '2024', '2025']
	},

	// ── TIME axis · quarter grain ───────────────────────────────────────────
	{
		id: 'quarter · 2 quarters, single year · wide (sparse, bare)',
		args: {
			width: W.wide,
			rows: quarterlyRows(2025, 0, 2),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'quarter'
		},
		expected: ['Q1', 'Q2']
	},
	{
		id: 'quarter · 4 quarters, single calendar year · wide (bare Q labels, no year)',
		args: {
			width: W.wide,
			rows: quarterlyRows(2025, 0, 4),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'quarter'
		},
		expected: ['Q1', 'Q2', 'Q3', 'Q4']
	},
	{
		id: 'quarter · 4 quarters across a year boundary · wide (two-tier: year returns at first + Q1)',
		args: {
			width: W.wide,
			rows: quarterlyRows(2024, 2, 4),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'quarter'
		},
		expected: ['Q3\n2024', 'Q4', 'Q1\n2025', 'Q2']
	},
	{
		id: 'quarter · 8 quarters multi-year · wide (inline first tick, bare-year boundaries)',
		args: {
			width: W.wide,
			rows: quarterlyRows(2023, 2, 8),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'quarter'
		},
		expected: ['Q3 2023', 'Q4', '2024', 'Q2', 'Q3', 'Q4', '2025', 'Q2']
	},
	{
		id: 'quarter · 24 quarters (6yr) · wide (native ECharts ticks → bare year timeline, no stray quarter-as-year)',
		args: {
			width: W.wide,
			rows: quarterlyRows(2020, 0, 24),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'quarter'
		},
		// Above the custom-tick threshold ECharts owns tick placement; its yearly
		// ticks land exactly on Jan 1 (Q1), so the compact branch collapses each to
		// a bare year. Guards the isJanuary1 boundary check — a non-boundary January
		// tick must never hide its quarter and read as a year separator.
		expected: ['2020', '2021', '2022', '2023', '2024', '2025']
	},

	// ── CATEGORY axis · year grain (bare 4-digit year, both column types) ────
	{
		id: 'year · 8 years · date col · wide',
		args: {
			width: W.wide,
			rows: yearlyDateRows(2015, 8),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'year'
		},
		expected: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
	},
	{
		id: 'year · 8 years · date col · phone',
		args: {
			width: W.phone,
			rows: yearlyDateRows(2015, 8),
			columns: DATE_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'year'
		},
		expected: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
	},
	{
		id: 'year · 8 years · number col · wide (no thousands separators)',
		args: {
			width: W.wide,
			rows: intRows(2015, 8),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'year'
		},
		expected: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
	},
	{
		id: 'year · 8 years · number col · wide · user fmt "yyyy" (ignored → still bare, no Excel-serial misread)',
		args: {
			width: W.wide,
			rows: intRows(2015, 8),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'year',
			fmt: 'yyyy'
		},
		// extractYear runs before `fmt` for the year grain, so a stray `fmt="yyyy"`
		// can't route the integer 2015 through SSF (which would misread it as an
		// Excel serial → a 1905-era date). Bare 4-digit years, same as no fmt.
		expected: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
	},
	{
		id: 'year · 30 years · number col · phone (numeric-thinned, never rotated)',
		args: {
			width: W.phone,
			rows: intRows(1995, 30),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'year'
		},
		expected: ['1995', '1999', '2003', '2007', '2011', '2015', '2019', '2024']
	},

	// ── CATEGORY axis · named seasonality (no user fmt → grain's canonical) ──
	{
		id: 'month of year · 12 · wide (names, not integers)',
		args: {
			width: W.wide,
			rows: intRows(1, 12),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month of year',
			seriesType: 'bar'
		},
		expected: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	},
	{
		id: 'month of year · 12 · phone (all names fit, no rotation)',
		args: {
			width: W.phone,
			rows: intRows(1, 12),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'month of year',
			seriesType: 'bar'
		},
		expected: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	},
	{
		id: 'day of week · 7 · wide (names)',
		args: {
			width: W.wide,
			rows: intRows(1, 7),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day of week',
			seriesType: 'bar'
		},
		expected: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	},
	{
		id: 'quarter of year · 4 · wide (Q1–Q4)',
		args: {
			width: W.wide,
			rows: intRows(1, 4),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'quarter of year',
			seriesType: 'bar'
		},
		expected: ['Q1', 'Q2', 'Q3', 'Q4']
	},

	// ── VALUE axis · numeric seasonality (whole integers, never decimals) ────
	{
		id: 'day of month · 31 · wide (integer ticks, no ".0")',
		args: {
			width: W.wide,
			rows: intRows(1, 31),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day of month'
		},
		expected: ['5', '10', '15', '20', '25', '30']
	},
	{
		id: 'day of month · 31 · phone',
		args: {
			width: W.phone,
			rows: intRows(1, 31),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day of month'
		},
		expected: ['5', '10', '15', '20', '25', '30']
	},
	{
		id: 'day of month · 31 · wide · stacked (forceCategory → all fit horizontally, never rotated)',
		args: {
			width: W.wide,
			rows: intRows(1, 31),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day of month',
			seriesType: 'bar',
			forceCategory: true
		},
		expected: [
			'1',
			'2',
			'3',
			'4',
			'5',
			'6',
			'7',
			'8',
			'9',
			'10',
			'11',
			'12',
			'13',
			'14',
			'15',
			'16',
			'17',
			'18',
			'19',
			'20',
			'21',
			'22',
			'23',
			'24',
			'25',
			'26',
			'27',
			'28',
			'29',
			'30',
			'31'
		],
		rotated: false
	},
	{
		id: 'day of month · 31 · phone · stacked (forceCategory → thinned more, still not rotated)',
		args: {
			width: W.phone,
			rows: intRows(1, 31),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day of month',
			seriesType: 'bar',
			forceCategory: true
		},
		expected: ['1', '4', '7', '10', '13', '16', '19', '22', '25', '28', '31'],
		rotated: false
	},
	{
		id: 'week of year · 53 · wide',
		args: {
			width: W.wide,
			rows: intRows(1, 53),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'week of year'
		},
		expected: ['10', '20', '30', '40', '50']
	},
	{
		id: 'day of year · 366 · wide',
		args: {
			width: W.wide,
			rows: intRows(1, 366),
			columns: NUMBER_COL,
			x: 'x',
			y: 'y',
			dateGrain: 'day of year'
		},
		expected: ['100', '200', '300']
	},

	// ── VALUE axis · plain numbers (no grain) ───────────────────────────────
	{
		id: 'plain number · un-named 4-digit ints · wide (generic number, separators)',
		args: { width: W.wide, rows: intRows(1995, 8), columns: NUMBER_COL, x: 'x', y: 'y' },
		expected: ['1,996', '1,998', '2,000', '2,002']
	},
	{
		id: 'value axis · year-named int column · wide (year-like → no separators)',
		args: {
			width: W.wide,
			rows: intRows(1995, 8).map((r) => ({ year: r.x, y: r.y })),
			columns: [
				{ name: 'year', jsType: 'number' },
				{ name: 'y', jsType: 'number' }
			],
			x: 'year',
			y: 'y'
		},
		expected: ['1996', '1998', '2000', '2002']
	},
	{
		id: 'plain number · 10-100 step 10 · wide',
		args: { width: W.wide, rows: intRows(10, 10, 10), columns: NUMBER_COL, x: 'x', y: 'y' },
		expected: ['20', '40', '60', '80', '100']
	},

	// ── CATEGORY axis · string labels ───────────────────────────────────────
	{
		id: 'string · 5 short · wide (verbatim, no date coercion)',
		args: {
			width: W.wide,
			rows: stringRows(['A', 'B', 'C', 'D', 'E']),
			columns: STRING_COL,
			x: 'x',
			y: 'y',
			seriesType: 'bar'
		},
		expected: ['A', 'B', 'C', 'D', 'E']
	},
	{
		id: 'string · 8 long · phone (rotate when they cannot fit)',
		args: {
			width: W.phone,
			rows: stringRows([
				'Alderaan',
				'Bespin',
				'Coruscant',
				'Dagobah',
				'Endor',
				'Felucia',
				'Geonosis',
				'Hoth'
			]),
			columns: STRING_COL,
			x: 'x',
			y: 'y',
			seriesType: 'bar'
		},
		expected: [
			'Alderaan',
			'Bespin',
			'Coruscant',
			'Dagobah',
			'Endor',
			'Felucia',
			'Geonosis',
			'Hoth'
		],
		rotated: true
	}
];

describe('x-axis label matrix (type × grain × density × span × width)', () => {
	it.each(CASES)('$id', ({ args, expected, rotated }) => {
		const result = renderAxis(args);
		expect(result.labels).toEqual(expected);
		expect(result.rotated).toBe(rotated ?? false);
	});
});
