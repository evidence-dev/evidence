import { describe, it, expect } from 'vitest';
import chroma from 'chroma-js';

import { applyThemeDefaults } from './applyThemeDefaults';

import { BUILTIN_COLORS } from '../../schemas/colors';
import { BUILTIN_COLOR_PALETTES } from '../../schemas/colorPalettes';
import { BUILTIN_COLOR_SCALES } from '../../schemas/colorScales';

describe('applyThemeDefaults', () => {
	describe('with empty input', () => {
		const input = {};

		describe('existence', () => {
			it.each(
				BUILTIN_COLORS.flatMap((color) => [
					{ color, mode: 'light' },
					{ color, mode: 'dark' }
				])
			)('should have $color color in $mode mode', ({ color, mode }) => {
				const actual = applyThemeDefaults(input);
				expect(actual.theme.colors[color][mode]).toBeDefined();
			});

			it.each(
				BUILTIN_COLOR_PALETTES.flatMap((colorPalette) => [
					{ colorPalette, mode: 'light' },
					{ colorPalette, mode: 'dark' }
				])
			)('should have $colorPalette color palette in $mode mode', ({ colorPalette, mode }) => {
				const actual = applyThemeDefaults(input);
				expect(actual.theme.colorPalettes[colorPalette][mode]).toBeDefined();
			});

			it.each(
				BUILTIN_COLOR_SCALES.flatMap((colorScale) => [
					{ colorScale, mode: 'light' },
					{ colorScale, mode: 'dark' }
				])
			)('should have $colorScale color scale in $mode mode', ({ colorScale, mode }) => {
				const actual = applyThemeDefaults(input);
				expect(actual.theme.colorScales[colorScale][mode]).toBeDefined();
			});
		});

		describe('contrast', () => {
			it.each([
				{ requiredColor: 'primary', computedColor: 'primary-content', mode: 'light' },
				{ requiredColor: 'accent', computedColor: 'accent-content', mode: 'light' },
				{ requiredColor: 'info', computedColor: 'info-content', mode: 'light' },
				{ requiredColor: 'positive', computedColor: 'positive-content', mode: 'light' },
				{ requiredColor: 'negative', computedColor: 'negative-content', mode: 'light' },
				{ requiredColor: 'warning', computedColor: 'warning-content', mode: 'light' },
				{ requiredColor: 'primary', computedColor: 'primary-content', mode: 'dark' },
				{ requiredColor: 'accent', computedColor: 'accent-content', mode: 'dark' },
				{ requiredColor: 'info', computedColor: 'info-content', mode: 'dark' },
				{ requiredColor: 'positive', computedColor: 'positive-content', mode: 'dark' },
				{ requiredColor: 'negative', computedColor: 'negative-content', mode: 'dark' },
				{ requiredColor: 'warning', computedColor: 'warning-content', mode: 'dark' }
			])(
				'should have contrast >= 4.5 between $requiredColor and $computedColor in $mode mode',
				({ requiredColor, computedColor, mode }) => {
					const actual = applyThemeDefaults(input);
					const requiredColorValue = actual.theme.colors[requiredColor][mode];
					const computedColorValue = actual.theme.colors[computedColor][mode];
					expect(
						chroma.contrast(requiredColorValue, computedColorValue),
						`Expected contrast between ${requiredColor} (${requiredColorValue}) and ${computedColor} (${computedColorValue}) to be greater than 4.5 in ${mode} mode`
					).toBeGreaterThan(4.5);
				}
			);

			it.each([
				{ bgColor: 'base-100', fgColor: 'base-heading', mode: 'light' },
				{ bgColor: 'base-100', fgColor: 'base-content', mode: 'light' },
				{ bgColor: 'base-100', fgColor: 'base-content-muted', mode: 'light' },
				{ bgColor: 'base-100', fgColor: 'base-heading', mode: 'dark' },
				{ bgColor: 'base-100', fgColor: 'base-content', mode: 'dark' },
				{ bgColor: 'base-100', fgColor: 'base-content-muted', mode: 'dark' }
			])(
				'should have contrast >= 4.5 between $bgColor and $fgColor in $mode mode',
				({ bgColor, fgColor, mode }) => {
					const actual = applyThemeDefaults(input);
					const bgColorValue = actual.theme.colors[bgColor][mode];
					const fgColorValue = actual.theme.colors[fgColor][mode];
					expect(
						chroma.contrast(bgColorValue, fgColorValue),
						`Expected contrast between ${bgColor} (${bgColorValue}) and ${fgColor} (${fgColorValue}) to be greater than 7 in ${mode} mode`
					).toBeGreaterThan(4.5);
				}
			);
		});
	});

	it('should preserve custom colors', () => {
		const actual = applyThemeDefaults({
			theme: {
				colors: {
					myCustomColor: {
						light: '#abcdef',
						dark: '#fedcba'
					}
				}
			}
		});

		expect(actual.theme.colors.myCustomColor?.light).toBe('#abcdef');
		expect(actual.theme.colors.myCustomColor?.dark).toBe('#fedcba');
	});
});
