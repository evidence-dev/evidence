import { DeepRequired } from 'ts-essentials';
import { ThemeColors } from '../../types.js';
import { REQUIRED_COLORS, COMPUTED_COLORS } from './constants.js';

export type RequiredColor = (typeof REQUIRED_COLORS)[number];
export type ComputedColor = (typeof COMPUTED_COLORS)[number];

export type RequiredThemeColors = DeepRequired<Pick<ThemeColors, RequiredColor>>;

export type ThemeColorsWithRequired = Partial<Omit<ThemeColors, RequiredColor>> &
	RequiredThemeColors;
