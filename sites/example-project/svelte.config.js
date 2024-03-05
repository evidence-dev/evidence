import preprocess from 'svelte-preprocess';
import evidencePreprocess from '@evidence-dev/preprocess';
import adapter from '@sveltejs/adapter-static';
import { evidencePlugins } from '@evidence-dev/plugin-connector';
/** @type {import('@sveltejs/kit').Config} */

/**
 * Handles errors generated in the Svelte Vite plugin. Temporary approach until this plugin allows errors to be passed through to the browser
 * @param {{ message: string }} warning - The warning object from the Svelte Vite plugin.
 * @throws {Error}
 */
function errorHandler(warning) {
	throw new Error(warning.message, { cause: warning });
}

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		...evidencePreprocess(true),
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
