import z from 'zod';
import { DeepRequired } from 'ts-essentials';

import {
	ThemesConfigFileSchema,
	BUILTIN_COLORS,
	BUILTIN_COLOR_PALETTES,
	BUILTIN_COLOR_SCALES
} from './index.js';

export type BuiltinColor = (typeof BUILTIN_COLORS)[number];
export type BuiltinColorPalette = (typeof BUILTIN_COLOR_PALETTES)[number];
export type BuiltinColorScale = (typeof BUILTIN_COLOR_SCALES)[number];

export type ThemesConfigFile = z.infer<typeof ThemesConfigFileSchema>;
export type ThemesConfig = DeepRequired<ThemesConfigFile>;

export type Theme = {
	colors: {
		[builtinColor in BuiltinColor]: string;
	} & Record<string, string>;
	colorPalettes: {
		[builtinColorPalette in BuiltinColorPalette]: string[];
	} & Record<string, string[]>;
	colorScales: {
		[builtinColorScale in BuiltinColorScale]: string[];
	} & Record<string, string[]>;
};

export type Themes = Record<'light' | 'dark', Theme>;
