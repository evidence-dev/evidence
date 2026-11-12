import { format, type Day, type Locale, type Month } from 'date-fns';
import { EN_DATE_LOCALE } from './languages/en';
import { FR_DATE_LOCALE } from './languages/fr';
import { getLanguagePack } from './registry';

/**
 * Per-language date formatting for the chart time-axis formatters.
 *
 * A language contributes two things: a date-fns `Locale` (the vocabulary —
 * month/weekday names, ordinals) and a set of `format` patterns (the
 * structure — token order, punctuation, 12h/24h). Both are static tables, so
 * output is byte-identical on the server and in every browser; nothing here
 * consults `Intl` or the viewer's browser locale. The active language is the
 * explicit `translations.yaml` selection (`lang` cookie), keyed by the same
 * ISO 639-1 codes. Unknown languages fall back to English.
 *
 * Adding a language: create `languages/<code>.ts` exporting a `DateLocale`
 * (import its date-fns locale, write the patterns in that language's
 * conventions — https://date-fns.org/docs/format) and register it in
 * `registry.ts`.
 *
 * The same date-fns locale also supplies the month/weekday names for
 * user-written `fmt` codes (`mmm`, `dddd`) via `getDateNames`, so a language
 * localizes those for free. Override `presets` only where a shared preset's
 * word order or clock reads wrong in the language.
 */
export type DatePatterns = {
	/** Bare axis period: "Jun" / "juin" */
	month: string;
	/** "Jun 2025" / "juin 2025" */
	monthYear: string;
	/** "Q3" / "T3" */
	quarter: string;
	/** "Q3 2025" / "T3 2025" */
	quarterYear: string;
	/** "Jun 15" / "15 juin" */
	dayMonth: string;
	/** "Jun 15, 2025" / "15 juin 2025" */
	dayMonthYear: string;
	/** Compact, for filter chips: "Jun 15 '25" / "15 juin 2025" */
	dayMonthShortYear: string;
	/** "4 pm" / "16 h" */
	hour: string;
	/** "Jun 15, 4 pm" / "15 juin 16 h" */
	dayMonthHour: string;
	/** "Jun 15, 2025 4 pm" / "15 juin 2025 16 h" */
	dayMonthYearHour: string;
	/** "2025" */
	year: string;
};

/**
 * Templates for a week's start–end range. `{start:<pattern>}` and
 * `{end:<pattern>}` are each replaced by `format(date, pattern)`; everything
 * else is literal, so the dash style and where the year lands are the
 * language's call.
 */
export type WeekRangeTemplates = {
	/** "Jun 15–21, 2025" / "15–21 juin 2025" */
	sameMonth: string;
	/** "Jun 29 – Jul 5, 2025" / "29 juin – 5 juil. 2025" */
	crossMonth: string;
	/** "Dec 29, 2025 – Jan 4, 2026" / "29 déc. 2025 – 4 janv. 2026" */
	crossYear: string;
};

/**
 * Named `fmt` presets whose English definitions carry English word order or
 * 12-hour time (`longdate` is `mmmm d, yyyy`). A language overrides only the
 * ones that read wrong verbatim; the rest keep the shared definition.
 */
export type LocalizedFormatPreset = 'shortdate' | 'longdate' | 'fulldate' | 'hms';

/**
 * `date_grain` default `fmt` codes (see `DATE_GRAIN_DEFINITIONS`) with English
 * word order or a 12-hour clock. Overridden by code rather than renamed, so
 * Excel export keeps mapping the original code.
 */
export type GrainFormatCode = 'MMM d, yyyy' | 'MMM d, yyyy h AM/PM' | '"Q"0';

export type DateLocale = {
	locale: Locale;
	patterns: DatePatterns;
	weekRange: WeekRangeTemplates;
	presets?: Partial<Record<LocalizedFormatPreset, string>>;
	grainFormats?: Partial<Record<GrainFormatCode, string>>;
};

/** Month and weekday names in the shape SSF reads them (Sunday first). */
export type DateNames = {
	months: [narrow: string, abbreviated: string, wide: string][];
	days: [abbreviated: string, wide: string][];
};

const DATE_NAMES_CACHE = new WeakMap<DateLocale, DateNames>();

export function getDateNames(dateLocale: DateLocale): DateNames {
	const cached = DATE_NAMES_CACHE.get(dateLocale);
	if (cached) return cached;
	const { localize } = dateLocale.locale;
	const names: DateNames = {
		months: Array.from({ length: 12 }, (_, i) => [
			localize.month(i as Month, { width: 'narrow' }),
			localize.month(i as Month, { width: 'abbreviated' }),
			localize.month(i as Month, { width: 'wide' })
		]),
		days: Array.from({ length: 7 }, (_, i) => [
			localize.day(i as Day, { width: 'abbreviated' }),
			localize.day(i as Day, { width: 'wide' })
		])
	};
	DATE_NAMES_CACHE.set(dateLocale, names);
	return names;
}

/** ECharts calendar `monthLabel` / `dayLabel` name maps (Sunday first); English equals ECharts' built-in labels. */
export function getCalendarNameMaps(dateLocale: DateLocale) {
	const { months } = getDateNames(dateLocale);
	const { localize } = dateLocale.locale;
	return {
		months: months.map((m) => m[1]),
		narrowMonths: months.map((m) => m[0]),
		days: Array.from({ length: 7 }, (_, i) => localize.day(i as Day, { width: 'narrow' }))
	};
}

export { EN_DATE_LOCALE, FR_DATE_LOCALE };

export function getDateLocale(language: string | null | undefined): DateLocale {
	return getLanguagePack(language).dateLocale;
}

/** "Q" / "T": the letter the language's `quarter` pattern puts before the quarter number. */
export function getQuarterPrefix(dateLocale: DateLocale): string {
	return format(new Date(2000, 0, 1), dateLocale.patterns.quarter, {
		locale: dateLocale.locale
	}).replace('1', '');
}

export function formatDate(dateLocale: DateLocale, key: keyof DatePatterns, date: Date): string {
	if (Number.isNaN(date.getTime())) return String(date);
	return format(date, dateLocale.patterns[key], { locale: dateLocale.locale });
}

const RANGE_TOKEN = /\{(start|end):([^}]+)\}/g;

export function formatWeekRange(dateLocale: DateLocale, start: Date, end: Date): string {
	const { weekRange, locale } = dateLocale;
	const template =
		start.getFullYear() !== end.getFullYear()
			? weekRange.crossYear
			: start.getMonth() !== end.getMonth()
				? weekRange.crossMonth
				: weekRange.sameMonth;
	return template.replace(RANGE_TOKEN, (_, which: string, pattern: string) =>
		format(which === 'start' ? start : end, pattern, { locale })
	);
}
