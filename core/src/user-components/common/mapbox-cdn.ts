/**
 * Mapbox GL JS is licensed under the Mapbox TOS, not an OSI license, and its
 * grant only runs to the holder of an active Mapbox account — so it must never
 * be bundled into anything `@evidence/core` or the CLI distribute. Loading it
 * from a CDN keeps it out of our artifacts entirely: the token holder's browser
 * fetches it under their own account, which is how Mapbox intends it to be
 * consumed. MapLibre stays bundled as the keyless default.
 *
 * Pinned to an exact version, not a `@3` range: a floating range means the code
 * running in a user's browser changes without an Evidence release, and Studio
 * would serve CDN JS against the older `mapbox-gl` CSS it bundles from npm.
 * Keep in step with the `mapbox-gl` dependency in `studio/package.json` — the
 * drift test there fails if these diverge.
 *
 * `+esm` rather than `dist/mapbox-gl.js` because the published dist bundle is
 * UMD, so a browser `import()` of it yields no usable default export.
 */
export const MAPBOX_GL_VERSION = '3.20.0';

export const MAPBOX_GL_CSS_URL = `https://cdn.jsdelivr.net/npm/mapbox-gl@${MAPBOX_GL_VERSION}/dist/mapbox-gl.css`;

const MAPBOX_GL_ESM_URL = `https://cdn.jsdelivr.net/npm/mapbox-gl@${MAPBOX_GL_VERSION}/+esm`;

/** Shape we rely on: the namespace/default export with a settable `accessToken`. */
export interface MapboxGlModule {
	accessToken?: string;
	[key: string]: unknown;
}

/**
 * `@vite-ignore` is what makes the no-bundling guarantee structural rather than
 * incidental: without it the specifier is statically analyzable and a host build
 * would pull the proprietary package back into the output.
 */
export async function loadMapboxGl(token?: string): Promise<MapboxGlModule> {
	const mod = await import(/* @vite-ignore */ MAPBOX_GL_ESM_URL);
	const mapboxgl = ((mod as { default?: unknown }).default ?? mod) as MapboxGlModule;
	if (token) mapboxgl.accessToken = token;
	return mapboxgl;
}
