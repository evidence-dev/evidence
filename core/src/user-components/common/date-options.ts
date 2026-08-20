import type { UserComponentAttribute } from '../types';
import type { SqlDialect } from '../../sql-dialect';
import { defaultDialect } from '../../sql-dialect';
import { ZodAttribute } from './zod-attribute';
import { setZodMetadata } from './zod-metadata';
import { z } from 'zod';
import {
	format,
	startOfWeek as dfStartOfWeek,
	endOfWeek as dfEndOfWeek,
	startOfMonth as dfStartOfMonth,
	endOfMonth as dfEndOfMonth,
	startOfQuarter as dfStartOfQuarter,
	endOfQuarter as dfEndOfQuarter,
	startOfYear as dfStartOfYear,
	endOfYear as dfEndOfYear,
	subDays,
	addDays,
	addWeeks,
	addMonths,
	addQuarters,
	addYears,
	subWeeks,
	subMonths,
	subQuarters,
	subYears,
	differenceInCalendarDays
} from 'date-fns';

/**
 * Centralized registry of all supported date grain definitions.
 * Each grain defines its key, display label, SQL function, default format,
 * whether it's temporal (for time-series analysis), ranking for sorting,
 * and approximate duration in days.
 */
export const DATE_GRAIN_DEFINITIONS = [
	{
		key: 'day',
		label: 'Day',
		sqlFunction: 'toStartOfDay',
		defaultFormat: 'MMM d, yyyy',
		isTemporal: true,
		rank: 1,
		approxDays: 1
	},
	{
		key: 'week',
		label: 'Week',
		sqlFunction: 'toStartOfWeek',
		defaultFormat: 'MMM d, yyyy',
		isTemporal: true,
		rank: 2,
		approxDays: 7
	},
	{
		key: 'month',
		label: 'Month',
		sqlFunction: 'toStartOfMonth',
		defaultFormat: 'MMM yyyy',
		isTemporal: true,
		rank: 3,
		approxDays: 30
	},
	{
		key: 'quarter',
		label: 'Quarter',
		sqlFunction: 'toStartOfQuarter',
		defaultFormat: 'quarter',
		isTemporal: true,
		rank: 4,
		approxDays: 90
	},
	{
		key: 'year',
		label: 'Year',
		sqlFunction: 'toStartOfYear',
		defaultFormat: 'yyyy',
		isTemporal: true,
		rank: 5,
		approxDays: 365
	},
	{
		key: 'hour',
		label: 'Hour',
		sqlFunction: 'toStartOfHour',
		defaultFormat: 'MMM d, yyyy h AM/PM',
		isTemporal: true,
		rank: 0.5, // Finer than day
		approxDays: 1 / 24
	},
	{
		key: 'day of week',
		label: 'Day of Week',
		sqlFunction: 'toDayOfWeek',
		defaultFormat: 'ddd',
		isTemporal: false,
		rank: 99, // Non-temporal, lowest priority
		approxDays: 0 // Non-temporal, no duration concept
	},
	{
		key: 'day of month',
		label: 'Day of Month',
		sqlFunction: 'toDayOfMonth',
		defaultFormat: 'num0',
		isTemporal: false,
		rank: 99, // Non-temporal, lowest priority
		approxDays: 0 // Non-temporal, no duration concept
	},
	{
		key: 'day of year',
		label: 'Day of Year',
		sqlFunction: 'toDayOfYear',
		defaultFormat: 'num0',
		isTemporal: false,
		rank: 99, // Non-temporal, lowest priority
		approxDays: 0 // Non-temporal, no duration concept
	},
	{
		key: 'week of year',
		label: 'Week of Year',
		sqlFunction: 'toWeek',
		defaultFormat: 'num0',
		isTemporal: false,
		rank: 99, // Non-temporal, lowest priority
		approxDays: 0 // Non-temporal, no duration concept
	},
	{
		key: 'month of year',
		label: 'Month of Year',
		sqlFunction: 'toMonth',
		defaultFormat: 'mmm',
		isTemporal: false,
		rank: 99, // Non-temporal, lowest priority
		approxDays: 0 // Non-temporal, no duration concept
	},
	{
		key: 'quarter of year',
		label: 'Quarter of Year',
		sqlFunction: 'toQuarter',
		defaultFormat: '"Q"0',
		isTemporal: false,
		rank: 99, // Non-temporal, lowest priority
		approxDays: 0 // Non-temporal, no duration concept
	}
] as const;

/** Array of all supported date grain keys */
export const DATE_GRAINS = DATE_GRAIN_DEFINITIONS.map((d) => d.key) as readonly string[];

/**
 * Return the coarser of two temporal grains (`month` beats `day`, `year` beats
 * `month`, etc.), or the one that IS temporal if the other isn't, or the first
 * defined argument. Used by combo_chart to auto-pick a grain when its metric
 * children come from views with different `grain:` — coarser wins so the child
 * with finer data gets bucketed up to align with the coarser child's rows.
 */
const GRAIN_COARSENESS = new Map<string, number>(
	DATE_GRAIN_DEFINITIONS.filter((d) => d.isTemporal).map((d) => [d.key, d.approxDays])
);
export function coarserGrain(
	a: string | undefined,
	b: string | undefined
): string | undefined {
	if (!a) return b;
	if (!b) return a;
	const rankA = GRAIN_COARSENESS.get(a) ?? -1;
	const rankB = GRAIN_COARSENESS.get(b) ?? -1;
	// Prefer the temporal one if only one is temporal; else the coarser rank.
	if (rankA < 0 && rankB >= 0) return b;
	if (rankB < 0 && rankA >= 0) return a;
	return rankA >= rankB ? a : b;
}

