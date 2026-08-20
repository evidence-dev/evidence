import type { DataPoint } from '../types';
import { untrack } from 'svelte';
import { DATE_GRAIN_DEFINITIONS, type DateGrain } from './date-options';

// NOTE: We intentionally do NOT use date-fns for date sequence generation.
// date-fns operates in local time, which causes timezone-related bugs when
// parsing UTC date strings. Instead, we use pure string arithmetic which is
// completely timezone-agnostic.

// ============================================================================
// TYPES
// ============================================================================

/**
 * How to handle missing data points in the chart
 * - 'connect': Do nothing, let ECharts auto-connect points (default)
 * - 'gaps': Insert nulls at missing intervals, creating visual breaks
 * - 'zero': Insert zeros at missing intervals
 */
export type HandleMissing = 'connect' | 'gaps' | 'zero';

/**
 * Configuration options for the unified gap-filling function
 */
export interface FillGapsOptions {
	/** The data array to process */
	data: DataPoint[];
	/** Column name for the x-axis values */
	xColumn: string;
	/** Column name for the y-axis values */
	yColumn: string;
	/** Column name for series grouping (optional) */
	seriesColumn?: string;
	/** Column name for bubble size (optional) */
	sizeColumn?: string;

	// Temporal filling control
	/** How to handle missing data points (default: 'connect') */
	handleMissing?: HandleMissing;
	/** Explicit date grain for interval calculation (preferred over inference) */
	dateGrain?: DateGrain;
	/**
	 * Whether to generate new X values that don't exist in the data.
	 * - true: Generate missing X positions (e.g., fill gaps in a sequence)
	 * - false: Only do cross-series alignment at existing X positions
	 *
	 * Bar charts should always set this to false (no phantom bars).
	 * Line/area charts can set to true when user wants handle_missing='gaps'/'zero'.
	 */
	generateMissingXValues?: boolean;

	// Type information from column metadata
	/** The JavaScript type of the x-axis column from QueryResult.columns[].jsType */
	xColumnType?: 'date' | 'number' | 'string';

