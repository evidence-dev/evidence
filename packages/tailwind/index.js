export const colors = {
	blue: {
		100: 'hsl(202, 100%, 95%, <alpha-value>)',
		200: 'hsl(204, 100%, 85%, <alpha-value>)',
		300: 'hsl(206, 95%, 72%, <alpha-value>)',
		400: 'hsl(208, 90%, 63%, <alpha-value>)',
		500: 'hsl(210, 85%, 54%, <alpha-value>)',
		600: 'hsl(212, 96%, 44%, <alpha-value>)',
		700: 'hsl(214, 98%, 38%, <alpha-value>)',
		800: 'hsl(217, 98%, 33%, <alpha-value>)',
		900: 'hsl(220, 99%, 24%, <alpha-value>)',
		999: 'hsl(222, 100%, 18%, <alpha-value>)',
		link: 'hsl(205, 62%, 38%, <alpha-value>)'
	},
	green: {
		100: 'hsl(167, 100%, 94%, <alpha-value>)',
		200: 'hsl(166, 100%, 87%, <alpha-value>)',
		300: 'hsl(163, 93%, 76%, <alpha-value>)',
		400: 'hsl(161, 90%, 63%, <alpha-value>)',
		500: 'hsl(159, 88%, 44%, <alpha-value>)',
		600: 'hsl(158, 91%, 35%, <alpha-value>)',
		700: 'hsl(156, 93%, 28%, <alpha-value>)',
		800: 'hsl(154, 95%, 23%, <alpha-value>)',
		900: 'hsl(152, 100%, 18%, <alpha-value>)',
		999: 'hsl(150, 100%, 14%, <alpha-value>)'
	},
	grey: {
		100: 'hsl(217, 33%, 97%, <alpha-value>)',
		200: 'hsl(215, 15%, 91%, <alpha-value>)',
		300: 'hsl(211, 16%, 82%, <alpha-value>)',
		400: 'hsl(212, 13%, 65%, <alpha-value>)',
		500: 'hsl(212, 10%, 53%, <alpha-value>)',
		600: 'hsl(212, 12%, 43%, <alpha-value>)',
		700: 'hsl(210, 14%, 37%, <alpha-value>)',
		800: 'hsl(210, 18%, 30%, <alpha-value>)',
		900: 'hsl(210, 20%, 25%, <alpha-value>)',
		999: 'hsl(211, 24%, 16%, <alpha-value>)'
	},
	red: {
		50: '#fdf1f1',
		100: 'hsl(0, 100%, 95%, <alpha-value>)',
		200: 'hsl(0, 100%, 87%, <alpha-value>)',
		300: 'hsl(0, 100%, 80%, <alpha-value>)',
		400: 'hsl(0, 91%, 69%, <alpha-value>)',
		500: 'hsl(0, 83%, 62%, <alpha-value>)',
		600: 'hsl(356, 75%, 53%, <alpha-value>)',
		700: 'hsl(354, 85%, 44%, <alpha-value>)',
		800: 'hsl(352, 90%, 35%, <alpha-value>)',
		900: 'hsl(350, 94%, 28%, <alpha-value>)',
		999: 'hsl(348, 94%, 20%, <alpha-value>)'
	},
	yellow: {
		100: 'hsl(49, 100%, 96%, <alpha-value>)',
		200: 'hsl(48, 100%, 88%, <alpha-value>)',
		300: 'hsl(48, 95%, 76%, <alpha-value>)',
		400: 'hsl(48, 94%, 68%, <alpha-value>)',
		500: 'hsl(44, 92%, 63%, <alpha-value>)',
		600: 'hsl(42, 87%, 55%, <alpha-value>)',
		700: 'hsl(36, 77%, 49%, <alpha-value>)',
		800: 'hsl(29, 80%, 44%, <alpha-value>)',
		900: 'hsl(22, 82%, 39%, <alpha-value>)',
		999: 'hsl(15, 86%, 30%, <alpha-value>)'
	},
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
};

/** @type {import('tailwindcss').Config} */
export const config = {
	theme: {
		extend: {
			colors: colors,
			fontFamily: {
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
				ui: [
					'"SF Display"',
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
					'"SF Compact Display"',
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
		},
		plugins: []
	}
};
export default config;
