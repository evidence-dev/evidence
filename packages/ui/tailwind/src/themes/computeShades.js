import chroma from 'chroma-js';
import { BUILTIN_COLORS } from '../schemas/colors.js';

const colorsWithContentShade = BUILTIN_COLORS.filter((color) => color.endsWith('-content')).map(
	(color) => color.replace('-content', '')
);

/**
 * @param {import('../schemas/types.js').ThemesConfigFile} config
 * @returns {import('../schemas/types.js').ThemesConfigFile}
 */
export const computeShades = (config) => {
	const colors = config.themes?.colors ?? {};

	// Generate -content shades
	colorsWithContentShade.forEach((colorName) => {
		const contentColorName = `${colorName}-content`;
		const color = colors[colorName];
		let contentColor = colors[contentColorName];
		if (color && !contentColor) {
			contentColor = {
				light: computeContentShade(color.light),
				dark: computeContentShade(color.dark)
			};
		}
		colors[contentColorName] = contentColor;
	});

	// Generate base shades
	colors['base-100'] = colors['base-100'] ?? {};
	colors['base-200'] = colors['base-200'] ?? {};
	colors['base-300'] = colors['base-300'] ?? {};

	if (colors['base-100'].light && !colors['base-200'].light) {
		colors['base-200'].light = darken(colors['base-100'].light, 0.25);
	}
	if (colors['base-200'].light && !colors['base-300'].light) {
		colors['base-300'].light = darken(colors['base-200'].light, 0.5);
	}

	if (colors['base-100'].dark && !colors['base-200'].dark) {
		colors['base-200'].dark = brighten(colors['base-100'].dark, 0.25);
	}
	if (colors['base-200'].dark && !colors['base-300'].dark) {
		colors['base-300'].dark = brighten(colors['base-200'].dark, 0.5);
	}

	// Generate base-content shades
	colors['base-content'] = colors['base-content'] ?? {};
	if (colors['base-100'].light && !colors['base-content'].light) {
		colors['base-content'].light = computeContentShade(colors['base-100'].light);
	}
	if (colors['base-100'].dark && !colors['base-content'].dark) {
		colors['base-content'].dark = computeContentShade(colors['base-100'].dark);
	}

	colors['base-content-muted'] = colors['base-content-muted'] ?? {};
	if (colors['base-100'].light && !colors['base-content-muted'].light) {
		colors['base-content-muted'].light = brighten(
			computeContentShade(colors['base-100'].light),
			1.5
		);
	}
	if (colors['base-100'].dark && !colors['base-content-muted'].dark) {
		colors['base-content-muted'].dark = darken(computeContentShade(colors['base-100'].dark), 1.5);
	}

	return {
		themes: {
			...config.themes,
			colors
		}
	};
};

/**
 * @param {string} color
 * @returns {boolean}
 */
const isDark = (color) => chroma.contrast(color, 'black') < chroma.contrast(color, 'white');

/**
 * @param {string} color
 * @returns {string}
 */
const computeContentShade = (color) => {
	const hue = chroma(color).get('hsl.h');
	const saturation = chroma(color).get('hsl.s');
	return chroma.hsl(hue, saturation / 2, isDark(color) ? 0.95 : 0.05).hex();
};

/**
 * @param {string} color
 * @param {number} amount
 */
const darken = (color, amount) => chroma(color).darken(amount).hex();

/**
 * @param {string} color
 * @param {number} amount
 */
const brighten = (color, amount) => chroma(color).brighten(amount).hex();
