const evidenceTailwind = require('@evidence-dev/tailwind/config').config;
const evidenceConfig = require('@evidence-dev/sdk/config').getEvidenceConfig();

const fs = require('fs');
const path = require('path');
let presets = [evidenceTailwind];
const CONTENT_GLOB = '**/*.{html,js,svelte,ts,md}';

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

const toPosixPath = (inputPath) => inputPath.split(path.sep).join('/');

const resolvePackageRoot = (packageName) => {
	const resolutionPaths = [process.cwd(), __dirname, path.resolve(__dirname, '..')];
	try {
		const packageJsonPath = require.resolve(`${packageName}/package.json`, { paths: resolutionPaths });
		return path.dirname(packageJsonPath);
	} catch {
		try {
			const entryPath = require.resolve(packageName, { paths: resolutionPaths });
			let current = path.dirname(entryPath);
			while (current !== path.dirname(current)) {
				if (fs.existsSync(path.join(current, 'package.json'))) {
					return current;
				}
				current = path.dirname(current);
			}
		} catch {
			return null;
		}
	}
	return null;
};

const resolveComponentContentGlobs = (pluginName) => {
	const globs = new Set([
		`./node_modules/${pluginName}/dist/${CONTENT_GLOB}`,
		`../../node_modules/${pluginName}/dist/${CONTENT_GLOB}`
	]);

	const packageRoot = resolvePackageRoot(pluginName);
	if (!packageRoot) return Array.from(globs);

	const relativePackageRoot = toPosixPath(path.relative(__dirname, packageRoot));
	if (relativePackageRoot.length === 0) return Array.from(globs);

	if (fs.existsSync(path.join(packageRoot, 'dist'))) {
		globs.add(`${relativePackageRoot}/dist/${CONTENT_GLOB}`);
	} else {
		globs.add(`${relativePackageRoot}/${CONTENT_GLOB}`);
	}

	return Array.from(globs);
};

/** @type {import("tailwindcss").Config} */
const config = {
	content: {
		relative: true,
		get files() {
			const pluginConfig = evidenceConfig.plugins ?? {};
			const components = pluginConfig.components ?? {};
			const componentPaths = Object.keys(components)
				.map((pluginName) => resolveComponentContentGlobs(pluginName))
				.flat();

			return [
				`./src/${CONTENT_GLOB}`, // This is used for everything in base evidence template
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
