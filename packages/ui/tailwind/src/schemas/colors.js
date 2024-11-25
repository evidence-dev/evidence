// @ts-check

import { z } from 'zod';
import { fromEntries } from './utils.js';

export const BUILTIN_COLORS = /** @type {const} */ ([
	'primary',
	'primary-content',
	'accent',
	'accent-content',
	'base-100',
	'base-200',
	'base-300',
	'base-heading',
	'base-content',
	'base-content-muted',
	'info',
	'info-content',
	'positive',
	'positive-content',
	'negative',
	'negative-content',
	'warning',
	'warning-content'
]);

export const BUILTIN_COLOR_ALIASES =
	/**
	 * @type {const}
	 * @satisfies {Record<string, import('./types.js').BuiltinColor>}
	 */
	({
		// We have to alias this here because we can't use `base` as a color because it conflicts with Tailwind's text-base class
		base: 'base-100'
	});

export const ThemeColorSchema = z.object({
	light: z.string(),
	dark: z.string()
});

export const ThemeColorsSchema = z
	.object(
		fromEntries(
			BUILTIN_COLORS.map((color) => /** @type {const} */ ([color, ThemeColorSchema.partial()]))
		)
	)
	.partial()
	.catchall(ThemeColorSchema)
	.transform((colors) => {
		const result = { ...colors };
		for (const [alias, color] of Object.entries(BUILTIN_COLOR_ALIASES)) {
			if (result[alias]) {
				result[color] = result[alias];
				delete result[alias];
			}
		}
		return result;
	});
