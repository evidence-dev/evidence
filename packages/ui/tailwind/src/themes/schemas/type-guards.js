import { BUILTIN_COLORS } from './colors.js';
import { BUILTIN_COLOR_PALETTES } from './colorPalettes.js';
import { BUILTIN_COLOR_SCALES } from './colorScales.js';

/**
 * @param {unknown} color
 * @returns {color is import('./types.js').BuiltinColor}
 */
export const isBuiltinColor = (color) => BUILTIN_COLORS.includes(/** @type {any} */ (color));

/**
 * @param {unknown} color
 * @returns {color is import('./types.js').BuiltinColorPalette}
 */
export const isBuiltinColorPalette = (color) =>
	BUILTIN_COLOR_PALETTES.includes(/** @type {any} */ (color));

/**
 * @param {unknown} color
 * @returns {color is import('./types.js').BuiltinColorScale}
 */
export const isBuiltinColorScale = (color) =>
	BUILTIN_COLOR_SCALES.includes(/** @type {any} */ (color));
