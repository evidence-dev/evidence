import { describe, it, expect } from 'vitest';

import { ThemesConfigFileSchema } from './config.js';

describe('ThemesConfigFileSchema', () => {
	it('should parse themes=null to themes={}', () => {
		const result = ThemesConfigFileSchema.parse({ themes: null });
		expect(result).toEqual({ themes: {} });
	});

	it('should parse themes=undefined to themes={}', () => {
		const result = ThemesConfigFileSchema.parse({ themes: undefined });
		expect(result).toEqual({ themes: {} });
	});

	it('should allow themes={}', () => {
		const { success } = ThemesConfigFileSchema.safeParse({ themes: {} });
		expect(success).toBe(true);
	});

	describe('colors', () => {
		it('should parse themes.colors=null to themes.colors={}', () => {
			const result = ThemesConfigFileSchema.parse({ themes: { colors: null } });
			expect(result.themes.colors).toEqual({});
		});

		it('should parse themes.colors=undefined to themes.colors={}', () => {
			const result = ThemesConfigFileSchema.parse({ themes: { colors: undefined } });
			expect(result.themes.colors).toEqual({});
		});

		it('should allow themes.colors={}', () => {
			const { success } = ThemesConfigFileSchema.safeParse({ themes: { colors: {} } });
			expect(success).toBe(true);
		});

		it.each([
			{ whatIsUndefined: 'light' },
			{ whatIsUndefined: 'dark' },
			{ whatIsUndefined: 'both light and dark' }
		])(
			'should allow $whatIsUndefined to be undefined for builtin color tokens',
			({ whatIsUndefined }) => {
				const colors =
					whatIsUndefined === 'light'
						? { dark: '#abcdef' }
						: whatIsUndefined === 'dark'
							? { light: '#abcdef' }
							: {};
				const { success } = ThemesConfigFileSchema.safeParse({
					themes: {
						colors: {
							primary: colors
						}
					}
				});
				expect(success).toBe(true);
			}
		);

		it.each([
			{ whatIsUndefined: 'light' },
			{ whatIsUndefined: 'dark' },
			{ whatIsUndefined: 'both light and dark' }
		])(
			'should not allow $whatIsUndefined to be undefined for non-builtin color tokens',
			({ whatIsUndefined }) => {
				const colors =
					whatIsUndefined === 'light'
						? { dark: '#abcdef' }
						: whatIsUndefined === 'dark'
							? { light: '#abcdef' }
							: {};

				const { success } = ThemesConfigFileSchema.safeParse({
					themes: {
						colors: {
							foo: colors
						}
					}
				});
				expect(success).toBe(false);
			}
		);
	});
});
