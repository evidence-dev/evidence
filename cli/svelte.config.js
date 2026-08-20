import adapter from './adapter/index.js';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			binaryName: 'evidence',
			out: 'dist'
		}),
		alias: {
			'@evidence/core': path.resolve('../core/src'),
			'@evidence/core/*': path.resolve('../core/src/*'),
			'$cli': path.resolve('./cli'),
			'$cli/*': path.resolve('./cli/*')
		}
	}
};

export default config;
