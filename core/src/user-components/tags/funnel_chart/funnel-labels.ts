import chroma from 'chroma-js';

export const FUNNEL_NAME_FONT_SIZE = 12;
export const FUNNEL_VALUE_FONT_SIZE = 11;
export const FUNNEL_LABEL_INSIDE_PADDING = 12;
// A one-line label ("{name}  {value}") is all cap-height with no descenders, so
// ECharts' em-box centering leaves the ink sitting ~1px above the segment's
// middle. A small top pad nudges it down to optically center. Two-line labels
// already balance out, so they get no nudge.
export const FUNNEL_LABEL_SINGLE_LINE_TOP_NUDGE = 2;

/**
 * Percent of the first funnel stage with trailing ".0" trimmed, so a full
 * bar reads "100%" instead of "100.0%" next to "62%".
 */
export function formatPercentOfFirst(value: number, firstValue: number): string {
	const pct = (value / firstValue) * 100;
	if (!Number.isFinite(pct)) return '';
	return `${Math.round(pct * 10) / 10}%`;
}

/** Black or white, whichever has more contrast against the segment fill. */
export function pickLabelTextColor(background: string): '#000000' | '#ffffff' {
	try {
		return chroma.contrast(background, '#000000') > chroma.contrast(background, '#ffffff')
			? '#000000'
			: '#ffffff';
	} catch {
		return '#000000';
	}
}

/**
 * ECharts rich-text treats "}" as the closing delimiter of a {style|...}
 * block and "\n" as a line break, so either in interpolated user data
 * (stage names, formatted values) would garble the label template.
 */
export function sanitizeRichText(text: string): string {
	return text.replace(/[\r\n]+/g, ' ').replace(/}/g, '');
}

// Shared mutable singleton: every chart on the page measures through this one
// context, and `font` persists between calls. Safe only because each measure
// sets `font` synchronously before reading — don't call this from async code.
let measureContext: CanvasRenderingContext2D | null | undefined;

/** Measure rendered text width; falls back to a per-character estimate during SSR. */
export function measureTextWidth(text: string, font: string): number {
	if (measureContext === undefined) {
		measureContext =
			typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
	}
	if (!measureContext) {
		const fontSize = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 12);
		return text.length * fontSize * 0.6;
	}
	measureContext.font = font;
	return measureContext.measureText(text).width;
}

/** Resolve an ECharts funnel min/max size ("25%" or px) to pixels of the series width. */
export function parseFunnelSize(
	size: string | number | undefined,
	seriesWidthPx: number,
	fallbackFraction: number
): number {
	if (size == null) return seriesWidthPx * fallbackFraction;
	if (typeof size === 'number') return size;
	const trimmed = size.trim();
	const numeric = Number(trimmed.endsWith('%') ? trimmed.slice(0, -1) : trimmed);
	if (Number.isNaN(numeric)) return seriesWidthPx * fallbackFraction;
	return trimmed.endsWith('%') ? (numeric / 100) * seriesWidthPx : numeric;
}

/**
 * Width in px ECharts will give a segment: values map linearly from
 * [0, maxValue] onto [minSize, maxSize] of the series width.
 */
export function estimateSegmentWidthPx(opts: {
	value: number;
	maxValue: number;
	seriesWidthPx: number;
	minSize?: string | number;
	maxSize?: string | number;
}): number {
	const minPx = parseFunnelSize(opts.minSize, opts.seriesWidthPx, 0);
	const maxPx = parseFunnelSize(opts.maxSize, opts.seriesWidthPx, 1);
	if (opts.maxValue <= 0) return maxPx;
	const fraction = Math.max(0, Math.min(1, opts.value / opts.maxValue));
	return minPx + fraction * (maxPx - minPx);
}

export type FunnelLabelPlacement = {
	inside: boolean;
	position: 'inside' | 'insideLeft' | 'insideRight' | 'left' | 'right';
};

/**
 * Rendered width of a stage label. When the segment is too short for two lines
 * the name and value share one line ("{name}  {value}"), so their widths add up
 * — measuring the max would undersize the outside rail and clip the label.
 */
export function measureFunnelLabelWidth(
	nameText: string,
	valueText: string,
	fontFamily: string,
	singleLine = false
): number {
	const nameFont = `600 ${FUNNEL_NAME_FONT_SIZE}px ${fontFamily}`;
	const nameWidth = nameText ? measureTextWidth(nameText, nameFont) : 0;
	const valueWidth = measureTextWidth(valueText, `${FUNNEL_VALUE_FONT_SIZE}px ${fontFamily}`);
	if (singleLine && nameWidth > 0) {
		return nameWidth + measureTextWidth('  ', nameFont) + valueWidth;
	}
	return Math.max(nameWidth, valueWidth);
}

/**
 * Put the label inside its segment when it fits, otherwise in the whitespace
 * beside it (which grows exactly as the segment shrinks) — to the right for
 * left/center-aligned funnels, to the left for right-aligned ones.
 */
export function resolveAutoLabelPlacement(opts: {
	nameText: string;
	valueText: string;
	segmentWidthPx: number;
	align: 'left' | 'center' | 'right';
	fontFamily: string;
	singleLine?: boolean;
}): FunnelLabelPlacement {
	const labelWidth = measureFunnelLabelWidth(
		opts.nameText,
		opts.valueText,
		opts.fontFamily,
		opts.singleLine
	);

	if (labelWidth + 2 * FUNNEL_LABEL_INSIDE_PADDING <= opts.segmentWidthPx) {
		return {
			inside: true,
			position:
				opts.align === 'left' ? 'insideLeft' : opts.align === 'right' ? 'insideRight' : 'inside'
		};
	}
	return { inside: false, position: opts.align === 'right' ? 'left' : 'right' };
}
