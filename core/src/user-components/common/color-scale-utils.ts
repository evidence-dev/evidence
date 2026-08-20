import chroma from 'chroma-js';
import { logger } from '../../shims/logger';

function isValidColor(color: string): boolean {
	try {
		chroma(color);
		return true;
	} catch {
		return false;
	}
}

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
	 * Only takes effect when the palette has 3 or more colors. When the data
	 * straddles the midpoint, the full palette is used with its middle color
	 * pinned to `midpoint`. When the data sits entirely on one side of the
	 * midpoint (e.g. all-positive values with `midpoint: 0`), only the relevant
	 * half of the palette is used and the neutral color stays anchored at the
	 * midpoint — so a barely-positive value reads as near-neutral rather than the
	 * low-end color.
	 */
	midpoint?: number;

	/**
	 * Explicit value→color anchors ("breakpoints") that pin specific colors to
	 * specific data values, still interpolating between them. Values beyond the
	 * outermost stops clamp to the end colors.
	 *
	 * When two or more valid stops are provided they take precedence over
	 * `colorPalette`, `min`/`max`, and `midpoint` — the caller has fully described
	 * the scale. Stops are sorted by value; ties collapse to the first-seen color.
	 */
	colorStops?: { value: number; color: string }[];
}

export interface ColorScaleResult {
	/**
	 * The chroma.js scale function
	 */
	scale: chroma.Scale;

	/**
	 * How the scale was built:
	 * - `linear`: a plain gradient over `[minValue, maxValue]`.
	 * - `diverging`: a `midpoint`-anchored scale (full palette or one-sided half).
	 * - `stops`: explicit value→color anchors (`colorStops`).
	 */
	kind: 'linear' | 'diverging' | 'stops';

