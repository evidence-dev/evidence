import evidencePreprocess from '@evidence-dev/preprocess';
import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';
import liveReload from 'vite-plugin-live-reload';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: evidencePreprocess(),
	kit: {
		adapter: adapter(),
		target: '#evidence',
		files: {
			routes: 'src/pages',
			lib: 'src/components'
		},
		vite: defineConfig({
			plugins: [liveReload.default('./.evidence/build/queries/**')]
		})
	}
};

export default config;
