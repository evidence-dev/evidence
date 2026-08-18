import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/**
 * Root vitest config for core tests.
 * Studio tests run separately via studio/vite.config.ts (requires sveltekit() plugin).
 */
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		// 'browser' allows tests running in a DOM environment (@vitest-environment
		// jsdom) to import svelte's client-only APIs (mount, unmount). The 'svelte'
		// condition picks the .svelte source files via the package export map.
		conditions: ['svelte', 'browser'],
		alias: {
			$lib: path.resolve(import.meta.dirname, './studio/src/lib'),
			'@evidence/core': path.resolve(import.meta.dirname, './core/src'),
			'$app/environment': path.resolve(import.meta.dirname, './core/src/shims/env.ts'),
			'$app/state': path.resolve(import.meta.dirname, './core/src/shims/page-state.ts'),
			'$app/navigation': path.resolve(import.meta.dirname, './core/src/shims/navigation.ts'),
			'$env/static/public': path.resolve(import.meta.dirname, './core/src/shims/env-vars.ts'),
			'$env/dynamic/private': path.resolve(import.meta.dirname, './core/src/shims/env-vars.ts'),
			'$env/static/private': path.resolve(import.meta.dirname, './core/src/shims/env-vars.ts'),
			'$env/dynamic/public': path.resolve(import.meta.dirname, './core/src/shims/env-vars.ts')
		}
	},
	ssr: {
		// Packages with .svelte file exports must be processed by Vite (not left as external)
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
		name: 'core',
		root: path.resolve(import.meta.dirname, './core'),
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'node',
		pool: 'forks',
		setupFiles: ['./src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text-summary', 'lcov', 'json-summary'],
			reportsDirectory: '../coverage/core',
			include: ['src/**/*.{ts,js,svelte}'],
			exclude: ['src/**/*.{test,spec}.{ts,js}']
		}
	}
});
