import { sveltekit } from '@sveltejs/kit/vite';
import { sourceQueryHmr, queryDirectoryHmr } from '@evidence-dev/sdk/build/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), sourceQueryHmr(), queryDirectoryHmr],
	optimizeDeps: {
		include: ['echarts-stat', 'echarts'],
		exclude: ['svelte-icons']
	},
	ssr: {
		external: [
			'@evidence-dev/db-orchestrator',
			'@evidence-dev/telemetry',
			'blueimp-md5',
			'@evidence-dev/sdk/plugins'
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
