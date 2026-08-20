import chroma from 'chroma-js';
import type { DataPoint } from '../../types';
import { logger } from '../../../shims/logger';
import {
	createColorScale,
	getColorForValue,
	type ColorScaleResult
} from '../../common/color-scale-utils';

export interface ColorStylesResult {
	backgroundColor: string;
	color: string;
	borderBottomColor: string;
	topBorderColor: string;
}

export interface VizRange {
	min: number;
	max: number;
}

export interface ColorVizMeasure {
	color_options?: {
		scale_column?: string;
		conditional_colors?: string;
		color_scale?: string[];
		color_stops?: { value: number; color: string }[];
		min?: number;
		max?: number;
		midpoint?: number;
	};
}

/** Fallback gradient used when no theme scale is supplied. */
const FALLBACK_COLOR_SCALE = ['#dbeafe', '#1e40af'];

/**
 * Builds the color-viz scale for a column once (rather than per cell), honouring
 * `color_stops` (value→color breakpoints) and `min`/`max`/`midpoint`. Delegates to
 * the shared `createColorScale` so tables, maps, and any future surface stay in
 * lockstep on palette resolution, diverging behaviour, and breakpoints.
 *
 * `conditional_colors` is handled separately in `calculateColorStyles` (a per-row
 * SQL color, not a scale).
 */
export function buildColorVizScale(
	tableMeasure: ColorVizMeasure | undefined,
	range: { min: number; max: number },
	defaultColorScale?: string[]
): ColorScaleResult | null {
	if (!range) return null;

	const options = tableMeasure?.color_options;
	const effectiveMin =
		typeof options?.min === 'number' && isFinite(options.min) ? options.min : range.min;
	const effectiveMax =
		typeof options?.max === 'number' && isFinite(options.max) ? options.max : range.max;

	return createColorScale([], {
		colorPalette: options?.color_scale,
		colorStops: options?.color_stops,
		defaultColorScale: defaultColorScale ?? FALLBACK_COLOR_SCALE,
		context: 'Table',
		min: effectiveMin,
		max: effectiveMax,
		midpoint: options?.midpoint
	});
}

/**
 * Converts a hex color string into background/text/border styles.
 * Reusable for both cell-level and row-level conditional colors.
 */
export function calculateColorStylesFromHex(colorValue: string): ColorStylesResult | null {
	try {
		const bgColor = chroma(colorValue);
		const textColor =
			chroma.contrast(bgColor, '#000000') > chroma.contrast(bgColor, '#ffffff')
				? '#000000'
				: '#ffffff';
		const isCellDark = bgColor.luminance() < 0.5;
		const borderColor = isCellDark ? bgColor.brighten(0.5) : bgColor.darken(0.5);
		const topBorderColor = isCellDark ? 'rgb(75 85 99)' : 'rgb(156 163 175)';

		return {
			backgroundColor: bgColor.hex(),
			color: textColor,
			borderBottomColor: borderColor.hex(),
			topBorderColor
		};
	} catch {
		return null;
	}
}

