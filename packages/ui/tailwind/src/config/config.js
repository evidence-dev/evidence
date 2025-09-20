import defaultTheme from 'tailwindcss/defaultTheme.js';

import { loadThemesConfig } from './loadThemesConfig.js';
import { buildThemes } from '../themes/buildThemes.js';
import { createVarsForColors } from './createVarsForColors/index.js';

const themesConfig = loadThemesConfig();
const themes = buildThemes(themesConfig);

/** @type {Partial<import('tailwindcss').Config>} */
export const config = {
	content: [
		// Core Evidence components source files (for local development)
		'../../../core-components/src/**/*.{html,js,svelte,ts,md}',
		'./node_modules/@evidence-dev/core-components/src/**/*.{html,js,svelte,ts,md}',
		'./node_modules/@evidence-dev/core-components/dist/**/*.{html,js,svelte,ts,md}',
		// Additional Evidence UI packages
		'../../../*/src/**/*.{html,js,svelte,ts,md}',
		'./node_modules/@evidence-dev/*/src/**/*.{html,js,svelte,ts,md}',
		'./node_modules/@evidence-dev/*/dist/**/*.{html,js,svelte,ts,md}',
		// Consumer project files
		'./src/**/*.{html,js,svelte,ts,md}',
		'./.evidence/template/src/**/*.{html,js,svelte,ts,md}'
	],
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
	plugins: [createVarsForColors(themes)],
	darkMode: ['class', '.theme-dark']
};

export default config;