	/**
	 * The actual color palette being used (for display in legends). May be a
	 * subset of the requested palette for one-sided diverging scales, or the stop
	 * colors when `colorStops` are used.
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
	 * The full domain passed to chroma, one entry per palette color. For linear
	 * scales this is `[minValue, maxValue]`; for diverging scales it contains
	 * intermediate stops so the midpoint lands at the correct color; for `stops`
	 * scales it is the (sorted) breakpoint values.
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
 * This is the canonical color scale creator used across area_layer, point_layer,
 * and the table `viz="color"` measure. It supports three shapes (see
 * `ColorScaleResult['kind']`): a plain linear gradient, a `midpoint`-anchored
 * diverging scale, and explicit `colorStops` (value→color breakpoints).
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
		midpoint,
		colorStops
	} = options;

	// Explicit stops take precedence over palette/min/max/midpoint.
	const stops = normalizeColorStops(colorStops);
	if (stops) {
		const stopColors = stops.map((s) => s.color);
		const stopValues = stops.map((s) => s.value);
		const scale = chroma.scale(stopColors).domain(stopValues).mode(mode);
		return {
			scale,
			kind: 'stops',
			colorPalette: stopColors,
			minValue: stopValues[0],
			maxValue: stopValues[stopValues.length - 1],
			domain: stopValues,
			midpoint: null
		};
	}

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

	if (hasMidpoint && !supportsMidpoint) {
		logger.warn(
			`[${context}] midpoint requires a color palette with 3 or more colors; ignoring midpoint`
		);
	}

	// One-sided diverging data uses only half the palette, so `colorPalette` may be a subset.
	let scalePalette = finalColorPalette;
	let domain: number[] = [minValue, maxValue];
	let finalMidpoint: number | null = null;
	let kind: ColorScaleResult['kind'] = 'linear';

	if (supportsMidpoint) {
		const diverging = buildDivergingScale(
			minValue,
			maxValue,
			midpoint as number,
			finalColorPalette
		);
		if (diverging) {
			scalePalette = diverging.palette;
			domain = diverging.domain;
			finalMidpoint = diverging.midpoint;
			kind = 'diverging';
		}
	}

	const scale = chroma.scale(scalePalette).domain(domain).mode(mode);

	logger.debug(
		{
			minValue,
			maxValue,
			midpoint: finalMidpoint,
			domain,
			colorPalette: scalePalette,
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
		kind,
		colorPalette: scalePalette,
		minValue,
		maxValue,
		domain,
		midpoint: finalMidpoint
	};
}

/**
 * Validate + normalize explicit color stops for use as a chroma domain.
 * Drops entries with a non-finite value or an unparseable color, sorts by value,
 * and collapses ties (chroma requires a strictly increasing domain) keeping the
 * first color seen at each value. Returns `null` when fewer than two usable stops
 * remain, so the caller falls back to the palette-based scale.
 */
function normalizeColorStops(
	stops: { value: number; color: string }[] | undefined
): { value: number; color: string }[] | null {
	if (!Array.isArray(stops) || stops.length < 2) return null;

	const valid = stops.filter(
		(s): s is { value: number; color: string } =>
			s != null &&
			typeof s.value === 'number' &&
			isFinite(s.value) &&
			typeof s.color === 'string' &&
			isValidColor(s.color)
	);
	if (valid.length < 2) return null;

	const sorted = [...valid].sort((a, b) => a.value - b.value);
	const deduped: { value: number; color: string }[] = [];
	for (const stop of sorted) {
		if (deduped.length === 0 || stop.value > deduped[deduped.length - 1].value) {
			deduped.push(stop);
		}
	}

	return deduped.length >= 2 ? deduped : null;
}

interface DivergingScale {
	/** Palette actually used — a subset of the input when the data is one-sided. */
	palette: string[];
	/** Domain passed to `chroma.scale().domain()`, one entry per palette color. */
	domain: number[];
	/** Reported midpoint (only when the data straddles it; `null` otherwise). */
	midpoint: number | null;
}

function isStrictlyIncreasing(arr: number[]): boolean {
	for (let i = 1; i < arr.length; i++) {
		if (!(arr[i] > arr[i - 1])) return false;
	}
	return true;
}

/**
 * Build the palette + domain for a diverging color scale anchored at `mid`
 * (3+ colors only). The non-obvious case is one-sided data: when every value is on
 * one side of `mid`, only the relevant half of the palette is used with the neutral
 * anchored at `mid`, so the midpoint stays meaningful even outside the data range.
 * Returns `null` (→ caller uses a linear scale) if no strictly-increasing domain
 * can be built.
 */
function buildDivergingScale(
	min: number,
	max: number,
	mid: number,
	palette: string[]
): DivergingScale | null {
	const n = palette.length;
	// The "logical middle" of an N-color palette sits at index (N-1)/2.
	const midIdx = (n - 1) / 2;

	// Data straddles the midpoint: full palette, middle color pinned at `mid`.
	if (mid > min && mid < max) {
		const domain = new Array<number>(n);
		for (let i = 0; i < n; i++) {
			if (i < midIdx) {
				domain[i] = min + (i / midIdx) * (mid - min);
			} else if (i > midIdx) {
				domain[i] = mid + ((i - midIdx) / (n - 1 - midIdx)) * (max - mid);
			} else {
				domain[i] = mid;
			}
		}
		return isStrictlyIncreasing(domain) ? { palette, domain, midpoint: mid } : null;
	}

	// One-sided, data all >= mid: use the neutral→high half of the palette.
	if (mid <= min) {
		const sub = palette.slice(Math.floor(midIdx)); // includes the middle color
		if (sub.length < 2) return null;
		const domain = sub.map((_, i) => mid + (i / (sub.length - 1)) * (max - mid));
		return isStrictlyIncreasing(domain) ? { palette: sub, domain, midpoint: null } : null;
	}

	// One-sided, data all <= mid: use the low→neutral half of the palette.
	const sub = palette.slice(0, Math.ceil(midIdx) + 1); // includes the middle color
	if (sub.length < 2) return null;
	const domain = sub.map((_, i) => min + (i / (sub.length - 1)) * (mid - min));
	return isStrictlyIncreasing(domain) ? { palette: sub, domain, midpoint: null } : null;
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
