import chroma from 'chroma-js';
import type { DataPoint } from '../../types';
import { logger } from '../../../shims/logger';

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

function isValidColor(color: string): boolean {
	try {
		chroma(color);
		return true;
	} catch {
		return false;
	}
}

export interface ColorVizMeasure {
	color_options?: {
		scale_column?: string;
		conditional_colors?: string;
		color_scale?: string[];
		color_stops?: { value: number; color: string }[];
	};
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
	defaultColorScale?: string[]
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

	// Pinned color stops: anchor explicit values to explicit colors, independent of the
	// column's data range. chroma clamps values outside the stop range to the end colors.
	const colorStops = tableMeasure?.color_options?.color_stops;
	if (colorStops && Array.isArray(colorStops) && colorStops.length >= 2) {
		const validStops = colorStops
			.filter(
				(stop): stop is { value: number; color: string } =>
					stop != null &&
					typeof stop.value === 'number' &&
					isFinite(stop.value) &&
					typeof stop.color === 'string' &&
					isValidColor(stop.color)
			)
			// Sort by value so chroma's domain is monotonic regardless of authoring order.
			.sort((a, b) => a.value - b.value);

		if (validStops.length >= 2) {
			if (isNaN(scaleValue)) return null;
			try {
				const scale = chroma
					.scale(validStops.map((stop) => stop.color))
					.domain(validStops.map((stop) => stop.value))
					.mode('lch');
				return calculateColorStylesFromHex(scale(scaleValue).hex());
			} catch (_error) {
				return null;
			}
		}

		logger.warn(
			`color_stops for column "${col}" needs at least 2 valid { value, color } entries; ` +
				`falling back to the data-range gradient.`
		);
	}

	// Default behaviour: spread the palette across the column's data range.
	// Resolve the colour palette: a custom color_scale if valid, otherwise the
	// (already background-adjusted) theme scale.
	const customColorScale = tableMeasure?.color_options?.color_scale;
	let colors = defaultColorScale ?? ['#dbeafe', '#1e40af'];

	if (customColorScale && Array.isArray(customColorScale) && customColorScale.length >= 1) {
		const validColors = customColorScale.filter(isValidColor);

		if (validColors.length >= 2) {
			// Multiple colors provided - use them directly
			colors = validColors;
		} else if (validColors.length === 1) {
			// Single color provided - create a scale from background to that color
			// Use first color from defaultColorScale (which is the background)
			const bg = colors[0] ?? '#ffffff';
			colors = [bg, validColors[0]];
		} else {
			logger.warn(`Invalid color_scale for column ${col}, using defaults`);
		}
	}

	const { min, max } = range;
	const rangeSize = max - min;
	const percent = rangeSize < 1e-10 ? 0.5 : (scaleValue - min) / rangeSize;

	try {
		const scale = chroma.scale(colors).mode('lch');
		return calculateColorStylesFromHex(scale(percent).hex());
	} catch (_error) {
		return null;
	}
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
