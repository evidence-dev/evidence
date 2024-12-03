import { z } from 'zod';
import { fromEntries } from './utils.js';

export const BUILTIN_COLOR_PALETTES = /** @type {const} */ (['default']);

const BuiltinThemeColorPaletteSchema = z
	.object({
		light: z.array(z.string()),
		dark: z.array(z.string())
	})
	.partial()
	.or(z.array(z.string()).transform((s) => ({ light: s, dark: s })));

const CustomThemeColorPaletteSchema = z
	.object({
		light: z.array(z.string()),
		dark: z.array(z.string())
	})
	.or(z.array(z.string()).transform((s) => ({ light: s, dark: s })));

export const ThemeColorPalettesSchema = z
	.object(
		fromEntries(
			BUILTIN_COLOR_PALETTES.map(
				(color) => /** @type {const} */ ([color, BuiltinThemeColorPaletteSchema])
			)
		)
	)
	.partial()
	.catchall(CustomThemeColorPaletteSchema);