/** Array of date grain keys that support temporal operations (time-series analysis and comparisons) */
export const TEMPORAL_DATE_GRAINS = DATE_GRAIN_DEFINITIONS.filter((d) => d.isTemporal).map(
	(d) => d.key
) as readonly string[];

/**
 * Checks if a date grain supports temporal operations like time-series analysis and comparisons.
 * @param grain - The date grain to check
 * @returns True if the grain is temporal, false otherwise
 */
export function isTemporalDateGrain(grain: string | undefined): boolean {
	return grain
		? TEMPORAL_DATE_GRAINS.includes(grain as (typeof TEMPORAL_DATE_GRAINS)[number])
		: false;
}

/** Grains that can land on a category axis, which takes slot order from row order. */
export function isCategoryAxisGrain(grain: string | undefined): boolean {
	if (!grain) return false;
	return grain === 'year' || !isTemporalDateGrain(grain);
}

export type DateGrain = (typeof DATE_GRAINS)[number];

/** Mapping of date grain keys to their human-readable labels */
export const DATE_GRAIN_LABELS = Object.fromEntries(
	DATE_GRAIN_DEFINITIONS.map((d) => [d.key, d.label])
) as Record<string, string>;

/** Mapping of date grain keys to their default display format codes */
export const DATE_GRAIN_DEFAULT_FORMATS = Object.fromEntries(
	DATE_GRAIN_DEFINITIONS.map((d) => [d.key, d.defaultFormat])
) as Record<string, string>;

/**
 * Gets the default format code for a given date grain
 * @param dateGrain The date grain to get the default format for
 * @returns The default format code or undefined if no date grain provided
 */
export function getDefaultFormatForDateGrain(dateGrain: DateGrain | undefined): string | undefined {
	if (!dateGrain) return undefined;
	return DATE_GRAIN_DEFAULT_FORMATS[dateGrain];
}

/** Mapping of date grain keys to their corresponding ClickHouse SQL functions */
export const DATE_GRAIN_SQL_FUNCTIONS = Object.fromEntries(
	DATE_GRAIN_DEFINITIONS.map((d) => [d.key, d.sqlFunction])
) as Record<string, string>;

/**
 * Generates a ClickHouse SQL function call that truncates a date/time column to the specified grain.
 * @param dateGrain - The date grain to apply (e.g., 'day', 'month', 'year')
 * @param columnName - The column name to apply the function to
 * @param firstDayOfWeek - First day of week setting ('sunday' or 'monday', defaults to 'sunday')
 * @returns The SQL function call (e.g., 'toStartOfMonth(date_col)') or the original column name if no valid grain
 */
export function getDateGrainSql(
	dateGrain: DateGrain | string | undefined,
	columnName: string,
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): string {
	if (!dateGrain || !(dateGrain in DATE_GRAIN_SQL_FUNCTIONS)) {
		return columnName;
	}

	return dialect.dateGrain(dateGrain, columnName, firstDayOfWeek);
}

/**
 * Maps comparison types and date grains to the appropriate ClickHouse date arithmetic function.
 * Used for calculating prior period dates in comparison queries.
 * @param comparison - The comparison type ('prior year' or 'prior period')
 * @param dateGrain - The date grain for 'prior period' comparisons ('day', 'week', 'month', 'quarter', 'year')
 * @returns ClickHouse function name for date arithmetic (e.g., 'addMonths', 'addYears')
 */
export function getOffsetFunction(comparison: string, dateGrain?: string): string {
	if (comparison === 'prior year') {
		return 'addYears';
	} else if (comparison === 'prior period') {
		switch (dateGrain) {
			case 'month':
				return 'addMonths';
			case 'quarter':
				return 'addQuarters';
			case 'year':
				return 'addYears';
			case 'day':
				return 'addDays';
			case 'week':
				return 'addWeeks';
			default:
				return 'addYears'; // Default to year
		}
	}
	return 'addYears';
}

/**
 * Converts a date range string to a compact shorthand version for display or storage.
 * @param dateRange - The date range string to convert (e.g., 'last 30 days', 'month to date')
 * @returns Shorthand version (e.g., 'l30d', 'mtd') or processed version for unrecognized patterns
 */
export function getDateRangeShorthand(dateRange: string): string {
	const lowercaseRange = dateRange.toLowerCase();
	const sh = PRESET_DEFINITIONS.find((d) => d.key === lowercaseRange)?.shorthand as
		| string
		| undefined;
	if (sh) return sh;

	const lastMatch = lowercaseRange.match(/^last (\d+ )?(day|week|month|quarter|year)s?$/);
	if (lastMatch) {
		const [, n, unit] = lastMatch;
		const count = n ? n.trim() : '1';
		const unitCode = unit[0];
		return `l${count}${unitCode}`;
	}

	return lowercaseRange.replace(/[ \t]+/g, '_');
}

/** String type representing all supported date range values */
export type DateRange = string; // will be narrowed after PRESET_DEFINITIONS

/**
 * Centralized registry of all supported date range preset definitions.
 * Each preset defines its key, display label, shorthand notation, type classification,
 * and metadata for date calculations. Used across UI components and parsing logic.
 */
