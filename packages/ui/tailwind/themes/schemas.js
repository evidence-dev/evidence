import z from 'zod';

const ThemeSchema = z.object({
	mySemanticColor: z.string().optional()
});

export const ThemesConfigSchema = z.object({
	themes: z
		.object({
			light: ThemeSchema.nullish().transform((value) => value ?? /** @type {typeof value} */ ({})),
			dark: ThemeSchema.nullish().transform((value) => value ?? /** @type {typeof value} */ ({}))
		})
		.nullish()
		.transform((value) => value ?? /** @type {typeof value} */ ({}))
});

/** @typedef {z.infer<typeof ThemesConfigSchema>['themes']} Themes */
