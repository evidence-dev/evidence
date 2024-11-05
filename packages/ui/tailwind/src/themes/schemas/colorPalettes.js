import { z } from 'zod';
import { fromEntries } from './utils.js';

export const BUILTIN_COLOR_PALETTES = /** @type {const} */ ([]);

export const ThemeColorPaletteSchema = z.object({
	light: z.array(z.string()),
	dark: z.array(z.string())
});

export const ThemeColorPalettesSchema = z
	.object(
		fromEntries(
			BUILTIN_COLOR_PALETTES.map(
				(color) => /** @type {const} */ ([color, ThemeColorPaletteSchema.partial()])
			)
		)
	)
	.partial()
	.catchall(ThemeColorPaletteSchema);
