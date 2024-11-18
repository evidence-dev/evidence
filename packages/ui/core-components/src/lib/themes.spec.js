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
				builtin: 'light_builtin',
				custom: 'light_custom'
			}
		},
		dark: {
			colors: {
				builtin: 'dark_builtin',
				custom: 'dark_custom'
			}
		}
	}
}));

describe('ThemeStores', async () => {
	const { setAppearance, resolveColor } = new ThemeStores();

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
			const store = resolveColor('builtin');

			setAppearance('light');
			expect(get(store)).toBe(`light_builtin`);

			setAppearance('dark');
			expect(get(store)).toBe(`dark_builtin`);
		});

		it('should correctly resolve each element of an array', () => {
			const store = resolveColor(['builtin', '#abcdef', 'custom', undefined]);

			setAppearance('light');
			expect(get(store)).toEqual(['light_builtin', '#abcdef', 'light_custom', undefined]);

			setAppearance('dark');
			expect(get(store)).toEqual(['dark_builtin', '#abcdef', 'dark_custom', undefined]);
		});

		it('should correctly resolve each value of an object', () => {
			const store = resolveColor({
				key1: 'builtin',
				key2: '#abcdef',
				key3: 'custom',
				key4: undefined
			});

			setAppearance('light');
			expect(get(store)).toEqual({
				key1: 'light_builtin',
				key2: '#abcdef',
				key3: 'light_custom',
				key4: undefined
			});

			setAppearance('dark');
			expect(get(store)).toEqual({
				key1: 'dark_builtin',
				key2: '#abcdef',
				key3: 'dark_custom',
				key4: undefined
			});
		});
	});
});
