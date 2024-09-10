import z from 'zod';

export const ThemesConfigSchema = z.object({
	themes: z
		.record(
			z.string(),
			z
				.object({
					mySemanticColor: z.string().optional()
				})
				.nullish()
				.transform((value) => value ?? {})
		)
		.nullish()
		.transform((value) => value ?? {})
});

/** @typedef {z.infer<typeof ThemesConfigSchema>['themes']} Themes */
