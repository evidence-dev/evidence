import colors from 'tailwindcss/colors.js';

/** @typedef {import('./schemas.js').Theme} Theme */

const todo = {
	primary: '#ffffff',
	'primary-content': '#ffffff',
	secondary: '#ffffff',
	'secondary-content': '#ffffff',
	accent: '#ffffff',
	'accent-content': '#ffffff'
};

/** @type {Record<'light' | 'dark', Theme>} */
export const defaultThemes = {
	light: {
		'base-100': colors.white,
		'base-200': colors.zinc[100],
		'base-300': colors.zinc[200],
		'base-content': colors.zinc[900],
		neutral: colors.neutral[100],
		'neutral-content': colors.neutral[800],
		info: colors.sky[100],
		'info-content': colors.sky[800],
		positive: colors.green[100],
		'positive-content': colors.green[800],
		warning: colors.amber[100],
		'warning-content': colors.amber[800],
		negative: colors.red[100],
		'negative-content': colors.red[800],

		...todo
	},
	dark: {
		'base-100': colors.zinc[900],
		'base-200': colors.zinc[800],
		'base-300': colors.zinc[700],
		'base-content': colors.zinc[100],
		neutral: colors.neutral[800],
		'neutral-content': colors.neutral[100],
		info: colors.sky[800],
		'info-content': colors.sky[100],
		positive: colors.green[800],
		'positive-content': colors.green[100],
		warning: colors.amber[800],
		'warning-content': colors.amber[100],
		negative: colors.red[800],
		'negative-content': colors.red[100],

		...todo
	}
};
