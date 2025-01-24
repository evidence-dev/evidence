import z from 'zod';
import { DeepRequired } from 'ts-essentials';

import { BUILTIN_COLORS, COMPUTED_COLORS, REQUIRED_COLORS, ThemeColorsSchema } from './colors.js';
import { BUILTIN_COLOR_PALETTES } from './colorPalettes.js';
import { BUILTIN_COLOR_SCALES } from './colorScales.js';
import { ThemesConfigFileSchema } from './config.js';

type BuiltinColor = (typeof BUILTIN_COLORS)[number];
type BuiltinColorPalette = (typeof BUILTIN_COLOR_PALETTES)[number];
type BuiltinColorScale = (typeof BUILTIN_COLOR_SCALES)[number];

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

export type Theme = {
	colors: {
		[builtinColor in BuiltinColor]: string;
	} & Record<string, string | undefined>;
	colorPalettes: {
		[builtinColorPalette in BuiltinColorPalette]: string[];
	} & Record<string, string[] | undefined>;
	colorScales: {
		[builtinColorScale in BuiltinColorScale]: string[];
	} & Record<string, string[] | undefined>;
};

export type ThemesConfigFile = z.infer<typeof ThemesConfigFileSchema>;
export type ThemesConfig = DeepRequired<ThemesConfigFile>;

export type Themes = Record<'light' | 'dark', Theme>;
