import { logger } from '../shims/logger';
import ssf from 'ssf';
import { getDecimalSeparator } from './format-settings';

/**
 * Converts single quotes to double quotes in format strings for better UX
 * This allows users to write fmt="'Q'0" instead of fmt="\"Q\"0"
 *
 * @param formatCode - The format code that may contain single quotes
 * @returns The format code with single quotes converted to double quotes
 */
function convertSingleQuotesToDouble(formatCode: string): string {
	// Replace single quotes with double quotes
	// This is a simple replacement - if users need literal single quotes in their format,
	// they can use double quotes or escaped single quotes
	return formatCode.replace(/'/g, '"');
}

/**
 * Date format preset keys - used to skip decimal separator conversion
 */
const DATE_FORMAT_PRESETS = new Set([
	'date',
	'ddd',
	'dddd',
	'mmm',
	'mmmm',
	'mmm-yy',
	'yyyy',
	'quarter',
	'qq',
	'shortdate',
	'longdate',
	'fulldate',
	'mdy',
	'dmy',
	'hms'
]);

/**
 * Check if a format code is a date/time format that should not have decimal separator conversion
 */
function isDateFormat(formatCode: string): boolean {
	// Check if it's a known date format preset
	if (DATE_FORMAT_PRESETS.has(formatCode.toLowerCase())) {
		return true;
	}
	// Check if the format code contains date/time specifiers (y, d, h, s, or m followed by another m)
	// but exclude number formats that use 'M' or 'B' or 'k' for units
	// Date formats typically have patterns like yyyy, mm, dd, hh, ss, or AM/PM
	const datePatterns = /\b(yyyy|yy|mmmm|mmm|mm|dd|ddd|dddd|hh|h|ss|s|AM|PM)\b/i;
	return datePatterns.test(formatCode);
}

/**
 * Built-in format presets that map to SSF format codes
 */
export const FORMAT_PRESETS = {
	// Date formats
	date: 'yyyy-mm-dd',
	ddd: 'ddd',
	dddd: 'dddd',
	mmm: 'mmm',
	mmmm: 'mmmm',
	'mmm-yy': 'mmm-yy',
	yyyy: 'yyyy',
	quarter: 'yyyy-"Q"0', // Custom quarter format - handled specially in formatValue
	qq: '"Q"0', // Bare quarter (Q#) - handled specially in formatValue
	shortdate: 'mmm d/yy',
	longdate: 'mmmm d, yyyy',
	fulldate: 'dddd mmmm d, yyyy',
	mdy: 'm/d/y',
	dmy: 'd/m/y',
	hms: 'H:MM:SS AM/PM',

	// Number formats
	num0: '#,##0',
	num1: '#,##0.0',
	num2: '#,##0.00',
	num3: '#,##0.000',
	num4: '#,##0.0000',
	num0k: '#,##0,"k"',
	num1k: '#,##0.0,"k"',
	num2k: '#,##0.00,"k"',
	num0m: '#,##0,,"M"',
	num1m: '#,##0.0,,"M"',
	num2m: '#,##0.00,,"M"',
	num0b: '#,##0,,,"B"',
	num0t: '#,##0,,,,"T"',
	num1b: '#,##0.0,,,"B"',
	num1t: '#,##0.0,,,,"T"',
	num2b: '#,##0.00,,,"B"',
	num2t: '#,##0.00,,,,"T"',
	id: '0',
	fract: '# ?/?',
	mult: '#,##0.0"x"',
	mult0: '#,##0"x"',
	mult1: '#,##0.0"x"',
	mult2: '#,##0.00"x"',
	sci: '0.00E+0',
	pct0: '#,##0%',
	pct1: '#,##0.0%',
	pct2: '#,##0.00%',
	pct3: '#,##0.000%',

	// USD - United States Dollar
	usd: '$#,##0',
	usd0: '$#,##0',
	usd1: '$#,##0.0',
	usd2: '$#,##0.00',
	usd0k: '$#,##0,"k"',
	usd1k: '$#,##0.0,"k"',
	usd2k: '$#,##0.00,"k"',
	usd0m: '$#,##0,,"M"',
	usd1m: '$#,##0.0,,"M"',
	usd2m: '$#,##0.00,,"M"',
	usd0b: '$#,##0,,,"B"',
	usd0t: '$#,##0,,,,"T"',
	usd1b: '$#,##0.0,,,"B"',
	usd1t: '$#,##0.0,,,,"T"',
	usd2b: '$#,##0.00,,,"B"',
	usd2t: '$#,##0.00,,,,"T"',

	// AUD - Australian Dollar
	aud: '"A$"#,##0',
	aud0: '"A$"#,##0',
	aud1: '"A$"#,##0.0',
	aud2: '"A$"#,##0.00',
	aud0k: '"A$"#,##0,"k"',
	aud1k: '"A$"#,##0.0,"k"',
	aud2k: '"A$"#,##0.00,"k"',
	aud0m: '"A$"#,##0,,"M"',
	aud1m: '"A$"#,##0.0,,"M"',
	aud2m: '"A$"#,##0.00,,"M"',
	aud0b: '"A$"#,##0,,,"B"',
	aud0t: '"A$"#,##0,,,,"T"',
	aud1b: '"A$"#,##0.0,,,"B"',
	aud1t: '"A$"#,##0.0,,,,"T"',
	aud2b: '"A$"#,##0.00,,,"B"',
	aud2t: '"A$"#,##0.00,,,,"T"',

	// BRL - Brazilian Real
	brl: '"R$"#,##0',
	brl0: '"R$"#,##0',
	brl1: '"R$"#,##0.0',
	brl2: '"R$"#,##0.00',
	brl0k: '"R$"#,##0,"k"',
	brl1k: '"R$"#,##0.0,"k"',
	brl2k: '"R$"#,##0.00,"k"',
	brl0m: '"R$"#,##0,,"M"',
	brl1m: '"R$"#,##0.0,,"M"',
	brl2m: '"R$"#,##0.00,,"M"',
	brl0b: '"R$"#,##0,,,"B"',
	brl0t: '"R$"#,##0,,,,"T"',
	brl1b: '"R$"#,##0.0,,,"B"',
	brl1t: '"R$"#,##0.0,,,,"T"',
	brl2b: '"R$"#,##0.00,,,"B"',
	brl2t: '"R$"#,##0.00,,,,"T"',

	// CAD - Canadian Dollar
	cad: '"C$"#,##0',
	cad0: '"C$"#,##0',
	cad1: '"C$"#,##0.0',
	cad2: '"C$"#,##0.00',
	cad0k: '"C$"#,##0,"k"',
	cad1k: '"C$"#,##0.0,"k"',
	cad2k: '"C$"#,##0.00,"k"',
	cad0m: '"C$"#,##0,,"M"',
	cad1m: '"C$"#,##0.0,,"M"',
	cad2m: '"C$"#,##0.00,,"M"',
	cad0b: '"C$"#,##0,,,"B"',
	cad0t: '"C$"#,##0,,,,"T"',
	cad1b: '"C$"#,##0.0,,,"B"',
	cad1t: '"C$"#,##0.0,,,,"T"',
	cad2b: '"C$"#,##0.00,,,"B"',
	cad2t: '"C$"#,##0.00,,,,"T"',

	// CNY - Renminbi
	cny: '"¥"#,##0',
	cny0: '"¥"#,##0',
	cny1: '"¥"#,##0.0',
	cny2: '"¥"#,##0.00',
	cny0k: '"¥"#,##0,"k"',
	cny1k: '"¥"#,##0.0,"k"',
	cny2k: '"¥"#,##0.00,"k"',
	cny0m: '"¥"#,##0,,"M"',
	cny1m: '"¥"#,##0.0,,"M"',
	cny2m: '"¥"#,##0.00,,"M"',
	cny0b: '"¥"#,##0,,,"B"',
	cny0t: '"¥"#,##0,,,,"T"',
	cny1b: '"¥"#,##0.0,,,"B"',
	cny1t: '"¥"#,##0.0,,,,"T"',
	cny2b: '"¥"#,##0.00,,,"B"',
	cny2t: '"¥"#,##0.00,,,,"T"',

	// EUR - Euro
	eur: '€#,##0',
	eur0: '€#,##0',
	eur1: '€#,##0.0',
	eur2: '€#,##0.00',
	eur0k: '€#,##0,"k"',
	eur1k: '€#,##0.0,"k"',
	eur2k: '€#,##0.00,"k"',
	eur0m: '€#,##0,,"M"',
	eur1m: '€#,##0.0,,"M"',
	eur2m: '€#,##0.00,,"M"',
	eur0b: '€#,##0,,,"B"',
	eur0t: '€#,##0,,,,"T"',
	eur1b: '€#,##0.0,,,"B"',
	eur1t: '€#,##0.0,,,,"T"',
	eur2b: '€#,##0.00,,,"B"',
	eur2t: '€#,##0.00,,,,"T"',

	// GBP - Pound Sterling
	gbp: '"£"#,##0',
	gbp0: '"£"#,##0',
	gbp1: '"£"#,##0.0',
	gbp2: '"£"#,##0.00',
	gbp0k: '"£"#,##0,"k"',
	gbp1k: '"£"#,##0.0,"k"',
	gbp2k: '"£"#,##0.00,"k"',
	gbp0m: '"£"#,##0,,"M"',
	gbp1m: '"£"#,##0.0,,"M"',
	gbp2m: '"£"#,##0.00,,"M"',
	gbp0b: '"£"#,##0,,,"B"',
	gbp0t: '"£"#,##0,,,,"T"',
	gbp1b: '"£"#,##0.0,,,"B"',
	gbp1t: '"£"#,##0.0,,,,"T"',
	gbp2b: '"£"#,##0.00,,,"B"',
	gbp2t: '"£"#,##0.00,,,,"T"',

	// JPY - Japanese Yen
	jpy: '"¥"#,##0',
	jpy0: '"¥"#,##0',
	jpy1: '"¥"#,##0.0',
	jpy2: '"¥"#,##0.00',
	jpy0k: '"¥"#,##0,"k"',
	jpy1k: '"¥"#,##0.0,"k"',
	jpy2k: '"¥"#,##0.00,"k"',
	jpy0m: '"¥"#,##0,,"M"',
	jpy1m: '"¥"#,##0.0,,"M"',
	jpy2m: '"¥"#,##0.00,,"M"',
	jpy0b: '"¥"#,##0,,,"B"',
	jpy0t: '"¥"#,##0,,,,"T"',
	jpy1b: '"¥"#,##0.0,,,"B"',
	jpy1t: '"¥"#,##0.0,,,,"T"',
	jpy2b: '"¥"#,##0.00,,,"B"',
	jpy2t: '"¥"#,##0.00,,,,"T"',

	// INR - Indian Rupee
	inr: '"₹"#,##0',
	inr0: '"₹"#,##0',
	inr1: '"₹"#,##0.0',
	inr2: '"₹"#,##0.00',
	inr0k: '"₹"#,##0,"k"',
	inr1k: '"₹"#,##0.0,"k"',
	inr2k: '"₹"#,##0.00,"k"',
	inr0m: '"₹"#,##0,,"M"',
	inr1m: '"₹"#,##0.0,,"M"',
	inr2m: '"₹"#,##0.00,,"M"',
	inr0b: '"₹"#,##0,,,"B"',
	inr0t: '"₹"#,##0,,,,"T"',
	inr1b: '"₹"#,##0.0,,,"B"',
	inr1t: '"₹"#,##0.0,,,,"T"',
	inr2b: '"₹"#,##0.00,,,"B"',
	inr2t: '"₹"#,##0.00,,,,"T"',

	// KRW - South Korean won
	krw: '"₩"#,##0',
	krw0: '"₩"#,##0',
	krw1: '"₩"#,##0.0',
	krw2: '"₩"#,##0.00',
	krw0k: '"₩"#,##0,"k"',
	krw1k: '"₩"#,##0.0,"k"',
	krw2k: '"₩"#,##0.00,"k"',
	krw0m: '"₩"#,##0,,"M"',
	krw1m: '"₩"#,##0.0,,"M"',
	krw2m: '"₩"#,##0.00,,"M"',
	krw0b: '"₩"#,##0,,,"B"',
	krw0t: '"₩"#,##0,,,,"T"',
	krw1b: '"₩"#,##0.0,,,"B"',
	krw1t: '"₩"#,##0.0,,,,"T"',
	krw2b: '"₩"#,##0.00,,,"B"',
	krw2t: '"₩"#,##0.00,,,,"T"',

	// NGN - Nigerian Naira
	ngn: '"₦"#,##0',
	ngn0: '"₦"#,##0',
	ngn1: '"₦"#,##0.0',
	ngn2: '"₦"#,##0.00',
	ngn0k: '"₦"#,##0,"k"',
	ngn1k: '"₦"#,##0.0,"k"',
	ngn2k: '"₦"#,##0.00,"k"',
	ngn0m: '"₦"#,##0,,"M"',
	ngn1m: '"₦"#,##0.0,,"M"',
	ngn2m: '"₦"#,##0.00,,"M"',
	ngn0b: '"₦"#,##0,,,"B"',
	ngn0t: '"₦"#,##0,,,,"T"',
	ngn1b: '"₦"#,##0.0,,,"B"',
	ngn1t: '"₦"#,##0.0,,,,"T"',
	ngn2b: '"₦"#,##0.00,,,"B"',
	ngn2t: '"₦"#,##0.00,,,,"T"',

	// SEK - Swedish Krona
	sek: '"kr"#,##0',
	sek0: '"kr"#,##0',
	sek1: '"kr"#,##0.0',
	sek2: '"kr"#,##0.00',
	sek0k: '"kr"#,##0,"k"',
	sek1k: '"kr"#,##0.0,"k"',
	sek2k: '"kr"#,##0.00,"k"',
	sek0m: '"kr"#,##0,,"M"',
	sek1m: '"kr"#,##0.0,,"M"',
	sek2m: '"kr"#,##0.00,,"M"',
	sek0b: '"kr"#,##0,,,"B"',
	sek0t: '"kr"#,##0,,,,"T"',
	sek1b: '"kr"#,##0.0,,,"B"',
	sek1t: '"kr"#,##0.0,,,,"T"',
	sek2b: '"kr"#,##0.00,,,"B"',
	sek2t: '"kr"#,##0.00,,,,"T"'
} as const;

// Base formats that support auto-scaling (these get converted to specific formats based on data range)
export const BASE_AUTO_FORMATS = [
	'num',
	'usd',
	'eur',
	'gbp',
	'aud',
	'cad',
	'cny',
	'jpy',
	'inr',
	'krw',
	'ngn',
	'sek',
	'pct'
] as const;

// Type as an array of at least one string - required for use in z.enum()
export const FMT_OPTIONS = Object.keys(FORMAT_PRESETS) as [string, ...string[]];

// Comprehensive list that includes both specific formats from presets AND base auto formats
export const ALL_FORMAT_OPTIONS = [...Object.keys(FORMAT_PRESETS), ...BASE_AUTO_FORMATS].filter(
	(value, index, self) => self.indexOf(value) === index
) as [string, ...string[]]; // Remove duplicates and ensure proper typing

type Range = {
	min: number | null;
	max: number | null;
};

function getAutoFormat(baseFormat: string, range?: Range): string {
	// Handle auto decimal places and units
	let decimals = '0';
	let unit = '';

	if (range?.max) {
		const max = Math.abs(range.max);
		// Determine decimals
		if (baseFormat === 'pct') {
			if (max < 0.1) decimals = '2';
			else if (max < 1) decimals = '1';
		} else {
			if (max < 10) decimals = '2';
			else if (max < 100) decimals = '1';
		}

		// Determine units for numeric formats
		if (baseFormat !== 'pct') {
			if (max >= 1_000_000_000_000) {
				unit = 't';
				decimals = '1';
			} else if (max >= 1_000_000_000) {
				unit = 'b';
				decimals = '1';
			} else if (max >= 1_000_000) {
				unit = 'm';
				decimals = '1';
			} else if (max >= 4_000) {
				unit = 'k';
				decimals = '0';
			}
		}
	}

	return baseFormat + decimals + unit;
}

export function standardizeDateString(date: string | Date) {
	if (date && typeof date === 'string') {
		// Parses an individual string into a JS date object

		const dateSplit = date.split(' ');

		// If date doesn't contain timestamp, add one at midnight (avoids timezone interpretation issue)
		if (!date.includes(':')) {
			date = date + 'T00:00:00';
		}

		// Remove any character groups beyond 2 (date and time):
		if (dateSplit.length > 2) {
			date = dateSplit[0] + ' ' + dateSplit[1];
		}

		// Replace microseconds if needed:
		const re = /\.([^\s]+)/;
		date = date.replace(re, '');

		// Remove "Z" to avoid timezone interpretation issue:
		date = date.replace('Z', '');

		// Remove an explicit numeric UTC offset ("+hh:mm" / "-hhmm") for the same
		// reason we strip "Z": the chart shows the wall-clock digits verbatim, the
		// same for every viewer, rather than converting to the viewer's timezone.
		date = date.replace(/[+-]\d{2}:?\d{2}$/, '');

		// Replace spaces with "T" to conform to ECMA standard:
		date = date.replace(' ', 'T');
	}

	return date;
}

/**
 * Parse a raw series x-value string to epoch ms for the time-axis pipeline —
 * tick positions (`customValues`), axis bounds, and label/tooltip formatting.
 *
 * Every value is routed through `standardizeDateString`, which strips any UTC
 * offset ("Z" / "±hh:mm") and parses the remaining wall-clock digits as LOCAL
 * time. That is the "same for everyone" rule: a `…04:00:00Z` point resolves to
 * 4 am for every viewer, identical to how a zoneless `2024-06-01 04:00:00`
 * string already behaves — the chart never converts to the viewer's timezone.
 *
 * The value fed to ECharts for bar positioning is canonicalized the same way
 * (`canonicalizeTimeAxisValue`), so the bar, axis label, and tooltip all land
 * on one instant. Returns NaN when unparseable.
 */
export function parseSeriesTimestampMs(value: string): number {
	return Date.parse(standardizeDateString(value) as string);
}

/**
 * Canonicalize a raw x-value for a TIME axis into the form ECharts should
 * position on, so the bar lines up with the ticks that `parseSeriesTimestampMs`
 * computes. String dates are collapsed to their offset-free wall-clock digits
 * (see `parseSeriesTimestampMs`); non-strings pass through unchanged (numeric
 * years use a value axis, never a time axis, so they never reach here).
 */
export function canonicalizeTimeAxisValue(value: unknown): unknown {
	return typeof value === 'string' ? standardizeDateString(value) : value;
}

// Shared quarter formatter: "YYYY-Q#". Returns null if the value can't be
// parsed as a date. Used by formatValue (on-screen) and by the Excel export.
export function formatAsQuarter(value: unknown): string | null {
	let dateValue: Date;
	if (value instanceof Date) {
		dateValue = value;
	} else if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
		dateValue = new Date(standardizeDateString(value));
	} else {
		return null;
	}
	const quarter = Math.floor(dateValue.getMonth() / 3) + 1;
	return `${dateValue.getFullYear()}-Q${quarter}`;
}

