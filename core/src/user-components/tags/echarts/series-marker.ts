/**
 * Marker shape types used for chart legends and tooltips.
 * This is the single source of truth for series type → marker shape mapping.
 */
export type MarkerShape = 'line' | 'circle' | 'square' | 'rounded-square';

/**
 * Line style types supported by ECharts.
 */
export type LineStyleType = 'solid' | 'dashed' | 'dotted';

/**
 * Determines the marker shape for a given ECharts series type.
 * Used by both CustomLegend and tooltip formatter to ensure consistency.
 *
 * @param seriesType - The ECharts series type (line, bar, scatter, area, etc.)
 * @returns The marker shape to display
 */
export function getMarkerShape(seriesType: string): MarkerShape {
	switch (seriesType) {
		case 'line':
		case 'area':
			return 'line';
		case 'scatter':
			return 'circle';
		case 'bar':
		case 'custom':
			return 'square';
		default:
			return 'rounded-square';
	}
}

/**
 * ECharts accepts a color as either a hex/rgba string or a gradient object.
 * Kept loose because the actual shapes come out of user-supplied echarts_options.
 */
export type SeriesColorValue =
	| string
	| { colorStops?: Array<{ color?: string; offset?: number }> }
	| undefined;

/**
 * Extract a single displayable color from any of ECharts' color value shapes.
 * Handles hex/rgba strings pass-through and picks the middle color stop from
 * gradient objects — used by legend swatches and tooltip markers which are too
 * small to render an actual gradient meaningfully.
 */
export function extractSwatchColor(raw: SeriesColorValue, fallback: string): string {
	if (typeof raw === 'string') return raw;
	if (raw && typeof raw === 'object' && Array.isArray(raw.colorStops)) {
		const stops = raw.colorStops;
		const mid = stops[Math.floor(stops.length / 2)];
		if (typeof mid?.color === 'string') return mid.color;
		const first = stops[0];
		if (typeof first?.color === 'string') return first.color;
	}
	return fallback;
}

/**
 * Resolve the color a series ACTUALLY renders with on the canvas, choosing the
 * right property based on series type. This differs from ECharts' own
 * `series.color` resolution when the author has overridden `lineStyle.color`
 * (for line/area) or `itemStyle.color` (for bar/scatter) via echarts_options
 * or echarts_series_options — those properties drive the rendered color but
 * are ignored by ECharts' internal color-resolution for the tooltip marker.
 */
export function getRenderedSeriesColor(
	series: {
		type?: string;
		color?: SeriesColorValue;
		lineStyle?: { color?: SeriesColorValue };
		itemStyle?: { color?: SeriesColorValue };
	},
	fallback: string
): string {
	const type = series.type || 'line';
	const raw =
		((type === 'line' || type === 'area') && series.lineStyle?.color) ||
		series.color ||
		series.itemStyle?.color;
	return extractSwatchColor(raw, fallback);
}

/**
 * Options for marker generation
 */
export interface MarkerOptions {
	/** The ECharts series type (line, bar, scatter, area, etc.) */
	seriesType: string;
	/** Color for the marker */
	color: string;
	/** Line style type for line/area charts */
	lineStyle?: LineStyleType;
}

/**
 * Generates a tooltip marker HTML that matches the series type shape.
 * Uses getMarkerShape internally for consistency with CustomLegend.
 *
 * @param seriesType - The ECharts series type (line, bar, scatter, area, etc.)
 * @param echartsMarker - The original ECharts marker HTML string (used to extract color if colorOverride is not provided)
 * @param lineStyle - Optional line style type (solid, dashed, dotted) for line/area charts
 * @param colorOverride - Optional explicit color that overrides the one embedded in echartsMarker. Use when the caller has already resolved the true rendered color (e.g. via getRenderedSeriesColor) and doesn't want the ECharts-provided series.color used in the marker HTML.
 * @returns HTML string for the marker
 */
export function getSeriesTypeMarker(
	seriesType: string,
	echartsMarker: string,
	lineStyle?: LineStyleType,
	colorOverride?: string
): string {
	let color: string;
	if (colorOverride) {
		color = colorOverride;
	} else {
		// Fall back to extracting from the ECharts-provided marker HTML.
		// ECharts marker format: <span style="...background-color:rgba(...)..."></span>
		const colorMatch = echartsMarker.match(/background-color:([^;"]+)/);
		color = colorMatch?.[1] || '#000';
	}

	const shape = getMarkerShape(seriesType);

	// All markers use a consistent 14px wide container for text alignment
	const containerStyle =
		'display:inline-flex;align-items:center;justify-content:center;margin-right:4px;width:14px;height:10px;vertical-align:middle;';

	switch (shape) {
		case 'line':
			return getLineMarkerHtml(color, lineStyle);
		case 'circle':
			return `<span style="${containerStyle}"><span style="border-radius:50%;width:10px;height:10px;background-color:${color};"></span></span>`;
		case 'square':
			return `<span style="${containerStyle}"><span style="width:10px;height:10px;background-color:${color};"></span></span>`;
		case 'rounded-square':
			return `<span style="${containerStyle}"><span style="border-radius:2px;width:10px;height:10px;background-color:${color};"></span></span>`;
	}
}

/**
 * Generates HTML for a line marker with optional dashed/dotted styling.
 */
function getLineMarkerHtml(color: string, lineStyle?: LineStyleType): string {
	if (lineStyle === 'dashed') {
		// Dashed line using border
		return `<span style="display:inline-block;margin-right:4px;width:14px;height:0;border-bottom:2.5px dashed ${color};vertical-align:middle;"></span>`;
	} else if (lineStyle === 'dotted') {
		// Dotted line using border
		return `<span style="display:inline-block;margin-right:4px;width:14px;height:0;border-bottom:2.5px dotted ${color};vertical-align:middle;"></span>`;
	}
	// Solid line (default)
	return `<span style="display:inline-block;margin-right:4px;width:14px;height:2.5px;background:${color};vertical-align:middle;"></span>`;
}

/**
 * Gets CSS classes for line marker styling in Tailwind/Svelte contexts.
 * Returns the appropriate classes for dashed/dotted/solid line markers.
 */
export function getLineMarkerClasses(lineStyle?: LineStyleType): {
	useBorder: boolean;
	borderStyle?: string;
} {
	if (lineStyle === 'dashed' || lineStyle === 'dotted') {
		return { useBorder: true, borderStyle: lineStyle };
	}
	return { useBorder: false };
}
