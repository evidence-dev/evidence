import { describe, it, expect } from 'vitest';
import {
	buildHtmlSandboxCsp,
	SCRIPT_CDN_ORIGINS,
	MAP_TILE_ORIGINS,
	IMAGE_ASSET_ORIGINS,
	DATA_FETCH_ORIGINS,
	TIER_1_CDN_ORIGINS
} from './html-csp';

const ORIGIN = 'https://app.example.com';

function directive(csp: string, name: string): string | undefined {
	return csp
		.split(';')
		.map((d) => d.trim())
		.find((d) => d.startsWith(`${name} `) || d === name);
}

describe('buildHtmlSandboxCsp', () => {
	const csp = buildHtmlSandboxCsp(ORIGIN);

	it('blocks everything by default', () => {
		expect(csp).toContain(`default-src 'none'`);
	});

	it('allows the runtime origin + allowlisted CDNs + author inline scripts', () => {
		for (const cdn of TIER_1_CDN_ORIGINS) {
			expect(csp).toContain(cdn);
		}
		expect(csp).toMatch(new RegExp(`script-src ${ORIGIN}[^;]*'unsafe-inline'`));
		expect(csp).toMatch(/script-src[^;]*cdn\.jsdelivr\.net/);
		expect(csp).toMatch(/script-src[^;]*esm\.sh/);
	});

	it('allows map-tile hosts on img-src AND connect-src', () => {
		// Both directives are needed: img-tag-based libs (Leaflet raster) go
		// through img-src, modern WebGL/fetch libs (deck.gl, MapLibre) go
		// through connect-src.
		const imgSrc = directive(csp, 'img-src');
		const connectSrc = directive(csp, 'connect-src');
		expect(imgSrc).toBeDefined();
		expect(connectSrc).toBeDefined();
		for (const host of MAP_TILE_ORIGINS) {
			expect(imgSrc).toContain(host);
			expect(connectSrc).toContain(host);
		}
	});

	it('allows image-asset hosts (flags, wikimedia) on img-src only', () => {
		// flagcdn / wikimedia commons are image-only — there's no reason
		// they need to be reachable via fetch(), which would just widen
		// exfiltration surface.
		const imgSrc = directive(csp, 'img-src');
		const connectSrc = directive(csp, 'connect-src');
		for (const host of IMAGE_ASSET_ORIGINS) {
			expect(imgSrc).toContain(host);
			expect(connectSrc).not.toContain(host);
		}
	});

	it('covers both wikimedia image-URL shapes on img-src', () => {
		// Two shapes an author reaches for:
		//   1. `https://upload.wikimedia.org/wikipedia/commons/...` — the
		//      raw asset URL (canonical, but non-obvious to construct).
		//   2. `https://commons.wikimedia.org/wiki/Special:FilePath/<name>`
		//      — the human-readable redirect resolver (what "copy image
		//      address" on Wikipedia often yields, and what agents pick).
		// CSP evaluates the *initial* URL against img-src before following
		// redirects, so both hosts have to be on the allowlist even though
		// (2) always ends up serving from (1).
		const imgSrc = directive(csp, 'img-src') ?? '';
		expect(imgSrc).toContain('https://upload.wikimedia.org');
		expect(imgSrc).toContain('https://commons.wikimedia.org');
	});

	it('allows script CDNs on connect-src as well as script-src', () => {
		// Every ES module served by esm.sh (and most `+esm` builds on
		// jsdelivr) embeds `//# sourceMappingURL=…same-cdn…map`. DevTools
		// fetches those source maps via `connect-src`, so without the CDN
		// on this list every author-authored `import` spams a CSP
		// violation the moment DevTools opens. Same shape covers legit
		// runtime fetches (workers, WASM, lazy chunks) a bundled library
		// makes back to its own CDN.
		//
		// The security trade-off is nil: `script-src` already grants these
		// hosts unrestricted code execution inside the sandbox. Denying
		// them `connect-src` does not reduce exfiltration surface — the
		// code they ship can always exfiltrate via any other allowed host.
		const connectSrc = directive(csp, 'connect-src') ?? '';
		for (const cdn of SCRIPT_CDN_ORIGINS) {
			expect(connectSrc).toContain(cdn);
		}
	});

	it('allows curated public-data APIs on connect-src', () => {
		// Each entry here is a deliberate choice — see the docstring in
		// html-csp.ts for the rationale per host. Pinning the full set
		// means a future change that removes one has to also update this
		// test and explain why.
		const connectSrc = directive(csp, 'connect-src');
		const expected = [
			'https://api.frankfurter.app',
			'https://restcountries.com',
			'https://api.worldbank.org',
			'https://api.open-meteo.com',
			'https://www150.statcan.gc.ca',
			'https://cdn.jsdelivr.net',
			'https://unpkg.com',
			'https://raw.githubusercontent.com'
		];
		for (const host of expected) {
			expect(DATA_FETCH_ORIGINS).toContain(host);
			expect(connectSrc).toContain(host);
		}
	});

	it('does not allow key-required public APIs on the default connect-src', () => {
		// Keys handed to author JS in the iframe become public the moment
		// the report is shared (sandbox is opaque, but the rendered HTML
		// the user wrote is plaintext in the DB). The default allowlist is
		// keyless-only on purpose. Per-project allowlists (separate feature)
		// are the right place for key-required APIs once we have project
		// secrets to inject server-side.
		const connectSrc = directive(csp, 'connect-src') ?? '';
		// Common ones we deliberately excluded.
		expect(connectSrc).not.toMatch(/exchangerate\.host|fixer\.io|apilayer/i);
		expect(connectSrc).not.toMatch(/openweathermap|nasa\.gov/i);
		expect(connectSrc).not.toMatch(/api\.census\.gov/);
		expect(connectSrc).not.toMatch(/fred\.stlouisfed/i);
	});

	it('does not let connect-src silently allow scheme wildcards or `*`', () => {
		// A `*` or `https:` wildcard in connect-src would defeat the whole
		// point of enumerating hosts.
		expect(csp).not.toContain('*');
		expect(csp).not.toMatch(/connect-src[^;]*\bhttps?:(?!\/\/[a-z])/);
		expect(csp).not.toMatch(/script-src[^;]*\bhttps?:(?!\/\/[a-z])/);
	});

	it('blocks workers, nested frames, and base/form hijacking', () => {
		expect(csp).toContain(`worker-src 'none'`);
		expect(csp).toContain(`child-src 'none'`);
		expect(csp).toContain(`frame-src 'none'`);
		expect(csp).toContain(`base-uri 'none'`);
		expect(csp).toContain(`form-action 'none'`);
	});

	// The asserts below are regression guards. Each is a specific way a future
	// change could quietly widen the policy — adding `'unsafe-eval'` to
	// `style-src`, `data:` to `script-src`, etc. — none of which a casual
	// reviewer would necessarily flag. Pin them by name so anyone changing the
	// CSP has to also change a test that names the threat.

	it('does not contain `*` or any wildcard scheme on any directive', () => {
		expect(csp).not.toMatch(/\s\*(\s|$|;)/);
		expect(csp).not.toMatch(/\bhttps?:(?!\/\/[a-z])/);
	});

	it('keeps `unsafe-eval` confined to script-src', () => {
		const directives = csp.split(';').map((d) => d.trim());
		for (const d of directives) {
			if (d.startsWith('script-src')) continue;
			expect(d).not.toContain(`'unsafe-eval'`);
		}
	});

	it('keeps `unsafe-inline` confined to script-src and style-src', () => {
		const directives = csp.split(';').map((d) => d.trim());
		for (const d of directives) {
			if (d.startsWith('script-src') || d.startsWith('style-src')) continue;
			expect(d).not.toContain(`'unsafe-inline'`);
		}
	});

	it('does not allow `data:` or `blob:` in script-src (would break the CDN allowlist)', () => {
		const scriptSrc = directive(csp, 'script-src');
		expect(scriptSrc).toBeDefined();
		expect(scriptSrc).not.toMatch(/\bdata:/);
		expect(scriptSrc).not.toMatch(/\bblob:/);
	});

	it('does not declare a media-src that would re-enable network egress', () => {
		// Falls back to default-src 'none'. If a future change adds
		// `media-src https:` or similar, video/audio elements become an
		// exfiltration channel (range requests, etc.). Pin the absence.
		expect(csp).not.toMatch(/\bmedia-src\b/);
	});

	it('exposes per-host explanatory comments in the source file', async () => {
		// Each connect-src entry should have a justification comment near it
		// in html-csp.ts. The check is best-effort but catches the "someone
		// adds a host without explaining why" case.
		const { readFileSync } = await import('node:fs');
		const { fileURLToPath } = await import('node:url');
		const source = readFileSync(
			fileURLToPath(new URL('./html-csp.ts', import.meta.url)),
			'utf8'
		);
		// Spot-check: every DATA_FETCH host string appears in the source
		// (trivially true) AND there's at least one `//` comment within 6
		// lines above it.
		const lines = source.split('\n');
		for (const host of DATA_FETCH_ORIGINS) {
			const idx = lines.findIndex((l) => l.includes(host));
			expect(idx).toBeGreaterThan(-1);
			// Either an explicit `//` per-host comment or the host falls under
			// a JSDoc block comment (`/* … */` with `*` continuation lines).
			const window = lines.slice(Math.max(0, idx - 6), idx).join('\n');
			expect(window).toMatch(/\/\/|\*/);
		}
	});
});