// Bare quarter formatter: "Q#" (no year), for the `qq` format code. Returns null if the value can't be
// read as a date.
export function formatAsBareQuarter(value: unknown): string | null {
	let dateValue: Date;
	if (value instanceof Date) {
		dateValue = value;
	} else if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
		dateValue = new Date(standardizeDateString(value));
	} else {
		return null;
	}
	return `Q${Math.floor(dateValue.getMonth() / 3) + 1}`;
}

/**
 * Converts date part numbers to appropriate Date objects for formatting
 * Handles common SQL date part functions like dayofweek() and month()
 *
 * For day of week, the interpretation depends on the firstDayOfWeek setting:
 * - When 'sunday': ClickHouse uses mode 3, returning Sunday=1, Monday=2, ..., Saturday=7
 * - When 'monday': ClickHouse uses mode 0, returning Monday=1, Tuesday=2, ..., Sunday=7
 *
 * @param value - The numeric value (e.g., 1-7 for dayofweek, 1-12 for month)
 * @param formatCode - The format code being used (e.g., 'ddd', 'mmm')
 * @param firstDayOfWeek - First day of week setting ('sunday' or 'monday')
 * @returns Date object if conversion is appropriate, otherwise original value
 */
/**
 * A number of magnitude >= 1e11 under a date format code is a millisecond
 * timestamp, not a date part. Without this, `ssf.format('yyyy', 1.6e12)`
 * treats the value as an Excel date serial far outside the representable
 * range and emits an EMPTY string — silently blanking axis labels and table
 * cells for epoch-ms BIGINT columns.
 *
 * Rebuilds a LOCAL date from the UTC components so downstream SSF formatting
 * (which reads local components) renders the value's UTC calendar date. A raw
 * epoch-ms value is a genuine Unix instant — definitionally UTC-anchored — so
 * its natural calendar date is the UTC one, and reading it this way keeps the
 * label identical for every viewer instead of shifting at midnight boundaries.
 * (This differs from the zoneless date STRINGS the time-axis pipeline handles,
 * which carry no offset and are parsed + formatted on the local clock so they
 * render verbatim — see format-time-axis-label.ts.)
 *
 * The 1e11 floor keeps this from swallowing legitimate date parts and small
 * integers (year 1974 ≈ 1.26e11 ms, so any real year-timestamp clears it).
 * Known gap: raw ms timestamps for 1970 through ~1973-03 fall below the
 * floor and slip through unconverted; widening it would misread stray
 * integers as 1970-era dates, which is worse than falling through.
 */
