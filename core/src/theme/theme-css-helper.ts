import { buildThemes } from './build-themes';
import type { ThemeConfig, Theme } from '../types/theme';
import { normalizeRadius } from '../types/theme';
import chroma from 'chroma-js';
import { getThemeToken } from './get-theme-token';
import {
	DEPTH_SHADOW_GEOMETRY,
	DENSITY_SPACING,
	FONT_FAMILY_STACKS,
	SYNTAX_PALETTES
} from '../constants/theme-style-maps';
import type { ThemeDepth } from '../types/theme';

/**
 * Marker class that report-surface components put on their PORTALED overlay
 * content (select menus, popovers, dialogs). Portaled nodes live under
 * document.body, outside the editor preview pane's scoped theme CSS, so
 * scoped mode re-emits the theme vars under this class. Editor-chrome
 * overlays must never carry it.
 */
export const PAGE_THEME_OVERLAY_CLASS = 'evidence-page-theme';

/**
 * Convert hex color to HSL format expected by shadcn/ui
 * Uses chroma-js for accurate color conversion
 */
export function hexToHSL(hex: string | undefined): string {
	if (!hex) {
		// Fallback to a neutral gray if no color provided
		return '0 0% 50%';
	}

	try {
		const [h, s, l] = chroma(hex).hsl();
		// Handle NaN for achromatic colors (grays)
		const hue = isNaN(h) ? 0 : Math.round(h);
		const saturation = isNaN(s) ? 0 : Math.round(s * 100);
		const lightness = Math.round(l * 100);

		// Return in shadcn format (without hsl() wrapper)
		return `${hue} ${saturation}% ${lightness}%`;
	} catch {
		// Fallback for invalid colors
		return '0 0% 50%';
	}
}

/**
 * Per-mode brand defaults for table color tokens that are NOT derived from the
 * surface: spark-bar color and link color. The special-row backgrounds
 * (subtotal/total/pivot) are derived from the applicable surface instead — see
 * deriveTableSurfaces — so they track any themed background; subtotal/total/pivot
 * here are only the last-resort fallback when a background fails to parse.
 * rowBorder/hover follow the theme border/muted and aren't listed here.
 */
const TABLE_TOKEN_DEFAULTS = {
	light: {
		bar: '#60a5fa', // blue-400 (spark bars; opacity-40 applied in the component)
		subtotal: '#f9fafb', // gray-50
		total: '#f3f4f6', // gray-100
		link: '#1d4ed8', // blue-700
		pivot: '#eff6ff' // blue-50
	},
	dark: {
		bar: '#60a5fa',
		subtotal: '#1f2937', // gray-800
		total: '#1f2937', // gray-800
		link: '#93c5fd', // blue-300
		pivot: '#172554' // blue-950
	}
} as const;

/**
 * Derive the table special-row backgrounds (subtotal/grand-total/pivot) as
 * subtle shades of the surface the table sits on, so they track any theme/mode
 * instead of the old fixed grays (which looked wrong on every non-white setup).
 * Keyed off the SURFACE luminance, not the app mode, so a dark themed surface in
 * light mode still gets darker-than-surface rows. total is the most prominent,
 * subtotal the faintest, pivot in between.
 */
function deriveTableSurfaces(background: string, mode: 'light' | 'dark') {
	try {
		const c = chroma(background);
		if (c.luminance() < 0.5) {
			// Dark surface → lift rows above the background.
			return {
				subtotal: c.brighten(0.5).hex(),
				total: c.brighten(0.9).hex(),
				pivot: c.brighten(0.7).hex()
			};
		}
		// Light surface → settle rows below the background.
		return {
			subtotal: c.darken(0.12).hex(),
			total: c.darken(0.28).hex(),
			pivot: c.darken(0.2).hex()
		};
	} catch {
		const d = TABLE_TOKEN_DEFAULTS[mode];
		return { subtotal: d.subtotal, total: d.total, pivot: d.pivot };
	}
}

