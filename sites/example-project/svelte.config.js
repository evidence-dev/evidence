import evidencePreprocess from '@evidence-dev/preprocess'
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */

const config = {
	extensions: ['.svelte', ".md"],
	preprocess: evidencePreprocess(true), // Modify preprocess to allow for loading of $lib instead of package version of components library
	kit: {
		adapter: adapter({
			strict: false
		}),
		files: {
			routes: 'src/pages',
			lib: 'src/components'
		}
	},
    package: {
        dir: '../../packages/components',
        emitTypes: true
    }
};

export default config;