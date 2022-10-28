import evidencePreprocess from '@evidence-dev/preprocess'
import adapter from '@sveltejs/adapter-static';
// import FullReload from 'vite-plugin-full-reload'
// import liveReload from 'vite-plugin-live-reload'

/** @type {import('@sveltejs/kit').Config} */

const config = {
	extensions: ['.svelte', ".md"],
	preprocess: evidencePreprocess(true), // Modify preprocess to allow for loading of $lib instead of package version of components library
	kit: {
		adapter: adapter(),
		files: {
			routes: 'src/pages',
			lib: 'src/components'
		},
		package: {
			dir: '../../packages/components',
			emitTypes: true
		},
		vite: {
			optimizeDeps: {
				include: ['echarts-stat'],
				exclude: ['@evidence-dev/components']
			},
			ssr: {
				external: ['@evidence-dev/db-orchestrator', '@evidence-dev/telemetry', 'blueimp-md5']
			},
			plugins: [
				// FullReload.default(['./.evidence-queries/extracted/*'], { delay: 150 })
				// liveReload('./.evidence-queries/extracted/*')
			],
		}
	}
};

export default config;