export function calculateColorStyles(
	tableMeasure: ColorVizMeasure | undefined,
	col: string,
	row: Record<string, unknown>,
	range: { min: number; max: number },
	defaultColorScale?: string[],
	precomputedScale?: ColorScaleResult | null
): ColorStylesResult | null {
	if (!range) return null;

	// Check for conditional colors first — if configured, use them exclusively
	// (don't fall through to gradient scale when the expression returns null)
	const conditionalColorsColumn = tableMeasure?.color_options?.conditional_colors;
	if (conditionalColorsColumn && conditionalColorsColumn in row) {
		const colorValue = row[conditionalColorsColumn];
		if (colorValue && typeof colorValue === 'string') {
			return calculateColorStylesFromHex(colorValue);
		}
		return null;
	}

	// Use the range already calculated in parent
	const requestedScaleColumn = tableMeasure?.color_options?.scale_column;
	let scaleColumn = requestedScaleColumn || col;

	// Check if the requested scale column actually exists in the row
	if (requestedScaleColumn && !(requestedScaleColumn in row)) {
		logger.warn(
			`scale_column "${requestedScaleColumn}" not found in table data for column "${col}". ` +
				`This often happens when referencing raw columns in aggregated tables. ` +
				`Falling back to measure column "${col}". ` +
				`Available columns: ${Object.keys(row)
					.filter((k) => !k.startsWith('_'))
					.join(', ')}`
		);
		scaleColumn = col;
	}

	const scaleValue = Number(row[scaleColumn]);
	if (isNaN(scaleValue)) return null;

	// Shared with the map layers via `createColorScale`; normally built once per column
	// and passed in as `precomputedScale` (falls back to inline for direct callers/tests).
	const scaleResult =
		precomputedScale ?? buildColorVizScale(tableMeasure, range, defaultColorScale);
	if (!scaleResult) return null;

	// All-equal gradient columns anchor to the palette middle (prior behaviour); stops are exempt.
	let queryValue = scaleValue;
	if (scaleResult.kind !== 'stops') {
		const options = tableMeasure?.color_options;
		const effectiveMin =
			typeof options?.min === 'number' && isFinite(options.min) ? options.min : range.min;
		const effectiveMax =
			typeof options?.max === 'number' && isFinite(options.max) ? options.max : range.max;
		if (Math.abs(effectiveMax - effectiveMin) < 1e-10) {
			queryValue = (scaleResult.minValue + scaleResult.maxValue) / 2;
		}
	}

	return calculateColorStylesFromHex(getColorForValue(queryValue, scaleResult));
}

import type { ColumnMetaItem } from '../../common/pivot-utils';
import { BASE_AUTO_FORMATS } from '../../formatValue';

interface TableRow {
	render_type?: string;
	[key: string]: unknown;
}

interface VizRangesParams {
	columnMeta: ColumnMetaItem[];
	sortedRows: TableRow[];
	rawRows: DataPoint[];
}

interface FormatRangesParams {
	columnMeta: ColumnMetaItem[];
	sortedRows: TableRow[];
}

/**
 * Checks if a format code is an auto-scalable base format
 */
function isAutoScalableFormat(fmt: string | undefined): boolean {
	if (!fmt) return false;
	// Base auto formats are exactly 3 characters (e.g., 'usd', 'num', 'eur')
	return fmt.length === 3 && BASE_AUTO_FORMATS.includes(fmt as (typeof BASE_AUTO_FORMATS)[number]);
}

/**
 * Pre-calculates format ranges for columns with auto-scalable formats
 * This ensures consistent unit scaling (k, M, B) and decimal precision within a column
 */
export function calculateFormatRanges({
	columnMeta,
	sortedRows
}: FormatRangesParams): Map<string, VizRange> {
	const ranges = new Map<string, VizRange>();

	for (const colMeta of columnMeta) {
		// Only process columns with auto-scalable formats
		if (!isAutoScalableFormat(colMeta.fmt)) continue;

		// Calculate min/max for this column
		const { min, max } = sortedRows.reduce<{ min: number; max: number }>(
			(acc, row) => {
				// Skip total/subtotal rows for range calculation
				if (row.render_type === 'row_total' || row.render_type === 'row_subtotal') {
					return acc;
				}

				const value = row[colMeta.key];
				if (value !== null && value !== undefined) {
					const num = Number(value);
					if (!isNaN(num) && isFinite(num)) {
						acc.min = Math.min(acc.min, num);
						acc.max = Math.max(acc.max, num);
					}
				}

				return acc;
			},
			{ min: Infinity, max: -Infinity }
		);

		// Only add range if we found valid values
		if (min !== Infinity && max !== -Infinity) {
			ranges.set(colMeta.key, { min, max });
		}
	}

	return ranges;
}

/**
 * Pre-calculates visualization ranges for bar and color visualizations
 * Calculates once per column instead of per cell for efficiency
 */
