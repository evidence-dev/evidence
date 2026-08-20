/**
 * Content-Security-Policy for the `{% html %}` sandbox.
 *
 * The CSP is the second layer of isolation (the first is the sandboxed
 * opaque-origin iframe). Two things stay locked regardless of what we allow:
 *
 *   1. `default-src 'none'` — anything not explicitly listed is blocked.
 *   2. Per-directive allowlists with no `*` / scheme wildcards anywhere —
 *      every host that loads anything into the sandbox is named explicitly.
 *
 * `connect-src` deliberately allows a curated set of hosts: tile servers and
 * data CDNs the 80% of analytical visualisations need to function (maps,
 * GeoJSON / TopoJSON loaders, public no-key reference APIs). Every entry on
 * the list is justified inline; removing one needs a code change with a
 * documented reason, adding one needs a security review.
 *
 * Hosts NOT on the default list — internal corporate APIs, paid services,
 * key-required public APIs, user-content domains (s3, blob storage), etc. —
 * are expected to come in through the per-project allowlist (separate
 * feature; admins opt their project into specific extras with audit + UI
 * acknowledgement of the trade-off).
 *
 * `'unsafe-inline'` / `'unsafe-eval'` on `script-src` look scary but cost
 * nothing in this threat model: the entire iframe is opaque-origin and
 * scoped, so "script can execute arbitrary code" is the feature, not the
 * vulnerability. They are deliberately NOT allowed on other directives.
 */

/**
 * CDNs trusted for loading SCRIPTS (and the related style/font/img surfaces).
 * Authors and AI agents reach for these by muscle memory — adding to this
 * list grows supply-chain surface (a compromised CDN could serve bad JS) but
 * does NOT widen the data-exfiltration surface, which `connect-src` controls
 * independently.
 *
 *   - jsdelivr / unpkg / cdnjs: the classic `<script src>` / UMD path
 *   - esm.sh / esm.run: the modern ES-module `import … from` path
 *   - d3js.org: D3's own host (the canonical d3.v7.min.js snippet)
 *
 * All are Cloudflare/Fastly backed and globally fast.
 */
export const SCRIPT_CDN_ORIGINS = [
	'https://cdn.jsdelivr.net',
	'https://esm.sh',
	'https://esm.run',
	'https://unpkg.com',
	'https://cdnjs.cloudflare.com',
	'https://d3js.org'
] as const;

/**
 * Map tile hosts. Two flavours:
 *   - Older / Leaflet-style libs load tiles as `<img src>` (img-src only).
 *   - Modern map libs (Mapbox GL, MapLibre, deck.gl) `fetch()` tiles via
 *     WebGL or batched requests (connect-src as well).
 *
 * Both directives include the same list so the same authoring patterns work
 * regardless of the library chosen.
 */
export const MAP_TILE_ORIGINS = [
	// OpenStreetMap raster tiles — the global no-key fallback for any map
	// viz. OSM uses {a,b,c}.tile.openstreetmap.org for load-balancing.
	// Enumerated rather than wildcarded so the "no `*` in CSP" regression
	// guard keeps biting.
	'https://tile.openstreetmap.org',
	'https://a.tile.openstreetmap.org',
	'https://b.tile.openstreetmap.org',
	'https://c.tile.openstreetmap.org',
	// CartoDB basemaps (Voyager, Positron, Dark Matter). Free, no key,
	// the most commonly-cited basemap in deck.gl / Mapbox GL examples.
	// Carto uses {a,b,c,d}.basemaps.cartocdn.com.
	'https://a.basemaps.cartocdn.com',
	'https://b.basemaps.cartocdn.com',
	'https://c.basemaps.cartocdn.com',
	'https://d.basemaps.cartocdn.com',
	// Stadia Maps — operator of the former Stamen tiles (Toner, Terrain).
	// Free tier without key for non-commercial; serious volume needs a key.
	'https://tiles.stadiamaps.com',
	// ESRI ArcGIS free tile services (World Imagery, World Street Map).
	'https://server.arcgisonline.com',
	'https://services.arcgisonline.com',
	// Wikimedia map tiles — niche but useful for OSM-based visualisations.
	'https://maps.wikimedia.org'
] as const;

/**
 * Hosts allowed for IMAGE loads in addition to map tiles. Images can probe
 * URLs (classic pixel-tracking exfil), but the request is fire-and-forget —
 * an attacker has to control the host to read anything back. Safe to keep
 * relatively broad among well-known asset hosts.
 */
export const IMAGE_ASSET_ORIGINS = [
	// Wikimedia Commons — images referenced from data joins (e.g. country
	// flags from Commons, public-domain illustrations). Two entries: the
	// raw asset host, AND the human-readable redirect resolver at
	// `commons.wikimedia.org/wiki/Special:FilePath/<name>.jpg`, which is
	// the URL shape agents and copy-paste-from-Wikipedia authors reach for
	// (it 302s to `upload.wikimedia.org`, but CSP checks the initial URL
	// against `img-src` before the redirect can rescue it).
	'https://upload.wikimedia.org',
	'https://commons.wikimedia.org',
	// flagcdn.com — country-flag image API used by half the country-data
	// dashboards on the internet.
	'https://flagcdn.com'
] as const;

