import chroma from 'chroma-js';
import { logger } from '../logger';
import type { Theme } from '../../types/theme';
import { DEFAULT_THEME } from '../../constants/default-theme';
import { buildThemes } from '../../theme/build-themes';
import { resolveTableColors } from '../../theme/theme-css-helper';

/** Always the light theme (a sheet is a white page); translucent colors are pre-blended. */
export interface ExcelPalette {
	background: string;
	mutedForeground: string;
	/** `bg-muted`: shaded rows. */
	rowShading: string;
	/** `bg-muted/50`: shaded rows in collapsible tables. */
	rowShadingCollapsible: string;
	/** `--theme-table-row-border`: row lines. */
	rowBorder: string;
	/** `border-foreground/40`: header underline and the line above totals. */
	emphasisBorder: string;
	totalFill: string;
	subtotalFill: string;
	pivotFill: string;
	link: string;
	/** `--theme-table-bar`, before the bars' opacity is applied. */
	bar: string;
	sparkline: string;
	positive: string;
	negative: string;
	neutral: string;
	colorScale: string[];
}

const NEUTRAL_DELTA = '#6b7280';
const DEFAULT_SPARKLINE = '#6b7280';

let defaultLightTheme: Theme | undefined;

function getDefaultLightTheme(): Theme {
	defaultLightTheme ??= buildThemes(DEFAULT_THEME).light;
	return defaultLightTheme;
}

export function blendColors(background: string, color: string, alpha: number): string {
	try {
		return chroma.mix(background, color, alpha, 'rgb').hex();
	} catch {
		return color;
	}
}

// A table export converts the same few colors thousands of times; color scales add one per value.
const excelRgbCache = new Map<string, string | undefined>();
const EXCEL_RGB_CACHE_LIMIT = 5000;

/** Excel colors are opaque, so translucent ones are blended over the white sheet. */
export function toExcelRgb(color: string | undefined): string | undefined {
	if (!color) return undefined;
	if (excelRgbCache.has(color)) return excelRgbCache.get(color);
	let rgb: string | undefined;
	try {
		const parsed = chroma(color);
		const opaque =
			parsed.alpha() < 1 ? chroma.mix('#ffffff', parsed.alpha(1), parsed.alpha(), 'rgb') : parsed;
		rgb = opaque.hex('rgb').slice(1).toUpperCase();
	} catch (err) {
		// e.g. `var(...)` or `color-mix(...)` in a theme; the cell keeps Excel's default color.
		logger.warn({ err, color }, 'Excel export skipped a color it could not read');
		rgb = undefined;
	}
	if (excelRgbCache.size >= EXCEL_RGB_CACHE_LIMIT) excelRgbCache.clear();
	excelRgbCache.set(color, rgb);
	return rgb;
}

/** `theme` must be a light-mode theme. */
export function resolveExcelPalette(theme?: Theme, { cardMode = false } = {}): ExcelPalette {
	const resolvedTheme = theme ?? getDefaultLightTheme();
	const surface = cardMode && resolvedTheme.card ? resolvedTheme.card : resolvedTheme;
	const table = resolveTableColors(resolvedTheme.table, surface, 'light');
	const scale = resolvedTheme.colorScales.default ?? [];

	return {
		background: surface.background,
		mutedForeground: surface.mutedForeground,
		rowShading: surface.muted,
		rowShadingCollapsible: blendColors(surface.background, surface.muted, 0.5),
		rowBorder: table.rowBorder,
		emphasisBorder: blendColors(surface.background, surface.foreground, 0.4),
		totalFill: table.totalBackground,
		subtotalFill: table.subtotalBackground,
		pivotFill: table.pivotBackground,
		link: table.link,
		bar: table.bar,
		sparkline: resolvedTheme.table?.barColor ?? DEFAULT_SPARKLINE,
		positive: resolvedTheme.positive ?? getDefaultLightTheme().positive!,
		negative: resolvedTheme.negative ?? getDefaultLightTheme().negative!,
		neutral: NEUTRAL_DELTA,
		colorScale: scale.length === 1 ? [surface.background, scale[0]] : scale
	};
}
