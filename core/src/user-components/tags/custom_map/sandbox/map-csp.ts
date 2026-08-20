/**
 * Content-Security-Policy for the `{% custom_map %}` sandbox.
 *
 * Same two-layer isolation as the other sandboxes (opaque-origin iframe +
 * CSP), but this policy is deliberately wider than the `{% html %}` block on
 * exactly two axes, because a map is a networked, worker-backed library:
 *
 *   1. `worker-src` / `child-src` allow `blob:` — Mapbox GL and MapLibre GL
 *      both spawn their render/parse worker from a blob URL and will not
 *      initialise without it. (This is what blocks a MapLibre map in the plain
 *      html block today.)
 *   2. `connect-src` / `img-src` allow the map tile + style + glyph hosts for
 *      Mapbox and MapLibre/OpenFreeMap, plus the keyless community basemaps.
 *
 * Everything else stays as locked down as the html block: `default-src 'none'`,
 * enumerated hosts with no `*` / scheme wildcards, and `'unsafe-inline'` /
 * `'unsafe-eval'` confined to `script-src` (the opaque origin is what makes
 * arbitrary author code safe).
 *
 * Unlike the interim per-org html allowlist, this policy carries NO org id and
 * NO customer-specific data — it is a property of the component, applied
 * identically for every tenant. Author code that needs a data host we don't
 * list here (a third-party tile server, a private API) comes in through the
 * per-project data-host allowlist (`extraOrigins`), never a code change.
 */

/**
 * Script/style CDNs. Authors reach for these to `import` the Mapbox-ecosystem
 * libraries a custom map needs beyond the base library — mapbox-gl-draw
 * (lasso/box select), deck.gl, turf, h3-js, supercluster, etc. All are on npm,
 * so all resolve from these hosts: "import the plugin you want" needs no
 * per-library change here.
 */
export const SCRIPT_CDN_ORIGINS = [
	'https://cdn.jsdelivr.net',
	'https://esm.sh',
	'https://esm.run',
	'https://unpkg.com',
	'https://cdnjs.cloudflare.com'
] as const;

/**
 * Mapbox GL data hosts (the library itself is provided by the runtime; these
 * are the runtime *data* fetches):
 *   - api.mapbox.com: style JSON, glyphs, sprites, TileJSON, and (GL JS v2+)
 *     the unified vector/raster tile endpoint.
 *   - {a,b,c,d}.tiles.mapbox.com: classic (GL JS v1) + raster tile endpoints.
 *   - events.mapbox.com: telemetry. Harmless if blocked; listed to avoid
 *     console CSP-violation noise.
 */
export const MAPBOX_DATA_ORIGINS = [
	'https://api.mapbox.com',
	'https://a.tiles.mapbox.com',
	'https://b.tiles.mapbox.com',
	'https://c.tiles.mapbox.com',
	'https://d.tiles.mapbox.com',
	'https://events.mapbox.com'
] as const;

/**
 * MapLibre GL data hosts — the keyless default. OpenFreeMap serves the
 * Positron / Liberty / Dark styles the built-in map already uses; the demo
 * tiles host backs MapLibre's own examples.
 */
export const MAPLIBRE_DATA_ORIGINS = [
	'https://tiles.openfreemap.org',
	'https://demotiles.maplibre.org'
] as const;

/**
 * Keyless community basemaps — the same set the html block and built-in map
 * expose, so an author copying a Leaflet/deck.gl/MapLibre example finds the
 * common tile hosts already working. Enumerated (subdomains listed) so the
 * no-`*` invariant holds.
 */
export const COMMUNITY_TILE_ORIGINS = [
	'https://tile.openstreetmap.org',
	'https://a.tile.openstreetmap.org',
	'https://b.tile.openstreetmap.org',
	'https://c.tile.openstreetmap.org',
	'https://a.basemaps.cartocdn.com',
	'https://b.basemaps.cartocdn.com',
	'https://c.basemaps.cartocdn.com',
	'https://d.basemaps.cartocdn.com',
	'https://tiles.stadiamaps.com',
	'https://server.arcgisonline.com',
	'https://services.arcgisonline.com',
	'https://maps.wikimedia.org'
] as const;

/** Every default map data host, in one list for CSP assembly. */
export const MAP_DATA_ORIGINS = [
	...MAPBOX_DATA_ORIGINS,
	...MAPLIBRE_DATA_ORIGINS,
	...COMMUNITY_TILE_ORIGINS
] as const;

/**
 * A CSP source is a canonical http(s) origin only — `https://host[:port]` with
 * no path, no wildcard, no CSP delimiters. `extraOrigins` flows from a future
 * per-project allowlist, so it is untrusted input: an entry like `*`, `https:`,
 * `'self'`, or `https://a.com; script-src *` would broaden or corrupt the
 * policy if joined verbatim. `new URL(...).origin === entry` accepts only exact,
 * scheme-qualified origins and rejects everything else (fail-closed).
 */
export function isCanonicalHttpOrigin(entry: string): boolean {
	// `new URL('https://*.a.com')` parses and round-trips, so the origin check
	// alone would let a subdomain wildcard through — reject any `*` outright.
	if (entry.includes('*')) return false;
	try {
		const url = new URL(entry);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
		return url.origin === entry;
	} catch {
		return false;
	}
}

/**
 * Build the CSP for a `{% custom_map %}` sandbox served from `origin`.
 *
 * `extraOrigins` is the per-project data-host allowlist seam: hosts an admin
 * has opted a project into (a custom tile server, a private data API). Added
 * to `connect-src` + `img-src` only — never to the code-execution surface.
 * Entries are validated as canonical origins and anything else is dropped, so
 * a bad allowlist entry can't inject a wildcard or extra directive.
 */
export function buildMapSandboxCsp(origin: string, extraOrigins: readonly string[] = []): string {
	const safeExtra = extraOrigins.filter(isCanonicalHttpOrigin);
	const scriptHosts = SCRIPT_CDN_ORIGINS.join(' ');
	const imageHosts = [...MAP_DATA_ORIGINS, ...SCRIPT_CDN_ORIGINS, ...safeExtra].join(' ');
	const connectHosts = [...MAP_DATA_ORIGINS, ...SCRIPT_CDN_ORIGINS, ...safeExtra].join(' ');

	return [
		`default-src 'none'`,
		// Runtime bundle origin + import CDNs + author inline scripts. 'unsafe-eval'
		// covers libraries that compile at runtime; 'unsafe-inline' the author's
		// inline map code. Safe only because the iframe is opaque-origin + scoped.
		`script-src ${origin} ${scriptHosts} 'unsafe-inline' 'unsafe-eval'`,
		`style-src ${scriptHosts} 'unsafe-inline'`,
		// Tiles/sprites load as images on some layers; data:/blob: cover
		// canvas/marker images the map generates.
		`img-src data: blob: ${imageHosts}`,
		`font-src ${origin} data: ${scriptHosts}`,
		// Map tiles, styles, glyphs + import CDNs + per-project extras. This is
		// the data-exfiltration surface — do not relax to a scheme wildcard
		// without a security review.
		`connect-src ${connectHosts}`,
		// Mapbox GL / MapLibre GL spawn their worker from a blob URL.
		`worker-src blob:`,
		`child-src blob:`,
		`frame-src 'none'`,
		`base-uri 'none'`,
		`form-action 'none'`
	].join('; ');
}
