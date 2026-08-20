import chroma from 'chroma-js';

/**
 * Shadcn token set derived from a single background color
 */
export interface ShadcnTokens {
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	border: string;
	// Default fill for input controls (dropdowns, button groups, text inputs).
	// Light: the surface itself (white) — inputs read via their border + shadow.
	// Dark: a raised tint above the background. Overridable via `colors.inputSurface`.
	inputSurface: string;
}

/**
 * Derive shadcn tokens directly from a background color
 * Uses chroma-js for perceptual color adjustments
 *
 * @param backgroundColor - Hex color for the background
 * @returns Complete set of shadcn tokens with proper contrast
 */
export function deriveShadcnTokens(backgroundColor: string): ShadcnTokens {
	const color = chroma(backgroundColor);
	const luminance = color.luminance();
	const isDark = luminance < 0.5;

	if (isDark) {
		// Dark background → derive ALL colors for consistency
		return {
			background: backgroundColor,
			foreground: '#f8fafc', // Fixed neutral for readability
			muted: color.brighten(0.4).hex(), // Slightly lighter background
			mutedForeground: color.brighten(3.5).desaturate(1.5).hex(), // Brighter for labels/charts
			border: color.brighten(1.0).hex(), // More visible border (increased from 0.8)
			inputSurface: color.brighten(0.55).hex() // Raised input fill: a touch above muted
		};
	} else {
		// Light background → derive ALL colors for consistency.
		// mutedForeground and border feed chart axis labels/subtitles and
		// gridlines/baselines respectively (see createTheme in echarts-themes.ts),
		// so their darken steps double as the default chart-typography weight.
		// From a white base these land ≈ #6a6a6a / #dcdcdc; custom bases stay
		// proportional. Also drives all *-muted-foreground / border app UI.
		return {
			background: backgroundColor,
			foreground: '#0f172a', // Fixed neutral for readability
			muted: color.darken(0.2).hex(), // Slightly darker background
			mutedForeground: color.darken(3.2).desaturate(1.5).hex(),
			border: color.darken(0.6).hex(),
			// Light inputs default to the surface itself (white on the default theme);
			// their border + shadow carry the shape. A tinted fill is opt-in via the token.
			inputSurface: backgroundColor
		};
	}
}
