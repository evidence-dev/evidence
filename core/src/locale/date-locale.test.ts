import { describe, it, expect } from 'vitest';
import {
	EN_DATE_LOCALE,
	FR_DATE_LOCALE,
	formatDate,
	formatWeekRange,
	getCalendarNameMaps,
	getDateLocale,
	getDateNames,
	type DatePatterns
} from './date-locale';
import { SUPPORTED_LANGUAGES } from './registry';
import { formatValue } from '../user-components/formatValue';

/**
 * Contract every registered language's `DateLocale` must satisfy, independent
 * of what its labels say. A new-language PR only has to add a registry entry;
 * this matrix makes a typo in it fail CI rather than throw inside a chart at
 * render time.
 */
const PATTERN_KEYS = Object.keys(EN_DATE_LOCALE.patterns) as (keyof DatePatterns)[];

const SAMPLE_DATES = [
	new Date(2024, 0, 1, 0),
	new Date(2024, 1, 29, 12),
	new Date(2025, 5, 15, 16),
	new Date(2025, 11, 31, 23)
];

describe.each(SUPPORTED_LANGUAGES)('DateLocale contract: %s', (language) => {
	const dl = getDateLocale(language);

	it('is registered under a lower-case BCP-47 tag and resolves case-insensitively', () => {
		expect(language).toMatch(/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/);
		expect(getDateLocale(language.toUpperCase())).toBe(dl);
	});

	it('defines every pattern and renders each to a non-empty single line', () => {
		for (const key of PATTERN_KEYS) {
			expect(dl.patterns[key], `patterns.${key}`).toBeTypeOf('string');
			for (const date of SAMPLE_DATES) {
				const out = formatDate(dl, key, date);
				expect(out, `${key} for ${date.toISOString()}`).not.toBe('');
				// The formatter stacks two-tier labels with '\n' and the layout
				// detects them by that character, so no pattern may emit one.
				expect(out, `${key} contains a newline`).not.toContain('\n');
			}
		}
	});

	it('period patterns are injective over their period', () => {
		const months = new Set(
			Array.from({ length: 12 }, (_, m) => formatDate(dl, 'month', new Date(2024, m, 1)))
		);
		expect(months.size).toBe(12);

		const quarters = new Set(
			Array.from({ length: 4 }, (_, q) => formatDate(dl, 'quarter', new Date(2024, q * 3, 1)))
		);
		expect(quarters.size).toBe(4);

		const hours = new Set(
			Array.from({ length: 24 }, (_, h) => formatDate(dl, 'hour', new Date(2024, 5, 1, h)))
		);
		expect(hours.size).toBe(24);
	});

	it('year-bearing patterns contain the year', () => {
		const date = new Date(2025, 5, 15, 16);
		for (const key of [
			'monthYear',
			'quarterYear',
			'dayMonthYear',
			'dayMonthYearHour',
			'year'
		] as const) {
			expect(formatDate(dl, key, date), key).toContain('2025');
		}
	});

	it('week-range templates resolve every token and cover all three cases', () => {
		const cases: [Date, Date][] = [
			[new Date(2025, 5, 15), new Date(2025, 5, 21)],
			[new Date(2025, 5, 29), new Date(2025, 6, 5)],
			[new Date(2025, 11, 29), new Date(2026, 0, 4)]
		];
		const outputs = cases.map(([s, e]) => formatWeekRange(dl, s, e));
		for (const out of outputs) {
			expect(out).not.toBe('');
			expect(out).not.toContain('{');
			expect(out).not.toContain('}');
			expect(out).not.toContain('\n');
		}
		expect(outputs[2]).toContain('2025');
		expect(outputs[2]).toContain('2026');
		expect(new Set(outputs).size).toBe(3);
	});

	it('renders every fmt preset and grain format override without falling back', () => {
		const date = new Date(2025, 6, 5, 16, 5, 9);
		const overridden = [...Object.keys(dl.presets ?? {}), ...Object.keys(dl.grainFormats ?? {})];
		for (const code of overridden) {
			const value = code === '"Q"0' ? 3 : date;
			const out = formatValue(value, code, '', undefined, undefined, 'sunday', undefined, language);
			expect(out, code).not.toBe('');
			expect(out, code).not.toBe(JSON.stringify(value));
		}
	});
});

