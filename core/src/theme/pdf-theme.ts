import type { ThemeConfig } from '../types/theme';

/**
 * Create a PDF-optimized theme from a resolved theme
 *
 * For printing/PDF generation, we want to:
 * - Force all backgrounds to white (save printer ink) — when `forceLightBackground` is true
 * - Keep custom colors for charts, text, borders, etc.
 * - Only use light mode — when `forceLightBackground` is true
 *
 * When `forceLightBackground` is false, the theme is returned unchanged to respect
 * the user's current light/dark mode (e.g., dark-themed PDFs for dark mode viewers).
 *
 * @param theme - Fully resolved theme config (from org → project → page hierarchy)
 * @param options - Optional configuration
 * @param options.forceLightBackground - When true (default), forces white backgrounds for printing.
 *   When false, preserves the theme's original background colors for dark mode PDFs.
 * @returns PDF-optimized theme
 */
export function createPDFTheme(
	theme: ThemeConfig,
	options?: { forceLightBackground?: boolean }
): ThemeConfig {
	const forceLight = options?.forceLightBackground ?? true;

	if (!forceLight) {
		// Respect the theme's original backgrounds (dark mode PDFs)
		return theme;
	}

	return {
		...theme,
		colors: {
			...theme.colors,
			// Force white backgrounds for printing (save ink!)
			base: { light: '#ffffff', dark: '#ffffff' },
			card: { light: '#ffffff', dark: '#ffffff' },
			cardLayoutBackground: { light: '#ffffff', dark: '#ffffff' }
		}
	};
}
