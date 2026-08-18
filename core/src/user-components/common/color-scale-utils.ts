import chroma from 'chroma-js';
import { logger } from '../../shims/logger';

export interface ColorScaleOptions {
	/**
	 * Custom color palette to use for the scale.
	 * If not provided, uses defaultColorScale.
	 */
	colorPalette?: string[];

	/**
	 * Default color scale to use if colorPalette is not provided.
	 * Typically the theme's background-adjusted color scale.
	 */
	defaultColorScale: string[];

	/**
	 * Color mode for chroma.js interpolation.
	 * @default 'lch'
	 */
	mode?: 'lch' | 'lab' | 'rgb' | 'hsl';

	/**
	 * Context for logging (e.g., 'AreaLayer', 'PointLayer', 'Table')
	 */
	context?: string;

	/**
	 * Override the lower bound of the color scale domain.
	 * Values below `min` clamp to the lowest color in the palette.
	 * Defaults to the minimum of the provided values.
	 */
	min?: number;

	/**
	 * Override the upper bound of the color scale domain.
	 * Values above `max` clamp to the highest color in the palette.
	 * Defaults to the maximum of the provided values.
	 */
	max?: number;

	/**
	 * Anchor a specific value (typically 0) at the middle color of the
	 * palette to create a diverging scale.
	 *
	 * Only takes effect when the palette has 3 or more colors. With an even
	 * number of colors, the midpoint sits between the two middle colors.
	 * Outside that case the option is ignored and the scale is linear from
	 * `min` to `max`.
	 */
	midpoint?: number;
}

export interface ColorScaleResult {
	/**
	 * The chroma.js scale function
	 */
	scale: chroma.Scale;

	/**
	 * The actual color palette being used (for display in legends)
	 */
	colorPalette: string[];

	/**
	 * Min value of the scale's domain (after applying any `min` override).
	 */
	minValue: number;

	/**
	 * Max value of the scale's domain (after applying any `max` override).
	 */
	maxValue: number;

	/**
	 * The full domain passed to chroma. For non-diverging scales this is
	 * `[minValue, maxValue]`. For diverging scales (with an explicit
	 * midpoint) this contains intermediate stops so the midpoint lands at
	 * the correct color.
	 */
	domain: number[];

	/**
	 * Midpoint value (when supplied and a diverging scale was constructed).
	 * `null` when no diverging midpoint was applied.
	 */
	midpoint: number | null;
}

/**
 * Creates a color scale from values and color palette options.
 * This is the canonical color scale creator used across:
 * - area_layer
 * - point_layer
 *
 * TODO: Migrate table (measure color visualization) to use this utility
 * (currently uses similar logic in table-viz.ts)
 *
 * @param values - Array of numeric values to scale
 * @param options - Color scale configuration
 * @returns ColorScaleResult with scale function and metadata
 */
export function createColorScale(
	values: number[],
	options: ColorScaleOptions
): ColorScaleResult | null {
	const {
		colorPalette,
		defaultColorScale,
		mode = 'lch',
		context = 'ColorScale',
		min: minOverride,
		max: maxOverride,
		midpoint
	} = options;

	const validValues = values.filter((v) => !isNaN(v) && isFinite(v));

	const hasMinOverride = typeof minOverride === 'number' && isFinite(minOverride);
	const hasMaxOverride = typeof maxOverride === 'number' && isFinite(maxOverride);

	if (validValues.length === 0 && !(hasMinOverride && hasMaxOverride)) {
		logger.warn(`[${context}] No valid values provided for color scale`);
		return null;
	}

	let minValue = hasMinOverride ? minOverride : Math.min(...validValues);
	let maxValue = hasMaxOverride ? maxOverride : Math.max(...validValues);

	// Guard against an inverted domain (min >= max) which chroma can't handle
	// gracefully. Fall back to a degenerate single-point domain by widening
	// max by a small epsilon so chroma still returns a valid scale function.
	if (!(minValue < maxValue)) {
		if (minValue === maxValue) {
			maxValue = minValue + 1;
		} else {
			// User-supplied min > max — swap to keep the scale usable.
			logger.warn(
				`[${context}] min (${minValue}) is greater than max (${maxValue}); swapping bounds`
			);
			[minValue, maxValue] = [maxValue, minValue];
		}
	}

	// Determine which color palette to use
	let finalColorPalette: string[];

	if (colorPalette && colorPalette.length > 0) {
		const validColors = colorPalette.filter((color) => {
			try {
				chroma(color);
				return true;
			} catch {
				logger.warn(`[${context}] Invalid color in palette: ${color}`);
				return false;
			}
		});

		if (validColors.length >= 2) {
			finalColorPalette = validColors;
		} else if (validColors.length === 1) {
			const bg = defaultColorScale[0] ?? '#ffffff';
			finalColorPalette = [bg, validColors[0]];
			logger.debug(
				`[${context}] Single color provided, creating scale from background: ${bg} -> ${validColors[0]}`
			);
		} else {
			logger.warn(`[${context}] No valid colors in palette, using default color scale`);
			finalColorPalette = defaultColorScale;
		}
	} else {
		finalColorPalette = defaultColorScale;
	}

	const hasMidpoint = typeof midpoint === 'number' && isFinite(midpoint);
	const supportsMidpoint = hasMidpoint && finalColorPalette.length >= 3;
	const appliedMidpoint = supportsMidpoint ? (midpoint as number) : null;

	if (hasMidpoint && !supportsMidpoint) {
		logger.warn(
			`[${context}] midpoint requires a color palette with 3 or more colors; ignoring midpoint`
		);
	}

	const domain = buildDomain(minValue, maxValue, appliedMidpoint, finalColorPalette.length);

	// `buildDomain` returns a 2-element `[min, max]` array when it can't
	// honour the requested midpoint (palette too small, midpoint at a
	// boundary, or any non-monotonic intermediate). In that case the scale
	// is effectively linear, so clear the reported midpoint so callers
	// (legend, models) don't draw a tick implying a diverging scale.
	const finalMidpoint = appliedMidpoint !== null && domain.length > 2 ? appliedMidpoint : null;

	const scale = chroma.scale(finalColorPalette).domain(domain).mode(mode);

	logger.debug(
		{
			minValue,
			maxValue,
			midpoint: finalMidpoint,
			domain,
			colorPalette: finalColorPalette,
			usingCustomPalette: !!colorPalette,
			testColors: {
				min: scale(minValue).hex(),
				mid: scale((minValue + maxValue) / 2).hex(),
				max: scale(maxValue).hex()
			}
		},
		`[${context}] Color scale created`
	);

	return {
		scale,
		colorPalette: finalColorPalette,
		minValue,
		maxValue,
		domain,
		midpoint: finalMidpoint
	};
}

