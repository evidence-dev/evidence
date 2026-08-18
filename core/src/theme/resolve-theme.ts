import type { ThemeColor, ThemeConfig, ThemeOverrides } from '../types/theme';
import { DEFAULT_THEME } from '../constants/default-theme';

type ColorTokenOverride = { light?: string; dark?: string };
type ColorListOverride = { light?: string[]; dark?: string[] };

/**
 * Backfill the token groups added after the first release so the resolver and
 * differ can safely read required fields like `base.fonts.heading` even when
 * `base` is a `ThemeConfig` serialized before those groups existed. New groups
 * inherit `DEFAULT_THEME` wholesale; existing groups (colors/palettes/scales)
 * pass through untouched.
 */
function withConfigDefaults(base: ThemeConfig): ThemeConfig {
	return {
		...base,
		colors: {
			...base.colors,
			// Optional color tokens (inputSurface, sidebarBackground) are intentionally
			// NOT backfilled: they're read only via optional chaining and must stay
			// absent so buildThemes derives them per-mode rather than pinning a color.
			positive: base.colors.positive ?? DEFAULT_THEME.colors.positive,
			negative: base.colors.negative ?? DEFAULT_THEME.colors.negative
		},
		fonts: base.fonts ?? DEFAULT_THEME.fonts,
		baseFontSize: base.baseFontSize ?? DEFAULT_THEME.baseFontSize,
		radius: base.radius ?? DEFAULT_THEME.radius,
		depth: base.depth ?? DEFAULT_THEME.depth,
		density: base.density ?? DEFAULT_THEME.density,
		chart: base.chart ?? DEFAULT_THEME.chart,
		table: base.table ?? DEFAULT_THEME.table
	};
}

function colorArraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
	if (a === b) return true;
	if (!a || !b || a.length !== b.length) return false;
	return a.every((v, i) => v === b[i]);
}

/** Keep only the modes of a color token that differ from the base. */
function diffColorToken(
	page: ColorTokenOverride | null | undefined,
	base: ThemeColor | undefined
): ColorTokenOverride | undefined {
	if (!page) return undefined;
	const out: ColorTokenOverride = {};
	if (page.light !== undefined && page.light !== base?.light) out.light = page.light;
	if (page.dark !== undefined && page.dark !== base?.dark) out.dark = page.dark;
	return Object.keys(out).length > 0 ? out : undefined;
}

