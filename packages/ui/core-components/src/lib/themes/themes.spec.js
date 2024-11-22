// @ts-check

/** @template T @typedef {import('svelte/store').Readable<T>} Readable */
import { vi, describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { ThemeStores } from './themes.js';

vi.mock('./convertLightToDark.js', () => ({
	/**
	 * @param {string} lightColor
	 * @returns {string}
	 */
	convertLightToDark: (lightColor) => `${lightColor}_dark`
}));

vi.mock('$evidence/themes', () => ({
	themesConfig: {
		themes: {
			defaultAppearance: 'light'
		}
	},
	themes: {
		light: {
			colors: {
				'base-100': 'light_base-100',
				myColor1: 'light_myColor1',
				myColor2: 'light_myColor2',
				lightOnly: '#abcdef',
				scaleWithSameNameAsColor: 'light_scaleWithSameNameAsColor'
			},
			colorPalettes: {
				myColorPalette1: [
					'light_myColorPalette1_color1',
					'light_myColorPalette1_color2',
					'light_myColorPalette1_color3'
				],
				myColorPalette2: [
					'light_myColorPalette2_color1',
					'light_myColorPalette2_color2',
					'light_myColorPalette2_color3'
				]
			},
			colorScales: {
				myColorScale1: ['light_myColorScale1_color1', 'light_myColorScale1_color2'],
				myColorScale2: ['light_myColorScale2_color1', 'light_myColorScale2_color2'],
				scaleWithSameNameAsColor: [
					'light_scaleWithSameNameAsColor_color1',
					'light_scaleWithSameNameAsColor_color2'
				]
			}
		},
		dark: {
			colors: {
				'base-100': 'dark_base-100',
				myColor1: 'dark_myColor1',
				myColor2: 'dark_myColor2',
				scaleWithSameNameAsColor: 'dark_scaleWithSameNameAsColor'
			},
			colorPalettes: {
				myColorPalette1: [
					'dark_myColorPalette1_color1',
					'dark_myColorPalette1_color2',
					'dark_myColorPalette1_color3'
				],
				myColorPalette2: [
					'dark_myColorPalette2_color1',
					'dark_myColorPalette2_color2',
					'dark_myColorPalette2_color3'
				]
			},
			colorScales: {
				myColorScale1: ['dark_myColorScale1_color1', 'dark_myColorScale1_color2'],
				myColorScale2: ['dark_myColorScale2_color1', 'dark_myColorScale2_color2'],
				scaleWithSameNameAsColor: [
					'dark_scaleWithSameNameAsColor_color1',
					'dark_scaleWithSameNameAsColor_color2'
				]
			}
		}
	}
}));

describe('ThemeStores', async () => {
	const {
		setAppearance,
		resolveColor,
		resolveColorsObject,
		resolveColorPalette,
		resolveColorScale
	} = new ThemeStores();

	describe('resolveColor', () => {
		it('should leave undefined as-is', () => {
			const store = resolveColor(undefined);

			setAppearance('light');
			expect(get(store)).toEqual(undefined);

			setAppearance('dark');
			expect(get(store)).toEqual(undefined);
		});

		it('should convert single hex color to dark mode', () => {
			const store = resolveColor('#abcdef');

			setAppearance('light');
			expect(get(store)).toEqual('#abcdef');

			setAppearance('dark');
			expect(get(store)).toEqual('#abcdef_dark');
		});

		it('should convert light-only theme color to dark mode', () => {
			const store = resolveColor('lightOnly');

			setAppearance('light');
			expect(get(store)).toEqual('#abcdef');

			setAppearance('dark');
			expect(get(store)).toEqual('#abcdef_dark');
		});

		it('should resolve colors in theme', () => {
			const store = resolveColor('myColor1');

			setAppearance('light');
			expect(get(store)).toEqual('light_myColor1');

			setAppearance('dark');
			expect(get(store)).toEqual('dark_myColor1');
		});

		it('should resolve colors in theme and ignore extraneous whitespace', () => {
			const store = resolveColor('  myColor2  ');

			setAppearance('light');
			expect(get(store)).toEqual('light_myColor2');

			setAppearance('dark');
			expect(get(store)).toEqual('dark_myColor2');
		});

		it('should resolve tuple of hex codes', () => {
			const store = resolveColor(['#abcdef', '#fedcba']);

			setAppearance('light');
			expect(get(store)).toEqual('#abcdef');

			setAppearance('dark');
			expect(get(store)).toEqual('#fedcba');
		});

		it('should resolve a tuple of just one hex code', () => {
			const store = resolveColor(['#abcdef']);

			setAppearance('light');
			expect(get(store)).toEqual('#abcdef');

			setAppearance('dark');
			expect(get(store)).toEqual('#abcdef_dark');
		});

		it('should resolve tuple of theme colors', () => {
			const store = resolveColor(['myColor1', 'myColor2']);

			setAppearance('light');
			expect(get(store)).toEqual('light_myColor1');

			setAppearance('dark');
			expect(get(store)).toEqual('dark_myColor2');
		});

		it('should resolve a tuple of just one theme color', () => {
			const store = resolveColor(['lightOnly']);

			setAppearance('light');
			expect(get(store)).toEqual('#abcdef');

			setAppearance('dark');
			expect(get(store)).toEqual('#abcdef_dark');
		});
	});

	describe('resolveColorsObject', () => {
		it('should leave undefined as-is', () => {
			const store = resolveColorsObject(undefined);

			setAppearance('light');
			expect(get(store)).toEqual(undefined);

			setAppearance('dark');
			expect(get(store)).toEqual(undefined);
		});

		it('should convert single hex color to dark mode', () => {
			const store = resolveColorsObject({ key1: '#abcdef' });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: '#abcdef' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: '#abcdef_dark' });
		});

		it('should convert light-only theme color to dark mode', () => {
			const store = resolveColorsObject({ key1: 'lightOnly' });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: '#abcdef' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: '#abcdef_dark' });
		});

		it('should resolve colors in theme', () => {
			const store = resolveColorsObject({ key1: 'myColor1' });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: 'light_myColor1' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: 'dark_myColor1' });
		});

		it('should resolve colors in theme and ignore extraneous whitespace', () => {
			const store = resolveColorsObject({ key1: '  myColor2  ' });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: 'light_myColor2' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: 'dark_myColor2' });
		});

		it('should resolve tuple of hex codes', () => {
			const store = resolveColorsObject({ key1: ['#abcdef', '#fedcba'] });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: '#abcdef' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: '#fedcba' });
		});

		it('should resolve a tuple of just one hex code', () => {
			const store = resolveColorsObject({ key1: ['#abcdef'] });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: '#abcdef' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: '#abcdef_dark' });
		});

		it('should resolve tuple of theme colors', () => {
			const store = resolveColorsObject({ key1: ['myColor1', 'myColor2'] });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: 'light_myColor1' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: 'dark_myColor2' });
		});

		it('should resolve a tuple of just one theme color', () => {
			const store = resolveColorsObject({ key1: ['lightOnly'] });

			setAppearance('light');
			expect(get(store)).toEqual({ key1: '#abcdef' });

			setAppearance('dark');
			expect(get(store)).toEqual({ key1: '#abcdef_dark' });
		});

		it('should resolve an object with multiple types of color values', () => {
			const store = resolveColorsObject({
				key1: undefined,
				key2: '#abcdef',
				key3: 'lightOnly',
				key4: 'myColor1',
				key5: '  myColor2  ',
				key6: ['#abcdef', '#fedcba'],
				key7: ['#abcdef'],
				key8: ['myColor1', 'myColor2'],
				key9: ['lightOnly']
			});

			setAppearance('light');
			expect(get(store)).toEqual({
				key1: undefined,
				key2: '#abcdef',
				key3: '#abcdef',
				key4: 'light_myColor1',
				key5: 'light_myColor2',
				key6: '#abcdef',
				key7: '#abcdef',
				key8: 'light_myColor1',
				key9: '#abcdef'
			});

			setAppearance('dark');
			expect(get(store)).toEqual({
				key1: undefined,
				key2: '#abcdef_dark',
				key3: '#abcdef_dark',
				key4: 'dark_myColor1',
				key5: 'dark_myColor2',
				key6: '#fedcba',
				key7: '#abcdef_dark',
				key8: 'dark_myColor2',
				key9: '#abcdef_dark'
			});
		});
	});

	describe('resolveColorPalette', () => {
		describe('using palette name', () => {
			it('should leave undefined as is', () => {
				const store = resolveColorPalette(undefined);

				setAppearance('light');
				expect(get(store)).toEqual(undefined);

				setAppearance('dark');
				expect(get(store)).toEqual(undefined);
			});

			it('should return undefined if color palette doesnt exist in theme', () => {
				const store = resolveColorPalette('nonExistentPalette');

				setAppearance('light');
				expect(get(store)).toEqual(undefined);

				setAppearance('dark');
				expect(get(store)).toEqual(undefined);
			});

			it('should resolve color palettes in theme', () => {
				const store = resolveColorPalette('myColorPalette1');

				setAppearance('light');
				expect(get(store)).toEqual([
					'light_myColorPalette1_color1',
					'light_myColorPalette1_color2',
					'light_myColorPalette1_color3'
				]);

				setAppearance('dark');
				expect(get(store)).toEqual([
					'dark_myColorPalette1_color1',
					'dark_myColorPalette1_color2',
					'dark_myColorPalette1_color3'
				]);
			});

			it('should resolve color palettes in theme and ignore extraneous whitespace', () => {
				const store = resolveColorPalette('  myColorPalette2  ');

				setAppearance('light');
				expect(get(store)).toEqual([
					'light_myColorPalette2_color1',
					'light_myColorPalette2_color2',
					'light_myColorPalette2_color3'
				]);

				setAppearance('dark');
				expect(get(store)).toEqual([
					'dark_myColorPalette2_color1',
					'dark_myColorPalette2_color2',
					'dark_myColorPalette2_color3'
				]);
			});
		});

		describe('using hardcoded colors', () => {
			it('should convert single hex color to dark mode', () => {
				const store = resolveColorPalette(['#abcdef']);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should convert light-only theme color to dark mode', () => {
				const store = resolveColorPalette(['lightOnly']);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should resolve colors in theme', () => {
				const store = resolveColorPalette(['myColor1']);

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColor1']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColor1']);
			});

			it('should resolve colors in theme and ignore extraneous whitespace', () => {
				const store = resolveColorPalette(['  myColor2  ']);

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColor2']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColor2']);
			});

			it('should resolve tuple of hex codes', () => {
				const store = resolveColorPalette([['#abcdef', '#fedcba']]);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#fedcba']);
			});

			it('should resolve a tuple of just one hex code', () => {
				const store = resolveColorPalette([['#abcdef']]);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should resolve tuple of theme colors', () => {
				const store = resolveColorPalette([['myColor1', 'myColor2']]);

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColor1']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColor2']);
			});

			it('should resolve a tuple of just one theme color', () => {
				const store = resolveColorPalette([['lightOnly']]);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should resolve a palette with multiple types of color values', () => {
				const store = resolveColorPalette([
					'#abcdef',
					'lightOnly',
					'myColor1',
					'  myColor2  ',
					['#abcdef', '#fedcba'],
					'#abcdef',
					['myColor1', 'myColor2'],
					'lightOnly'
				]);

				setAppearance('light');
				expect(get(store)).toEqual([
					'#abcdef',
					'#abcdef',
					'light_myColor1',
					'light_myColor2',
					'#abcdef',
					'#abcdef',
					'light_myColor1',
					'#abcdef'
				]);

				setAppearance('dark');
				expect(get(store)).toEqual([
					'#abcdef_dark',
					'#abcdef_dark',
					'dark_myColor1',
					'dark_myColor2',
					'#fedcba',
					'#abcdef_dark',
					'dark_myColor2',
					'#abcdef_dark'
				]);
			});
		});
	});

	describe('resolveColorScale', () => {
		describe('using scale name', () => {
			it('should leave undefined as is', () => {
				const store = resolveColorScale(undefined);

				setAppearance('light');
				expect(get(store)).toEqual(undefined);

				setAppearance('dark');
				expect(get(store)).toEqual(undefined);
			});

			it('should prefer scale name to color name', () => {
				const store = resolveColorScale('scaleWithSameNameAsColor');

				setAppearance('light');
				expect(get(store)).toEqual([
					'light_scaleWithSameNameAsColor_color1',
					'light_scaleWithSameNameAsColor_color2'
				]);

				setAppearance('dark');
				expect(get(store)).toEqual([
					'dark_scaleWithSameNameAsColor_color1',
					'dark_scaleWithSameNameAsColor_color2'
				]);
			});

			it('should return undefined if color scale doesnt exist in theme', () => {
				const store = resolveColorScale('nonExistentScale');

				setAppearance('light');
				expect(get(store)).toEqual(undefined);

				setAppearance('dark');
				expect(get(store)).toEqual(undefined);
			});

			it('should resolve color scales in theme', () => {
				const store = resolveColorScale('myColorScale1');

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColorScale1_color1', 'light_myColorScale1_color2']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColorScale1_color1', 'dark_myColorScale1_color2']);
			});

			it('should resolve color scales in theme and ignore extraneous whitespace', () => {
				const store = resolveColorScale('  myColorScale2  ');

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColorScale2_color1', 'light_myColorScale2_color2']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColorScale2_color1', 'dark_myColorScale2_color2']);
			});
		});

		describe('using single color', () => {
			it('should create scale using color name and base-100', () => {
				const store = resolveColorScale('myColor1');

				setAppearance('light');
				expect(get(store)).toEqual(['light_base-100', 'light_myColor1']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_base-100', 'dark_myColor1']);
			});

			it('should create scale hex color and base-100', () => {
				const store = resolveColorScale('#abcdef');

				setAppearance('light');
				expect(get(store)).toEqual(['light_base-100', '#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_base-100', '#abcdef']);
			});
		});

		describe('using multiple colors', () => {
			it('should convert single hex color to dark mode', () => {
				const store = resolveColorScale(['#abcdef']);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should convert light-only theme color to dark mode', () => {
				const store = resolveColorScale(['lightOnly']);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should resolve colors in theme', () => {
				const store = resolveColorScale(['myColor1']);

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColor1']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColor1']);
			});

			it('should resolve colors in theme and ignore extraneous whitespace', () => {
				const store = resolveColorScale(['  myColor2  ']);

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColor2']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColor2']);
			});

			it('should resolve tuple of hex codes', () => {
				const store = resolveColorScale([['#abcdef', '#fedcba']]);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#fedcba']);
			});

			it('should resolve a tuple of just one hex code', () => {
				const store = resolveColorScale([['#abcdef']]);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should resolve tuple of theme colors', () => {
				const store = resolveColorScale([['myColor1', 'myColor2']]);

				setAppearance('light');
				expect(get(store)).toEqual(['light_myColor1']);

				setAppearance('dark');
				expect(get(store)).toEqual(['dark_myColor2']);
			});

			it('should resolve a tuple of just one theme color', () => {
				const store = resolveColorScale([['lightOnly']]);

				setAppearance('light');
				expect(get(store)).toEqual(['#abcdef']);

				setAppearance('dark');
				expect(get(store)).toEqual(['#abcdef_dark']);
			});

			it('should resolve a scale with multiple types of color values', () => {
				const store = resolveColorScale([
					'#abcdef',
					'lightOnly',
					'myColor1',
					'  myColor2  ',
					['#abcdef', '#fedcba'],
					'#abcdef',
					['myColor1', 'myColor2'],
					'lightOnly'
				]);

				setAppearance('light');
				expect(get(store)).toEqual([
					'#abcdef',
					'#abcdef',
					'light_myColor1',
					'light_myColor2',
					'#abcdef',
					'#abcdef',
					'light_myColor1',
					'#abcdef'
				]);

				setAppearance('dark');
				expect(get(store)).toEqual([
					'#abcdef_dark',
					'#abcdef_dark',
					'dark_myColor1',
					'dark_myColor2',
					'#fedcba',
					'#abcdef_dark',
					'dark_myColor2',
					'#abcdef_dark'
				]);
			});
		});
	});
});
