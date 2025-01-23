import defaultTheme from 'tailwindcss/defaultTheme.js';
import { createThemes as createTwcThemes } from 'tw-colors';

import { loadThemesConfig } from './loadThemesConfig.js';
import { buildThemes } from '../themes/buildThemes.js';
import { createVarsForColors } from './createVarsForColors/index.js';
import plugin from 'tailwindcss/plugin.js';

const themesConfig = loadThemesConfig();
const themes = buildThemes(themesConfig);
const twcConfig = Object.fromEntries(
	Object.entries(themes).map(([name, theme]) => [
		name,
		/** @type {Record<string, string>} */
		(Object.fromEntries(Object.entries(theme.colors).filter(([, value]) => Boolean(value))))
	])
);

const inner = createTwcThemes(twcConfig, {
	produceThemeClass: (name) => `theme-${name}`
});
const wrappedTwcThemes = plugin((creator) => {
	const pre = creator.addUtilities;
	const dataThemeRegex = /,?\[data-theme="([^"]+)"\]/g;
	creator.addUtilities = function (utilities, options) {
		utilities = Object.fromEntries(
			Object.entries(utilities).map(([k, v]) => {
				console.log('pre', k);
				k = k.replaceAll(dataThemeRegex, '');
				console.log('post', k);
				return [k, v];
			})
		);
		console.log({
			utilities,
			options
		});
		return pre(utilities, options);
	}.bind(creator);

	const res = inner.handler(creator);
	return res;
}, inner.config);

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
	plugins: [
		wrappedTwcThemes,
		// createTwcThemes(twcConfig, { produceThemeClass: (name) => `theme-${name}` }),
		createVarsForColors(themes)
	],
	darkMode: ['class', 'theme-dark'],
	safelist: ['theme-light', 'theme-dark']
};

export default config;
