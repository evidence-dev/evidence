import z from 'zod';
import { Builtin, DeepRequired } from 'ts-essentials';

import { BUILTIN_COLOR_TOKENS, ThemeColorSchema, ThemesConfigFileSchema } from './schemas.js';

export type BuiltinColorToken = (typeof BUILTIN_COLOR_TOKENS)[number];
export type ThemeColor = z.infer<typeof ThemeColorSchema>;
export type ThemesConfigFile = z.infer<typeof ThemesConfigFileSchema>;
export type ThemesConfig = DeepRequired<ThemesConfigFile>;
export type BuiltinColorToken = keyof ThemesConfig['themes']['colors'];

export type Theme = {
	colors: {
		[builtinColor in BuiltinColorToken]: string;
	} & Record<string, string>;
};

export type Themes = Record<'light' | 'dark', Theme>;

export * from './vite-plugin/evidence-themes.d.ts';
