import { z } from 'zod';
import { fromEntries } from './utils.js';

export const BUILTIN_COLORS = /** @type {const} */ ([
	'primary',
	'primary-content',
	'secondary',
	'secondary-content',
	'accent',
	'accent-content',
	'base-100',
	'base-200',
	'base-300',
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
	.catchall(ThemeColorSchema);
