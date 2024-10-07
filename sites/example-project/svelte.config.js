import preprocess from 'svelte-preprocess';
import evidencePreprocess from '@evidence-dev/preprocess';
import adapter from '@sveltejs/adapter-static';
import { evidencePlugins } from '@evidence-dev/plugin-connector';
import path from 'path';

/**
 * Handles errors generated in the Svelte Vite plugin. Temporary approach until this plugin allows errors to be passed through to the browser
 * @param {{ message: string }} warning - The warning object from the Svelte Vite plugin.
 * @throws {Error}
 */
function errorHandler(warning) {
	if (warning.message.includes('defined') || warning.message.includes('Empty Block')) {
		throw new Error(warning.message, { cause: warning });
	}
}

/**
 * Load Remark Plugins
 */
async function loadRemarkConfiguration() {
	const configFileLocation = path.join(process.cwd(), 'remark.config.js');
	const configURL = new URL(`file:///${configFileLocation}`).href;
	return await import(configURL).then((r) => r.default);
}

const remarkConfig = await loadRemarkConfiguration();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		...evidencePreprocess(true, remarkConfig),
		evidencePlugins(),
		preprocess({
			postcss: true
		})
	], // Modify preprocess to allow for loading of $lib instead of package version of components library
	onwarn: errorHandler,
	kit: {
		adapter: adapter({
			strict: false
		}),
		files: {
			routes: 'src/pages'
			// lib: 'src/components'
		}
	}
};

export default config;
