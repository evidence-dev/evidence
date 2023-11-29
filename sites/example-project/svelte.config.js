import preprocess from 'svelte-preprocess';
import evidencePreprocess from '@evidence-dev/preprocess';
import adapter from '@sveltejs/adapter-static';
import { evidencePlugins } from '@evidence-dev/plugin-connector';
/** @type {import('@sveltejs/kit').Config} */

function errorHandler(warning) {
	throw new Error(warning.message);
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
	onwarn: (warning) => {
		errorHandler(warning);
	},
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
