import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		// Replaceable at build time by release.ts --dev so the dev binary bakes
		// in staging defaults. BUILD_QUERY_ENGINE_HOST controls the value.
		__DEFAULT_QUERY_ENGINE_HOST__: JSON.stringify(
			process.env.BUILD_QUERY_ENGINE_HOST ?? 'https://query-engine-service.evidence.studio'
		)
	},
	// Match studio: core's shims read PUBLIC_* vars off import.meta.env (e.g. PUBLIC_MAPBOX_TOKEN)
	envPrefix: ['VITE_', 'PUBLIC_'],
	resolve: {
		alias: {
			'@evidence/core': path.resolve(__dirname, '../core/src')
		}
	},
	server: {
		fs: {
			// Allow serving files from core
			allow: ['..']
		},
		watch: {
			// Ensure core changes trigger HMR
			ignored: ['!**/core/**']
		}
	},
	optimizeDeps: {
		// Don't pre-bundle @evidence/core - let Vite handle it
		exclude: ['@evidence/core'],
		// Pre-bundle deps that @evidence/core pulls in (it's excluded above, so
		// Vite can't discover these by crawling it). Without this they're found
		// mid-session on first import, triggering a re-optimize + the
		// `svelte_legacy.js` 404 cascade that breaks client-side hydration.
		include: ['svelte-sonner', 'html-to-image']
	},
	ssr: {
		// Bundle packages with Svelte components during SSR so they're processed properly
		noExternal: [
			'@evidence/core',
			/svelte/,
			'virtua',
			'echarts',
			'bits-ui',
			'runed'
		]
	}
});
