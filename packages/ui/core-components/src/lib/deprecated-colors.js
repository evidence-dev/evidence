/** @typedef {keyof typeof DEPRECATED_COLOR_MAP} DeprecatedColor */

/**
 * @param {unknown} input
 * @returns {input is DeprecatedColor}
 */
export const isDeprecatedColor = (input) => Object.keys(DEPRECATED_COLOR_MAP).includes(input);

export const DEPRECATED_COLOR_MAP = /** @type {const} */ ({
	grey: 'base-content-muted',
	blue: 'info',
	green: 'positive',
	yellow: 'warning',
	red: 'negative',
	bluegreen: 'positive'
});

/**
 * @template T
 * @param {string} component
 * @param {string} name
 * @param {T} value
 * @returns {T | string}
 */
export const checkDeprecatedColor = (component, name, value) => {
	if (isDeprecatedColor(value)) {
		console.warn(
			`[${component}] ${name}=${value} is deprecated. Please use a color from the theme, or a valid color string.`
		);
		return DEPRECATED_COLOR_MAP[value];
	}
	return value;
};