describe.each(SUPPORTED_LANGUAGES)('getDateNames: %s', (language) => {
	const names = getDateNames(getDateLocale(language));

	it('yields 12 distinct months and 7 distinct days at every width SSF uses', () => {
		expect(names.months).toHaveLength(12);
		expect(names.days).toHaveLength(7);
		for (const width of [1, 2] as const) {
			expect(new Set(names.months.map((m) => m[width])).size).toBe(12);
		}
		for (const width of [0, 1] as const) {
			expect(new Set(names.days.map((d) => d[width])).size).toBe(7);
		}
		for (const cell of [...names.months.flat(), ...names.days.flat()]) {
			expect(cell.trim()).not.toBe('');
		}
	});
});

describe('getDateNames', () => {
	// `fmt` output for English viewers must not change when names are supplied explicitly.
	it('English names are exactly the ones SSF ships with', () => {
		const { months, days } = getDateNames(EN_DATE_LOCALE);
		expect(months.map((m) => m[1])).toEqual([
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
		]);
		expect(months.map((m) => m[2])).toEqual([
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December'
		]);
		expect(months.map((m) => m[0]).join('')).toBe('JFMAMJJASOND');
		expect(days.map((d) => d[0])).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
		expect(days.map((d) => d[1])).toEqual([
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		]);
	});

	it('French names follow CLDR: lower-case, abbreviations with a trailing period', () => {
		const { months, days } = getDateNames(FR_DATE_LOCALE);
		expect(months[0]).toEqual(['J', 'janv.', 'janvier']);
		expect(months[7]).toEqual(['A', 'août', 'août']);
		expect(days[0]).toEqual(['dim.', 'dimanche']);
		expect(days[1]).toEqual(['lun.', 'lundi']);
	});
});

describe('getCalendarNameMaps', () => {
	// ECharts' built-in 'EN' calendar labels (echarts/lib/i18n/langEN.js).
	it('English matches the labels ECharts draws by default, so English calendars are unchanged', () => {
		const { months, narrowMonths, days } = getCalendarNameMaps(EN_DATE_LOCALE);
		expect(months).toEqual([
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
		]);
		expect(narrowMonths.join('')).toBe('JFMAMJJASOND');
		expect(days).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
	});

	it('French calendars get French month and weekday names', () => {
		const { months, narrowMonths, days } = getCalendarNameMaps(FR_DATE_LOCALE);
		expect(months.slice(0, 3)).toEqual(['janv.', 'févr.', 'mars']);
		expect(narrowMonths.join('')).toBe('JFMAMJJASOND');
		expect(days).toEqual(['D', 'L', 'M', 'M', 'J', 'V', 'S']);
	});
});

describe('getDateLocale', () => {
	it('serves a regional variant from its primary language until one is contributed', () => {
		expect(getDateLocale('fr-CA')).toBe(FR_DATE_LOCALE);
		expect(getDateLocale('fr_CA')).toBe(FR_DATE_LOCALE);
		expect(getDateLocale('en-GB')).toBe(EN_DATE_LOCALE);
		expect(getDateLocale('pt-BR')).toBe(EN_DATE_LOCALE);
	});

	it('falls back to English for unknown, empty and missing languages', () => {
		expect(getDateLocale('xx')).toBe(EN_DATE_LOCALE);
		expect(getDateLocale('')).toBe(EN_DATE_LOCALE);
		expect(getDateLocale(null)).toBe(EN_DATE_LOCALE);
		expect(getDateLocale(undefined)).toBe(EN_DATE_LOCALE);
	});
});

describe('dayMonthShortYear', () => {
	it('keeps the English filter-chip form and spells the year out in French', () => {
		const date = new Date(2025, 5, 15);
		expect(formatDate(getDateLocale('en'), 'dayMonthShortYear', date)).toBe("Jun 15 '25");
		expect(formatDate(getDateLocale('fr'), 'dayMonthShortYear', date)).toBe('15 juin 2025');
	});
});

describe('formatDate', () => {
	it('returns "Invalid Date" instead of throwing', () => {
		expect(formatDate(FR_DATE_LOCALE, 'dayMonthYear', new Date('2026-02-31x'))).toBe(
			'Invalid Date'
		);
	});
});