	// Safety limits
	/** Maximum number of new points to insert (default: 500) */
	maxFillPoints?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_FILL_POINTS = 500;

/**
 * Mapping of date grains to their approximate millisecond values
 * Used for grain inference via median-snapping
 */
const GRAIN_TO_MS: Record<string, number> = {
	hour: 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000,
	quarter: 90 * 24 * 60 * 60 * 1000,
	year: 365 * 24 * 60 * 60 * 1000
};

/**
 * Tolerance for grain matching (20%)
 * If median difference is within 20% of a known grain, we snap to it
 */
const GRAIN_TOLERANCE = 0.2;

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Unified gap-filling function that handles both:
 * 1. Temporal gaps: Missing time intervals within the data (e.g., Jan 3-4 missing from all series)
 * 2. Cross-series gaps: Values that exist in some series but not others
 *
 * Performance optimizations:
 * - Multiple early exits for common cases (95%+ of charts need no filling)
 * - Single-pass data structure building
 * - untrack() wrapper to avoid Svelte proxy overhead
 *
 * @example
 * ```ts
 * // No filling needed (default) - returns data unchanged
 * fillGaps({ data, xColumn: 'date', yColumn: 'value' });
 *
 * // Fill temporal gaps with nulls (shows breaks in line charts)
 * fillGaps({ data, xColumn: 'date', yColumn: 'value', handleMissing: 'gaps', dateGrain: 'day' });
 *
 * // Multi-series with cross-series alignment
 * fillGaps({ data, xColumn: 'date', yColumn: 'value', seriesColumn: 'category' });
 * ```
 */
export function fillGaps(options: FillGapsOptions): DataPoint[] {
	const {
		data,
		xColumn,
		yColumn,
		seriesColumn,
		sizeColumn,
		handleMissing = 'connect',
		dateGrain,
		generateMissingXValues = true,
		xColumnType,
		maxFillPoints = DEFAULT_MAX_FILL_POINTS
	} = options;

	// ──────────────────────────────────────────────────────────────────────────
	// EARLY EXIT 1: No data or insufficient data
	// ──────────────────────────────────────────────────────────────────────────
	if (!data || data.length === 0) {
		return data;
	}

	// ──────────────────────────────────────────────────────────────────────────
	// EARLY EXIT 2: No filling requested AND single series
	// This is the 95%+ common case - zero cost path
	// ──────────────────────────────────────────────────────────────────────────
	if (handleMissing === 'connect' && !seriesColumn) {
		return data;
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Build data structures (single pass, wrapped in untrack for performance)
	// ──────────────────────────────────────────────────────────────────────────
	const { xValues, seriesValues, dataMap } = buildDataStructures(data, xColumn, seriesColumn);

	// ──────────────────────────────────────────────────────────────────────────
	// EARLY EXIT 3: Single series with no temporal filling
	// ──────────────────────────────────────────────────────────────────────────
	if (seriesValues.length <= 1 && handleMissing === 'connect') {
		return data;
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Determine expected X values
	// - If generateMissingXValues is false OR handleMissing === 'connect': use existing X values only
	// - Otherwise: generate complete sequence based on grain/inference
	//
	// This separation allows:
	// - Bar charts: cross-series alignment at EXISTING x positions only (no phantom bars)
	// - Line/area charts with handle_missing='gaps'/'zero': generate NEW x positions
	// ──────────────────────────────────────────────────────────────────────────
	let expectedXValues: unknown[];

	// Only generate new X values if:
	// 1. Chart type allows it (bar charts never do)
	// 2. User explicitly wants gap/zero handling (not 'connect')
	const shouldGenerateNewXValues = generateMissingXValues && handleMissing !== 'connect';

	if (!shouldGenerateNewXValues) {
		// Cross-series alignment only: use existing X values
		expectedXValues = xValues;
	} else {
		// Temporal filling: generate complete sequence
		// Uses explicit xColumnType from column metadata (no inference hacking)
		const generated = generateExpectedXValues(xValues, xColumnType, dateGrain, maxFillPoints);

		if (generated === null) {
			// Type unknown, inference failed, or would exceed limits - fall back to existing values
			expectedXValues = xValues;
		} else {
			expectedXValues = generated;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// EARLY EXIT 4: Grid already complete
	// (All expected X × series combinations already exist)
	// ──────────────────────────────────────────────────────────────────────────
	const expectedSize = expectedXValues.length * seriesValues.length;
	if (data.length === expectedSize) {
		return data;
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Build the complete grid with filled values
	// ──────────────────────────────────────────────────────────────────────────
	const fillValue = handleMissing === 'zero' ? 0 : null;

	return buildCompleteGrid({
		dataMap,
		expectedXValues,
		seriesValues,
		xColumn,
		yColumn,
		seriesColumn,
		sizeColumn,
		fillValue
	});
}

// ============================================================================
// DATA STRUCTURE BUILDING
// ============================================================================

/**
 * Builds all necessary data structures in a single pass through the data.
 * Uses untrack() to avoid Svelte proxy overhead (100x faster on reactive data).
 *
 * Handles Date objects specially: uses ISO string keys for Set/Map operations
 * to ensure proper equality comparison (JS compares objects by reference).
 *
 * @returns Object containing:
 *   - xValues: Array of distinct X values (preserves order of first appearance)
 *   - seriesValues: Array of distinct series values
 *   - dataMap: Map for O(1) lookup of existing data points
 */
function buildDataStructures(
	data: DataPoint[],
	xColumn: string,
	seriesColumn?: string
): {
	xValues: unknown[];
	seriesValues: unknown[];
	dataMap: Map<string, DataPoint>;
} {
	// Use string keys for Sets to handle Date object equality correctly
	const xKeyToValue = new Map<string, unknown>();
	const seriesSet = new Set<unknown>();
	const dataMap = new Map<string, DataPoint>();

	untrack(() => {
		for (const row of data) {
			const xVal = row[xColumn];
			const seriesVal = seriesColumn ? row[seriesColumn] : null;

			// Normalize x value to string key for proper equality
			const xKey = normalizeToKey(xVal);
			if (!xKeyToValue.has(xKey)) {
				xKeyToValue.set(xKey, xVal);
			}

			seriesSet.add(seriesVal);

			// Create lookup key: "xValue|seriesValue"
			const key = createLookupKey(xVal, seriesVal);
			dataMap.set(key, row);
		}
	});

	return {
		xValues: [...xKeyToValue.values()],
		seriesValues: [...seriesSet],
		dataMap
	};
}

/**
 * Normalizes a value to a string key for Set/Map operations.
 * Handles Date objects by converting to ISO string.
 */
function normalizeToKey(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString();
	}
	return String(value);
}

/**
 * Creates a consistent lookup key for the data map.
 * Handles Date objects by converting to ISO string for reliable comparison.
 */
function createLookupKey(xValue: unknown, seriesValue: unknown): string {
	const xKey = xValue instanceof Date ? xValue.toISOString() : String(xValue);
	return `${xKey}|${seriesValue}`;
}

// ============================================================================
// EXPECTED X VALUES GENERATION
// ============================================================================

/**
 * Generates the complete sequence of expected X values based on column type.
 * Uses explicit xColumnType from column metadata - no type inference hacking.
 *
 * @param existingXValues - The distinct X values already in the data
 * @param xColumnType - The JavaScript type from QueryResult.columns[].jsType
 * @param dateGrain - Optional explicit date grain for date columns
 * @param maxFillPoints - Safety limit for generated points
 *
 * @returns Array of expected X values, or null if:
 *   - xColumnType is not provided or is 'string' (can't interpolate)
 *   - Inference fails
 *   - Would exceed maxFillPoints
 */
function generateExpectedXValues(
	existingXValues: unknown[],
	xColumnType: 'date' | 'number' | 'string' | undefined,
	dateGrain?: DateGrain,
	maxFillPoints: number = DEFAULT_MAX_FILL_POINTS
): unknown[] | null {
	// Need at least 2 values to determine interval
	if (existingXValues.length < 2) {
		return existingXValues;
	}

	// If no type provided or it's a string column, can't do temporal filling
	if (!xColumnType || xColumnType === 'string') {
		return null;
	}

	switch (xColumnType) {
		case 'date':
			// Dates can be Date objects or ISO date strings depending on data source
			return generateExpectedDates(existingXValues as (Date | string)[], dateGrain, maxFillPoints);

		case 'number':
			return generateExpectedNumbers(existingXValues as number[], maxFillPoints);
	}
}

// ============================================================================
// DATE SEQUENCE GENERATION (Timezone-Agnostic String Arithmetic)
// ============================================================================

/**
 * Parsed date components for timezone-agnostic arithmetic.
 * We work with these instead of Date objects to avoid timezone issues.
 */
interface DateComponents {
	year: number;
	month: number; // 1-12
	day: number;
}

/**
 * Extracts the YYYY-MM-DD portion from any date string format.
 * Handles: "2024-01-15", "2024-01-15 14:30:00", "2024-01-15T14:30:00.000Z"
 */
function extractDatePart(dateStr: string): string {
	return dateStr.substring(0, 10);
}

/**
 * Parses a date string to components. Works with any format that starts with YYYY-MM-DD.
 */
function parseDateString(dateStr: string): DateComponents {
	const datePart = extractDatePart(dateStr);
	const [yearStr, monthStr, dayStr] = datePart.split('-');
	return {
		year: parseInt(yearStr, 10),
		month: parseInt(monthStr, 10),
		day: parseInt(dayStr, 10)
	};
}

/**
 * Formats date components back to YYYY-MM-DD string.
 */
function formatDateComponents(components: DateComponents): string {
	const { year, month, day } = components;
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Gets the number of days in a given month.
 * Uses Date constructor trick: new Date(year, month, 0) gives last day of previous month.
 */
function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

/**
 * Adds a time interval to date components using pure arithmetic.
 * Completely timezone-agnostic.
 */
function addToDateComponents(components: DateComponents, grain: DateGrain): DateComponents {
	let { year, month, day } = components;

	switch (grain) {
		case 'hour':
			// For hourly data with date-only strings, treat as daily
			// (hours don't apply to YYYY-MM-DD format)
			day += 1;
			break;
		case 'day':
			day += 1;
			break;
		case 'week':
			day += 7;
			break;
		case 'month':
			month += 1;
			break;
		case 'quarter':
			month += 3;
			break;
		case 'year':
			year += 1;
			break;
		default:
			day += 1;
	}

	// Handle month overflow
	while (month > 12) {
		month -= 12;
		year++;
	}

	// Handle day overflow (accounts for variable month lengths)
	let daysInCurrentMonth = getDaysInMonth(year, month);
	while (day > daysInCurrentMonth) {
		day -= daysInCurrentMonth;
		month++;
		if (month > 12) {
			month = 1;
			year++;
		}
		daysInCurrentMonth = getDaysInMonth(year, month);
	}

	// Clamp day to valid range (for month/quarter/year additions)
	// e.g., Jan 31 + 1 month should be Feb 28/29, not Mar 2-3
	if (grain === 'month' || grain === 'quarter' || grain === 'year') {
		const maxDay = getDaysInMonth(year, month);
		day = Math.min(components.day, maxDay);
	}

	return { year, month, day };
}

/**
 * Compares two date component objects.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareDateComponents(a: DateComponents, b: DateComponents): number {
	if (a.year !== b.year) return a.year - b.year;
	if (a.month !== b.month) return a.month - b.month;
	return a.day - b.day;
}

/**
 * Generates a complete sequence of dates between min and max.
 * Handles both Date objects and ISO date strings.
 * Uses pure string arithmetic - completely timezone-agnostic.
 *
 * @param dateValues - Existing date values (Date objects or ISO strings)
 * @param explicitGrain - User-provided date grain (preferred)
 * @param maxFillPoints - Maximum new points to add
 * @returns Complete date sequence in the same format as input, or null if limits exceeded or grain unknown
 */
function generateExpectedDates(
	dateValues: (Date | string)[],
	explicitGrain?: DateGrain,
	maxFillPoints: number = DEFAULT_MAX_FILL_POINTS
): (Date | string)[] | null {
	// Determine if input is strings
	const inputIsStrings = typeof dateValues[0] === 'string';

	// Convert all values to date strings for consistent processing
	const dateStrings: string[] = dateValues.map((d) => {
		if (d instanceof Date) {
			// Format Date object to YYYY-MM-DD using UTC
			const year = d.getUTCFullYear();
			const month = String(d.getUTCMonth() + 1).padStart(2, '0');
			const day = String(d.getUTCDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}
		return extractDatePart(d);
	});

	// Sort to find min/max
	const sorted = [...dateStrings].sort();
	const minDateStr = sorted[0];
	const maxDateStr = sorted[sorted.length - 1];

	// Parse to components for grain inference (still need Date objects for median calculation)
	// But we only use them for inference, not for sequence generation
	const datesForInference: Date[] = dateStrings.map((d) => new Date(d + 'T12:00:00Z'));
	const sortedForInference = [...datesForInference].sort((a, b) => a.getTime() - b.getTime());

	// Determine the grain to use
	const grain = explicitGrain ?? inferDateGrain(sortedForInference);

	if (!grain) {
		return null;
	}

	// Check if we're dealing with a non-temporal grain (like 'month of year')
	const grainDef = DATE_GRAIN_DEFINITIONS.find((d) => d.key === grain);
	if (grainDef && !grainDef.isTemporal) {
		return null;
	}

	// Estimate fill count (use Date objects just for estimation)
	const minDate = sortedForInference[0];
	const maxDate = sortedForInference[sortedForInference.length - 1];
	const estimatedCount = estimateFillCount(minDate, maxDate, grain);
	const newPoints = estimatedCount - dateStrings.length;

	if (newPoints > maxFillPoints) {
		return null;
	}

	// Generate sequence using pure string arithmetic
	const sequence = generateDateSequenceFromStrings(minDateStr, maxDateStr, grain);

	// Return in the original format
	if (inputIsStrings) {
		return sequence;
	}

	// Convert back to Date objects if input was Date objects. Noon UTC is
	// deliberate: it keeps the calendar date stable when the Date is formatted
	// in ANY viewer timezone (UTC±12) — midnight-anchored synthetic dates
	// showed as the previous day for viewers behind UTC. The cost is a 12h
	// offset from driver-emitted midnight Dates on time-axis positioning,
	// which is the accepted trade-off (see X_AXIS_SPEC.md, series fill).
	return sequence.map((s) => new Date(s + 'T12:00:00Z'));
}

/**
 * Generates a complete sequence of date strings from min to max.
 * Uses pure string arithmetic - completely timezone-agnostic.
 */
function generateDateSequenceFromStrings(
	minDateStr: string,
	maxDateStr: string,
	grain: DateGrain
): string[] {
	const sequence: string[] = [];
	let current = parseDateString(minDateStr);
	const max = parseDateString(maxDateStr);

	// Safety limit to prevent infinite loops
	const MAX_ITERATIONS = 10000;
	let iterations = 0;

	while (compareDateComponents(current, max) <= 0 && iterations < MAX_ITERATIONS) {
		sequence.push(formatDateComponents(current));
		current = addToDateComponents(current, grain);
		iterations++;
	}

	return sequence;
}

/**
 * Infers the date grain from the data by analyzing the median difference
 * between consecutive dates and snapping to the nearest known grain.
 *
 * @returns The inferred grain, or null if no confident match
 */
export function inferDateGrain(sortedDates: Date[]): DateGrain | null {
	if (sortedDates.length < 2) {
		return null;
	}

	// Calculate differences between consecutive dates
	const diffs: number[] = [];
	for (let i = 1; i < sortedDates.length; i++) {
		const diff = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
		if (diff > 0) {
			diffs.push(diff);
		}
	}

	if (diffs.length === 0) {
		return null;
	}

	// Find median difference
	diffs.sort((a, b) => a - b);
	const medianMs = diffs[Math.floor(diffs.length / 2)];

	// Try to snap to known grains (with tolerance)
	// Check in order from finest to coarsest
	const grainsToCheck: DateGrain[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];

	for (const grain of grainsToCheck) {
		const grainMs = GRAIN_TO_MS[grain];
		const ratio = medianMs / grainMs;

		// Accept if within tolerance (e.g., 0.8 to 1.2 for 20% tolerance)
		if (ratio >= 1 - GRAIN_TOLERANCE && ratio <= 1 + GRAIN_TOLERANCE) {
			return grain;
		}
	}

	// No confident match
	return null;
}

/**
 * Estimates how many date points would be in the complete sequence.
 * Used for safety checks before actually generating.
 */
function estimateFillCount(minDate: Date, maxDate: Date, grain: DateGrain): number {
	const rangeMs = maxDate.getTime() - minDate.getTime();
	const grainMs = GRAIN_TO_MS[grain] || GRAIN_TO_MS.day;
	return Math.ceil(rangeMs / grainMs) + 1;
}

// ============================================================================
// NUMERIC SEQUENCE GENERATION
// ============================================================================

/**
 * Generates a complete sequence of numbers between min and max.
 * Uses GCD (Greatest Common Divisor) approach to find the interval.
 *
 * @param numbers - Existing numeric values
 * @param maxFillPoints - Maximum new points to add
 * @returns Complete numeric sequence, or null if limits exceeded or interval unknown
 */
function generateExpectedNumbers(
	numbers: number[],
	maxFillPoints: number = DEFAULT_MAX_FILL_POINTS
): number[] | null {
	// Sort to find min/max and compute differences
	const sorted = [...numbers].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];

	// Infer interval using GCD approach
	const interval = inferNumericInterval(sorted);

	if (interval === null || interval <= 0) {
		return null;
	}

	// Safety check: would this exceed limits?
	const expectedCount = Math.ceil((max - min) / interval) + 1;
	const newPoints = expectedCount - numbers.length;

	if (newPoints > maxFillPoints) {
		return null;
	}

	// Generate the sequence
	return generateNumericSequence(min, max, interval);
}

/**
 * Infers the numeric interval using the GCD (Greatest Common Divisor) approach.
 * This finds the "base unit" that all intervals are multiples of.
 *
 * Example: [0, 10, 20, 35, 50] → diffs [10, 10, 15, 15] → GCD = 5
 *
 * Uses precision scaling (×10^8) to handle decimal intervals like 0.5
 */
export function inferNumericInterval(sortedNumbers: number[]): number | null {
	if (sortedNumbers.length < 2) {
		return null;
	}

	// Calculate differences between consecutive values
	const diffs: number[] = [];
	for (let i = 1; i < sortedNumbers.length; i++) {
		const diff = sortedNumbers[i] - sortedNumbers[i - 1];
		if (diff > 0) {
			diffs.push(diff);
		}
	}

	if (diffs.length === 0) {
		return null;
	}

	// Scale up for precision (handles decimals like 0.1, 0.5)
	const PRECISION_SCALE = 100000000;
	const scaledDiffs = diffs.map((d) => Math.round(d * PRECISION_SCALE));

	// Calculate GCD of all differences
	let result = scaledDiffs[0];
	for (let i = 1; i < scaledDiffs.length; i++) {
		result = gcd(result, scaledDiffs[i]);
		if (result === 1) {
			// GCD is 1 (scaled) - likely no common interval
			break;
		}
	}

	// Scale back down and round for floating point cleanup
	const interval = result / PRECISION_SCALE;
	return Math.round(interval * PRECISION_SCALE) / PRECISION_SCALE;
}

/**
 * Calculates the Greatest Common Divisor of two numbers using Euclidean algorithm
 */
function gcd(a: number, b: number): number {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b > 0) {
		const temp = b;
		b = a % b;
		a = temp;
	}
	return a;
}

/**
 * Generates a sequence of numbers from min to max with the given interval
 */
function generateNumericSequence(min: number, max: number, interval: number): number[] {
	const sequence: number[] = [];
	const PRECISION_SCALE = 100000000;

	let current = min;
	while (current <= max + interval / 2) {
		// Small tolerance for floating point
		// Round for floating point cleanup
		const rounded = Math.round(current * PRECISION_SCALE) / PRECISION_SCALE;
		sequence.push(rounded);
		current += interval;
	}

	return sequence;
}

// ============================================================================
// GRID BUILDING
// ============================================================================

interface BuildGridOptions {
	dataMap: Map<string, DataPoint>;
	expectedXValues: unknown[];
	seriesValues: unknown[];
	xColumn: string;
	yColumn: string;
	seriesColumn?: string;
	sizeColumn?: string;
	fillValue: null | 0;
}

/**
 * Builds the complete grid of (X × series) combinations.
 * Uses the dataMap for O(1) lookup of existing data points.
 * Creates new rows with fillValue for missing combinations.
 */
function buildCompleteGrid(options: BuildGridOptions): DataPoint[] {
	const {
		dataMap,
		expectedXValues,
		seriesValues,
		xColumn,
		yColumn,
		seriesColumn,
		sizeColumn,
		fillValue
	} = options;

	const result: DataPoint[] = [];

	for (const xValue of expectedXValues) {
		for (const seriesValue of seriesValues) {
			const key = createLookupKey(xValue, seriesValue);
			const existingRow = dataMap.get(key);

			if (existingRow) {
				// Use existing data point
				result.push(existingRow);
			} else {
				// Create filled row
				// Cast values - they originated from DataPoint so are valid types
				const filledRow: DataPoint = {
					[xColumn]: xValue as DataPoint[string],
					[yColumn]: fillValue
				};

				if (seriesColumn) {
					filledRow[seriesColumn] = seriesValue as DataPoint[string];
				}

				if (sizeColumn) {
					filledRow[sizeColumn] = fillValue;
				}

				result.push(filledRow);
			}
		}
	}

	return result;
}
