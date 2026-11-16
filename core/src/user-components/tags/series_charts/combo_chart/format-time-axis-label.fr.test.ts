import { describe, it, expect } from 'vitest';
import {
	formatTimeAxisLabel,
	formatTimeAxisTooltip,
	type TimeAxisGrain
} from './format-time-axis-label';
import {
	EN_DATE_LOCALE,
	FR_DATE_LOCALE,
	formatDate,
	formatWeekRange,
	getDateLocale
} from '../../../../locale/date-locale';

/**
 * French-language axis labels. The hierarchical rollover rules are shared
 * with the English suite (format-time-axis-label.test.ts); these cases pin the
 * French `DateLocale` — CLDR month abbreviations, day-before-month order,
 * 24-hour clock, "T" quarter prefix — and that omitting `dateLocale` is
 * exactly English.
 */
function frSequence(ticks: Date[], grain: TimeAxisGrain, compactYearRollover = false): string[] {
	const dataMinMs = ticks[0]?.getTime();
	const spansMultipleYears =
		ticks.length > 0 && ticks[0].getFullYear() !== ticks[ticks.length - 1].getFullYear();
	return ticks.map((t, i) =>
		formatTimeAxisLabel(
			t,
			i,
			grain,
			dataMinMs,
			false,
			compactYearRollover,
			spansMultipleYears,
			undefined,
			FR_DATE_LOCALE
		)
	);
}

function dt(y: number, m: number, d: number, h = 0): Date {
	return new Date(y, m, d, h);
}

describe('getDateLocale', () => {
	it('resolves the translations.yaml language code, falling back to English', () => {
		expect(getDateLocale('fr')).toBe(FR_DATE_LOCALE);
		expect(getDateLocale('FR')).toBe(FR_DATE_LOCALE);
		expect(getDateLocale('en')).toBe(EN_DATE_LOCALE);
		expect(getDateLocale('de')).toBe(EN_DATE_LOCALE);
		expect(getDateLocale(null)).toBe(EN_DATE_LOCALE);
		expect(getDateLocale(undefined)).toBe(EN_DATE_LOCALE);
	});
});

describe('DateLocale patterns', () => {
	const d = new Date(2025, 8, 15, 16);

	it('English patterns reproduce the pre-localization labels exactly', () => {
		const en = (key: Parameters<typeof formatDate>[1]) => formatDate(EN_DATE_LOCALE, key, d);
		expect(en('month')).toBe('Sep');
		expect(en('monthYear')).toBe('Sep 2025');
		expect(en('quarter')).toBe('Q3');
		expect(en('quarterYear')).toBe('Q3 2025');
		expect(en('dayMonth')).toBe('Sep 15');
		expect(en('dayMonthYear')).toBe('Sep 15, 2025');
		expect(en('hour')).toBe('4 pm');
		expect(en('dayMonthHour')).toBe('Sep 15, 4 pm');
		expect(en('dayMonthYearHour')).toBe('Sep 15, 2025 4 pm');
		expect(en('year')).toBe('2025');
		expect(formatDate(EN_DATE_LOCALE, 'hour', new Date(2025, 0, 1, 0))).toBe('12 am');
		expect(formatDate(EN_DATE_LOCALE, 'hour', new Date(2025, 0, 1, 12))).toBe('12 pm');
	});

	it('French patterns use CLDR abbreviations, day-first order and the 24-hour clock', () => {
		const frf = (key: Parameters<typeof formatDate>[1]) => formatDate(FR_DATE_LOCALE, key, d);
		expect(frf('month')).toBe('sept.');
		expect(frf('monthYear')).toBe('sept. 2025');
		expect(frf('quarter')).toBe('T3');
		expect(frf('quarterYear')).toBe('T3 2025');
		expect(frf('dayMonth')).toBe('15 sept.');
		expect(frf('dayMonthYear')).toBe('15 sept. 2025');
		expect(frf('hour')).toBe('16 h');
		expect(frf('dayMonthHour')).toBe('15 sept. 16 h');
		expect(frf('dayMonthYearHour')).toBe('15 sept. 2025 16 h');
		expect(formatDate(FR_DATE_LOCALE, 'hour', new Date(2025, 0, 1, 0))).toBe('0 h');
	});

	it('week range templates pick same-month / cross-month / cross-year by the end date', () => {
		const week = (dl: typeof EN_DATE_LOCALE, y: number, m: number, day: number) =>
			formatWeekRange(dl, new Date(y, m, day), new Date(y, m, day + 6));
		expect(week(EN_DATE_LOCALE, 2025, 5, 15)).toBe('Jun 15–21, 2025');
		expect(week(EN_DATE_LOCALE, 2025, 5, 29)).toBe('Jun 29 – Jul 5, 2025');
		expect(week(EN_DATE_LOCALE, 2025, 11, 29)).toBe('Dec 29, 2025 – Jan 4, 2026');
		expect(week(FR_DATE_LOCALE, 2025, 5, 15)).toBe('15–21 juin 2025');
		expect(week(FR_DATE_LOCALE, 2025, 5, 29)).toBe('29 juin – 5 juil. 2025');
		expect(week(FR_DATE_LOCALE, 2025, 11, 29)).toBe('29 déc. 2025 – 4 janv. 2026');
	});
});

