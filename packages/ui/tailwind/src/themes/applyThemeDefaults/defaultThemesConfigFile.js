import colors from 'tailwindcss/colors.js';

/** @typedef {import('../../schemas/types.js').ThemesConfigFile} ThemesConfigFile */

export const defaultThemesConfigFile =
	/**
	 * @satisfies {ThemesConfigFile}
	 * @type {const}
	 */
	({
		theme: {
			defaultAppearance: 'light',
			appearanceSwitcher: false,
			colors: /** @satisfies {import('./types.js').RequiredThemeColors} */ ({
				primary: {
					light: colors.blue[500],
					dark: colors.blue[500]
				},
				accent: {
					light: colors.orange[700],
					dark: colors.orange[300]
				},
				'base-100': {
					light: colors.white,
					dark: colors.zinc[950]
				},
				info: {
					light: colors.sky[600],
					dark: colors.sky[400]
				},
				positive: {
					light: colors.green[600],
					dark: colors.green[400]
				},
				warning: {
					light: '#f8c900',
					dark: colors.amber[400]
				},
				negative: {
					light: colors.red[600],
					dark: colors.red[400]
				}
			}),
			colorPalettes: {
				default: {
					light: [
						'hsla(207, 65%, 39%, 1)', // Navy
						'hsla(195, 49%, 51%, 1)', // Teal
						'hsla(207, 69%, 79%, 1)', // Light Blue
						'hsla(202, 28%, 65%, 1)', // Grey
						'hsla(179, 37%, 65%, 1)', // Light Green
						'hsla(40, 30%, 75%, 1)', // Tan
						'hsla(38, 89%, 62%, 1)', // Yellow
						'hsla(342, 40%, 40%, 1)', // Maroon
						'hsla(207, 86%, 70%, 1)', // Blue
						'hsla(160, 40%, 46%, 1)' // Green
					],
					dark: [
						'hsla(207, 65%, 39%, 1)', // Navy
						'hsla(195, 49%, 51%, 1)', // Teal
						'hsla(207, 69%, 79%, 1)', // Light Blue
						'hsla(202, 28%, 65%, 1)', // Grey
						'hsla(179, 37%, 65%, 1)', // Light Green
						'hsla(40, 30%, 75%, 1)', // Tan
						'hsla(38, 89%, 62%, 1)', // Yellow
						'hsla(342, 40%, 40%, 1)', // Maroon
						'hsla(207, 86%, 70%, 1)', // Blue
						'hsla(160, 40%, 46%, 1)' // Green
					]
				}
			},
			colorScales: {
				default: {
					light: ['lightblue', 'darkblue'],
					dark: ['lightblue', 'darkblue']
				}
			}
		}
	});