export function calculateVizRanges({
	columnMeta,
	sortedRows,
	rawRows
}: VizRangesParams): Map<string, VizRange> {
	const ranges = new Map<string, VizRange>();
	const calculatedRanges = new Map<string, VizRange>();

	// Helper function to calculate range from post-pivoted data (individual scale)
	const calculateIndividualRange = (colMeta: ColumnMetaItem, scaleColumn: string): VizRange => {
		// Check if scale column exists in the data
		let effectiveScaleColumn = scaleColumn;
		if (sortedRows.length > 0 && !(scaleColumn in sortedRows[0])) {
			const requestedScaleColumn = colMeta.color_options?.scale_column;
			if (requestedScaleColumn) {
				logger.warn(
					`scale_column "${requestedScaleColumn}" not found in table data for column "${colMeta.key}". ` +
						`This often happens when referencing raw columns in aggregated tables. ` +
						`Falling back to measure column "${colMeta.key}".`
				);
			}
			effectiveScaleColumn = colMeta.key;
		}

		const { min, max } = sortedRows.reduce<{ min: number; max: number }>(
			(acc, row) => {
				// Include subtotals in range only if they're being visualized
				if (row.render_type === 'row_subtotal' && colMeta.viz_include_subtotals === false) {
					return acc;
				}
				// Always exclude grand totals from range calculation
				if (row.render_type === 'row_total') {
					return acc;
				}

				// Check values from the scale column
				const value = row[effectiveScaleColumn];
				if (value !== null && value !== undefined) {
					const num = Number(value);
					if (!isNaN(num) && isFinite(num)) {
						acc.min = Math.min(acc.min, num);
						acc.max = Math.max(acc.max, num);
					}
				}

				return acc;
			},
			{ min: Infinity, max: -Infinity }
		);

		return { min, max };
	};

	// Helper function to calculate range from pre-pivoted data (shared scale for pivoted measures)
	const calculateSharedRange = (baseMeasure: string): VizRange => {
		const result = rawRows.reduce<VizRange>(
			(acc, row) => {
				// Check values from the base measure column in raw data
				const value = row[baseMeasure];
				if (value !== null && value !== undefined) {
					const num = Number(value);
					if (!isNaN(num) && isFinite(num)) {
						acc.min = Math.min(acc.min, num);
						acc.max = Math.max(acc.max, num);
					}
				}

				return acc;
			},
			{ min: Infinity, max: -Infinity }
		);

		// Handle case where no valid numbers were found
		if (result.min === Infinity || result.max === -Infinity) {
			return { min: 0, max: 0 };
		}

		return result;
	};

	for (const colMeta of columnMeta) {
		// Only process columns that need range calculations
		if (colMeta.viz !== 'bar' && colMeta.viz !== 'color') continue;

		const scaleMode = colMeta.color_options?.scale_mode || 'individual';

		if (scaleMode === 'shared') {
			// For shared scaling, use pre-pivoted data and base measure
			const baseMeasure = colMeta.alias; // e.g., "sum(sales)" instead of "sum(sales)_2021"
			if (!baseMeasure) continue;

			const cacheKey = `${colMeta.viz}:shared:${baseMeasure}`;

			// Calculate range once per base measure
			if (!calculatedRanges.has(cacheKey)) {
				const range = calculateSharedRange(baseMeasure);
				calculatedRanges.set(cacheKey, range);
			}

			ranges.set(colMeta.key, calculatedRanges.get(cacheKey)!);
		} else {
			// For individual scaling, use post-pivoted data and specific scale column
			// Only use scale_column for color viz, bars always use the measure column itself
			const scaleColumn =
				colMeta.viz === 'color' && colMeta.color_options?.scale_column
					? colMeta.color_options.scale_column
					: colMeta.key;
			const cacheKey = `${colMeta.viz}:individual:${scaleColumn}`;

			// Calculate range once per scale column
			if (!calculatedRanges.has(cacheKey)) {
				const range = calculateIndividualRange(colMeta, scaleColumn);
				calculatedRanges.set(cacheKey, range);
			}

			ranges.set(colMeta.key, calculatedRanges.get(cacheKey)!);
		}
	}

	return ranges;
}