describe('formatTimeAxisLabel (fr)', () => {
	it('omitting dateLocale is byte-identical to passing the English locale', () => {
		const ticks = [dt(2025, 5, 5), dt(2025, 5, 6), dt(2025, 6, 1), dt(2026, 0, 1)];
		const implicit = ticks.map((t, i) =>
			formatTimeAxisLabel(t, i, 'day', ticks[0].getTime(), false, false, true)
		);
		const explicit = ticks.map((t, i) =>
			formatTimeAxisLabel(
				t,
				i,
				'day',
				ticks[0].getTime(),
				false,
				false,
				true,
				undefined,
				EN_DATE_LOCALE
			)
		);
		expect(implicit).toEqual(explicit);
		expect(implicit).toEqual(['Jun 5', '6', 'Jul', 'Jan 2026']);
	});

	it('day grain: first tick is day-before-month, rollovers use French abbreviations', () => {
		const seq = frSequence([dt(2025, 5, 5), dt(2025, 5, 6), dt(2025, 6, 1), dt(2026, 0, 1)], 'day');
		expect(seq).toEqual(['5 juin', '6', 'juil.', 'janv. 2026']);
	});

	it('week grain: non-day-1 month rollover reads "7 mai", day-1 reads bare month', () => {
		const seq = frSequence(
			[dt(2025, 3, 23), dt(2025, 3, 30), dt(2025, 4, 7), dt(2025, 4, 14), dt(2025, 5, 1)],
			'week'
		);
		expect(seq).toEqual(['23 avr.', '30', '7 mai', '14', 'juin']);
	});

	it('month grain within one calendar year: bare French months', () => {
		const seq = frSequence([dt(2026, 3, 1), dt(2026, 4, 1), dt(2026, 5, 1)], 'month');
		expect(seq).toEqual(['avr.', 'mai', 'juin']);
	});

	it('month grain across a year boundary: two-tier with the year at the first tick and January', () => {
		const seq = frSequence(
			[dt(2024, 10, 1), dt(2024, 11, 1), dt(2025, 0, 1), dt(2025, 1, 1)],
			'month'
		);
		expect(seq).toEqual(['nov.\n2024', 'déc.', 'janv.\n2025', 'févr.']);
	});

	it('quarter grain uses the T (trimestre) prefix', () => {
		const seq = frSequence(
			[dt(2024, 6, 1), dt(2024, 9, 1), dt(2025, 0, 1), dt(2025, 3, 1)],
			'quarter'
		);
		expect(seq).toEqual(['T3\n2024', 'T4', 'T1\n2025', 'T2']);
	});

	it('multi-year compact rollover: bare years at January, inline "T3 2023" anchor', () => {
		const seq = frSequence(
			[dt(2023, 6, 1), dt(2024, 0, 1), dt(2024, 6, 1), dt(2025, 0, 1)],
			'quarter',
			true
		);
		expect(seq).toEqual(['T3 2023', '2024', 'T3', '2025']);
	});

	it('hour grain: 24-hour clock, midnight surfaces the day-before-month date', () => {
		const seq = frSequence(
			[dt(2025, 5, 15, 9), dt(2025, 5, 15, 16), dt(2025, 5, 16, 0), dt(2025, 5, 16, 4)],
			'hour'
		);
		expect(seq).toEqual(['9 h', '16 h', '16 juin', '4 h']);
	});

	it('year grain is language-independent', () => {
		expect(frSequence([dt(2024, 0, 1), dt(2025, 0, 1)], 'year')).toEqual(['2024', '2025']);
	});

	it('previousTick rollovers (thinned pinned ticks) are spelled in French', () => {
		const frPrev = (
			value: Date,
			grain: TimeAxisGrain,
			previous: Date,
			compactYearRollover = false,
			spansMultipleYears = false
		) =>
			formatTimeAxisLabel(
				value,
				4,
				grain,
				undefined,
				false,
				compactYearRollover,
				spansMultipleYears,
				previous,
				FR_DATE_LOCALE
			);
		expect(frPrev(dt(2024, 1, 2), 'day', dt(2024, 0, 31))).toBe('2 févr.');
		expect(frPrev(dt(2025, 0, 3), 'day', dt(2024, 11, 28), false, true)).toBe('janv. 2025');
		expect(frPrev(dt(2024, 1, 6), 'day', dt(2024, 1, 2))).toBe('6');
		expect(frPrev(dt(2024, 2, 3, 4), 'hour', dt(2024, 2, 2, 21))).toBe('3 mars 4 h');
		expect(frPrev(dt(2024, 6, 1), 'quarter', dt(2023, 9, 1), true, true)).toBe('T3 2024');
	});
});

