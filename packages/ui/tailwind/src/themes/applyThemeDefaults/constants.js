export const REQUIRED_COLORS =
	/**
	 * @satisfies {import('../../schemas/types.js').BuiltinColor[]}
	 * @type {const}
	 */
	(['primary', 'accent', 'base-100', 'info', 'positive', 'negative', 'warning']);

/**
 * @param {unknown} color
 * @returns {color is import('./types.js').RequiredColor}
 */
export const isRequiredColor = (color) => REQUIRED_COLORS.includes(/** @type {any} */ (color));

export const COMPUTED_COLORS =
	/**
	 * @satisfies {import('../../schemas/types.js').BuiltinColor[]}
	 * @type {const}
	 */
	([
		'primary-content',
		'accent-content',
		'base-200',
		'base-300',
		'base-heading',
		'base-content',
		'base-content-muted',
		'info-content',
		'positive-content',
		'negative-content',
		'warning-content'
	]);

/**
 * @param {unknown} color
 * @returns {color is import('./types.js').ComputedColor}
 */
export const isComputedColor = (color) => COMPUTED_COLORS.includes(/** @type {any} */ (color));
