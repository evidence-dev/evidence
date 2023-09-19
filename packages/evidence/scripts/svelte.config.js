import evidencePreprocess from '@evidence-dev/preprocess';
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import { evidencePlugins } from '@evidence-dev/plugin-connector';
import fs from 'fs';
import path from 'path';

/**
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
const deepMerge = (a, b) => {
	for (const key in b) {
		if (typeof b[key] === 'object' && !Array.isArray(b[key])) {
			if (!a[key]) a[key] = {};
			deepMerge(a[key], b[key]);
		} else {
			Object.assign(a, { [key]: b[key] });
		}
	}
	return a;
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		...evidencePreprocess(true),
		evidencePlugins(),
		preprocess({
			postcss: true
		})
	],
	kit: {
		adapter: adapter({
			strict: false
		}),
		files: {
			routes: 'src/pages',
			lib: 'src/components'
		}
	}
};

async function loadUserConfiguration() {
	if (!process.cwd().includes('.evidence')) return;
	const rootDir = process.cwd().split('.evidence')[0];
	const rootDirContents = fs.readdirSync(rootDir);

	if (!rootDirContents.includes('svelte.config.js')) return;

	/** @type {import("@sveltejs/kit").Config} */
	const userConfig = await import(path.join(rootDir, 'svelte.config.js')).then((r) => r.default);

	if ('preprocess' in userConfig) {
		if ('preprocess' in config) {
			config.preprocess.push(...userConfig.preprocess);
		} else {
			// This case shouldn't ever be reached.
			config.preprocess = userConfig.preprocess;
		}
		delete userConfig.preprocess;
	}
	if ('extensions' in userConfig) {
		console.warn('Configuring extensions is disabled for Evidence projects.');
		delete userConfig.extensions;
	}
	if ('kit' in userConfig && 'files' in userConfig.kit) {
		console.warn('Configuring file locations is disabled for Evidence projects.');
		delete userConfig.kit.files;
	}

	deepMerge(config, userConfig);
	console.log('Custom svelte.config.js applied');
}

await loadUserConfiguration();

export default config;