describe('formatTimeAxisTooltip (fr)', () => {
	it('day grain: "15 juin 2025" with no comma', () => {
		expect(formatTimeAxisTooltip(new Date(2025, 5, 15), 'day', FR_DATE_LOCALE)).toBe(
			'15 juin 2025'
		);
	});

	describe('week grain ranges', () => {
		it('same month', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 5, 15), 'week', FR_DATE_LOCALE)).toBe(
				'15–21 juin 2025'
			);
		});

		it('crosses a month boundary', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 5, 29), 'week', FR_DATE_LOCALE)).toBe(
				'29 juin – 5 juil. 2025'
			);
		});

		it('crosses a year boundary', () => {
			expect(formatTimeAxisTooltip(new Date(2025, 11, 29), 'week', FR_DATE_LOCALE)).toBe(
				'29 déc. 2025 – 4 janv. 2026'
			);
		});
	});

	it('hour grain: date then 24-hour time', () => {
		expect(formatTimeAxisTooltip(new Date(2025, 5, 15, 14, 0), 'hour', FR_DATE_LOCALE)).toBe(
			'15 juin 2025 14 h'
		);
	});

	it('month and quarter grains', () => {
		expect(formatTimeAxisTooltip(new Date(2025, 5, 1), 'month', FR_DATE_LOCALE)).toBe('juin 2025');
		expect(formatTimeAxisTooltip(new Date(2025, 3, 1), 'quarter', FR_DATE_LOCALE)).toBe('T2 2025');
	});

	it('English tooltips are unchanged when dateLocale is omitted', () => {
		expect(formatTimeAxisTooltip(new Date(2025, 5, 29), 'week')).toBe('Jun 29 – Jul 5, 2025');
		expect(formatTimeAxisTooltip(new Date(2025, 5, 15, 14, 0), 'hour')).toBe('Jun 15, 2025 2 pm');
	});
});
