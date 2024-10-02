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
		'base-100': '#ffffff',
		'base-200': '#f3f4f6',
		'base-300': '#e5e7eb',
		'base-content': '#030712',
		...todo
	},
	dark: {
		'base-100': '#111827',
		'base-200': '#1f2937',
		'base-300': '#374151',
		'base-content': '#f9fafb',
		...todo
	}
};
