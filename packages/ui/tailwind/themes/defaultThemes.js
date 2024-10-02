/** @typedef {import('./schemas.js').Theme} Theme */

/** @type {Record<'light' | 'dark', Theme>} */
export const defaultThemes = {
	light: {
		primary: '#3b82f6',
		'primary-content': '#ffffff',
		secondary: '#f59e0b',
		'secondary-content': '#ffffff',
		accent: '#f472b6',
		'accent-content': '#ffffff',
		neutral: '#333',
		'neutral-content': '#ffffff',
		'base-100': '#ffffff',
		'base-200': '#f9fafb',
		'base-300': '#f4f5f7',
		'base-content': '#1f2937',
		info: '#2094f3',
		'info-content': '#ffffff',
		positive: '#00b74a',
		'positive-content': '#ffffff',
		negative: '#ff3d71',
		'negative-content': '#ffffff',
		warning: '#ffaa2c',
		'warning-content': '#ffffff'
	},
	dark: {
		primary: '#3b82f6',
		'primary-content': '#ffffff',
		secondary: '#f59e0b',
		'secondary-content': '#ffffff',
		accent: '#f472b6',
		'accent-content': '#ffffff',
		neutral: '#d1d5db',
		'neutral-content': '#ffffff',
		'base-100': '#1f2937',
		'base-200': '#233048',
		'base-300': '#374151',
		'base-content': '#ffffff',
		info: '#2094f3',
		'info-content': '#ffffff',
		positive: '#00b74a',
		'positive-content': '#ffffff',
		negative: '#ff3d71',
		'negative-content': '#ffffff',
		warning: '#ffaa2c',
		'warning-content': '#ffffff'
	}
};
