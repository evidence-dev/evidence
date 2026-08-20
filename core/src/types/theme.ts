import { z } from 'zod';

// Color can be a hex string
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// Theme mode colors - each color has light and dark variants
const themeColorSchema = z.object({
	light: hexColorSchema,
	dark: hexColorSchema
});

// Color palette with light/dark variants
const colorPaletteSchema = z.object({
	light: z.array(hexColorSchema),
	dark: z.array(hexColorSchema)
});

// Color scale with light/dark variants (for heatmaps, etc)
const colorScaleSchema = z.object({
	light: z.array(hexColorSchema),
	dark: z.array(hexColorSchema)
});

// Semantic font family. Authors pick a family, not a raw CSS stack; each maps
// to a bundled stack (Geist / Source Serif 4 / Geist Mono) via FONT_FAMILY_STACKS.
export const themeFontFamilySchema = z.enum(['sans-serif', 'serif', 'mono']);

// CSS length, e.g. '0.5rem', '14px', '2em' (used by baseFontSize/sidebarFontSize).
const cssLengthSchema = z.string().regex(/^\d*\.?\d+(px|rem|em)$/);

// Corner-radius token. A unitless value (number or numeric string) is
// interpreted as rem — `1` → '1rem', `0.5` → '0.5rem' — or you can give an
// explicit CSS length like '6px' or '0.25rem'.
const CSS_LENGTH_RE = /^\d*\.?\d+(px|rem|em)$/;
const UNITLESS_RE = /^\d*\.?\d+$/;

/**
 * Normalize a corner-radius token to a CSS length. Unitless numbers/strings are
 * interpreted as rem (`1` → '1rem'); explicit lengths ('6px', '0.25rem', '2em')
 * pass through. Unusable input falls back to the default radius. Used both by the
 * schema (parsed paths) and at CSS emission (covers raw, unparsed theme.yaml).
 */
export function normalizeRadius(value: string | number): string {
	if (typeof value === 'number')
		return Number.isFinite(value) && value >= 0 ? `${value}rem` : '0.5rem';
	const s = value.trim();
	if (CSS_LENGTH_RE.test(s)) return s;
	if (UNITLESS_RE.test(s)) return `${s}rem`;
	return '0.5rem';
}

const radiusSchema = z
	.union([z.number(), z.string()])
	.refine(
		(v) =>
			typeof v === 'number'
				? Number.isFinite(v) && v >= 0
				: CSS_LENGTH_RE.test(v.trim()) || UNITLESS_RE.test(v.trim()),
		{ message: "radius must be a non-negative number (rem) or a CSS length like '6px' or '0.5rem'" }
	)
	.transform((v) => normalizeRadius(v));

export const themeDepthSchema = z.enum(['flat', 'subtle', 'elevated']);
// 'flush' removes grid gutters entirely (terminal-style tiling)
export const themeDensitySchema = z.enum(['flush', 'compact', 'default', 'comfortable']);

// Full theme configuration - only includes tokens that are actually used
export const themeConfigSchema = z.object({
	colors: z.object({
		base: themeColorSchema,
		card: themeColorSchema.optional(),
		cardLayoutBackground: themeColorSchema.optional(),
		// Default fill for input controls (dropdowns, button groups, text inputs).
		// When unset it's derived per-mode from the surface so inputs read raised.
		inputSurface: themeColorSchema.optional(),
		// Published report viewer's navigation sidebar background. When unset the
		// sidebar tracks the page background (prior behavior).
		sidebarBackground: themeColorSchema.optional(),
		// Semantic up/down colors (deltas, red-negatives, candlesticks)
		positive: themeColorSchema,
		negative: themeColorSchema
	}),
	colorPalettes: z.object({
		default: colorPaletteSchema
	}),
	colorScales: z.object({
		default: colorScaleSchema
	}),
	fonts: z.object({
		heading: themeFontFamilySchema,
		body: themeFontFamilySchema,
		mono: themeFontFamilySchema
	}),
	// Base font size for report text; 16px matches the browser default and is
	// the identity value (utilities scale by baseFontSize/16)
	baseFontSize: cssLengthSchema,
	// Font size for the published report viewer's sidebar nav. When unset the
	// sidebar follows the baseFontSize-scaled default (prior behavior).
	sidebarFontSize: cssLengthSchema.optional(),
	radius: radiusSchema,
	depth: themeDepthSchema,
	density: themeDensitySchema,
	chart: z.object({
		gridlines: z.boolean(),
		// Show the axis baseline (the x-axis line)
		baselines: z.boolean(),
		// Chart draw-in on first render
		animateIntro: z.boolean(),
		// Chart data-update animations (re-animate on data change)
		animateUpdates: z.boolean(),
		// Absent color/font tokens fall back to derived tokens (border,
		// mutedForeground, fonts.body) at the ECharts theme layer
		gridlineColor: themeColorSchema.optional(),
		axisLabelColor: themeColorSchema.optional(),
		// Color of the axis baseline and its ticks
		baselineColor: themeColorSchema.optional(),
		fontFamily: themeFontFamilySchema.optional(),
		// Top-corner radius on bar series, px (top-only by design; applied as
		// [r, r, 0, 0] so vertical bars never get a rounded bottom)
		barRadius: z.number().min(0).max(50).optional(),
		// Default line/area smoothing when a chart doesn't specify it
		smooth: z.boolean().optional(),
		// Default color-to-transparent gradient fill on area charts
		areaGradient: z.boolean().optional()
	}),
	table: z.object({
		// Spark-bar / sparkline default fill/stroke color
		barColor: themeColorSchema.optional(),
		// Subtotal row background
		subtotalBackground: themeColorSchema.optional(),
		// Grand-total row background
		totalBackground: themeColorSchema.optional(),
		// Row dividers and internal cell seams; falls back to the derived border
		rowBorderColor: themeColorSchema.optional(),
		// Clickable-row hover background; falls back to the derived muted token
		hoverColor: themeColorSchema.optional(),
		// Cell link text color
		linkColor: themeColorSchema.optional(),
		// Pivot column-total/subtotal and pivot group-header accent background
		pivotBackground: themeColorSchema.optional(),
		// Behavioral defaults applied when a table doesn't set the attribute itself
		rowLines: z.boolean().optional(),
		rowShading: z.boolean().optional()
	})
});