export const PRESET_DEFINITIONS = [
	{
		key: 'today',
		label: 'Today',
		shorthand: 'td',
		type: 'relative',
		periodGrain: 'day',
		periodCount: 1
	},
	{
		key: 'yesterday',
		label: 'Yesterday',
		shorthand: 'yd',
		type: 'previous',
		periodGrain: 'day',
		periodCount: 1
	},
	{
		key: 'last 7 days',
		label: 'Last 7 Days',
		shorthand: 'l7d',
		type: 'relative',
		periodGrain: 'day',
		periodCount: 7
	},
	{
		key: 'last 30 days',
		label: 'Last 30 Days',
		shorthand: 'l30d',
		type: 'relative',
		periodGrain: 'day',
		periodCount: 30
	},
	{
		key: 'last 3 months',
		label: 'Last 3 Months',
		shorthand: 'l3m',
		type: 'relative',
		periodGrain: 'month',
		periodCount: 3
	},
	{
		key: 'last 6 months',
		label: 'Last 6 Months',
		shorthand: 'l6m',
		type: 'relative',
		periodGrain: 'month',
		periodCount: 6
	},
	{
		key: 'last 12 months',
		label: 'Last 12 Months',
		shorthand: 'l12m',
		type: 'relative',
		periodGrain: 'month',
		periodCount: 12
	},
	{
		key: 'previous week',
		label: 'Previous Week',
		shorthand: 'pw',
		type: 'previous',
		periodGrain: 'week',
		periodCount: 1
	},
	{
		key: 'previous month',
		label: 'Previous Month',
		shorthand: 'pm',
		type: 'previous',
		periodGrain: 'month',
		periodCount: 1
	},
	{
		key: 'previous quarter',
		label: 'Previous Quarter',
		shorthand: 'pq',
		type: 'previous',
		periodGrain: 'quarter',
		periodCount: 1
	},
	{
		key: 'previous year',
		label: 'Previous Year',
		shorthand: 'py',
		type: 'previous',
		periodGrain: 'year',
		periodCount: 1
	},
	{
		key: 'this week',
		label: 'This Week',
		shorthand: 'tw',
		type: 'relative',
		periodGrain: 'week',
		periodCount: 1
	},
	{
		key: 'this month',
		label: 'This Month',
		shorthand: 'tm',
		type: 'relative',
		periodGrain: 'month',
		periodCount: 1
	},
	{
		key: 'this quarter',
		label: 'This Quarter',
		shorthand: 'tq',
		type: 'relative',
		periodGrain: 'quarter',
		periodCount: 1
	},
	{
		key: 'this year',
		label: 'This Year',
		shorthand: 'ty',
		type: 'relative',
		periodGrain: 'year',
		periodCount: 1
	},
	{
		key: 'next week',
		label: 'Next Week',
		shorthand: 'nw',
		type: 'relative',
		periodGrain: 'week',
		periodCount: 1
	},
	{
		key: 'next month',
		label: 'Next Month',
		shorthand: 'nm',
		type: 'relative',
		periodGrain: 'month',
		periodCount: 1
	},
	{
		key: 'next quarter',
		label: 'Next Quarter',
		shorthand: 'nq',
		type: 'relative',
		periodGrain: 'quarter',
		periodCount: 1
	},
	{
		key: 'next year',
		label: 'Next Year',
		shorthand: 'ny',
		type: 'relative',
		periodGrain: 'year',
		periodCount: 1
	},
	{
		key: 'week to date',
		label: 'Week to Date',
		shorthand: 'wtd',
		type: 'to_date',
		startDateFunction: 'toStartOfWeek'
	},
	{
		key: 'month to date',
		label: 'Month to Date',
		shorthand: 'mtd',
		type: 'to_date',
		startDateFunction: 'toStartOfMonth'
	},
	{
		key: 'quarter to date',
		label: 'Quarter to Date',
		shorthand: 'qtd',
		type: 'to_date',
		startDateFunction: 'toStartOfQuarter'
	},
	{
		key: 'year to date',
		label: 'Year to Date',
		shorthand: 'ytd',
		type: 'to_date',
		startDateFunction: 'toStartOfYear'
	},
	{ key: 'all time', label: 'All Time', shorthand: 'all', type: 'allTime' }
] as const;

/** Array of all supported date range keys extracted from preset definitions */
export const DATE_RANGES = PRESET_DEFINITIONS.map((d) => d.key) as readonly string[];

/**
 * Single-day and forward-looking "this/next" presets are available, but hidden by default so the
 * preset menu stays compact. Opt in by providing explicit `preset_ranges`.
 */
export const DEFAULT_VISIBLE_PRESET_DEFINITIONS = PRESET_DEFINITIONS.filter(
	(d) =>
		![
			'today',
			'yesterday',
			'this week',
			'next week',
			'this month',
			'next month',
			'this quarter',
			'next quarter',
			'this year',
			'next year'
		].includes(d.key)
);

/** Tuple form of date ranges required for Zod enum validation (ensures at least one element) */
export const DATE_RANGES_TUPLE = DATE_RANGES as unknown as [
	(typeof DATE_RANGES)[number],
	...(typeof DATE_RANGES)[number][]
];

/**
 * Zod schema for validating date range objects used in user components.
 * Supports predefined presets, custom date ranges, partial ranges, and dynamic patterns.
 */
const MONTH_MAX_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Validate a literal `YYYY-MM-DD`, honoring leap years so e.g. 2025-02-29 (non-leap) is rejected. */
function isValidIsoDate(value: string): boolean {
	const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return false;
	const [, y, mo, d] = m.map(Number);
	if (mo < 1 || mo > 12 || d < 1) return false;
	const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
	const maxDay = mo === 2 && leap ? 29 : MONTH_MAX_DAYS[mo - 1];
	return d <= maxDay;
}

