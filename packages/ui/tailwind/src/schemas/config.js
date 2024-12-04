import z from 'zod';

import { DefaultEmptyObject } from './utils.js';
import { ThemeColorsSchema } from './colors.js';
import { ThemeColorPalettesSchema } from './colorPalettes.js';
import { ThemeColorScalesSchema } from './colorScales.js';

export const ThemesConfigFileSchema = DefaultEmptyObject(
	z.object({
		appearance: DefaultEmptyObject(
			z.object({
				default: z
					.union([z.literal('light'), z.literal('dark'), z.literal('system')])
					.default('light'),
				switcher: z.boolean().default(false)
			})
		),
		theme: DefaultEmptyObject(
			z
				.object({
					colors: DefaultEmptyObject(ThemeColorsSchema),
					colorPalettes: DefaultEmptyObject(ThemeColorPalettesSchema),
					colorScales: DefaultEmptyObject(ThemeColorScalesSchema)
				})
				.strict()
		)
	})
);
