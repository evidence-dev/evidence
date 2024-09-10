import { createThemes } from 'tw-colors';

const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export const config = {
	theme: {
		extend: {
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
				]
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
		}
	},
	plugins: [
		createThemes({
			myTheme1: {
				mySemanticColor: '#abcdef'
			},
			myTheme2: {
				mySemanticColor: '#fedcba'
			}
		})
	]
};

export default config;