/**
 * The single source of truth for "is this a range string the app can resolve?" — shared by every place a
 * user enters a range (the `date_range.range` attribute, range_calendar's `default_range` / `all_time_range`,
 * etc.) so they allow/deny exactly the same values. Accepts the "all time" sentinel, preset keys,
 * `{{ variables }}`, closed/open ISO ranges (with real-date validity), and "Last N …" / "Previous …" patterns.
 */
export function isValidDateRangeExpression(value: string): boolean {
	const v = value.trim();
	if (!v) return false;
	if (/\{\{[^}]+\}\}/.test(v)) return true;
	return isRecognizedDateRange(v);
}

export const dateRangeSchema = setZodMetadata(
	z
		.object({
			range: setZodMetadata(
				z
					.union([
						z.enum(DATE_RANGES_TUPLE), // Predefined ranges (single source of truth)
						z.string().refine((val) => isValidDateRangeExpression(val), {
							message:
								"Invalid date range format. Use predefined ranges (e.g., 'last 7 days', 'month to date'), dynamic ranges (e.g., 'last 90 days'), custom ranges ('YYYY-MM-DD to YYYY-MM-DD'), partial ranges ('from YYYY-MM-DD' or 'until YYYY-MM-DD'), or a variable ({{ $var }}). Note: ranges are case-insensitive."
						})
					])
					.optional()
					.describe(
						"Time period to filter. Use presets like 'last 7 days', dynamic patterns like 'Last 90 days', custom ranges like '2020-01-01 to 2023-03-01', or partial ranges like 'from 2020-01-01'."
					),
				{ supportsVariables: true }
			),
			date: setZodMetadata(
				z
					.string()
					.optional()
					.describe('Date column to filter on. Required when the data has multiple date columns.'),
				{ suggestionType: 'sql', supportsVariables: true }
			)
		})
		.optional(),
	{
		example: `{
    range = "last 7 days"
    date = "order_date"
  }`
	}
);

export type DateRangeObject = z.infer<typeof dateRangeSchema>;

/**
 * Reusable date range attribute definition for user components.
 * Provides validation, autocomplete, and documentation for date_range properties.
 */
