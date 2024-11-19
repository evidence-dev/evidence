// @ts-check
import { describe, it, expect } from 'vitest';
import { buildThemes } from './buildThemes.js';
/** @typedef {import('./types.js').Themes} Themes */
/** @typedef {import('./types.js').ThemesConfig} ThemesConfig */

describe('buildThemes', () => {
	it('should collect correct colors for each theme', () => {
		/** @type {ThemesConfig} */
		const themesConfig = {
			themes: {
				defaultAppearance: 'light',
				appearanceSwitcher: true,
				colors: {
					primary: {
						light: 'primary_light',
						dark: 'primary_dark'
					},
					'primary-content': {
						light: 'primary-content_light',
						dark: 'primary-content_dark'
					},
					secondary: {
						light: 'secondary_light',
						dark: 'secondary_dark'
					},
					'secondary-content': {
						light: 'secondary-content_light',
						dark: 'secondary-content_dark'
					},
					accent: {
						light: 'accent_light',
						dark: 'accent_dark'
					},
					'accent-content': {
						light: 'accent-content_light',
						dark: 'accent-content_dark'
					},
					'base-100': {
						light: 'base-100_light',
						dark: 'base-100_dark'
					},
					'base-200': {
						light: 'base-200_light',
						dark: 'base-200_dark'
					},
					'base-300': {
						light: 'base-300_light',
						dark: 'base-300_dark'
					},
					'base-content': {
						light: 'base-content_light',
						dark: 'base-content_dark'
					},
					'base-content-muted': {
						light: 'base-content-muted_light',
						dark: 'base-content-muted_dark'
					},
					info: {
						light: 'info_light',
						dark: 'info_dark'
					},
					'info-content': {
						light: 'info-content_light',
						dark: 'info-content_dark'
					},
					positive: {
						light: 'positive_light',
						dark: 'positive_dark'
					},
					'positive-content': {
						light: 'positive-content_light',
						dark: 'positive-content_dark'
					},
					negative: {
						light: 'negative_light',
						dark: 'negative_dark'
					},
					'negative-content': {
						light: 'negative-content_light',
						dark: 'negative-content_dark'
					},
					warning: {
						light: 'warning_light',
						dark: 'warning_dark'
					},
					'warning-content': {
						light: 'warning-content_light',
						dark: 'warning-content_dark'
					}
				},
				colorPalettes: {
					default: {
						light: ['default_light_1', 'default_light_2', 'default_light_3'],
						dark: ['default_dark_1', 'default_dark_2', 'default_dark_3']
					}
				},
				colorScales: {}
			}
		};

		const actual = buildThemes(themesConfig);

		/** @type {Themes} */
		const expected = {
			light: {
				colors: {
					primary: 'primary_light',
					'primary-content': 'primary-content_light',
					secondary: 'secondary_light',
					'secondary-content': 'secondary-content_light',
					accent: 'accent_light',
					'accent-content': 'accent-content_light',
					'base-100': 'base-100_light',
					'base-200': 'base-200_light',
					'base-300': 'base-300_light',
					'base-content': 'base-content_light',
					'base-content-muted': 'base-content-muted_light',
					info: 'info_light',
					'info-content': 'info-content_light',
					positive: 'positive_light',
					'positive-content': 'positive-content_light',
					negative: 'negative_light',
					'negative-content': 'negative-content_light',
					warning: 'warning_light',
					'warning-content': 'warning-content_light'
				},
				colorPalettes: {
					default: ['default_light_1', 'default_light_2', 'default_light_3']
				},
				colorScales: {}
			},
			dark: {
				colors: {
					primary: 'primary_dark',
					'primary-content': 'primary-content_dark',
					secondary: 'secondary_dark',
					'secondary-content': 'secondary-content_dark',
					accent: 'accent_dark',
					'accent-content': 'accent-content_dark',
					'base-100': 'base-100_dark',
					'base-200': 'base-200_dark',
					'base-300': 'base-300_dark',
					'base-content': 'base-content_dark',
					'base-content-muted': 'base-content-muted_dark',
					info: 'info_dark',
					'info-content': 'info-content_dark',
					positive: 'positive_dark',
					'positive-content': 'positive-content_dark',
					negative: 'negative_dark',
					'negative-content': 'negative-content_dark',
					warning: 'warning_dark',
					'warning-content': 'warning-content_dark'
				},
				colorPalettes: {
					default: ['default_dark_1', 'default_dark_2', 'default_dark_3']
				},
				colorScales: {}
			}
		};

		expect(actual).toEqual(expected);
	});
});