/**
 * Build the `--theme-table-*` var lines for a given surface (page or card), so
 * tables track whichever background they actually sit on. Explicit theme
 * overrides win; otherwise backgrounds derive from the surface and
 * rowBorder/hover follow the surface border/muted.
 */
function tableCSSVars(
	table: Theme['table'],
	surface: { background: string; border: string; muted: string },
	mode: 'light' | 'dark'
): string[] {
	const defaults = TABLE_TOKEN_DEFAULTS[mode];
	const derived = deriveTableSurfaces(surface.background, mode);
	return [
		`--theme-table-bar: ${table?.barColor ?? defaults.bar} !important;`,
		`--theme-table-subtotal-bg: ${table?.subtotalBackground ?? derived.subtotal} !important;`,
		`--theme-table-total-bg: ${table?.totalBackground ?? derived.total} !important;`,
		`--theme-table-row-border: ${table?.rowBorderColor ?? surface.border} !important;`,
		`--theme-table-hover: ${table?.hoverColor ?? surface.muted} !important;`,
		`--theme-table-link: ${table?.linkColor ?? defaults.link} !important;`,
		`--theme-table-pivot-bg: ${table?.pivotBackground ?? derived.pivot} !important;`
	];
}

/**
 * Generate CSS variables from a Theme object
 */