/**
 * Hosts allowed for fetch / XHR / WebSocket / EventSource requests. This is
 * the directive that controls data-exfiltration surface — every entry here
 * is also a place a compromised CDN library could ship data to. Curate
 * tightly; expand via the per-project allowlist for anything specific to a
 * customer.
 *
 * Each entry below names the use case and what would justify removing it.
 */
export const DATA_FETCH_ORIGINS = [
	// jsdelivr / unpkg — `script-src` already allows them; `connect-src`
	// allows them so author code can `fetch()` JSON, CSV, GeoJSON, and
	// TopoJSON files that live alongside the JS packages they ship with
	// (e.g. `unpkg.com/world-atlas@2/countries-110m.json`, the canonical
	// world-map TopoJSON cited in every D3 tutorial).
	'https://cdn.jsdelivr.net',
	'https://unpkg.com',
	// raw.githubusercontent.com — D3 sample datasets, Khronos glTF
	// samples, hundreds of community example datasets. By far the
	// highest-surface entry on this list (any file in any public repo).
	// Justified because removing it breaks the most common "I followed a
	// D3 tutorial and copied the URL" path. Worth reviewing if we ever see
	// abuse.
	'https://raw.githubusercontent.com',

	// Currency rates — Frankfurt-hosted, ECB-backed reference rates.
	// No key, no rate limit on reasonable use. The "one currency API"
	// pick: institutional source, daily updates back to 1999.
	'https://api.frankfurter.app',

	// REST Countries — country metadata (ISO codes, regions, populations,
	// currencies, capitals). The default join table for any country-
	// keyed data. No key.
	'https://restcountries.com',

	// World Bank Open Data — economic indicators (GDP, population,
	// inflation, etc.) for every country, decades of history. The
	// single most useful free cross-country econ API. No key.
	'https://api.worldbank.org',

	// Open-Meteo — weather + climate + historical reanalysis. No key,
	// generous limits. Surprisingly common in analytics reports
	// (correlate sales with weather, etc.).
	'https://api.open-meteo.com',

	// Statistics Canada Web Data Service — Canadian government
	// statistical data (StatCan). No key required, open access.
	'https://www150.statcan.gc.ca'
] as const;

/**
 * Convenience aggregate that callers use to derive a "this host is in our
 * default allowlist" check. Order doesn't matter — duplicates are fine in
 * CSP output (browsers de-dup).
 */
export const TIER_1_CDN_ORIGINS = SCRIPT_CDN_ORIGINS;

/**
 * Build the CSP for an opaque-origin html sandbox served from `origin`.
 * `origin` is the app origin serving the runtime bundle itself; the
 * allowlists above are added on top so author libraries, tiles, and
 * reference data can load.
 */
export function buildHtmlSandboxCsp(origin: string): string {
	const scriptHosts = SCRIPT_CDN_ORIGINS.join(' ');
	const tileHosts = MAP_TILE_ORIGINS.join(' ');
	const imageHosts = [...MAP_TILE_ORIGINS, ...IMAGE_ASSET_ORIGINS, ...SCRIPT_CDN_ORIGINS].join(' ');
	// Script CDNs are on connect-src as well as script-src for two reasons:
	//   1. Every ES module served by esm.sh (and most jsdelivr `+esm` builds)
	//      embeds `//# sourceMappingURL=…same-cdn…map`. DevTools fetches the
	//      map via `connect-src`; without the CDN on this list, opening
	//      DevTools spams a CSP violation per import.
	//   2. Bundled libraries occasionally `fetch()` sibling chunks / worker
	//      code / WASM from their own CDN at runtime. If we trust the host
	//      to deliver executable code, forbidding it from delivering the
	//      data that code needs is a subtle failure mode that only fires
	//      after a library upgrade.
	// Adding to script-CDN <-> connect-src is a strictly smaller expansion
	// than adding a brand-new host, because the same origin is already an
	// unrestricted code-execution surface via script-src.
	const connectHosts = [...MAP_TILE_ORIGINS, ...DATA_FETCH_ORIGINS, ...SCRIPT_CDN_ORIGINS].join(' ');

	return [
		`default-src 'none'`,
		// Runtime bundle origin + allowlisted CDNs + author inline scripts.
		// 'unsafe-eval' supports libraries that compile at runtime (Chart.js,
		// some plot helpers) and the author's wrapped inline code.
		`script-src ${origin} ${scriptHosts} 'unsafe-inline' 'unsafe-eval'`,
		`style-src ${scriptHosts} 'unsafe-inline'`,
		// Map tiles + image-asset hosts + the CDNs (libraries sometimes load
		// inline assets from their own CDN). data: and blob: cover author-
		// generated images (canvas exports, SVG-to-PNG transitions, etc.).
		`img-src data: blob: ${imageHosts}`,
		`font-src ${origin} data: ${scriptHosts}`,
		// Tile hosts + curated reference-data APIs. See `DATA_FETCH_ORIGINS`
		// for the per-host rationale. Do not relax further (e.g. `https:`
		// scheme-glob) without a security review — every host here is a
		// place a compromised CDN library could exfiltrate data.
		`connect-src ${connectHosts}`,
		`worker-src 'none'`,
		`child-src 'none'`,
		`frame-src 'none'`,
		`base-uri 'none'`,
		`form-action 'none'`
	].join('; ');
}
