import { z } from 'zod';
import { fromEntries } from './utils.js';

export const BUILTIN_COLOR_SCALES = /** @type {const} */ (['default']);

const BuiltinThemeColorScaleSchema = z
	.object({
		light: z.array(z.string()),
		dark: z.array(z.string())
	})
	.partial()
	.or(z.array(z.string()).transform((s) => ({ light: s, dark: s })));

const CustomThemeColorScaleSchema = z
	.object({
		light: z.array(z.string()),
		dark: z.array(z.string())
	})
	.or(z.array(z.string()).transform((s) => ({ light: s, dark: s })));

export const ThemeColorScalesSchema = z
	.object(
		fromEntries(
			BUILTIN_COLOR_SCALES.map(
				(color) => /** @type {const} */ ([color, BuiltinThemeColorScaleSchema])
			)
		)
	)
	.partial()
	.catchall(CustomThemeColorScaleSchema);