/**
 * Build the domain array passed to `chroma.scale().domain()`.
 *
 * - With no midpoint, the domain is `[min, max]` and chroma evenly
 *   distributes the palette across the range.
 * - With a midpoint and a 3+ color palette, the domain has one entry per
 *   color so the middle color (or the gap between the two middle colors,
 *   for an even-sized palette) lands exactly at `midpoint`. The remaining
 *   colors are evenly distributed between `[min, midpoint]` and
 *   `[midpoint, max]`.
 */
function buildDomain(
	min: number,
	max: number,
	midpoint: number | null,
	colorCount: number
): number[] {
	if (midpoint === null || colorCount < 3) {
		return [min, max];
	}

	// Clamp midpoint inside the domain so chroma receives a monotonic array.
	const clampedMid = Math.min(Math.max(midpoint, min), max);

	// The "logical middle" of an N-color palette sits at index (N-1)/2.
	const midIdx = (colorCount - 1) / 2;

	const domain: number[] = new Array(colorCount);
	for (let i = 0; i < colorCount; i++) {
		if (i < midIdx) {
			const t = i / midIdx; // 0..1 across the lower half
			domain[i] = min + t * (clampedMid - min);
		} else if (i > midIdx) {
			const t = (i - midIdx) / (colorCount - 1 - midIdx); // 0..1 across the upper half
			domain[i] = clampedMid + t * (max - clampedMid);
		} else {
			domain[i] = clampedMid;
		}
	}

	// Chroma requires a strictly increasing domain. If midpoint equals min or
	// max the formula above produces duplicates — collapse to a simple range.
	for (let i = 1; i < domain.length; i++) {
		if (!(domain[i] > domain[i - 1])) {
			return [min, max];
		}
	}

	return domain;
}

/**
 * Gets a color for a specific value using a color scale.
 *
 * @param value - The value to get a color for
 * @param scaleResult - The result from createColorScale
 * @returns Hex color string
 */
export function getColorForValue(value: number, scaleResult: ColorScaleResult): string {
	if (!isFinite(value) || isNaN(value)) {
		// Return first color for invalid values
		return scaleResult.colorPalette[0];
	}

	return scaleResult.scale(value).hex();
}

/**
 * Pre-computes colors for all features in a dataset.
 * Useful for map layers where we want to store colors in feature properties.
 *
 * @param data - Array of data rows
 * @param valueColumn - Column name containing the values to color
 * @param options - Color scale configuration
 * @returns Map of index -> hex color, plus the ColorScaleResult
 */
export function precomputeColors<T extends Record<string, unknown>>(
	data: T[],
	valueColumn: string,
	options: ColorScaleOptions
): { colors: Map<number, string>; scaleResult: ColorScaleResult } | null {
	// Extract values
	const values = data
		.map((row) => Number(row[valueColumn]))
		.filter((v) => !isNaN(v) && isFinite(v));

	// Create scale
	const scaleResult = createColorScale(values, options);
	if (!scaleResult) {
		return null;
	}

	// Pre-compute colors for each row
	const colors = new Map<number, string>();
	data.forEach((row, idx) => {
		const value = Number(row[valueColumn]);
		colors.set(idx, getColorForValue(value, scaleResult));
	});

	return { colors, scaleResult };
}