/** Keep only the modes of a color list (palette/scale) whose array differs from the base. */
function diffColorList(
	page: ColorListOverride | null | undefined,
	base: { light: string[]; dark: string[] } | undefined
): ColorListOverride | undefined {
	if (!page) return undefined;
	const out: ColorListOverride = {};
	if (page.light !== undefined && !colorArraysEqual(page.light, base?.light))
		out.light = page.light;
	if (page.dark !== undefined && !colorArraysEqual(page.dark, base?.dark)) out.dark = page.dark;
	return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Reduce a theme-overrides object to ONLY the tokens/modes that actually differ
 * from `base` (a fully-resolved theme — typically the resolved project theme).
 * Used by the migration so a page's frontmatter carries just its genuine
 * overrides instead of duplicating values it would already inherit. Returns
 * `undefined` when nothing differs.
 */
export function diffThemeOverrides(
	page: ThemeOverrides | null | undefined,
	base: ThemeConfig
): ThemeOverrides | undefined {
	if (!page) return undefined;
	base = withConfigDefaults(base);
	const result: ThemeOverrides = {};

	const colors: NonNullable<ThemeOverrides['colors']> = {};
	const baseToken = diffColorToken(page.colors?.base, base.colors.base);
	if (baseToken) colors.base = baseToken;
	const cardToken = diffColorToken(page.colors?.card, base.colors.card);
	if (cardToken) colors.card = cardToken;
	const clbToken = diffColorToken(
		page.colors?.cardLayoutBackground,
		base.colors.cardLayoutBackground
	);
	if (clbToken) colors.cardLayoutBackground = clbToken;
	const inputSurfaceToken = diffColorToken(page.colors?.inputSurface, base.colors.inputSurface);
	if (inputSurfaceToken) colors.inputSurface = inputSurfaceToken;
	const sidebarBgToken = diffColorToken(
		page.colors?.sidebarBackground,
		base.colors.sidebarBackground
	);
	if (sidebarBgToken) colors.sidebarBackground = sidebarBgToken;
	const positiveToken = diffColorToken(page.colors?.positive, base.colors.positive);
	if (positiveToken) colors.positive = positiveToken;
	const negativeToken = diffColorToken(page.colors?.negative, base.colors.negative);
	if (negativeToken) colors.negative = negativeToken;
	if (Object.keys(colors).length > 0) result.colors = colors;

	const palette = diffColorList(page.colorPalettes?.default, base.colorPalettes.default);
	if (palette) result.colorPalettes = { default: palette };

	const scale = diffColorList(page.colorScales?.default, base.colorScales.default);
	if (scale) result.colorScales = { default: scale };

	if (page.fonts) {
		const fonts: NonNullable<ThemeOverrides['fonts']> = {};
		if (page.fonts.heading != null && page.fonts.heading !== base.fonts.heading)
			fonts.heading = page.fonts.heading;
		if (page.fonts.body != null && page.fonts.body !== base.fonts.body)
			fonts.body = page.fonts.body;
		if (page.fonts.mono != null && page.fonts.mono !== base.fonts.mono)
			fonts.mono = page.fonts.mono;
		if (Object.keys(fonts).length > 0) result.fonts = fonts;
	}

	if (page.baseFontSize != null && page.baseFontSize !== base.baseFontSize)
		result.baseFontSize = page.baseFontSize;
	if (page.sidebarFontSize != null && page.sidebarFontSize !== base.sidebarFontSize)
		result.sidebarFontSize = page.sidebarFontSize;
	if (page.radius != null && page.radius !== base.radius) result.radius = page.radius;
	if (page.depth != null && page.depth !== base.depth) result.depth = page.depth;
	if (page.density != null && page.density !== base.density) result.density = page.density;

	if (page.chart) {
		const chart: NonNullable<ThemeOverrides['chart']> = {};
		if (page.chart.gridlines != null && page.chart.gridlines !== base.chart.gridlines)
			chart.gridlines = page.chart.gridlines;
		if (page.chart.baselines != null && page.chart.baselines !== base.chart.baselines)
			chart.baselines = page.chart.baselines;
		if (page.chart.animateIntro != null && page.chart.animateIntro !== base.chart.animateIntro)
			chart.animateIntro = page.chart.animateIntro;
		if (
			page.chart.animateUpdates != null &&
			page.chart.animateUpdates !== base.chart.animateUpdates
		)
			chart.animateUpdates = page.chart.animateUpdates;
		const gridlineColor = diffColorToken(page.chart.gridlineColor, base.chart.gridlineColor);
		if (gridlineColor) chart.gridlineColor = gridlineColor;
		const axisLabelColor = diffColorToken(page.chart.axisLabelColor, base.chart.axisLabelColor);
		if (axisLabelColor) chart.axisLabelColor = axisLabelColor;
		const baselineColor = diffColorToken(page.chart.baselineColor, base.chart.baselineColor);
		if (baselineColor) chart.baselineColor = baselineColor;
		if (page.chart.fontFamily != null && page.chart.fontFamily !== base.chart.fontFamily)
			chart.fontFamily = page.chart.fontFamily;
		if (page.chart.barRadius != null && page.chart.barRadius !== base.chart.barRadius)
			chart.barRadius = page.chart.barRadius;
		if (page.chart.smooth != null && page.chart.smooth !== base.chart.smooth)
			chart.smooth = page.chart.smooth;
		if (page.chart.areaGradient != null && page.chart.areaGradient !== base.chart.areaGradient)
			chart.areaGradient = page.chart.areaGradient;
		if (Object.keys(chart).length > 0) result.chart = chart;
	}

	if (page.table) {
		const table: NonNullable<ThemeOverrides['table']> = {};
		const barColor = diffColorToken(page.table.barColor, base.table.barColor);
		if (barColor) table.barColor = barColor;
		const subtotalBackground = diffColorToken(
			page.table.subtotalBackground,
			base.table.subtotalBackground
		);
		if (subtotalBackground) table.subtotalBackground = subtotalBackground;
		const totalBackground = diffColorToken(page.table.totalBackground, base.table.totalBackground);
		if (totalBackground) table.totalBackground = totalBackground;
		const rowBorderColor = diffColorToken(page.table.rowBorderColor, base.table.rowBorderColor);
		if (rowBorderColor) table.rowBorderColor = rowBorderColor;
		const hoverColor = diffColorToken(page.table.hoverColor, base.table.hoverColor);
		if (hoverColor) table.hoverColor = hoverColor;
		const linkColor = diffColorToken(page.table.linkColor, base.table.linkColor);
		if (linkColor) table.linkColor = linkColor;
		const pivotBackground = diffColorToken(page.table.pivotBackground, base.table.pivotBackground);
		if (pivotBackground) table.pivotBackground = pivotBackground;
		if (page.table.rowLines != null && page.table.rowLines !== base.table.rowLines)
			table.rowLines = page.table.rowLines;
		if (page.table.rowShading != null && page.table.rowShading !== base.table.rowShading)
			table.rowShading = page.table.rowShading;
		if (Object.keys(table).length > 0) result.table = table;
	}

	return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Merge a single light/dark color token. Each mode is independent: a mode that
 * the override omits (undefined) is inherited from the base. A `null` override
 * means "inherit the whole token".
 */
function mergeColorToken(
	base: ThemeColor,
	override: ColorTokenOverride | null | undefined
): ThemeColor {
	if (!override) return base; // undefined or null -> inherit
	return {
		light: override.light ?? base.light,
		dark: override.dark ?? base.dark
	};
}

/**
 * Optional-token variant: the base token may be absent (card / cardLayoutBackground
 * are optional). Adopt a fully-specified override when there is no base; otherwise
 * merge per-mode against the base.
 */
function mergeOptionalColorToken(
	base: ThemeColor | undefined,
	override: ColorTokenOverride | null | undefined
): ThemeColor | undefined {
	if (!base) {
		if (override && override.light !== undefined && override.dark !== undefined) {
			return { light: override.light, dark: override.dark };
		}
		return base;
	}
	return mergeColorToken(base, override);
}

/**
 * Overlay an override color list onto a base list POSITIONALLY: the override's
 * colors take the first N slots, the base fills the remainder. This is what makes
 * "specify a couple of colors" keep the rest of the palette from the parent theme.
 * An empty/absent override inherits the base entirely.
 */
function overlayColorList(base: string[], override: string[] | null | undefined): string[] {
	if (!override || override.length === 0) return base;
	if (override.length >= base.length) return [...override];
	return [...override, ...base.slice(override.length)];
}

/**
 * Merge a light/dark color list (palette or scale). Each mode is overlaid
 * positionally and independently; an omitted mode inherits the base for that mode.
 */
function mergeColorList<T extends { light: string[]; dark: string[] }>(
	base: T,
	override: ColorListOverride | null | undefined
): T {
	if (!override) return base;
	return {
		...base,
		light: overlayColorList(base.light, override.light),
		dark: overlayColorList(base.dark, override.dark)
	};
}

/**
 * Resolve theme overrides against a base theme.
 *
 * The merge is DEEP and layered: color tokens merge per-mode, and palette/scale
 * arrays are overlaid positionally (override colors first, base fills the rest).
 * `null` means "inherit"; an omitted value means "not specified" (also inherit).
 */
export function resolveThemeOverrides(
	base: ThemeConfig,
	overrides?: ThemeOverrides | null
): ThemeConfig {
	base = withConfigDefaults(base);
	if (!overrides) return base;

	const colors: ThemeConfig['colors'] = {
		base: mergeColorToken(base.colors.base, overrides.colors?.base),
		positive: mergeColorToken(base.colors.positive, overrides.colors?.positive),
		negative: mergeColorToken(base.colors.negative, overrides.colors?.negative)
	};
	const card = mergeOptionalColorToken(base.colors.card, overrides.colors?.card);
	if (card !== undefined) colors.card = card;
	const cardLayoutBackground = mergeOptionalColorToken(
		base.colors.cardLayoutBackground,
		overrides.colors?.cardLayoutBackground
	);
	if (cardLayoutBackground !== undefined) colors.cardLayoutBackground = cardLayoutBackground;
	const inputSurface = mergeOptionalColorToken(
		base.colors.inputSurface,
		overrides.colors?.inputSurface
	);
	if (inputSurface !== undefined) colors.inputSurface = inputSurface;
	const sidebarBackground = mergeOptionalColorToken(
		base.colors.sidebarBackground,
		overrides.colors?.sidebarBackground
	);
	if (sidebarBackground !== undefined) colors.sidebarBackground = sidebarBackground;

	// `??` treats both null and omitted as "inherit", matching the color tokens
	const fonts: ThemeConfig['fonts'] = overrides.fonts
		? {
				heading: overrides.fonts.heading ?? base.fonts.heading,
				body: overrides.fonts.body ?? base.fonts.body,
				mono: overrides.fonts.mono ?? base.fonts.mono
			}
		: base.fonts;

	let chart: ThemeConfig['chart'] = base.chart;
	if (overrides.chart) {
		chart = {
			gridlines: overrides.chart.gridlines ?? base.chart.gridlines,
			baselines: overrides.chart.baselines ?? base.chart.baselines,
			animateIntro: overrides.chart.animateIntro ?? base.chart.animateIntro,
			animateUpdates: overrides.chart.animateUpdates ?? base.chart.animateUpdates
		};
		const gridlineColor = mergeOptionalColorToken(
			base.chart.gridlineColor,
			overrides.chart.gridlineColor
		);
		if (gridlineColor !== undefined) chart.gridlineColor = gridlineColor;
		const axisLabelColor = mergeOptionalColorToken(
			base.chart.axisLabelColor,
			overrides.chart.axisLabelColor
		);
		if (axisLabelColor !== undefined) chart.axisLabelColor = axisLabelColor;
		const baselineColor = mergeOptionalColorToken(
			base.chart.baselineColor,
			overrides.chart.baselineColor
		);
		if (baselineColor !== undefined) chart.baselineColor = baselineColor;
		const fontFamily = overrides.chart.fontFamily ?? base.chart.fontFamily;
		if (fontFamily !== undefined) chart.fontFamily = fontFamily;
		const barRadius = overrides.chart.barRadius ?? base.chart.barRadius;
		if (barRadius !== undefined) chart.barRadius = barRadius;
		const smooth = overrides.chart.smooth ?? base.chart.smooth;
		if (smooth !== undefined) chart.smooth = smooth;
		const areaGradient = overrides.chart.areaGradient ?? base.chart.areaGradient;
		if (areaGradient !== undefined) chart.areaGradient = areaGradient;
	}

	let table: ThemeConfig['table'] = base.table;
	if (overrides.table) {
		table = {};
		const barColor = mergeOptionalColorToken(base.table.barColor, overrides.table.barColor);
		if (barColor !== undefined) table.barColor = barColor;
		const subtotalBackground = mergeOptionalColorToken(
			base.table.subtotalBackground,
			overrides.table.subtotalBackground
		);
		if (subtotalBackground !== undefined) table.subtotalBackground = subtotalBackground;
		const totalBackground = mergeOptionalColorToken(
			base.table.totalBackground,
			overrides.table.totalBackground
		);
		if (totalBackground !== undefined) table.totalBackground = totalBackground;
		const rowBorderColor = mergeOptionalColorToken(
			base.table.rowBorderColor,
			overrides.table.rowBorderColor
		);
		if (rowBorderColor !== undefined) table.rowBorderColor = rowBorderColor;
		const hoverColor = mergeOptionalColorToken(base.table.hoverColor, overrides.table.hoverColor);
		if (hoverColor !== undefined) table.hoverColor = hoverColor;
		const linkColor = mergeOptionalColorToken(base.table.linkColor, overrides.table.linkColor);
		if (linkColor !== undefined) table.linkColor = linkColor;
		const pivotBackground = mergeOptionalColorToken(
			base.table.pivotBackground,
			overrides.table.pivotBackground
		);
		if (pivotBackground !== undefined) table.pivotBackground = pivotBackground;
		const rowLines = overrides.table.rowLines ?? base.table.rowLines;
		if (rowLines !== undefined) table.rowLines = rowLines;
		const rowShading = overrides.table.rowShading ?? base.table.rowShading;
		if (rowShading !== undefined) table.rowShading = rowShading;
	}

	return {
		colors,
		colorPalettes: {
			default: mergeColorList(base.colorPalettes.default, overrides.colorPalettes?.default)
		},
		colorScales: {
			default: mergeColorList(base.colorScales.default, overrides.colorScales?.default)
		},
		fonts,
		baseFontSize: overrides.baseFontSize ?? base.baseFontSize,
		sidebarFontSize: overrides.sidebarFontSize ?? base.sidebarFontSize,
		radius: overrides.radius ?? base.radius,
		depth: overrides.depth ?? base.depth,
		density: overrides.density ?? base.density,
		chart,
		table
	};
}

/**
 * Resolve theme hierarchy by merging overrides
 * Each level's non-null values override the parent
 *
 * @param base - Base theme (full ThemeConfig, defaults to DEFAULT_THEME if null)
 * @param org - Organization theme overrides (inherits from base)
 * @param project - Project theme overrides (inherits from org)
 * @param page - Page theme overrides (inherits from project)
 * @returns Fully resolved theme config
 */
export function resolveTheme(
	base?: ThemeConfig | null,
	org?: ThemeOverrides | null,
	project?: ThemeOverrides | null,
	page?: ThemeOverrides | null
): ThemeConfig {
	// Start with base theme, or default if not set
	const baseTheme: ThemeConfig = base ?? DEFAULT_THEME;

	// Resolve each level in sequence
	const afterOrg = resolveThemeOverrides(baseTheme, org);
	const afterProject = resolveThemeOverrides(afterOrg, project);
	const afterPage = resolveThemeOverrides(afterProject, page);

	return afterPage;
}
