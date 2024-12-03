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
					light: '#2563eb',
					dark: '#3b82f6'
				},
				accent: {
					light: '#c2410c',
					dark: '#fdba74'
				},
				'base-100': {
					light: '#ffffff',
					dark: '#09090b'
				},
				info: {
					light: '#0284c7',
					dark: '#38bdf8'
				},
				positive: {
					light: '#16a34a',
					dark: '#4ade80'
				},
				warning: {
					light: '#f8c900',
					dark: '#fbbf24'
				},
				negative: {
					light: '#dc2626',
					dark: '#f87171'
				}
			}),
			colorPalettes: {
				default: {
					light: [
						'#236aa4',
						'#45a1bf',
						'#a5cdee',
						'#8dacbf',
						'#85c7c6',
						'#d2c6ac',
						'#f4b548',
						'#8f3d56',
						'#71b9f4',
						'#46a485'
					],
					dark: [
						'#236aa4',
						'#45a1bf',
						'#a5cdee',
						'#8dacbf',
						'#85c7c6',
						'#d2c6ac',
						'#f4b548',
						'#8f3d56',
						'#71b9f4',
						'#46a485'
					]
				}
			},
			colorScales: {
				default: {
					light: ['#ADD8E6', '#00008B'],
					dark: ['#ADD8E6', '#00008B']
				}
			}
		}
	});