export const DATE_RANGE_ATTRIBUTE = {
	date_range: {
		type: ZodAttribute.create(dateRangeSchema),
		required: false,
		default: undefined,
		description:
			'Filter data to a time period. `date_range` is an OBJECT with `range` (the period) and optionally `date` (which column to filter on when the table has more than one). Shape: `date_range={ range="last 12 months" date="order_date" }`. `range` accepts predefined values (`last 7 days`, `month to date`), dynamic patterns (`Last 90 days`), custom windows (`2020-01-01 to 2023-03-01`), or partial ranges (`from 2020-01-01`, `until 2023-03-01`). Pass a plain string for `range` — the whole object is NOT a string.',
		affectsQuery: true,
		supportsVariables: true,
		keywords: [
			'date range',
			'date filter',
			'where date',
			'date range filter',
			'time range',
			'last x periods',
			'year to date',
			'period filter',
			'time period selection',
			'date-based filtering',
			'custom date range',
			'specific dates',
			'date to date',
			'from date',
			'until date',
			'partial date range',
			'start date only',
			'end date only'
		]
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Tuple form of date grains required for Zod enum validation
 */
const DATE_GRAINS_TUPLE = DATE_GRAINS as unknown as [
	(typeof DATE_GRAINS)[number],
	...(typeof DATE_GRAINS)[number][]
];

/**
 * Zod schema for date_grain that supports both predefined grains and variables
 */
const dateGrainSchema = z
	.union([
		z.enum(DATE_GRAINS_TUPLE),
		z.string().refine(
			(val) => {
				// Allow variable syntax ({{ ... }})
				if (val.match(/\{\{[^}]+\}\}/)) {
					return true;
				}
				// Check if it's a valid grain
				return DATE_GRAINS.includes(val as (typeof DATE_GRAINS)[number]);
			},
			{
				message: `Invalid date grain. Must be one of: ${Array.from(DATE_GRAINS).join(', ')}, or a variable like {{ $var }}`
			}
		)
	])
	.optional();

/**
 * Reusable date grain attribute definition for user components.
 * Provides validation and documentation for date_grain properties.
 */
export const DATE_GRAIN_ATTRIBUTE = {
	date_grain: {
		type: ZodAttribute.create(setZodMetadata(dateGrainSchema, { supportsVariables: true })),
		required: false,
		description:
			'Bucket dates into a grain. Pass the raw date column as `x` and the chart truncates and groups for you. Temporal grains (`day`, `week`, `month`, `quarter`, `year`, `hour`) preserve the year — use for time-series. Seasonality grains (`day of week`, `day of month`, `day of year`, `week of year`, `month of year`, `quarter of year`) collapse across years — use for cyclical patterns like "which month sells most regardless of year".',
		affectsQuery: true,
		supportsVariables: true,
		variableContext: 'text' as const
	}
} as const satisfies Record<string, UserComponentAttribute>;

/**
 * Structured information extracted from parsing a date range string.
 * Contains metadata needed for date calculations and SQL generation.
 */
export interface ParsedDateRange {
	type: 'relative' | 'previous' | 'to_date';
	periodGrain: 'day' | 'week' | 'month' | 'quarter' | 'year';
	periodCount: number;
	isToDate: boolean; // true for "to date" formats (MTD, WTD, YTD, etc.)
	startDateFunction?: string; // ClickHouse function for calculating start date in "to date" formats
}

/**
 * Parses a date range string into structured metadata for date calculations.
 * Handles predefined presets, explicit date ranges, and dynamic patterns with case-insensitive matching.
 * @param dateRange - The date range string to parse (e.g., 'last 30 days', '2023-01-01 to 2023-12-31')
 * @param today - Anchor date used to resolve dynamic range boundaries
 * @returns Parsed metadata object containing type, grain, count, and other properties, or null for 'all time'
 */
export function parseDateRange(
	dateRange: string | undefined,
	today: Date = new Date()
): ParsedDateRange | null {
	// Case-insensitive like the rest of the grammar — "All Time" must not fall
	// through to the last-12-months fallback below.
	if (!dateRange || dateRange.toLowerCase() === 'all time') return null;

	// Handle explicit date ranges first (e.g., "2023-03-14 to today")
	const explicitMatch = dateRange.match(
		new RegExp(`^(?:from )?(${DATE_BOUNDARY_TOKEN}) to (${DATE_BOUNDARY_TOKEN})$`, 'i')
	);
	if (explicitMatch) {
		const resolveBoundary = (boundary: string) => {
			if (boundary.toLowerCase() === 'today') return today;
			if (boundary.toLowerCase() === 'yesterday') return subDays(today, 1);
			return new Date(`${boundary}T00:00:00`);
		};
		const startDate = resolveBoundary(explicitMatch[1]);
		const endDate = resolveBoundary(explicitMatch[2]);
		const daysDiff = differenceInCalendarDays(endDate, startDate) + 1;

		return {
			type: 'relative', // Treat explicit ranges as 'relative' so comparison logic can calculate prior periods
			periodGrain: 'day',
			periodCount: daysDiff,
			isToDate: false
		};
	}

	// Convert to lowercase for case-insensitive matching (centralized here)
	const lowercaseInput = dateRange.toLowerCase();

	// Handle specific date range formats
	if (lowercaseInput === 'today' || lowercaseInput === 'td') {
		return {
			type: 'relative',
			periodGrain: 'day',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'yesterday' || lowercaseInput === 'yd') {
		return {
			type: 'previous',
			periodGrain: 'day',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'month to date' || lowercaseInput === 'mtd') {
		return {
			type: 'to_date',
			periodGrain: 'month',
			periodCount: 1,
			isToDate: true,
			startDateFunction: 'toStartOfMonth'
		};
	} else if (lowercaseInput === 'quarter to date' || lowercaseInput === 'qtd') {
		return {
			type: 'to_date',
			periodGrain: 'quarter',
			periodCount: 1,
			isToDate: true,
			startDateFunction: 'toStartOfQuarter'
		};
	} else if (lowercaseInput === 'week to date' || lowercaseInput === 'wtd') {
		return {
			type: 'to_date',
			periodGrain: 'week',
			periodCount: 1,
			isToDate: true,
			startDateFunction: 'toStartOfWeek'
		};
	} else if (lowercaseInput === 'year to date' || lowercaseInput === 'ytd') {
		return {
			type: 'to_date',
			periodGrain: 'year',
			periodCount: 1,
			isToDate: true,
			startDateFunction: 'toStartOfYear'
		};
	} else if (lowercaseInput === 'this week' || lowercaseInput === 'tw') {
		return {
			type: 'relative',
			periodGrain: 'week',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'next week' || lowercaseInput === 'nw') {
		return {
			type: 'relative',
			periodGrain: 'week',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'this month' || lowercaseInput === 'tm') {
		return {
			type: 'relative',
			periodGrain: 'month',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'next month' || lowercaseInput === 'nm') {
		return {
			type: 'relative',
			periodGrain: 'month',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'this quarter' || lowercaseInput === 'tq') {
		return {
			type: 'relative',
			periodGrain: 'quarter',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'next quarter' || lowercaseInput === 'nq') {
		return {
			type: 'relative',
			periodGrain: 'quarter',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'this year' || lowercaseInput === 'ty') {
		return {
			type: 'relative',
			periodGrain: 'year',
			periodCount: 1,
			isToDate: false
		};
	} else if (lowercaseInput === 'next year' || lowercaseInput === 'ny') {
		return {
			type: 'relative',
			periodGrain: 'year',
			periodCount: 1,
			isToDate: false
		};
	} else {
		// Parse "Previous X" periods using regex - handle both with and without numbers
		const previousMatch = dateRange.match(/^Previous (\d+ )?(week|month|quarter|year)s?$/i);
		if (previousMatch) {
			const periodCount = previousMatch[1] ? parseInt(previousMatch[1].trim()) : 1;
			const periodGrain = previousMatch[2].toLowerCase() as 'week' | 'month' | 'quarter' | 'year';

			return {
				type: 'previous',
				periodGrain,
				periodCount,
				isToDate: false
			};
		}

		// Parse "Last X" periods using regex — the count is optional ("last week" == "last 1 week").
		const lastMatch = dateRange.match(/^Last (\d+ )?(day|week|month|quarter|year)s?$/i);
		if (lastMatch) {
			const periodCount = lastMatch[1] ? parseInt(lastMatch[1].trim()) : 1;
			const periodGrain = lastMatch[2].toLowerCase() as
				| 'day'
				| 'week'
				| 'month'
				| 'quarter'
				| 'year';

			return {
				type: 'relative',
				periodGrain,
				periodCount,
				isToDate: false
			};
		} else {
			// Fallback for any unrecognized patterns
			return {
				type: 'relative',
				periodGrain: 'month',
				periodCount: 12,
				isToDate: false
			};
		}
	}
}

/** A boundary in from/until/closed ranges: a literal YYYY-MM-DD, or the dynamic tokens "today"/"yesterday". */
export const DATE_BOUNDARY_TOKEN = '\\d{4}-\\d{2}-\\d{2}|today|yesterday';

// Literal tokens parseDateRange matches explicitly. Preset keys like "last 7 days" are
// covered by the previous/last regexes below; the "all" shorthand is deliberately absent
// because parseDateRange only recognizes the full "all time".
const RECOGNIZED_RANGE_TOKENS = new Set([
	'all time',
	'today',
	'td',
	'yesterday',
	'yd',
	'week to date',
	'wtd',
	'month to date',
	'mtd',
	'quarter to date',
	'qtd',
	'year to date',
	'ytd',
	'this week',
	'tw',
	'next week',
	'nw',
	'this month',
	'tm',
	'next month',
	'nm',
	'this quarter',
	'tq',
	'next quarter',
	'nq',
	'this year',
	'ty',
	'next year',
	'ny'
]);

const RANGE_BOUNDARY = `(?:${DATE_BOUNDARY_TOKEN})`;
const CLOSED_RANGE_RE = new RegExp(`^(?:from )?${RANGE_BOUNDARY} to ${RANGE_BOUNDARY}$`, 'i');
const FROM_RANGE_RE = new RegExp(`^from ${RANGE_BOUNDARY}$`, 'i');
const UNTIL_RANGE_RE = new RegExp(`^until ${RANGE_BOUNDARY}$`, 'i');
// Counts are bounded to 1-9999, narrower than the parser: it accepts zero
// (inverted, always-empty range) and astronomic counts (date-fns throws).
const PREVIOUS_RANGE_RE = /^previous ([1-9]\d{0,3} )?(week|month|quarter|year)s?$/i;
const LAST_RANGE_RE = /^last ([1-9]\d{0,3} )?(day|week|month|quarter|year)s?$/i;

/**
 * Whether parseDateRange/resolveRangeToDates recognize this string. Must stay in
 * lockstep with their grammar: on unrecognized input they silently fall back to
 * "last 12 months" instead of erroring, so callers that need to reject bad input
 * (rather than mis-resolve it) must check here first.
 */
export function isRecognizedDateRange(range: string): boolean {
	const trimmed = range.trim();
	if (!trimmed) return false;
	if (RECOGNIZED_RANGE_TOKENS.has(trimmed.toLowerCase())) return true;
	// Literal dates must exist on the calendar — the resolvers pass them through unchecked.
	const isoDates = trimmed.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
	if (!isoDates.every(isValidIsoDate)) return false;
	return (
		CLOSED_RANGE_RE.test(trimmed) ||
		FROM_RANGE_RE.test(trimmed) ||
		UNTIL_RANGE_RE.test(trimmed) ||
		PREVIOUS_RANGE_RE.test(trimmed) ||
		LAST_RANGE_RE.test(trimmed)
	);
}

/**
 * Converts a date range string into concrete ISO date strings (YYYY-MM-DD format).
 * Handles all supported range formats and calculates dates relative to the provided anchor date.
 * Week calculations respect the first day of week setting.
 * @param range - The date range string to resolve (e.g., 'last 30 days', 'month to date', '2023-01-01 to 2023-12-31')
 * @param today - The anchor date for relative calculations (defaults to current date)
 * @param firstDayOfWeek - First day of week ('sunday' or 'monday', defaults to 'sunday')
 * @returns Object with start and/or end ISO date strings, or undefined for 'all time'
 */
export function resolveRangeToDates(
	range: string | undefined,
	today: Date = new Date(),
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday'
): { start?: string; end?: string } | undefined {
	if (!range || range.toLowerCase() === 'all time') return undefined;

	const resolveDateToken = (tok: string) => {
		const t = tok.toLowerCase();
		if (t === 'today') return format(today, 'yyyy-MM-dd');
		if (t === 'yesterday') return format(subDays(today, 1), 'yyyy-MM-dd');
		return tok;
	};

	// Specific closed-ended range. A leading "from" is accepted ("from X to Y" == "X to Y") so the
	// natural phrasing resolves instead of silently falling through to the relative fallback below.
	const closed = range.match(
		new RegExp(`^(?:from )?(${DATE_BOUNDARY_TOKEN}) to (${DATE_BOUNDARY_TOKEN})$`, 'i')
	);
	if (closed) {
		return { start: resolveDateToken(closed[1]), end: resolveDateToken(closed[2]) };
	}

	// Open-ended ranges
	const fromMatch = range.match(new RegExp(`^from (${DATE_BOUNDARY_TOKEN})$`, 'i'));
	if (fromMatch) {
		return { start: resolveDateToken(fromMatch[1]), end: undefined };
	}
	const untilMatch = range.match(new RegExp(`^until (${DATE_BOUNDARY_TOKEN})$`, 'i'));
	if (untilMatch) {
		return { start: undefined, end: resolveDateToken(untilMatch[1]) };
	}

	const parsed = parseDateRange(range);
	if (!parsed) return undefined;

	const toISO = (d: Date) => format(d, 'yyyy-MM-dd');
	const weekStartsOn = firstDayOfWeek === 'monday' ? 1 : 0;
	const lowercaseRange = range.toLowerCase();

	if (lowercaseRange === 'today' || lowercaseRange === 'td') {
		const iso = toISO(today);
		return { start: iso, end: iso };
	}

	if (lowercaseRange === 'yesterday' || lowercaseRange === 'yd') {
		const iso = toISO(subDays(today, 1));
		return { start: iso, end: iso };
	}

	// Full month presets include future days rather than ending at "today".
	if (lowercaseRange === 'this week' || lowercaseRange === 'tw') {
		const start = dfStartOfWeek(today, { weekStartsOn });
		return {
			start: toISO(start),
			end: toISO(dfEndOfWeek(today, { weekStartsOn }))
		};
	}

	if (lowercaseRange === 'next week' || lowercaseRange === 'nw') {
		const nextWeekDate = addWeeks(today, 1);
		const start = dfStartOfWeek(nextWeekDate, { weekStartsOn });
		return {
			start: toISO(start),
			end: toISO(dfEndOfWeek(nextWeekDate, { weekStartsOn }))
		};
	}

	if (lowercaseRange === 'this month' || lowercaseRange === 'tm') {
		return {
			start: toISO(dfStartOfMonth(today)),
			end: toISO(dfEndOfMonth(today))
		};
	}

	if (lowercaseRange === 'next month' || lowercaseRange === 'nm') {
		const nextMonthDate = addMonths(today, 1);
		return {
			start: toISO(dfStartOfMonth(nextMonthDate)),
			end: toISO(dfEndOfMonth(nextMonthDate))
		};
	}

	if (lowercaseRange === 'this quarter' || lowercaseRange === 'tq') {
		return {
			start: toISO(dfStartOfQuarter(today)),
			end: toISO(dfEndOfQuarter(today))
		};
	}

	if (lowercaseRange === 'next quarter' || lowercaseRange === 'nq') {
		const nextQuarterDate = addQuarters(today, 1);
		return {
			start: toISO(dfStartOfQuarter(nextQuarterDate)),
			end: toISO(dfEndOfQuarter(nextQuarterDate))
		};
	}

	if (lowercaseRange === 'this year' || lowercaseRange === 'ty') {
		return {
			start: toISO(dfStartOfYear(today)),
			end: toISO(dfEndOfYear(today))
		};
	}

	if (lowercaseRange === 'next year' || lowercaseRange === 'ny') {
		const nextYearDate = addYears(today, 1);
		return {
			start: toISO(dfStartOfYear(nextYearDate)),
			end: toISO(dfEndOfYear(nextYearDate))
		};
	}

	if (parsed.isToDate) {
		// to-date periods
		const end = today;
		let start: Date;
		if (parsed.periodGrain === 'month') start = dfStartOfMonth(end);
		else if (parsed.periodGrain === 'quarter') start = dfStartOfQuarter(end);
		else if (parsed.periodGrain === 'week') start = dfStartOfWeek(end, { weekStartsOn });
		else if (parsed.periodGrain === 'year') start = dfStartOfYear(end);
		else start = end;

		const startISO = toISO(start);
		const endISO = toISO(end);

		return { start: startISO, end: endISO };
	}

	if (parsed.type === 'previous') {
		// Previous full period
		if (parsed.periodGrain === 'day') {
			const day = subDays(today, parsed.periodCount);
			return { start: toISO(day), end: toISO(day) };
		}
		if (parsed.periodGrain === 'quarter') {
			const currentStart = dfStartOfQuarter(today);
			const start = subQuarters(currentStart, parsed.periodCount);
			const end = subDays(currentStart, 1);
			return { start: toISO(start), end: toISO(end) };
		}
		if (parsed.periodGrain === 'month') {
			const currentStart = dfStartOfMonth(today);
			const start = subMonths(currentStart, parsed.periodCount);
			const end = subDays(currentStart, 1);
			return { start: toISO(start), end: toISO(end) };
		}
		if (parsed.periodGrain === 'week') {
			const currentStart = dfStartOfWeek(today, { weekStartsOn });
			const start = subWeeks(currentStart, parsed.periodCount);
			const end = subDays(currentStart, 1);
			return { start: toISO(start), end: toISO(end) };
		}
		if (parsed.periodGrain === 'year') {
			const currentStart = dfStartOfYear(today);
			const start = subYears(currentStart, parsed.periodCount);
			const end = subDays(currentStart, 1);
			return { start: toISO(start), end: toISO(end) };
		}
		// Fallback (shouldn't happen)
		const end = today;
		return { start: toISO(end), end: toISO(end) };
	}

	if (parsed.type === 'relative') {
		const end = today;
		let start: Date = end;
		if (parsed.periodGrain === 'day') start = addDays(subDays(end, parsed.periodCount), 1);
		else if (parsed.periodGrain === 'week') start = addDays(subWeeks(end, parsed.periodCount), 1);
		else if (parsed.periodGrain === 'month') start = addDays(subMonths(end, parsed.periodCount), 1);
		else if (parsed.periodGrain === 'quarter')
			start = addDays(subQuarters(end, parsed.periodCount), 1);
		else if (parsed.periodGrain === 'year') start = addDays(subYears(end, parsed.periodCount), 1);
		return { start: toISO(start), end: toISO(end) };
	}

	return undefined;
}

/** Alias for resolveRangeToDates with consistent naming convention */
export const dateRangeToDates = resolveRangeToDates;

/**
 * Primary date processing function that converts a date range string into all necessary formats.
 * This is the main entry point for date range processing across the application.
 * Combines parsing, date resolution, and SQL generation in a single call.
 *
 * @param range - The date range string to process (e.g., 'last 30 days', 'month to date', '2023-01-01 to 2023-12-31')
 * @param column - Optional column name for generating WHERE clauses (e.g., 'order_date')
 * @param today - Anchor date for relative calculations (defaults to current date)
 * @param firstDayOfWeek - First day of week ('sunday' or 'monday', defaults to 'sunday')
 * @returns Comprehensive object containing all date formats and SQL fragments needed by components
 */
export function processDateRange(
	range: string | undefined,
	column?: string,
	today: Date = new Date(),
	firstDayOfWeek: 'sunday' | 'monday' = 'sunday',
	dialect: SqlDialect = defaultDialect
): {
	/** Raw ISO date strings (YYYY-MM-DD) - source of truth for date calculations */
	startDate?: string;
	endDate?: string;

	/** SQL-formatted dates cast with the active warehouse dialect */
	startDateSql?: string;
	endDateSql?: string;

	/** Complete SQL WHERE clause including column name (empty if no column provided) */
	whereClause: string;
	/** SQL fragment for BETWEEN/comparison operations (without column name) */
	betweenFragment: string;

	/** Range type classification for business logic */
	type: 'relative' | 'previous' | 'to_date' | 'custom' | 'all_time';
	/** Time grain unit (day, week, month, quarter, year) */
	periodGrain: string;
	/** Number of periods in the range */
	periodCount: number;
	/** Whether this is a "to date" range (e.g., month to date, year to date) */
	isToDate: boolean;
	/** Original range string that was processed */
	range: string;
} {
	// Handle 'all time' or empty range
	if (!range || range.toLowerCase() === 'all time') {
		return {
			startDate: undefined,
			endDate: undefined,
			startDateSql: undefined,
			endDateSql: undefined,
			whereClause: '',
			betweenFragment: '',
			type: 'all_time',
			periodGrain: 'day',
			periodCount: 0,
			isToDate: false,
			range: 'all time'
		};
	}

	// Get raw dates and metadata
	const dates = resolveRangeToDates(range, today, firstDayOfWeek);
	const metadata = parseDateRange(range, today);

	if (!dates) {
		return {
			startDate: undefined,
			endDate: undefined,
			startDateSql: undefined,
			endDateSql: undefined,
			whereClause: '',
			betweenFragment: '',
			type: metadata?.type || 'custom',
			periodGrain: metadata?.periodGrain || 'day',
			periodCount: metadata?.periodCount || 0,
			isToDate: metadata?.isToDate || false,
			range: range || ''
		};
	}

	// Raw ISO dates (source of truth)
	const startDate = dates.start;
	const endDate = dates.end;

	// Format dates for SQL
	const startDateSql = startDate ? dialect.dateLiteral(startDate) : undefined;
	const endDateSql = endDate ? dialect.dateLiteral(endDate) : undefined;

	// Build WHERE clause (only if column provided)
	let whereClause = '';
	if (column) {
		if (startDateSql && endDateSql) {
			whereClause = `${column} >= ${startDateSql} AND ${column} <= ${endDateSql}`;
		} else if (startDateSql) {
			whereClause = `${column} >= ${startDateSql}`;
		} else if (endDateSql) {
			whereClause = `${column} <= ${endDateSql}`;
		}
	}

	// Build BETWEEN fragment
	let betweenFragment = '';
	if (startDateSql && endDateSql) {
		betweenFragment = `BETWEEN ${startDateSql} AND ${endDateSql}`;
	} else if (startDateSql) {
		betweenFragment = `>= ${startDateSql}`;
	} else if (endDateSql) {
		betweenFragment = `<= ${endDateSql}`;
	}

	return {
		startDate,
		endDate,
		startDateSql,
		endDateSql,
		whereClause,
		betweenFragment,
		type: metadata?.type || 'custom',
		periodGrain: metadata?.periodGrain || 'day',
		periodCount: metadata?.periodCount || 0,
		isToDate: metadata?.isToDate || false,
		range: range || ''
	};
}

/**
 * Mapping of date grains to their ranking order from fine to coarse.
 * Lower numbers represent finer granularity. Used for sorting and precedence logic.
 */
export const TEMPORAL_GRAIN_ORDER: Record<string, number> = Object.fromEntries(
	DATE_GRAIN_DEFINITIONS.map((d) => [d.key, d.rank])
);

/**
 * Gets the ranking order of a date grain, with lower numbers being finer granularity.
 * @param grain - The date grain to get the rank for
 * @returns Numeric rank (0.5-5 for temporal grains, 99 for non-temporal/unknown/null)
 */
export function getGrainRank(grain: string | undefined | null): number {
	if (!grain) return 99;
	return TEMPORAL_GRAIN_ORDER[grain] ?? 99;
}

/**
 * Mapping of date grains to their approximate duration in days.
 * Used for quantitative comparison of grain "fineness" and duration calculations.
 */
export const TEMPORAL_GRAIN_DAYS: Record<string, number> = Object.fromEntries(
	DATE_GRAIN_DEFINITIONS.map((d) => [d.key, d.approxDays])
);

/**
 * Calculates the approximate total duration in days for a given grain and period count.
 * @param grain - The date grain ('day', 'week', 'month', etc.)
 * @param periodCount - The number of periods (defaults to 1)
 * @returns Total approximate days, or null if the grain is unknown
 */
export function getEffectiveDays(
	grain: string | undefined | null,
	periodCount: number = 1
): number | null {
	if (!grain) return null;
	const base = TEMPORAL_GRAIN_DAYS[grain];
	if (base === undefined) return null;
	return base * periodCount;
}
