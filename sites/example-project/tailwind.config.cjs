const evidenceTailwind = require('@evidence-dev/tailwind').config;

/** @type {import("tailwindcss").Config} */
const config = {
	content: {
		relative: true,
		files: [
			'./src/**/*.{html,js,svelte,ts,md}', // This is used for everything in base evidence template
			'./node_modules/@evidence-dev/core-components/dist/**/*.{html,js,svelte,ts,md}',
			'../../node_modules/@evidence-dev/core-components/dist/**/*.{html,js,svelte,ts,md}'
		]
	},
	theme: {
		extend: {}
	},

	presets: [evidenceTailwind],

	plugins: []
};

module.exports = config;
