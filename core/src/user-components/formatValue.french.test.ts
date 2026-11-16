// `it.fails` marks known French gaps; flip one to `it` when it is fixed.
import { describe, expect, it, vi } from 'vitest';
import { formatValue, createLocalizedFormatValue } from './formatValue';
import {
	formatTimeAxisLabel,
	formatTimeAxisTooltip
} from './tags/series_charts/combo_chart/format-time-axis-label';
import { getDateLocale, getDateNames } from '../locale/date-locale';

vi.spyOn(console, 'warn').mockImplementation(() => {});

const fr = createLocalizedFormatValue('fr');
const d = (y: number, m: number, day: number, h = 0, mi = 0, s = 0) =>
	new Date(y, m - 1, day, h, mi, s);

describe('French month/day names', () => {
	it('mmm = CLDR abbreviations', () => {
		const out = Array.from({ length: 12 }, (_, i) => fr(d(2026, i + 1, 15), 'mmm'));
		expect(out).toEqual([
			'janv.',
			'févr.',
			'mars',
			'avr.',
			'mai',
			'juin',
			'juil.',
			'août',
			'sept.',
			'oct.',
			'nov.',
			'déc.'
		]);
	});

	it('mmmm = wide lowercase, mmmmm = narrow letter', () => {
		expect(fr(d(2026, 2, 1), 'mmmm')).toBe('février');
		expect(fr(d(2026, 8, 1), 'mmmm')).toBe('août');
		expect(Array.from({ length: 12 }, (_, i) => fr(d(2026, i + 1, 1), 'mmmmm')).join('')).toBe(
			'JFMAMJJASOND'
		);
	});

	it('ddd / dddd on dates and on dayofweek integers (both week starts)', () => {
		// 2026-03-02 is a Monday
		expect(fr(d(2026, 3, 2), 'ddd')).toBe('lun.');
		expect(fr(d(2026, 3, 2), 'dddd')).toBe('lundi');
		expect(fr(d(2026, 3, 8), 'dddd')).toBe('dimanche');
		expect(fr(2, 'ddd', undefined, undefined, undefined, 'sunday')).toBe('lun.');
		expect(fr(1, 'dddd', undefined, undefined, undefined, 'monday')).toBe('lundi');
		expect(fr(7, 'dddd', undefined, undefined, undefined, 'monday')).toBe('dimanche');
	});

	it('month integers (month(date) = 1..12) localize', () => {
		expect(fr(3, 'mmm')).toBe('mars');
		expect(fr(7, 'mmmm')).toBe('juillet');
		expect(fr('12', 'mmm')).toBe('déc.');
	});

	it('presets', () => {
		const v = d(2026, 3, 4, 16, 5, 9);
		const table = Object.fromEntries(
			[
				'date',
				'shortdate',
				'longdate',
				'fulldate',
				'mdy',
				'dmy',
				'hms',
				'mmm-yy',
				'quarter',
				'qq',
				'ddd',
				'dddd',
				'mmm',
				'mmmm',
				'yyyy'
			].map((k) => [k, fr(v, k)])
		);
		expect(table.date).toBe('2026-03-04');
		expect(table.longdate).toBe('4 mars 2026');
		expect(table.fulldate).toBe('mercredi 4 mars 2026');
		expect(table.shortdate).toBe('4 mars 26');
		expect(table.hms).toBe('16:05:09');
		expect(table.dmy).toBe('4/3/26');
	});

	it.fails('`mdy` preset is US order in French (03/04 ambiguity) — documented gap', () => {
		expect(fr(d(2026, 3, 4), 'mdy')).not.toBe('3/4/26');
	});

	it('`quarter` preset uses "T" like the axis', () => {
		expect(fr(d(2026, 5, 1), 'quarter')).toBe('2026-T2');
	});

	it.fails('custom `h:mm AM/PM` emits English AM/PM in French', () => {
		expect(fr(d(2026, 3, 4, 16, 5), 'h:mm AM/PM')).not.toContain('PM');
	});

	it.fails('`General` on a Date falls back to SSF table 14 (m/d/yy, US order)', () => {
		expect(fr(d(2026, 3, 4), 'General')).not.toBe('3/4/26');
	});

	describe('date_grain default formats (tables, pivots, heatmap, sparkline, waterfall, category axes)', async () => {
		const { getDefaultFormatForDateGrain } = await import('./common/date-options');
		const cases: [Parameters<typeof getDefaultFormatForDateGrain>[0], unknown, string][] = [
			['day', '2026-03-04', '4 mars 2026'],
			['week', '2026-03-02', '2 mars 2026'],
			['month', '2026-03-01', 'mars 2026'],
			['hour', '2026-03-04 16:00:00', '4 mars 2026 16 h'],
			['quarter', '2026-04-01', '2026-T2'],
			['quarter of year', 2, 'T2'],
			['month of year', 3, 'mars'],
			['day of week', 2, 'lun.']
		];
		it.each(cases)('grain %s', (grain, value, expected) => {
			const code = getDefaultFormatForDateGrain(grain)!;
			const out = fr(
				value,
				code,
				undefined,
				undefined,
				typeof value === 'string' ? 'date' : undefined
			);
			expect(out).toBe(expected);
		});
	});

	it('literal / escaped text is never localized', () => {
		expect(fr(d(2026, 3, 4), '"mmm "mmm')).toBe('mmm mars');
		expect(fr(d(2026, 3, 4), '\\m\\m\\m yyyy')).toBe('mmm 2026');
		expect(fr(d(2026, 3, 4), '[$-409]mmmm yyyy')).toBe('mars 2026');
	});

	it('capitalisation: names are lowercase everywhere, incl. label start', () => {
		expect(fr(d(2026, 1, 1), 'mmmm yyyy')).toBe('janvier 2026');
		expect(fr(d(2026, 1, 5), 'dddd')).toBe('lundi');
	});

	it.fails(
		'comma decimal separator rewrites the "." in French abbreviations (serial + compact code)',
		() => {
			// 40 = day serial (1970-02-10 with date1970); `mmmyy` misses isDateFormat's \b regex
			const en = formatValue(40, 'mmmyy', undefined, undefined, undefined, undefined, ',', 'en');
			const out = formatValue(40, 'mmmyy', undefined, undefined, undefined, undefined, ',', 'fr');
			expect(out).not.toContain(',');
		}
	);

	it('decimal separator is independent of language (fr numbers still 1,234.5)', () => {
		expect(fr(1234.5, 'num1')).toBe('1,234.5');
		expect(fr(1234.5, 'num1', undefined, undefined, undefined, undefined, ',')).toBe('1.234,5');
	});
});