// ============================================================================
// Categorical Color Assignment
// ============================================================================

export interface CategoricalColorOptions {
	/**
	 * Custom color palette to use for categories.
	 * If not provided, uses defaultColorPalette.
	 */
	colorPalette?: string[];

	/**
	 * Default color palette to use if colorPalette is not provided.
	 * Typically the theme's chart color palette.
	 */
	defaultColorPalette: string[];

	/**
	 * Context for logging (e.g., 'PointLayer', 'PieChart')
	 */
	context?: string;
}

export interface CategoricalColorResult {
	/**
	 * Map from category value to assigned color
	 */
	categoryColors: Map<string, string>;

	/**
	 * Ordered list of unique categories (in order they appear in data)
	 */
	categories: string[];

	/**
	 * The color palette being used (for display in legends)
	 */
	colorPalette: string[];
}

/**
 * Creates a categorical color map that assigns colors to categories.
 * This is used for charts and maps when color_value is a string/categorical column.
 *
 * The function:
 * - Assigns colors from the palette to categories in order
 * - Cycles through the palette if there are more categories than colors
 * - Filters out null/undefined values
 *
 * Used across:
 * - point_layer for categorical coloring
 * - pie_chart, polar_chart for category colors
 * - histogram for series colors
 *
 * @param categories - Array of category values (strings) from the data
 * @param options - Categorical color configuration
 * @returns CategoricalColorResult with category->color mapping and metadata
 *
 * @example
 * ```ts
 * const data = [
 *   { type: 'hotel' },
 *   { type: 'restaurant' },
 *   { type: 'bar' },
 *   { type: 'hotel' }
 * ];
 * const categories = data.map(d => String(d.type));
 * const result = createCategoricalColorMap(categories, {
 *   defaultColorPalette: ['#154886', '#45a1bf', '#a5cdee']
 * });
 * // result.categoryColors.get('hotel') => '#154886'
 * // result.categoryColors.get('restaurant') => '#45a1bf'
 * // result.categoryColors.get('bar') => '#a5cdee'
 * ```
 */
export function createCategoricalColorMap(
	categories: (string | number | null | undefined)[],
	options: CategoricalColorOptions
): CategoricalColorResult | null {
	const { colorPalette, defaultColorPalette, context = 'CategoricalColors' } = options;

	// Filter out null/undefined and convert to strings, keeping first occurrence order
	const seen = new Set<string>();
	const uniqueCategories: string[] = [];

	for (const cat of categories) {
		if (cat === null || cat === undefined) continue;
		const catStr = String(cat);
		if (!seen.has(catStr)) {
			seen.add(catStr);
			uniqueCategories.push(catStr);
		}
	}

	if (uniqueCategories.length === 0) {
		logger.warn(`[${context}] No valid categories provided for color mapping`);
		return null;
	}

	// Determine which color palette to use
	let finalColorPalette: string[];

	if (colorPalette && colorPalette.length > 0) {
		// Validate custom colors
		const validColors = colorPalette.filter((color) => {
			try {
				chroma(color);
				return true;
			} catch {
				logger.warn(`[${context}] Invalid color in palette: ${color}`);
				return false;
			}
		});

		if (validColors.length >= 1) {
			finalColorPalette = validColors;
		} else {
			// No valid colors - fall back to default
			logger.warn(`[${context}] No valid colors in palette, using default color palette`);
			finalColorPalette = defaultColorPalette;
		}
	} else {
		// No custom palette - use default
		finalColorPalette = defaultColorPalette;
	}

	// Assign colors to categories (cycle through palette if needed)
	const categoryColors = new Map<string, string>();
	uniqueCategories.forEach((category, index) => {
		const colorIndex = index % finalColorPalette.length;
		categoryColors.set(category, finalColorPalette[colorIndex]);
	});

	logger.debug(
		{
			categoryCount: uniqueCategories.length,
			paletteSize: finalColorPalette.length,
			willCycle: uniqueCategories.length > finalColorPalette.length,
			categories: uniqueCategories,
			usingCustomPalette: !!colorPalette,
			sampleMappings: Array.from(categoryColors.entries()).slice(0, 5)
		},
		`[${context}] Categorical color map created`
	);

	return {
		categoryColors,
		categories: uniqueCategories,
		colorPalette: finalColorPalette
	};
}

/**
 * Gets the color assigned to a specific category.
 *
 * @param category - The category value to get a color for
 * @param result - The result from createCategoricalColorMap
 * @param fallbackColor - Color to use if category not found (defaults to first palette color)
 * @returns Hex color string
 */
export function getColorForCategory(
	category: string | number | null | undefined,
	result: CategoricalColorResult,
	fallbackColor?: string
): string {
	if (category === null || category === undefined) {
		return fallbackColor ?? result.colorPalette[0];
	}

	const catStr = String(category);
	const color = result.categoryColors.get(catStr);

	if (color) {
		return color;
	}

	// Category not in map - return fallback or first color
	return fallbackColor ?? result.colorPalette[0];
}