function generateThemeCSSVarsFromTheme(theme: Theme, mode: 'light' | 'dark'): string {
	const vars: string[] = [];

	// Direct shadcn token injection
	// Tailwind v4 expects full color values with hsl() wrapper
	// Use !important to ensure theme CSS overrides app.css defaults
	vars.push(`--background: hsl(${hexToHSL(theme.background)}) !important;`);
	vars.push(`--foreground: hsl(${hexToHSL(theme.foreground)}) !important;`);
	vars.push(`--muted: hsl(${hexToHSL(theme.muted)}) !important;`);
	vars.push(`--muted-foreground: hsl(${hexToHSL(theme.mutedForeground)}) !important;`);
	vars.push(`--border: hsl(${hexToHSL(theme.border)}) !important;`);
	vars.push(`--input: hsl(${hexToHSL(theme.border)}) !important;`); // Input borders use same color as regular borders
	// Input control fill (dropdowns/button groups/text inputs) — a raised surface
	// that contrasts the page in both modes. Consumed via the bg-input-surface utility.
	vars.push(`--input-surface: hsl(${hexToHSL(theme.inputSurface)}) !important;`);

	// Semantic up/down colors (raw hex; consumed via var() in components)
	if (theme.positive) vars.push(`--theme-positive: ${theme.positive} !important;`);
	if (theme.negative) vars.push(`--theme-negative: ${theme.negative} !important;`);

	// Code-fence syntax palette, chosen by the SURFACE the <pre> sits on
	// (bg-muted) rather than the app mode — so a dark themed background in light
	// mode still gets light-on-dark syntax colors (no black-on-black). Base text
	// uses the theme foreground for exact contrast; hues come from the palette.
	let codeSurfaceDark = mode === 'dark';
	try {
		codeSurfaceDark = chroma(theme.muted).luminance() < 0.5;
	} catch {
		/* keep mode-based fallback for invalid colors */
	}
	const syntax = codeSurfaceDark ? SYNTAX_PALETTES.dark : SYNTAX_PALETTES.light;
	vars.push(`--syntax-text: ${theme.foreground} !important;`);
	vars.push(`--syntax-tag: ${syntax.tag} !important;`);
	vars.push(`--syntax-attr: ${syntax.attr} !important;`);
	vars.push(`--syntax-string: ${syntax.string} !important;`);
	vars.push(`--syntax-number: ${syntax.number} !important;`);
	vars.push(`--syntax-punctuation: ${syntax.punctuation} !important;`);
	vars.push(`--syntax-keyword: ${syntax.keyword} !important;`);
	vars.push(`--syntax-function: ${syntax.function} !important;`);
	vars.push(`--syntax-link: ${syntax.link} !important;`);

	// Table chrome (raw hex; consumed via bg-(--var)/text-(--var)/border-(--var)
	// in Table.svelte & co). Special-row backgrounds derive from the page surface
	// (the card context re-emits these from the card surface); row-border/hover
	// follow the theme border/muted so everything tracks the base color.
	vars.push(
		...tableCSSVars(
			theme.table,
			{ background: theme.background, border: theme.border, muted: theme.muted },
			mode
		)
	);

	// Tailwind prose plugin uses --color-* aliases (needed for scoped CSS to work)
	vars.push(`--color-foreground: ${theme.foreground} !important;`);
	vars.push(`--color-muted-foreground: ${theme.mutedForeground} !important;`);
	vars.push(`--color-border: ${theme.border} !important;`);
	vars.push(`--color-muted: ${theme.muted} !important;`);

	// Card uses its own background if configured, otherwise defaults to page background
	const cardBg = getThemeToken(theme, 'background', Boolean(theme.card));
	const cardFg = getThemeToken(theme, 'foreground', Boolean(theme.card));
	vars.push(`--card: hsl(${hexToHSL(cardBg)}) !important;`);
	vars.push(`--card-foreground: hsl(${hexToHSL(cardFg)}) !important;`);

	// Other UI tokens. Contrast pairs must be emitted together: a themed
	// --primary with the app-default --primary-foreground renders selected
	// states (e.g. calendar days) as same-on-same.
	vars.push(`--popover: hsl(${hexToHSL(theme.background)}) !important;`);
	vars.push(`--popover-foreground: hsl(${hexToHSL(theme.foreground)}) !important;`);
	vars.push(`--accent: hsl(${hexToHSL(theme.muted)}) !important;`);
	vars.push(`--accent-foreground: hsl(${hexToHSL(theme.foreground)}) !important;`);
	vars.push(`--primary: hsl(${hexToHSL(theme.foreground)}) !important;`);
	vars.push(`--primary-foreground: hsl(${hexToHSL(theme.background)}) !important;`);
	vars.push(`--secondary: hsl(${hexToHSL(theme.muted)}) !important;`);
	vars.push(`--secondary-foreground: hsl(${hexToHSL(theme.foreground)}) !important;`);
	vars.push(`--ring: hsl(${hexToHSL(theme.mutedForeground)}) !important;`);

	// Sidebar tokens. Default to the page colors so the sidebar tracks the page
	// background; when colors.sidebarBackground is set, buildThemes derives a
	// sidebar bundle whose foreground/muted/border contrast its own surface.
	const sidebarBg = theme.sidebar?.background ?? theme.background;
	const sidebarFg = theme.sidebar?.foreground ?? theme.foreground;
	const sidebarAccent = theme.sidebar?.muted ?? theme.muted;
	const sidebarBorder = theme.sidebar?.border ?? theme.border;
	vars.push(`--sidebar: hsl(${hexToHSL(sidebarBg)}) !important;`);
	vars.push(`--sidebar-foreground: hsl(${hexToHSL(sidebarFg)}) !important;`);
	vars.push(`--sidebar-primary: hsl(${hexToHSL(sidebarFg)}) !important;`);
	vars.push(`--sidebar-primary-foreground: hsl(${hexToHSL(sidebarBg)}) !important;`);
	vars.push(`--sidebar-accent: hsl(${hexToHSL(sidebarAccent)}) !important;`);
	vars.push(`--sidebar-accent-foreground: hsl(${hexToHSL(sidebarFg)}) !important;`);
	vars.push(`--sidebar-border: hsl(${hexToHSL(sidebarBorder)}) !important;`);
	vars.push(`--sidebar-ring: hsl(${hexToHSL(sidebarFg)}) !important;`);

	// Card mode background (when card layout is configured)
	if (theme.cardLayout) {
		const cardLayoutBg = `hsl(${hexToHSL(theme.cardLayout.background)})`;
		vars.push(`--card-mode-background: ${cardLayoutBg} !important;`);
		// Set --color-* alias for scoped CSS compatibility (needed for editor route)
		vars.push(`--color-card-mode-background: ${cardLayoutBg} !important;`);
	}

	// Add default palette as individual variables
	const palette = theme.colorPalettes.default ?? [];
	palette.forEach((color: string, i: number) => {
		vars.push(`--palette-${i}: ${color};`);
	});

	// Add color scale
	const scale = theme.colorScales.default ?? [];
	scale.forEach((color: string, i: number) => {
		vars.push(`--scale-${i}: ${color};`);
	});

	return vars.join('\n');
}

