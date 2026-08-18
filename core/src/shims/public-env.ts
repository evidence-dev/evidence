/**
 * Public environment shim - replaces $env/static/public.
 * Provides public env vars with fallbacks for non-Studio contexts.
 *
 * Requires envPrefix: ['VITE_', 'PUBLIC_'] in the host app's vite.config.ts
 * so Vite exposes PUBLIC_* vars through import.meta.env.
 */

// Vercel blob base URL - used for evd_ image shortcuts
// Falls back to empty string in CLI/non-Studio contexts (evd_ shortcuts won't work)
export const PUBLIC_VERCEL_BLOB_BASE_URL: string =
	import.meta.env.PUBLIC_VERCEL_BLOB_BASE_URL || '';

// Empty in CLI/non-Studio contexts, which switches maps to the open-source basemap
export const PUBLIC_MAPBOX_TOKEN: string = import.meta.env.PUBLIC_MAPBOX_TOKEN || '';
