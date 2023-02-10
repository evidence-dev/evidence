import adapter from '@sveltejs/adapter-static';
import evidencePreprocess from '@evidence-dev/preprocess'
import sveltePreprocess from "svelte-preprocess";
import sequential from 'svelte-sequential-preprocessor'
/** @type {import('@sveltejs/kit').Config} */

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: sequential([evidencePreprocess(true), sveltePreprocess({typescript:true})]),
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