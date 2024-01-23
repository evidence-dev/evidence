const evidenceTailwind = require('@evidence-dev/tailwind').config;
const { loadConfig } = require('@evidence-dev/plugin-connector/load-config');

const fs = require('fs');
let presets = [evidenceTailwind];
if (fs.statSync('../../tailwind.config.cjs', { throwIfNoEntry: false })) {
	presets.push(require('../../tailwind.config.cjs'));
}

/** @type {import("tailwindcss").Config} */
const config = {
	content: {
		relative: true,
		get files() {
			const pluginConfig = loadConfig(process.cwd().includes('.evidence') ? '../../' : './');
			const components = pluginConfig.components;
			const componentPaths = Object.keys(components)
				.map((pluginName) => [
					`./node_modules/${pluginName}/dist/**/*.{html,js,svelte,ts,md}`,
					`../../node_modules/${pluginName}/dist/**/*.{html,js,svelte,ts,md}`
				])
				.flat();

			return [
				'./src/**/*.{html,js,svelte,ts,md}', // This is used for everything in base evidence template
				...componentPaths
			];
		}
	},
	theme: {
		extend: {}
	},

	presets: presets,

	plugins: []
};

module.exports = config;