describe('French time axis', () => {
	const FR = getDateLocale('fr');
	const lbl = (v: Date, g: Parameters<typeof formatTimeAxisLabel>[2], idx = 0, prev?: Date) =>
		formatTimeAxisLabel(v, idx, g, undefined, false, false, false, prev, FR);

	it('grain labels', () => {
		const out = {
			year: lbl(d(2026, 1, 1), 'year'),
			quarterFirst: lbl(d(2026, 4, 1), 'quarter'),
			monthFirst: lbl(d(2026, 2, 1), 'month'),
			weekFirst: lbl(d(2026, 2, 9), 'week'),
			dayFirst: lbl(d(2026, 2, 9), 'day'),
			hourFirst: lbl(d(2026, 2, 9, 16), 'hour'),
			hourMidnight: lbl(d(2026, 2, 9, 0), 'hour', 3),
			hourRoll: lbl(d(2026, 2, 10, 4), 'hour', 3, d(2026, 2, 9, 20)),
			dayMonthRoll: lbl(d(2026, 3, 2), 'day', 3, d(2026, 2, 23)),
			monthYearCompactFirst: formatTimeAxisLabel(
				d(2023, 7, 1),
				0,
				'quarter',
				undefined,
				false,
				true,
				true,
				undefined,
				FR
			),
			tooltipHour: formatTimeAxisTooltip(d(2026, 6, 15, 16), 'hour', FR),
			tooltipDay: formatTimeAxisTooltip(d(2026, 6, 15), 'day', FR),
			tooltipWeekSame: formatTimeAxisTooltip(d(2026, 6, 15), 'week', FR),
			tooltipWeekCross: formatTimeAxisTooltip(d(2026, 6, 29), 'week', FR),
			tooltipWeekYear: formatTimeAxisTooltip(d(2025, 12, 29), 'week', FR),
			tooltipMonth: formatTimeAxisTooltip(d(2026, 7, 1), 'month', FR),
			tooltipQuarter: formatTimeAxisTooltip(d(2026, 7, 1), 'quarter', FR)
		};
		expect(out.quarterFirst).toBe('T2');
		expect(out.monthFirst).toBe('févr.');
		expect(out.dayFirst).toBe('9 févr.');
		expect(out.hourFirst).toBe('16 h');
		expect(out.hourMidnight).toBe('9 févr.');
		expect(out.tooltipHour).toBe('15 juin 2026 16 h');
		expect(out.tooltipWeekSame).toBe('15–21 juin 2026');
		expect(out.tooltipWeekCross).toBe('29 juin – 5 juil. 2026');
		expect(out.tooltipWeekYear).toBe('29 déc. 2025 – 4 janv. 2026');
		expect(out.tooltipQuarter).toBe('T3 2026');
	});

	it('getDateNames shape matches SSF expectations (Sunday first)', () => {
		const n = getDateNames(FR);
		expect(n.days[0]).toEqual(['dim.', 'dimanche']);
		expect(n.months[4]).toEqual(['M', 'mai', 'mai']);
	});
});
