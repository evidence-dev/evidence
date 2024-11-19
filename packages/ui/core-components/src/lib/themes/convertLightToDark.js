import chroma from 'chroma-js';

/**
 * @param {unknown} lightColor
 * @returns {string | undefined}
 */
export const convertLightToDark = (lightColor) => {
	if (!chroma.valid(lightColor)) return undefined;

	const color = chroma(lightColor);
	const white = chroma('white');
	const black = chroma('black');

	// Calculate relative luminance difference in light mode
	const lightModeLuminance = color.luminance();
	const lightModeRatio = Math.abs(lightModeLuminance - white.luminance());

	// Find dark mode color with similar luminance difference from black
	const targetLuminance = black.luminance() + lightModeRatio;

	// Adjust hue and saturation while targeting new luminance
	return color
		.set('hsl.l', targetLuminance)
		.saturate(0.1) // Slightly increase saturation to compensate for dark background
		.hex();
};
