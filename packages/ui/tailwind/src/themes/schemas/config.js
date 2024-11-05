import z from 'zod';

import { DefaultEmptyObject } from './utils.js';
import { ThemeColorsSchema } from './colors.js';
import { ThemeColorPalettesSchema } from './colorPalettes.js';
import { ThemeColorScalesSchema } from './colorScales.js';

export const ThemesConfigFileSchema = z.object({
	themes: DefaultEmptyObject(
		z.object({
			defaultAppearance: z
				.union([z.literal('light'), z.literal('dark'), z.literal('system')])
				.default('light'),
			appearanceSwitcher: z.boolean().default(false),
			colors: DefaultEmptyObject(ThemeColorsSchema),
			colorPalettes: DefaultEmptyObject(ThemeColorPalettesSchema),
			colorScales: DefaultEmptyObject(ThemeColorScalesSchema)
		})
	)
});
