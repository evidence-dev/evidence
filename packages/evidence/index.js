import evidencePreprocess from '@evidence-dev/preprocess'
import adapter from '@sveltejs/adapter-static';
import FullReload from 'vite-plugin-full-reload'

/** @type {import('@sveltejs/kit').Config} */

export const config = {
	extensions: ['.svelte', ".md"],
	preprocess: evidencePreprocess(),
	kit: {
		adapter: adapter(),
		files: {
			routes: 'src/pages',
			lib: 'src/components'
		},
		vite: {
			optimizeDeps: {
				include: ['echarts-stat', 'prettier-sql'],
				exclude: ['@evidence-dev/components']
			},
			ssr: {
				external: ['@evidence-dev/db-orchestrator']
			},
			plugins: [
				FullReload.default(['./.evidence/build/queries/**'], {delay: 150}),
			]
		}
	}
};
