import z from 'zod';

const ThemeSchema = z.object({
	primary: z.string(),
	'primary-content': z.string(),
	secondary: z.string(),
	'secondary-content': z.string(),
	accent: z.string(),
	'accent-content': z.string(),
	neutral: z.string(),
	'neutral-content': z.string(),
	'base-100': z.string(),
	'base-200': z.string(),
	'base-300': z.string(),
	'base-content': z.string(),
	info: z.string(),
	'info-content': z.string(),
	positive: z.string(),
	'positive-content': z.string(),
	negative: z.string(),
	'negative-content': z.string(),
	warning: z.string(),
	'warning-content': z.string()
});
/** @typedef {z.infer<typeof ThemeSchema>} Theme */

/** @typedef {Record<'light' | 'dark', Theme>} Themes */

const ThemeConfigSchema = ThemeSchema.partial();
/** @typedef {z.infer<typeof ThemeConfigSchema>} ThemeConfig */

const ThemesConfigSchema = z.object({
	light: ThemeConfigSchema.nullish().transform((value) => value ?? /** @type {ThemeConfig} */ ({})),
	dark: ThemeConfigSchema.nullish().transform((value) => value ?? /** @type {ThemeConfig} */ ({}))
});
/** @typedef {z.infer<typeof ThemesConfigSchema>} ThemesConfig */

export const ThemesConfigFileSchema = z.object({
	themes: ThemesConfigSchema.nullish().transform(
		(value) => value ?? /** @type {ThemesConfig} */ ({})
	)
});
/** @typedef {z.infer<typeof ThemesConfigFileSchema>} ThemesConfigFile */
