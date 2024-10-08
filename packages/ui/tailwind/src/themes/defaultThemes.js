import colors from 'tailwindcss/colors.js';

/** @typedef {import('./schemas.js').Theme} Theme */

const todo = {
	secondary: '#ffffff',
	'secondary-content': '#ffffff',
	accent: '#ffffff',
	'accent-content': '#ffffff'
};

/** @type {Record<'light' | 'dark', Theme>} */
export const defaultThemes = {
	light: {
		primary: colors.blue[500],
		'primary-content': colors.blue[950],
		'base-100': colors.white,
		'base-200': colors.zinc[100],
		'base-300': colors.zinc[200],
		'base-content': colors.zinc[900],
		neutral: colors.neutral[600],
		'neutral-content': colors.zinc[50],
		info: colors.sky[600],
		'info-content': colors.zinc[50],
		positive: colors.green[600],
		'positive-content': colors.zinc[50],
		warning: colors.amber[600],
		'warning-content': colors.zinc[50],
		negative: colors.red[600],
		'negative-content': colors.zinc[50],

		...todo
	},
	dark: {
		primary: colors.blue[400],
		'primary-content': colors.blue[50],
		'base-100': colors.zinc[900],
		'base-200': colors.zinc[800],
		'base-300': colors.zinc[700],
		'base-content': colors.zinc[100],
		neutral: colors.neutral[400],
		'neutral-content': colors.zinc[950],
		info: colors.sky[400],
		'info-content': colors.zinc[950],
		positive: colors.green[400],
		'positive-content': colors.zinc[950],
		warning: colors.amber[400],
		'warning-content': colors.zinc[950],
		negative: colors.red[400],
		'negative-content': colors.zinc[950],

		...todo
	}
};