/**
 * Mode-independent vars from config-level tokens (fonts, radius, depth,
 * density). Emitted once in the main scoped/:root block; the .dark block only
 * redefines colors, so these carry over.
 */
/**
 * Build the shadow value for a depth level with a color derived from the page
 * background: on light surfaces the shadow is a darker tint of the surface
 * itself (warm backgrounds get warm shadows instead of neutral gray); on dark
 * surfaces plain black at slightly higher alpha keeps shadows perceptible.
 */
export function buildDepthShadow(depth: ThemeDepth, background: string): string {
	const geometry = DEPTH_SHADOW_GEOMETRY[depth];
	if (geometry.length === 0) return '0 0 #0000';

	let tint: chroma.Color;
	let alphaBoost = 1;
	try {
		const base = chroma(background);
		if (base.luminance() < 0.5) {
			tint = chroma('black');
			alphaBoost = 3;
		} else {
			tint = base.darken(3).desaturate(0.3);
		}
	} catch {
		tint = chroma('black');
	}

	return geometry
		.map((g) => `${g.offsets} ${tint.alpha(Math.min(1, g.alpha * alphaBoost)).css()}`)
		.join(', ');
}

/**
 * Convert the baseFontSize token to the unitless multiplier the --text-* scale
 * is built on (16px = 1). rem/em values are already relative to the 16px root.
 */
export function fontScaleFromBaseFontSize(baseFontSize: string): number {
	const value = parseFloat(baseFontSize);
	if (Number.isNaN(value) || value <= 0) return 1;
	return baseFontSize.endsWith('px') ? value / 16 : value;
}

function generateConfigCSSVars(config: ThemeConfig): string {
	const spacing = DENSITY_SPACING[config.density];
	const fontScale = Math.round(fontScaleFromBaseFontSize(config.baseFontSize) * 10000) / 10000;
	const vars = [
		`--radius: ${normalizeRadius(config.radius)} !important;`,
		`--theme-font-heading: ${FONT_FAMILY_STACKS[config.fonts.heading]} !important;`,
		`--theme-font-body: ${FONT_FAMILY_STACKS[config.fonts.body]} !important;`,
		`--theme-font-mono: ${FONT_FAMILY_STACKS[config.fonts.mono]} !important;`,
		`--theme-font-scale: ${fontScale} !important;`,
		`--theme-report-gap: ${spacing.gap} !important;`,
		`--theme-block-gap: ${spacing.blockGap} !important;`,
		`--theme-card-padding: ${spacing.cardPadding} !important;`
	];
	// Only emit the sidebar font size when set; the published sidebar's CSS falls
	// back to the baseFontSize-scaled default so unset themes are unchanged.
	if (config.sidebarFontSize) {
		vars.push(`--theme-sidebar-font-size: ${config.sidebarFontSize} !important;`);
	}
	return vars.join('\n');
}

/**
 * Generate CSS variables for both light and dark modes from ThemeConfig
 * Returns CSS string that can be injected into <svelte:head>
 */
interface ThemeCSSOptions {
	scopeSelector?: string;
	/** Only generate light mode CSS (useful for PDFs/printing to avoid dark backgrounds) */
	lightModeOnly?: boolean;
}