function msTimestampToDate(numericValue: number): Date | undefined {
	if (Math.abs(numericValue) < 1e11) return undefined;
	const asDate = new Date(numericValue);
	if (isNaN(asDate.getTime())) return undefined;
	const year = asDate.getUTCFullYear();
	if (year < 1900 || year > 2100) return undefined;
	return new Date(
		year,
		asDate.getUTCMonth(),
		asDate.getUTCDate(),
		asDate.getUTCHours(),
		asDate.getUTCMinutes(),
		asDate.getUTCSeconds()
	);
}

function convertDatePartToDate(
	value: unknown,
	formatCode: string,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday'
): unknown {
	// Only convert if we have a numeric value (number or string that can be converted) and a date-related format
	let numericValue: number | null = null;
	if (typeof value === 'number') {
		numericValue = value;
	} else if (typeof value === 'string' && !Number.isNaN(Number(value))) {
		numericValue = Number(value);
	}

	if (numericValue === null || !formatCode) {
		return value;
	}

	// Get the resolved format code from presets if needed
	const resolvedFormatCode =
		FORMAT_PRESETS[formatCode as keyof typeof FORMAT_PRESETS] || formatCode;

	// Day of week formats (ddd, dddd) - directly map numeric values to day names
	// ClickHouse toDayOfWeek returns 1-7, with the meaning determined by the mode:
	// - Mode 0 (firstDayOfWeek='monday'): Monday=1, Tuesday=2, ..., Sunday=7
	// - Mode 3 (firstDayOfWeek='sunday'): Sunday=1, Monday=2, ..., Saturday=7
	const isDayOfWeekFormat =
		formatCode === 'ddd' ||
		formatCode === 'dddd' ||
		resolvedFormatCode === 'ddd' ||
		resolvedFormatCode === 'dddd';

	if (isDayOfWeekFormat && numericValue >= 1 && numericValue <= 7) {
		const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const longNames = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		];

		// ClickHouse toDayOfWeek returns 1-7:
		// Mode 3 (firstDayOfWeek='sunday'): 1=Sunday, 2=Monday, ..., 7=Saturday
		// Mode 0 (firstDayOfWeek='monday'): 1=Monday, 2=Tuesday, ..., 7=Sunday
		let dayIndex: number;
		if (firstDayOfWeek === 'sunday') {
			dayIndex = numericValue - 1;
		} else {
			dayIndex = numericValue === 7 ? 0 : numericValue;
		}

		const useShortFormat = formatCode === 'ddd' || resolvedFormatCode === 'ddd';
		return useShortFormat ? shortNames[dayIndex] : longNames[dayIndex];
	}
	if (isDayOfWeekFormat) {
		return msTimestampToDate(numericValue) ?? value;
	}

	// Month formats (mmm, mmmm) - check both original and resolved codes
	if (
		formatCode === 'mmm' ||
		formatCode === 'mmmm' ||
		resolvedFormatCode.includes('mmm') ||
		resolvedFormatCode.includes('mmmm')
	) {
		// Handle 1-12 range for months
		if (numericValue >= 1 && numericValue <= 12) {
			// Create a date with the specified month (using January 1st as base)
			const monthDate = new Date(2024, numericValue - 1, 1); // Month is 0-indexed in Date constructor
			return monthDate;
		}
		return msTimestampToDate(numericValue) ?? value; // Outside expected range
	}

	// Hour formats - match h/H as a format specifier, not inside quoted strings.
	// Strip both single and double quotes: users write single quotes in markdoc
	// (fmt="'text'0") which are converted to double quotes later by convertSingleQuotesToDouble.
	const unquotedFormat = resolvedFormatCode.replace(/"[^"]*"|'[^']*'/g, '');
	const hasHourSpecifier =
		formatCode === 'h' ||
		formatCode === 'hh' ||
		formatCode === 'hms' ||
		/(?:^|[^"'])(?:hh?)\b/i.test(unquotedFormat);
	if (hasHourSpecifier) {
		// Handle 0-23 range for hours
		if (numericValue >= 0 && numericValue <= 23) {
			// Create a date with the specified hour (using today as base)
			const hourDate = new Date(2024, 0, 1, numericValue, 0, 0);
			return hourDate;
		}
		return msTimestampToDate(numericValue) ?? value; // Outside expected range
	}

	// Year format (yyyy) - two shapes are legitimate here: a plain year
	// integer (1900..2100, wrapped in a Date at Jan 1) or a millisecond
	// timestamp for a real year (msTimestampToDate).
	if (formatCode === 'yyyy' || resolvedFormatCode.includes('yyyy')) {
		if (numericValue >= 1900 && numericValue <= 2100) {
			const yearDate = new Date(numericValue, 0, 1); // January 1st of that year
			return yearDate;
		}
		return msTimestampToDate(numericValue) ?? value;
	}

	return value; // No conversion needed
}

/**
 * Formats a value using spreadsheet-style format codes via the ssf package
 *
 * Supports automatic conversion of date part numbers to proper date formatting:
 * - dayofweek(date) returns 1-7 or 0-6 → use fmt="ddd" for "Mon", "Tue", etc.
 * - month(date) returns 1-12 → use fmt="mmm" for "Jan", "Feb", etc.
 * - extract(year from date) returns year → use fmt="yyyy" for "2024"
 *
 * @param {number|string|Date} value - The value to format
 * @param {string} formatCode - Spreadsheet-style format code or a built-in format name
 * @param {string} fallbackValue - Value to display if formatting fails (default: original value)
 * @param {Range} range - Optional range for automatic scaling
 * @param {string} columnType - Optional column type from metadata (e.g., 'date', 'number')
 * @param {'sunday'|'monday'} firstDayOfWeek - First day of week setting for day-of-week formatting
 * @param {'.'|','} decimalSeparator - Decimal separator: '.' (period) or ',' (comma). Thousands separator will be the opposite. Defaults to '.'
 * @returns {string} The formatted value
 */
export function formatValue(
	value: unknown,
	formatCode: string | null | undefined,
	fallbackValue: string = value?.toString() || '',
	range?: Range,
	columnType?: string,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	decimalSeparator?: '.' | ','
): string {
	// Use global format settings if not explicitly provided
	const effectiveDecimalSeparator = decimalSeparator ?? getDecimalSeparator();

	// Handle null/undefined values
	if (value === null || value === undefined) {
		return fallbackValue;
	} else if (value === 'Total') {
		return 'Total';
	}

	let effectiveFormatCode = formatCode;

	// If no format code is provided, apply automatic formatting based on column type
	if (effectiveFormatCode === null || effectiveFormatCode === undefined) {
		// Auto-format date columns
		if (
			columnType &&
			(columnType.toLowerCase().includes('date') || columnType.toLowerCase().includes('time'))
		) {
			effectiveFormatCode = 'date';
		}
		// Auto-format numeric values - use base 'num' format to enable auto-scaling with units
		else if (
			typeof value === 'number' ||
			(typeof value === 'string' && !Number.isNaN(Number(value)))
		) {
			effectiveFormatCode = 'num';
		}
	}

	if (
		value === null ||
		value === undefined ||
		effectiveFormatCode === null ||
		effectiveFormatCode === undefined
	) {
		if (typeof value === 'object' && value !== null) {
			return JSON.stringify(value);
		}
		return fallbackValue;
	}

	try {
		// Handle type conversion for values that might be strings but should be numbers or dates
		let processedValue: unknown = value;

		// First, try to convert date parts to dates if using date format codes
		if (effectiveFormatCode) {
			const converted = convertDatePartToDate(processedValue, effectiveFormatCode, firstDayOfWeek);
			if (typeof converted === 'string' && converted !== processedValue) {
				// convertDatePartToDate already produced a formatted string (e.g. day-of-week name),
				// return it directly to avoid SSF re-interpreting the string as numeric 0 → Thursday
				return converted;
			}
			processedValue = converted;
		}

		// Using metadata for type conversion when available
		if (typeof processedValue === 'string') {
			// If we have column type from metadata, use it for conversion
			if (columnType) {
				// Convert strings to appropriate types based on column metadata
				if (
					columnType.toLowerCase().includes('date') ||
					columnType.toLowerCase().includes('time')
				) {
					processedValue = new Date(standardizeDateString(processedValue));
				} else if (
					columnType.toLowerCase().includes('int') ||
					columnType.toLowerCase().includes('decimal') ||
					columnType.toLowerCase().includes('float') ||
					columnType.toLowerCase().includes('double') ||
					columnType.toLowerCase().includes('number')
				) {
					processedValue = Number(processedValue);
				}
			}
			// Fallback to original detection logic when metadata is not available
			else {
				const effectiveIsDateFormat = effectiveFormatCode
					? isDateFormat(effectiveFormatCode)
					: false;

				// If it's a string that looks like a number and we're not using a date format
				if (
					typeof processedValue === 'string' &&
					!Number.isNaN(Number(processedValue)) &&
					effectiveFormatCode &&
					!effectiveIsDateFormat
				) {
					processedValue = Number(processedValue);
				}

				// If it's a string that looks like a date and we're using a date format
				if (
					typeof processedValue === 'string' &&
					!Number.isNaN(Date.parse(processedValue)) &&
					effectiveFormatCode &&
					effectiveIsDateFormat
				) {
					processedValue = new Date(standardizeDateString(processedValue));
				}
			}
		}

		let actualFormatCode = effectiveFormatCode;
		const baseFormats = BASE_AUTO_FORMATS;

		// For zero values, use base format with no scaling or decimals
		if (processedValue === 0 || processedValue === '0') {
			// Check if this is a base auto format (e.g., 'num', 'usd')
			if (
				effectiveFormatCode.length === 3 &&
				baseFormats.includes(effectiveFormatCode as (typeof baseFormats)[number])
			) {
				actualFormatCode = `${effectiveFormatCode}0`; // Just add 0 decimal places, no scaling
			}
			// Check if this is an explicit format with units (e.g., 'usd1m', 'num0k')
			// Pattern: base format (3 chars) + decimal (1 char) + unit (1 char: k, m, b, or t)
			else if (effectiveFormatCode.length === 5) {
				const baseFormat = effectiveFormatCode.substring(0, 3);
				const unit = effectiveFormatCode.substring(4, 5).toLowerCase();
				if (
					baseFormats.includes(baseFormat as (typeof baseFormats)[number]) &&
					['k', 'm', 'b', 't'].includes(unit)
				) {
					actualFormatCode = `${baseFormat}0`; // Use base format with 0 decimals, no units
				}
			}
		} else if (
			effectiveFormatCode.length === 3 &&
			baseFormats.includes(effectiveFormatCode as (typeof baseFormats)[number])
		) {
			// If no range is provided but we have a numeric value, use the value itself as the range
			// This enables auto-scaling for single value components (BigValue, Value, Delta)
			let effectiveRange = range;
			if (!effectiveRange && typeof processedValue === 'number') {
				effectiveRange = { min: processedValue, max: processedValue };
			}
			actualFormatCode = getAutoFormat(effectiveFormatCode, effectiveRange);
		}

		// Handle special quarter format
		if (actualFormatCode === 'quarter') {
			const formatted = formatAsQuarter(processedValue);
			if (formatted === null) return fallbackValue;
			return formatted;
		}

		// Handle bare quarter format (`qq` → "Q2"); the year-prefixed form lives in `quarter` above.
		if (actualFormatCode === 'qq') {
			const formatted = formatAsBareQuarter(processedValue);
			if (formatted === null) return fallbackValue;
			return formatted;
		}

		// First check if the format code is in our presets
		actualFormatCode =
			FORMAT_PRESETS[actualFormatCode as keyof typeof FORMAT_PRESETS] || actualFormatCode;

		// Convert single quotes to double quotes for better UX before passing to SSF
		// This allows users to write fmt="'Q'0" instead of fmt="\"Q\"0"
		const ssfFormatCode = convertSingleQuotesToDouble(actualFormatCode);

		// Handle quarter of year formatting - only show Q1-Q4, hide invalid quarters
		// Matches formats like "Q"0, 'Q'0, or any format containing quoted Q followed by 0
		if (
			typeof processedValue === 'number' &&
			(ssfFormatCode.includes('"Q"') || ssfFormatCode.includes("'Q'")) &&
			(processedValue < 1 || processedValue > 4)
		) {
			return '';
		}

		// Any format code, whether from presets or custom, is now passed to ssf for formatting
		try {
			let result = ssf.format(ssfFormatCode, processedValue, { date1970: true });

			// Convert to comma decimal separator if requested: 1,234.56 -> 1.234,56
			// Only apply to numeric values - skip for dates (which may have commas like "January 15, 2024")
			// and strings (which should not have their punctuation modified)
			if (
				effectiveDecimalSeparator === ',' &&
				typeof result === 'string' &&
				typeof processedValue === 'number' &&
				!isDateFormat(effectiveFormatCode)
			) {
				// Use a placeholder unlikely to appear in formatted numbers
				const PLACEHOLDER = '<<COMMA>>';
				result = result
					.replace(/,/g, PLACEHOLDER) // temp placeholder for commas (thousands separator)
					.replace(/\./g, ',') // periods -> commas (decimal separator)
					.replace(new RegExp(PLACEHOLDER, 'g'), '.'); // commas -> periods (thousands separator)
			}

			return result;
		} catch (ssfError) {
			logger.warn(ssfError, 'SSF formatting error');
			throw ssfError; // Re-throw to be caught by outer catch
		}
	} catch (err) {
		logger.warn(err, `Error formatting value with code "${effectiveFormatCode}"`);
		if (typeof value === 'object') {
			return JSON.stringify(value);
		}
		return fallbackValue;
	}
}

/**
 * Helper function for generating format suggestions in Monaco editor
 * Centralized to avoid code duplication between root level and nested ZodAttribute format suggestions
 */
export function getFormatSuggestions(
	position: { lineNumber: number; column: number },
	monaco: { languages: { CompletionItemKind: { Value: number } } }, // Minimal Monaco interface
	isArrayType: boolean = false
) {
	// Use comprehensive format options that include both specific formats and base auto formats
	const formatOptions = ALL_FORMAT_OPTIONS;

	// Group formats into categories for sorting
	const getSortPrefix = (format: string) => {
		// Base auto formats first (highest priority)
		if (BASE_AUTO_FORMATS.includes(format as (typeof BASE_AUTO_FORMATS)[number])) {
			// Sub-categorize base auto formats
			if (format === 'num') return '0a';
			if (format === 'pct') return '0b';
			if (
				['usd', 'eur', 'gbp', 'aud', 'cad', 'cny', 'jpy', 'inr', 'krw', 'ngn', 'sek'].includes(
					format
				)
			) {
				return '0c' + format;
			}
			return '0z';
		}
		// Number formats second
		if (
			format.startsWith('num') ||
			format === 'id' ||
			format === 'fract' ||
			format.startsWith('mult') ||
			format === 'sci'
		) {
			return '1';
		}
		// Percent formats third
		if (format.startsWith('pct')) {
			return '2';
		}
		// Currency formats fourth, sorted by currency code
		if (
			['usd', 'eur', 'gbp', 'aud', 'cad', 'cny', 'jpy', 'inr', 'krw', 'ngn', 'sek'].some((curr) =>
				format.startsWith(curr)
			)
		) {
			return '3' + format.substring(0, 3);
		}
		// Date formats last
		return '4';
	};

	return {
		suggestions: formatOptions.map((format, index) => ({
			label: format,
			kind: monaco.languages.CompletionItemKind.Value,
			insertText: isArrayType ? `"${format}"` : format,
			// Set sortText to control display order
			sortText: getSortPrefix(format) + String(index).padStart(3, '0'),
			range: {
				startLineNumber: position.lineNumber,
				startColumn: position.column,
				endLineNumber: position.lineNumber,
				endColumn: position.column
			}
		}))
	};
}
