import { z } from 'zod';
import { fromEntries } from './utils.js';

export const BUILTIN_COLOR_SCALES = /** @type {const} */ ([]);

export const ThemeColorScaleSchema = z.object({
	light: z.array(z.string()),
	dark: z.array(z.string())
});

export const ThemeColorScalesSchema = z
	.object(
		fromEntries(
			BUILTIN_COLOR_SCALES.map(
				(color) => /** @type {const} */ ([color, ThemeColorScaleSchema.partial()])
			)
		)
	)
	.partial()
	.catchall(ThemeColorScaleSchema);
