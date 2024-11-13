import { sveltekit } from '@sveltejs/kit/vite';
import { sourceQueryHmr } from '@evidence-dev/sdk/build/vite';
import { evidenceThemes } from '@evidence-dev/tailwind/vite-plugin';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), sourceQueryHmr(), evidenceThemes()],
	optimizeDeps: {
		include: ['echarts-stat', 'echarts'],
		exclude: ['svelte-icons']
	},
	ssr: {
		external: [
			'@evidence-dev/db-orchestrator',
			'@evidence-dev/telemetry',
			'blueimp-md5',
			'@evidence-dev/plugin-connector'
		]
	},
	server: {
		fs: {
			strict: process.env.NODE_ENV !== 'development'
		},
		hmr: {
			overlay: false
		}
	},
	build: {
		rollupOptions: {
			external: [/^@evidence-dev\/tailwind\/fonts\//]
		}
	}
};

export default config;
