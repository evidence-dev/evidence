import colors from 'tailwindcss/colors.js';

/** @typedef {import('./schemas.js').Theme} Theme */

const todo = {
	primary: '#ffffff',
	'primary-content': '#ffffff',
	secondary: '#ffffff',
	'secondary-content': '#ffffff',
	accent: '#ffffff',
	'accent-content': '#ffffff',
	neutral: '#ffffff',
	'neutral-content': '#ffffff',
	info: '#ffffff',
	'info-content': '#ffffff',
	positive: '#ffffff',
	'positive-content': '#ffffff',
	negative: '#ffffff',
	'negative-content': '#ffffff',
	warning: '#ffffff',
	'warning-content': '#ffffff'
};

/** @type {Record<'light' | 'dark', Theme>} */
export const defaultThemes = {
	light: {
		'base-100': colors.white,
		'base-200': colors.gray[100],
		'base-300': colors.gray[200],
		'base-content': colors.gray[950],
		...todo
	},
	dark: {
		'base-100': colors.gray[900],
		'base-200': colors.gray[800],
		'base-300': colors.gray[700],
		'base-content': colors.gray[50],
		...todo
	}
};
