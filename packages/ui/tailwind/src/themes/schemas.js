import z from 'zod';

import { fromEntries } from './fromEntries.js';

/**
 * @template {z.ZodObject<any>} S
 * @param {S} schema
 */
const DefaultEmptyObject = (schema) =>
	schema.nullish().transform((value) => /** @type {Partial<z.infer<S>>} */ (value ?? {}));

export const ThemeColorSchema = z.object({
	light: z.string(),
	dark: z.string()
});

export const BUILTIN_COLOR_TOKENS = /** @type {const} */ ([
	'primary',
	'primary-content',
	'secondary',
	'secondary-content',
	'accent',
	'accent-content',
	'neutral',
	'neutral-content',
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

export const ThemesConfigFileSchema = z.object({
	themes: DefaultEmptyObject(
		z.object({
			defaultAppearance: z
				.union([z.literal('light'), z.literal('dark'), z.literal('system')])
				.default('light'),
			appearanceSwitcher: z.boolean().default(false),
			colors: DefaultEmptyObject(
				z
					.object(
						fromEntries(
							BUILTIN_COLOR_TOKENS.map(
								(color) => /** @type {const} */ ([color, ThemeColorSchema.partial()])
							)
						)
					)
					.partial()
					.catchall(ThemeColorSchema)
			)
		})
	)
});
