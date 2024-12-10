import { describe, it, expect } from 'vitest';

import { ThemesConfigFileSchema } from './config.js';

describe('ThemesConfigFileSchema', () => {
	describe.each([{ key: 'theme' }, { key: 'appearance' }])('$key', ({ key }) => {
		it(`should parse ${key}=null to ${key}={}`, () => {
			const result = ThemesConfigFileSchema.parse({ [key]: null });
			expect(result[key]).toEqual({});
		});

		it(`should parse ${key}=undefined to ${key}={}`, () => {
			const result = ThemesConfigFileSchema.parse({ [key]: undefined });
			expect(result[key]).toEqual({});
		});

		it(`should allow ${key}={}`, () => {
			const { success } = ThemesConfigFileSchema.safeParse({ [key]: {} });
			expect(success).toBe(true);
		});
	});

	describe('colors', () => {
		it('should parse theme.colors=null to theme.colors={}', () => {
			const result = ThemesConfigFileSchema.parse({ theme: { colors: null } });
			expect(result.theme.colors).toEqual({});
		});

		it('should parse theme.colors=undefined to theme.colors={}', () => {
			const result = ThemesConfigFileSchema.parse({ theme: { colors: undefined } });
			expect(result.theme.colors).toEqual({});
		});

		it('should allow theme.colors={}', () => {
			const { success } = ThemesConfigFileSchema.safeParse({ theme: { colors: {} } });
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
					theme: {
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
					theme: {
						colors: {
							foo: colors
						}
					}
				});
				expect(success).toBe(false);
			}
		);
	});

	it('should not allow unknown keys under theme:', () => {
		const config = {
			theme: {
				colors: {
					primary: {
						light: '#abcdef',
						dark: '#fedcba'
					}
				},
				colorPalette: {
					default: ['#abcdef', '#fedcba']
				}
			}
		};

		const { success } = ThemesConfigFileSchema.safeParse(config);
		expect(success).toBe(false);
	});
});
