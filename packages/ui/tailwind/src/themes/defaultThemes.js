import colors from 'tailwindcss/colors.js';

/** @typedef {import('./schemas.js').Theme} Theme */

/** @type {Record<'light' | 'dark', Theme>} */
export const defaultThemes = {
	light: {
		primary: colors.blue[600],
		'primary-content': colors.blue[50],
		secondary: colors.slate[600],
		'secondary-content': colors.slate[50],
		accent: colors.orange[700],
		'accent-content': colors.orange[50],
		'base-100': colors.white,
		'base-200': colors.zinc[100],
		'base-300': colors.zinc[200],
		'base-content': colors.zinc[900],
		'base-content-muted': colors.zinc[600],
		neutral: colors.neutral[500],
		'neutral-content': colors.zinc[50],
		info: colors.sky[600],
		'info-content': colors.zinc[50],
		positive: colors.green[600],
		'positive-content': colors.zinc[50],
		warning: colors.yellow[500],
		'warning-content': colors.zinc[50],
		negative: colors.red[600],
		'negative-content': colors.zinc[50]
	},
	dark: {
		primary: colors.blue[400],
		'primary-content': colors.blue[950],
		secondary: colors.slate[400],
		'secondary-content': colors.slate[950],
		accent: colors.orange[300],
		'accent-content': colors.orange[950],
		'base-100': colors.zinc[950],
		'base-200': colors.zinc[800],
		'base-300': colors.zinc[700],
		'base-content': colors.zinc[100],
		'base-content-muted': colors.zinc[400],
		neutral: colors.neutral[400],
		'neutral-content': colors.zinc[950],
		info: colors.sky[400],
		'info-content': colors.zinc[950],
		positive: colors.green[400],
		'positive-content': colors.zinc[950],
		warning: colors.amber[400],
		'warning-content': colors.zinc[950],
		negative: colors.red[400],
		'negative-content': colors.zinc[950]
	}
};
