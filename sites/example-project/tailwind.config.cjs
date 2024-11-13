const evidenceTailwind = require('@evidence-dev/tailwind/config').config;
const { loadConfig } = require('@evidence-dev/plugin-connector/load-config');

const fs = require('fs');
const path = require('path');
let presets = [evidenceTailwind];

const altConfigFilenames = ['tailwind.config.js', 'tailwind.config.cjs'];
const altConfigFilepaths = altConfigFilenames.map((filename) => path.join('..', '..', filename));
// Use find so that we can stop iteration
altConfigFilepaths.find((file) => {
	if (fs.statSync(file, { throwIfNoEntry: false })) {
		presets.push(require(file));
		return true;
	}
	return false;
});

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
