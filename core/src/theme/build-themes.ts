import type { ThemeConfig } from '../types/theme';
import { deriveShadcnTokens } from './derive-shadcn-tokens';
import { FONT_FAMILY_STACKS } from '../constants/theme-style-maps';

/**
 * Build separate light and dark themes from config
 * Auto-derives shadcn tokens (foreground, muted, border, etc.) from the background color
 * Also derives card and cardLayout tokens when configured
 *
 * Precondition: `config` must be a fully-resolved ThemeConfig (the output of
 * resolveTheme / resolveThemeOverrides, which backfill post-release token groups via
 * withConfigDefaults). The new groups (fonts/chart/table) are field-accessed unguarded
 * here — do NOT pass a raw, pre-resolution stored config.
 */
export function buildThemes(config: ThemeConfig) {
	const buildTheme = (mode: 'light' | 'dark') => {
		const baseColor = config.colors.base[mode];

		// Derive shadcn tokens directly from base color
		const shadcnTokens = deriveShadcnTokens(baseColor);

		// Derive card layout shadcn tokens
		let cardLayoutTokens:
			| { background: string; foreground: string; mutedForeground: string }
			| undefined;
		if (config.colors.cardLayoutBackground) {
			const cardLayoutBg = config.colors.cardLayoutBackground[mode];
			const derived = deriveShadcnTokens(cardLayoutBg);
			cardLayoutTokens = {
				background: cardLayoutBg,
				foreground: derived.foreground,
				mutedForeground: derived.mutedForeground
			};
		}

		// Derive card shadcn tokens
		let cardTokens: ReturnType<typeof deriveShadcnTokens> | undefined;
		if (config.colors.card) {
			const cardBg = config.colors.card[mode];
			cardTokens = deriveShadcnTokens(cardBg);
		}

		// Derive sidebar tokens from sidebarBackground so the sidebar's foreground /
		// muted / border contrast its own surface (vs. tracking the page background)
		let sidebarTokens:
			| { background: string; foreground: string; muted: string; border: string }
			| undefined;
		if (config.colors.sidebarBackground) {
			const sidebarBg = config.colors.sidebarBackground[mode];
			const derived = deriveShadcnTokens(sidebarBg);
			sidebarTokens = {
				background: sidebarBg,
				foreground: derived.foreground,
				muted: derived.muted,
				border: derived.border
			};
		}

		// Build color scales - components will handle expansion with appropriate background context
		const colorScales = config.colorScales
			? Object.fromEntries(
					Object.entries(config.colorScales).map(([k, v]) => {
						const scaleColors = v?.[mode];
						return [k, scaleColors && Array.isArray(scaleColors) ? scaleColors : []];
					})
				)
			: {};

		return {
			// Shadcn tokens (direct)
			background: shadcnTokens.background,
			foreground: shadcnTokens.foreground,
			muted: shadcnTokens.muted,
			mutedForeground: shadcnTokens.mutedForeground,
			border: shadcnTokens.border,
			// Explicit inputSurface token themes the page-level input fill; absent
			// it falls back to the derived raised surface. Inputs inside cards use
			// the card's own derived inputSurface (cardTokens), so they still pop.
			inputSurface: config.colors.inputSurface?.[mode] ?? shadcnTokens.inputSurface,

			// Semantic up/down colors (`?.` guards configs serialized before these existed)
			positive: config.colors.positive?.[mode],
			negative: config.colors.negative?.[mode],

			// Card tokens (if configured)
			...(cardTokens ? { card: cardTokens } : {}),

			// Card layout tokens (if configured)
			...(cardLayoutTokens ? { cardLayout: cardLayoutTokens } : {}),

			// Sidebar tokens (if sidebarBackground configured)
			...(sidebarTokens ? { sidebar: sidebarTokens } : {}),

			// Chart configuration
			colorPalettes: config.colorPalettes
				? Object.fromEntries(
						Object.entries(config.colorPalettes).map(([k, v]) => [k, v?.[mode] ?? []])
					)
				: {},
			colorScales,

			// Typography resolved to real CSS stacks (the family enum → stack) so
			// consumers like ECharts get a usable font-family
			fonts: {
				heading: FONT_FAMILY_STACKS[config.fonts.heading],
				body: FONT_FAMILY_STACKS[config.fonts.body],
				mono: FONT_FAMILY_STACKS[config.fonts.mono]
			},
			density: config.density,
			chart: {
				gridlines: config.chart.gridlines,
				baselines: config.chart.baselines,
				animateIntro: config.chart.animateIntro,
				animateUpdates: config.chart.animateUpdates,
				...(config.chart.gridlineColor ? { gridlineColor: config.chart.gridlineColor[mode] } : {}),
				...(config.chart.axisLabelColor
					? { axisLabelColor: config.chart.axisLabelColor[mode] }
					: {}),
				...(config.chart.baselineColor ? { baselineColor: config.chart.baselineColor[mode] } : {}),
				...(config.chart.fontFamily
					? { fontFamily: FONT_FAMILY_STACKS[config.chart.fontFamily] }
					: {}),
				...(config.chart.barRadius !== undefined ? { barRadius: config.chart.barRadius } : {}),
				...(config.chart.smooth !== undefined ? { smooth: config.chart.smooth } : {}),
				...(config.chart.areaGradient !== undefined
					? { areaGradient: config.chart.areaGradient }
					: {})
			},
			table: {
				...(config.table.barColor ? { barColor: config.table.barColor[mode] } : {}),
				...(config.table.subtotalBackground
					? { subtotalBackground: config.table.subtotalBackground[mode] }
					: {}),
				...(config.table.totalBackground
					? { totalBackground: config.table.totalBackground[mode] }
					: {}),
				...(config.table.rowBorderColor
					? { rowBorderColor: config.table.rowBorderColor[mode] }
					: {}),
				...(config.table.hoverColor ? { hoverColor: config.table.hoverColor[mode] } : {}),
				...(config.table.linkColor ? { linkColor: config.table.linkColor[mode] } : {}),
				...(config.table.pivotBackground
					? { pivotBackground: config.table.pivotBackground[mode] }
					: {}),
				...(config.table.rowLines !== undefined ? { rowLines: config.table.rowLines } : {}),
				...(config.table.rowShading !== undefined ? { rowShading: config.table.rowShading } : {})
			}
		};
	};

	return {
		light: buildTheme('light'),
		dark: buildTheme('dark')
	};
}
