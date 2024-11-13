import defaultTheme from 'tailwindcss/defaultTheme.js';
import { createThemes as createTwcThemes } from 'tw-colors';

import { loadThemesConfig } from './loadThemesConfig.js';
import { buildThemes } from '../themes/buildThemes.js';
import { createVarsForColors } from './createVarsForColors/index.js';

const themesConfig = loadThemesConfig();
const themes = buildThemes(themesConfig);
const twcConfig = Object.fromEntries(
	Object.entries(themes).map(([name, theme]) => [name, theme.colors])
);

/** @type {Partial<import('tailwindcss').Config>} */
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
	plugins: [createTwcThemes(twcConfig), createVarsForColors(themes)],
	darkMode: ['selector', '[data-theme="dark"]']
};

export default config;
