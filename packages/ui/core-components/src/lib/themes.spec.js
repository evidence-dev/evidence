// @ts-check

/** @template T @typedef {import('svelte/store').Readable<T>} Readable */
import { vi, describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { ThemeStores } from './themes.js';

vi.mock('$evidence/themes', () => ({
	themesConfig: {
		themes: {
			defaultAppearance: 'light'
		}
	},
	themes: {
		light: {
			colors: {
				myColor1: 'light_myColor1',
				myColor2: 'light_myColor2'
			}
		},
		dark: {
			colors: {
				myColor1: 'dark_myColor1',
				myColor2: 'dark_myColor2'
			}
		}
	}
}));

describe('ThemeStores', async () => {
	const { setAppearance, resolveColor, resolveColorsObject } = new ThemeStores();

	describe('resolveColor', () => {
		it('should leave undefined as-is', () => {
			const store = resolveColor(undefined);

			setAppearance('light');
			expect(get(store)).toBe(undefined);

			setAppearance('dark');
			expect(get(store)).toBe(undefined);
		});

		it('should leave non-theme colors as-is', () => {
			const store = resolveColor('#abcdef');

			setAppearance('light');
			expect(get(store)).toBe('#abcdef');

			setAppearance('dark');
			expect(get(store)).toBe('#abcdef');
		});

		it('should correctly resolve colors in theme', () => {
			const store = resolveColor('myColor1');

			setAppearance('light');
			expect(get(store)).toBe(`light_myColor1`);

			setAppearance('dark');
			expect(get(store)).toBe(`dark_myColor1`);
		});

		it('should correctly resolve colors in theme and ignore extraneous whitespace', () => {
			const store = resolveColor('  myColor2  ');

			setAppearance('light');
			expect(get(store)).toBe(`light_myColor2`);

			setAppearance('dark');
			expect(get(store)).toBe(`dark_myColor2`);
		});
	});

	describe('resolveColorsObject', () => {
		it('should correctly resolve each value of an object', () => {
			const store = resolveColorsObject({
				key1: 'myColor1',
				key2: '#abcdef',
				key3: 'myColor2',
				key4: undefined
			});

			setAppearance('light');
			expect(get(store)).toEqual({
				key1: 'light_myColor1',
				key2: '#abcdef',
				key3: 'light_myColor2',
				key4: undefined
			});

			setAppearance('dark');
			expect(get(store)).toEqual({
				key1: 'dark_myColor1',
				key2: '#abcdef',
				key3: 'dark_myColor2',
				key4: undefined
			});
		});

		it('should correctly resolve colors in theme and ignore extraneous whitespace', () => {
			const store = resolveColorsObject({
				key1: '  myColor1  ',
				key3: '  myColor2  '
			});

			setAppearance('light');
			expect(get(store)).toEqual({
				key1: 'light_myColor1',
				key3: 'light_myColor2'
			});

			setAppearance('dark');
			expect(get(store)).toEqual({
				key1: 'dark_myColor1',
				key3: 'dark_myColor2'
			});
		});
	});
});
