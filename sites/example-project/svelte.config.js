import preprocess from 'svelte-preprocess';
import evidencePreprocess from '@evidence-dev/preprocess';
import adapter from '@sveltejs/adapter-static';
import { evidencePlugins } from '@evidence-dev/plugin-connector';
/** @type {import('@sveltejs/kit').Config} */

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		...evidencePreprocess(true),
		evidencePlugins(),
		preprocess({
			postcss: true
		})
	], // Modify preprocess to allow for loading of $lib instead of package version of components library
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