// Override variants: `light`/`dark` are independently OPTIONAL so a partial
// override (e.g. only `light`) is valid and the unspecified mode is inherited
// from the parent theme by `resolveThemeOverrides`. Arrays are overlaid
// positionally (the override's colors take the first slots, the parent fills the
// rest), so specifying a couple of palette colors keeps the remaining defaults.
const themeColorOverrideSchema = z.object({
	light: hexColorSchema.optional().describe('Hex color (e.g. #1e40af) used in light mode.'),
	dark: hexColorSchema.optional().describe('Hex color (e.g. #1e40af) used in dark mode.')
});

const colorPaletteOverrideSchema = z.object({
	light: z.array(hexColorSchema).optional().describe('Ordered list of hex colors for light mode.'),
	dark: z.array(hexColorSchema).optional().describe('Ordered list of hex colors for dark mode.')
});

const colorScaleOverrideSchema = z.object({
	light: z.array(hexColorSchema).optional().describe('Ordered list of hex colors for light mode.'),
	dark: z.array(hexColorSchema).optional().describe('Ordered list of hex colors for dark mode.')
});

// Theme overrides schema - values can be null to indicate inheritance from parent.
// Non-color fields carry per-field `.catch(undefined)` so one invalid hand-edited
// key (theme.yaml / frontmatter) degrades to "inherit" instead of voiding the
// whole override object via the outer `.catch` at the frontmatter layer.
export const themeOverridesSchema = z.object({
	colors: z
		.object({
			base: themeColorOverrideSchema
				.nullable()
				.optional()
				.describe('Base background/foreground colors.'),
			card: themeColorOverrideSchema.nullable().optional().describe('Card surface colors.'),
			cardLayoutBackground: themeColorOverrideSchema
				.nullable()
				.optional()
				.describe('Background behind cards when card layout is enabled.'),
			inputSurface: themeColorOverrideSchema
				.nullable()
				.optional()
				.catch(undefined)
				.describe('Fill for input controls; omit to derive a raised surface from the theme.'),
			sidebarBackground: themeColorOverrideSchema
				.nullable()
				.optional()
				.catch(undefined)
				.describe('Published report sidebar background; omit to track the page background.'),
			positive: themeColorOverrideSchema
				.nullable()
				.optional()
				.catch(undefined)
				.describe('Semantic up/positive color (deltas, gains, candlestick up bodies).'),
			negative: themeColorOverrideSchema
				.nullable()
				.optional()
				.catch(undefined)
				.describe('Semantic down/negative color (deltas, losses, red-negative values).')
		})
		.optional()
		.describe('Theme color tokens. Omit a key to inherit it from the parent theme.'),
	colorPalettes: z
		.object({
			default: colorPaletteOverrideSchema
				.nullable()
				.optional()
				.describe('Default categorical palette used by charts.')
		})
		.optional()
		.describe('Categorical color palettes for charts.'),
	colorScales: z
		.object({
			default: colorScaleOverrideSchema
				.nullable()
				.optional()
				.describe('Default sequential scale used by heatmaps and gradients.')
		})
		.optional()
		.describe('Sequential color scales for heatmaps and gradients.'),
	fonts: z
		.object({
			heading: themeFontFamilySchema.nullable().optional().catch(undefined),
			body: themeFontFamilySchema.nullable().optional().catch(undefined),
			mono: themeFontFamilySchema.nullable().optional().catch(undefined)
		})
		.nullable()
		.optional()
		.catch(undefined),
	baseFontSize: cssLengthSchema.nullable().optional().catch(undefined),
	sidebarFontSize: cssLengthSchema.nullable().optional().catch(undefined),
	radius: radiusSchema.nullable().optional().catch(undefined),
	depth: themeDepthSchema.nullable().optional().catch(undefined),
	density: themeDensitySchema.nullable().optional().catch(undefined),
	chart: z
		.object({
			gridlines: z.boolean().nullable().optional().catch(undefined),
			baselines: z.boolean().nullable().optional().catch(undefined),
			animateIntro: z.boolean().nullable().optional().catch(undefined),
			animateUpdates: z.boolean().nullable().optional().catch(undefined),
			gridlineColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			axisLabelColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			baselineColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			fontFamily: themeFontFamilySchema.nullable().optional().catch(undefined),
			barRadius: z.number().min(0).max(50).nullable().optional().catch(undefined),
			smooth: z.boolean().nullable().optional().catch(undefined),
			areaGradient: z.boolean().nullable().optional().catch(undefined)
		})
		.nullable()
		.optional()
		.catch(undefined),
	table: z
		.object({
			barColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			subtotalBackground: themeColorOverrideSchema.nullable().optional().catch(undefined),
			totalBackground: themeColorOverrideSchema.nullable().optional().catch(undefined),
			rowBorderColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			hoverColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			linkColor: themeColorOverrideSchema.nullable().optional().catch(undefined),
			pivotBackground: themeColorOverrideSchema.nullable().optional().catch(undefined),
			rowLines: z.boolean().nullable().optional().catch(undefined),
			rowShading: z.boolean().nullable().optional().catch(undefined)
		})
		.nullable()
		.optional()
		.catch(undefined)
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type ThemeOverrides = z.infer<typeof themeOverridesSchema>;
export type ThemeColor = z.infer<typeof themeColorSchema>;
export type ColorPalette = z.infer<typeof colorPaletteSchema>;
export type ColorScale = z.infer<typeof colorScaleSchema>;
export type ThemeFonts = ThemeConfig['fonts'];
export type ThemeFontFamily = z.infer<typeof themeFontFamilySchema>;
export type ThemeDepth = z.infer<typeof themeDepthSchema>;
export type ThemeDensity = z.infer<typeof themeDensitySchema>;

// Single mode theme (light OR dark)
export interface Theme {
	// Shadcn tokens (direct access)
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	border: string;
	// Input control fill for this surface (derived, or the inputSurface override)
	inputSurface: string;

	// Semantic up/down colors (populated by buildThemes)
	positive?: string;
	negative?: string;

	// Card tokens (when cards are configured)
	card?: {
		background: string;
		foreground: string;
		muted: string;
		mutedForeground: string;
		border: string;
		inputSurface: string;
	};

	// Card layout tokens (when card mode is enabled)
	cardLayout?: {
		background: string;
		foreground: string;
		mutedForeground: string;
	};

	// Sidebar tokens, derived from colors.sidebarBackground when set (so the
	// sidebar's foreground/border contrast its own surface); absent → the sidebar
	// tracks the page background via the existing --sidebar* fallback.
	sidebar?: {
		background: string;
		foreground: string;
		muted: string;
		border: string;
	};

	// Chart configuration
	colorPalettes: Record<string, string[]>;
	colorScales: Record<string, string[]>;

	// Typography (mode-independent; populated by buildThemes). These are the
	// RESOLVED CSS font stacks (the family enum is mapped via FONT_FAMILY_STACKS),
	// so consumers like ECharts get a real font-family string.
	fonts?: { heading: string; body: string; mono: string };

	// Density (mode-independent; lets components adapt layout, e.g. flush
	// card-edge grouping)
	density?: ThemeDensity;

	// Chart chrome tokens resolved for this mode; absent values fall back to
	// derived tokens (border, mutedForeground, fonts.body) in createTheme
	chart?: {
		gridlines: boolean;
		baselines: boolean;
		// Chart animation switches (mode-independent): intro draw-in + data-update
		animateIntro: boolean;
		animateUpdates: boolean;
		gridlineColor?: string;
		axisLabelColor?: string;
		baselineColor?: string;
		fontFamily?: string;
		barRadius?: number;
		smooth?: boolean;
		areaGradient?: boolean;
	};

	// Table chrome tokens; color values resolved for this mode (absent ones fall
	// back to derived/brand defaults in the CSS-var emit layer), booleans are
	// mode-independent defaults read by Table.svelte when the attr is unset
	table?: {
		barColor?: string;
		subtotalBackground?: string;
		totalBackground?: string;
		rowBorderColor?: string;
		hoverColor?: string;
		linkColor?: string;
		pivotBackground?: string;
		rowLines?: boolean;
		rowShading?: boolean;
	};
}

// Both themes together
export interface Themes {
	light: Theme;
	dark: Theme;
}
