import chroma from 'chroma-js';
import { isComputedColor, isRequiredColor } from './constants.js';
import { BUILTIN_COLORS } from '../../schemas/colors.js';

/** @typedef {import('../../schemas/types.js').ThemeColors} ThemeColors */

/**
 * @param {import('./types.js').ThemeColorsWithRequired} colors
 * @returns {import('ts-essentials').DeepRequired<ThemeColors>}
 */
export const computeShades = (colors) => {
	const computed = {};

	/**
	 * Compute base colors
	 */
	const base100Light = colors['base-100'].light;
	const base100Dark = colors['base-100'].dark;

	// Compute base-200 from base-100
	const base200Light = colors['base-200']?.light ?? darken(base100Light, 0.15);
	const base200Dark = colors['base-200']?.dark ?? brighten(base100Dark, 0.15);
	computed['base-200'] = {
		light: base200Light,
		dark: base200Dark
	};

	// Compute base-300 from base-200
	const base300Light = colors['base-300']?.light ?? darken(base200Light, 0.65);
	const base300Dark = colors['base-300']?.dark ?? brighten(base200Dark, 0.65);
	computed['base-300'] = {
		light: base300Light,
		dark: base300Dark
	};

	// Compute base-heading from base-100
	const baseHeadingLight = colors['base-heading']?.light ?? computeContentShade(base100Light);
	const baseHeadingDark = colors['base-heading']?.dark ?? computeContentShade(base100Dark);
	computed['base-heading'] = {
		light: baseHeadingLight,
		dark: baseHeadingDark
	};

	// Compute base-content from base-heading
	const baseContentLight = colors['base-content']?.light ?? brighten(baseHeadingLight, 0.9);
	const baseContentDark = colors['base-content']?.dark ?? darken(baseHeadingDark, 0.9);
	computed['base-content'] = {
		light: baseContentLight,
		dark: baseContentDark
	};

	// Compute base-content-muted from base-content
	const baseContentMutedLight =
		colors['base-content-muted']?.light ?? brighten(baseContentLight, 0.9);
	const baseContentMutedDark = colors['base-content-muted']?.dark ?? darken(baseContentDark, 0.9);
	computed['base-content-muted'] = {
		light: baseContentMutedLight,
		dark: baseContentMutedDark
	};

	/**
	 * Compute -content colors
	 */
	// Compute primary-content from primary
	const primaryContentLight =
		colors['primary-content']?.light ?? computeContentShade(colors.primary.light);
	const primaryContentDark =
		colors['primary-content']?.dark ?? computeContentShade(colors.primary.dark);
	computed['primary-content'] = {
		light: primaryContentLight,
		dark: primaryContentDark
	};

	// Compute accent-content from accent
	const accentContentLight =
		colors['accent-content']?.light ?? computeContentShade(colors.accent.light);
	const accentContentDark =
		colors['accent-content']?.dark ?? computeContentShade(colors.accent.dark);
	computed['accent-content'] = {
		light: accentContentLight,
		dark: accentContentDark
	};

	// Compute info-content from info
	const infoContentLight = colors['info-content']?.light ?? computeContentShade(colors.info.light);
	const infoContentDark = colors['info-content']?.dark ?? computeContentShade(colors.info.dark);
	computed['info-content'] = {
		light: infoContentLight,
		dark: infoContentDark
	};

	// Compute positive-content from positive
	const positiveContentLight =
		colors['positive-content']?.light ?? computeContentShade(colors.positive.light);
	const positiveContentDark =
		colors['positive-content']?.dark ?? computeContentShade(colors.positive.dark);
	computed['positive-content'] = {
		light: positiveContentLight,
		dark: positiveContentDark
	};

	const warningContentLight =
		colors['warning-content']?.light ?? computeContentShade(colors.warning.light);
	const warningContentDark =
		colors['warning-content']?.dark ?? computeContentShade(colors.warning.dark);
	computed['warning-content'] = {
		light: warningContentLight,
		dark: warningContentDark
	};

	// Compute negative-content from negative
	const negativeContentLight =
		colors['negative-content']?.light ?? computeContentShade(colors.negative.light);
	const negativeContentDark =
		colors['negative-content']?.dark ?? computeContentShade(colors.negative.dark);
	computed['negative-content'] = {
		light: negativeContentLight,
		dark: negativeContentDark
	};

	return BUILTIN_COLORS.reduce((acc, color) => {
		if (isRequiredColor(color)) {
			acc[color] = colors[color];
		} else if (isComputedColor(color)) {
			acc[color] = computed[color];
		}
		return acc;
	}, /** @type {import('ts-essentials').DeepRequired<ThemeColors>} */ ({}));
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
	return chroma.hsl(hue, saturation / 2, isDark(color) ? 0.975 : 0.025).hex();
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
