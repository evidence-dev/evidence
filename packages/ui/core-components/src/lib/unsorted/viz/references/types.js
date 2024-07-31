export const PRESET_COLORS = /** @type {const} */ (['red', 'green', 'yellow', 'grey', 'blue']);

/** @typedef {typeof PRESET_COLORS[number]} PresetColor */

/**
 * @param {unknown} s
 * @returns {s is PresetColor}
 */
export const isPresetColor = (s) => PRESET_COLORS.includes(s);

// Hack to prevent typescript from reducing this type to just `string`
// See: https://stackoverflow.com/a/61048124
/** @typedef {PresetColor | (string & {})} ReferenceColor */

/** @typedef {'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond' | 'pin' | 'arrow' | 'none' | `path://${string}`} Symbol */
