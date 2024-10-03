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
		neutral: colors.neutral[400],
		'neutral-content': colors.neutral[950],
		info: colors.sky[400],
		'info-content': colors.sky[950],
		positive: colors.green[400],
		'positive-content': colors.green[950],
		warning: colors.amber[400],
		'warning-content': colors.amber[950],
		negative: colors.red[400],
		'negative-content': colors.red[950],

		...todo
	},
	dark: {
		'base-100': colors.zinc[900],
		'base-200': colors.zinc[800],
		'base-300': colors.zinc[700],
		'base-content': colors.zinc[100],
		neutral: colors.neutral[600],
		'neutral-content': colors.neutral[50],
		info: colors.sky[500],
		'info-content': colors.sky[50],
		positive: colors.green[500],
		'positive-content': colors.green[50],
		warning: colors.amber[500],
		'warning-content': colors.amber[50],
		negative: colors.red[500],
		'negative-content': colors.red[50],

		...todo
	}
};
