const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: {
		relative: true,
		files: [
			'./src/**/*.{html,js,svelte,ts,md}', // This is used for everything in base evidence template
			'../../pages/**/*.{html,js,svelte,ts,md}', // This is used in end user projects to let them access tailwind classes
			'../../src/**/*.{html,js,svelte,ts,md}' // This is used in end user projects to let them access tailwind classes
		]
	},
	theme: {
		extend: {
			textShadow: {
				DEFAULT: '1px solid var(--tw-shadow-color)'
			},
			gridTemplateRows: {
				auto: 'auto'
			},
			fontFamily: {
				sans: [
					'Inter',
					'SF Display',
					'-apple-system',
					'BlinkMacSystemFont',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif',
					'Apple Color Emoji',
					'Segoe UI Emoji',
					'Segoe UI Symbol'
				],

				monospace: [
					'Menlo',
					'Monaco',
					'"Lucida Console"',
					'"Liberation Mono"',
					'"DejaVu Sans Mono"',
					'"Bitstream Vera Sans Mono"',
					'"Courier New"',
					'monospace'
				],
				mono: [
					'IBM Plex Mono',
					'Menlo',
					'Monaco',
					'"Lucida Console"',
					'"Liberation Mono"',
					'"DejaVu Sans Mono"',
					'"Bitstream Vera Sans Mono"',
					'"Courier New"',
					'monospace'
				],
				ui: [
					'Inter',
					'SF Display',
					'-apple-system',
					'BlinkMacSystemFont',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif',
					'"Apple Color Emoji"',
					'"Segoe UI Emoji"',
					'"Segoe UI Symbol"'
				],
				ui_compact: [
					'Inter',
					'SF Compact Display',
					'-apple-system',
					'BlinkMacSystemFont',
					'Roboto',
					'Helvetica',
					'Arial',
					'sans-serif',
					'"Apple Color Emoji"',
					'"Segoe UI Emoji"',
					'"Segoe UI Symbol"'
				]
			},
			colors: {
				color: {
					1: '#923d59',
					2: '#488f96',
					3: '#518eca',
					4: '#B3A9A0',
					5: '#3F6C51',
					6: '#ffc857',
					7: '#495867',
					8: '#bfdbf7',
					9: '#bc4749',
					10: '#EEEBD0',
					11: '#F68E5F',
					12: '#923d59',
					13: '#488f96',
					14: '#518eca',
					15: '#B3A9A0',
					16: '#3F6C51',
					17: '#ffc857',
					18: '#495867',
					19: '#bfdbf7',
					20: '#bc4749'
				}
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
		require('@tailwindcss/typography'),
		// Add support for textShadow
		plugin(function ({ matchUtilities, theme }) {
			matchUtilities(
				{
					'text-shadow': (value) => ({
						textShadow: value
					})
				},
				{ values: theme('textShadow') }
			);
		})
	]
};
