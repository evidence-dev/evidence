import colors from 'tailwindcss/colors.js';

/** @typedef {import('./types.js').ThemesConfig} ThemesConfig */

/** @type {ThemesConfig} */
export const defaultThemesConfig = {
	themes: {
		defaultAppearance: 'light',
		appearanceSwitcher: false,
		colors: {
			primary: {
				light: colors.blue[600],
				dark: colors.blue[400]
			},
			'primary-content': {
				light: colors.blue[50],
				dark: colors.blue[950]
			},
			secondary: {
				light: colors.slate[600],
				dark: colors.slate[400]
			},
			'secondary-content': {
				light: colors.slate[50],
				dark: colors.slate[950]
			},
			accent: {
				light: colors.orange[700],
				dark: colors.orange[300]
			},
			'accent-content': {
				light: colors.orange[50],
				dark: colors.orange[950]
			},
			'base-100': {
				light: colors.white,
				dark: colors.zinc[950]
			},
			'base-200': {
				light: colors.zinc[50],
				dark: colors.zinc[900]
			},
			'base-300': {
				light: colors.zinc[200],
				dark: colors.zinc[700]
			},
			'base-content': {
				light: colors.zinc[900],
				dark: colors.zinc[100]
			},
			'base-content-muted': {
				light: colors.zinc[600],
				dark: colors.zinc[400]
			},
			neutral: {
				light: colors.neutral[500],
				dark: colors.neutral[400]
			},
			'neutral-content': {
				light: colors.zinc[50],
				dark: colors.zinc[950]
			},
			info: {
				light: colors.sky[600],
				dark: colors.sky[400]
			},
			'info-content': {
				light: colors.zinc[50],
				dark: colors.zinc[950]
			},
			positive: {
				light: colors.green[600],
				dark: colors.green[400]
			},
			'positive-content': {
				light: colors.zinc[50],
				dark: colors.zinc[950]
			},
			warning: {
				light: colors.yellow[500],
				dark: colors.amber[400]
			},
			'warning-content': {
				light: colors.zinc[50],
				dark: colors.zinc[950]
			},
			negative: {
				light: colors.red[600],
				dark: colors.red[400]
			},
			'negative-content': {
				light: colors.zinc[50],
				dark: colors.zinc[950]
			}
		}
	}
};
