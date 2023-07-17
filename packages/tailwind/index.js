export const colors = {
	color: {
		1: '#923d59',
		2: '#488f96',
		3: '#518eca',
		4: '#B3A9A0',
		5: '#3F6C51',
		6: '#ffc857',
		7: '#495867',
		8: '#bfdbf7',
		9: '#bc4749',
		10: '#EEEBD0',
		11: '#F68E5F',
		12: '#923d59',
		13: '#488f96',
		14: '#518eca',
		15: '#B3A9A0',
		16: '#3F6C51',
		17: '#ffc857',
		18: '#495867',
		19: '#bfdbf7',
		20: '#bc4749'
	}
};

const defaultTheme = require('tailwindcss/defaultTheme');



/** @type {import('tailwindcss').Config} */
export const config = {
	theme: {
		extend: {
			colors: colors,
			fontFamily: {
				sans: [
					`Inter, ${defaultTheme.fontFamily.sans}`,
					{
						// open fours by default
						fontFeatureSettings: '"cv02"'
					}
				],
				serif: [
					`Spectral, ${defaultTheme.fontFamily.serif}`,
					{
						// proportional oldstyle figures by default
						fontFeatureSettings: '"pnum", "onum"'
					}
				],
				mono: [`'Menlo', 'Monaco', ${defaultTheme.fontFamily.mono}`]
			},
			textShadow: {
				DEFAULT: '1px solid var(--tw-shadow-color)'
			},
			gridTemplateRows: {
				auto: 'auto'
			},
			listStyleType: {
				circle: 'circle',
				square: 'square',
				'lower-alpha': 'lower-alpha',
				'lower-roman': 'lower-roman'
			}
		},
		plugins: []
	}
};
export default config;
