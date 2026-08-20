import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// Svelte plugin + shim aliases mirror the root vitest config so tests can
// import modules that reach @evidence/core's component registry.
const coreShims = path.resolve(import.meta.dirname, '../core/src/shims');

export default defineConfig({
	plugins: [svelte()],
	resolve: {
		conditions: ['svelte'],
		alias: {
			'$app/environment': path.join(coreShims, 'env.ts'),
			'$app/state': path.join(coreShims, 'page-state.ts'),
			'$app/navigation': path.join(coreShims, 'navigation.ts'),
			'$env/static/public': path.join(coreShims, 'env-vars.ts'),
			'$env/dynamic/private': path.join(coreShims, 'env-vars.ts'),
			'$env/static/private': path.join(coreShims, 'env-vars.ts'),
			'$env/dynamic/public': path.join(coreShims, 'env-vars.ts'),
			$lib: path.resolve(import.meta.dirname, './src/lib'),
			$cli: path.resolve(import.meta.dirname, './cli')
		}
	},
	ssr: {
		// Packages with .svelte file exports must be processed by Vite (not left
		// as external) — same list as the root vitest config.
		noExternal: [
			'bits-ui',
			'svelte-sonner',
			'lucide-svelte',
			'@lucide/svelte',
			'runed',
			'virtua',
			'mode-watcher',
			'formsnap',
			'paneforge',
			'vaul-svelte',
			'layerchart',
			'@number-flow/svelte',
			'@steeze-ui/svelte-icon',
			'sveltekit-superforms'
		]
	},
	test: {
		include: ['cli/**/*.test.ts', 'src/**/*.test.ts'],
		globals: true,
		environment: 'node'
	}
});