export function generateThemeCSS(config: ThemeConfig, options: ThemeCSSOptions = {}): string {
	const themes = buildThemes(config);

	const configVars = generateConfigCSSVars(config);
	// Shadow color derives from the mode's background, so it's per-mode unlike
	// the rest of the config-level tokens
	const lightShadow = `--theme-shadow-xs: ${buildDepthShadow(config.depth, themes.light.background)} !important;`;
	const darkShadow = `--theme-shadow-xs: ${buildDepthShadow(config.depth, themes.dark.background)} !important;`;
	const lightVars =
		generateThemeCSSVarsFromTheme(themes.light, 'light') + '\n' + configVars + '\n' + lightShadow;
	const darkVars = generateThemeCSSVarsFromTheme(themes.dark, 'dark') + '\n' + darkShadow;

	const scopeSelector = options.scopeSelector ?? ':root';
	const darkScopeSelector = options.scopeSelector ? `.dark ${options.scopeSelector}` : '.dark';
	// Only include body background styles when not scoped (i.e., applying to full page)
	const includeBodyBackground = !options.scopeSelector;

	let css = '';

	if (options.lightModeOnly) {
		// PDF/Print mode: only generate light mode CSS
		css = `
			${scopeSelector} {
				${lightVars}
			}
		`;

		if (includeBodyBackground) {
			css += `
			body {
				background-color: ${themes.light.background};
				color: ${themes.light.foreground};
			}
			`;
		}
	} else {
		// Normal mode: generate both light and dark CSS
		css = `
		${scopeSelector} {
			${lightVars}
		}
		${darkScopeSelector} {
			${darkVars}
		}
	`;

		if (includeBodyBackground) {
			css += `
		body {
			background-color: ${themes.light.background};
			color: ${themes.light.foreground};
		}
		.dark body {
			background-color: ${themes.dark.background};
			color: ${themes.dark.foreground};
		}
		`;
		}
	}

	// Scoped mode (editor preview): popovers/selects/date-pickers portal to
	// document.body and escape the scope. Report-surface overlay content
	// carries the marker class so ONLY those overlays re-receive the theme
	// vars — editor-chrome overlays (Share menu etc.) must never be themed.
	if (options.scopeSelector) {
		css += `
		.${PAGE_THEME_OVERLAY_CLASS} {
			${lightVars}
		}
		.dark .${PAGE_THEME_OVERLAY_CLASS} {
			${darkVars}
		}
		`;
	}

	// Card mode: Two simple contexts
	// Context 1: On the blue page background (outside cards)
	// Context 2: Inside white cards

	// Build selectors with optional scope prefix
	const cardModeSelector = options.scopeSelector
		? `${options.scopeSelector} .bg-card-mode-background`
		: '.bg-card-mode-background';
	const cardSelector = options.scopeSelector
		? `${options.scopeSelector} .bg-card-mode-background .bg-card`
		: '.bg-card-mode-background .bg-card';
	const darkCardModeSelector = options.scopeSelector
		? `.dark ${options.scopeSelector} .bg-card-mode-background`
		: '.dark .bg-card-mode-background';
	const darkCardSelector = options.scopeSelector
		? `.dark ${options.scopeSelector} .bg-card-mode-background .bg-card`
		: '.dark .bg-card-mode-background .bg-card';

	// CONTEXT 1: Everything on the page background should use cardLayout foreground
	if (themes.light.cardLayout) {
		css += `
		/* All text on card mode background */
		${cardModeSelector},
		${cardModeSelector} .prose,
		${cardModeSelector} .prose code,
		${cardModeSelector} .prose p,
		${cardModeSelector} .prose ul,
		${cardModeSelector} .prose ol,
		${cardModeSelector} .prose li,
		${cardModeSelector} .prose h1,
		${cardModeSelector} .prose h2,
		${cardModeSelector} .prose h3,
		${cardModeSelector} .prose h4,
		${cardModeSelector} .prose h5,
		${cardModeSelector} .prose h6 {
			color: ${themes.light.cardLayout.foreground} !important;
		}
		`;
	}
	if (themes.dark.cardLayout) {
		css += `
		${darkCardModeSelector},
		${darkCardModeSelector} .prose,
		${darkCardModeSelector} .prose code,
		${darkCardModeSelector} .prose p,
		${darkCardModeSelector} .prose ul,
		${darkCardModeSelector} .prose ol,
		${darkCardModeSelector} .prose li,
		${darkCardModeSelector} .prose h1,
		${darkCardModeSelector} .prose h2,
		${darkCardModeSelector} .prose h3,
		${darkCardModeSelector} .prose h4,
		${darkCardModeSelector} .prose h5,
		${darkCardModeSelector} .prose h6 {
			color: ${themes.dark.cardLayout.foreground} !important;
		}
		`;
	}

	// CONTEXT 2: Inside cards should use CARD colors
	// Redefine CSS variables so components automatically adapt
	if (themes.light.card) {
		css += `
		${cardSelector} {
			/* Redefine CSS variables to card-derived colors */
			--background: hsl(${hexToHSL(themes.light.card.background)});
			--foreground: hsl(${hexToHSL(themes.light.card.foreground)});
			--muted: hsl(${hexToHSL(themes.light.card.muted)});
			--muted-foreground: hsl(${hexToHSL(themes.light.card.mutedForeground)});
			--accent: hsl(${hexToHSL(themes.light.card.muted)});
			--border: hsl(${hexToHSL(themes.light.card.border)});
			--input: hsl(${hexToHSL(themes.light.card.border)});
			--input-surface: hsl(${hexToHSL(themes.light.card.inputSurface)});
			${tableCSSVars(
				themes.light.table,
				{
					background: themes.light.card.background,
					border: themes.light.card.border,
					muted: themes.light.card.muted
				},
				'light'
			).join('\n\t\t\t')}
		}
		`;
	}
	if (themes.dark.card) {
		css += `
		${darkCardSelector} {
			--background: hsl(${hexToHSL(themes.dark.card.background)});
			--foreground: hsl(${hexToHSL(themes.dark.card.foreground)});
			--muted: hsl(${hexToHSL(themes.dark.card.muted)});
			--muted-foreground: hsl(${hexToHSL(themes.dark.card.mutedForeground)});
			--accent: hsl(${hexToHSL(themes.dark.card.muted)});
			--border: hsl(${hexToHSL(themes.dark.card.border)});
			--input: hsl(${hexToHSL(themes.dark.card.border)});
			--input-surface: hsl(${hexToHSL(themes.dark.card.inputSurface)});
			${tableCSSVars(
				themes.dark.table,
				{
					background: themes.dark.card.background,
					border: themes.dark.card.border,
					muted: themes.dark.card.muted
				},
				'dark'
			).join('\n\t\t\t')}
		}
		`;
	}

	// Text inside cards
	if (themes.light.card) {
		css += `
		/* Text inside cards - light mode */
		${cardSelector},
		${cardSelector} .prose,
		${cardSelector} .prose code,
		${cardSelector} .prose p,
		${cardSelector} .prose ul,
		${cardSelector} .prose ol,
		${cardSelector} .prose li,
		${cardSelector} .prose h1,
		${cardSelector} .prose h2,
		${cardSelector} .prose h3,
		${cardSelector} .prose h4,
		${cardSelector} .prose h5,
		${cardSelector} .prose h6 {
			color: ${themes.light.card.foreground} !important;
		}
		`;
	}
	if (themes.dark.card) {
		css += `
		/* Text inside cards - dark mode */
		${darkCardSelector},
		${darkCardSelector} .prose,
		${darkCardSelector} .prose code,
		${darkCardSelector} .prose p,
		${darkCardSelector} .prose ul,
		${darkCardSelector} .prose ol,
		${darkCardSelector} .prose li,
		${darkCardSelector} .prose h1,
		${darkCardSelector} .prose h2,
		${darkCardSelector} .prose h3,
		${darkCardSelector} .prose h4,
		${darkCardSelector} .prose h5,
		${darkCardSelector} .prose h6 {
			color: ${themes.dark.card.foreground} !important;
		}
		`;
	}

	return css;
}
