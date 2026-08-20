import { describe, it, expect } from 'vitest';
import {
	buildMapSandboxCsp,
	isCanonicalHttpOrigin,
	MAPBOX_DATA_ORIGINS,
	MAPLIBRE_DATA_ORIGINS,
	MAP_DATA_ORIGINS,
	SCRIPT_CDN_ORIGINS
} from './map-csp';

const ORIGIN = 'https://app.example.com';

function directive(csp: string, name: string): string | undefined {
	return csp
		.split(';')
		.map((d) => d.trim())
		.find((d) => d.startsWith(`${name} `) || d === name);
}

describe('buildMapSandboxCsp', () => {
	const csp = buildMapSandboxCsp(ORIGIN);

	it('blocks everything by default', () => {
		expect(csp).toContain(`default-src 'none'`);
	});

	it('allows blob: workers (Mapbox GL / MapLibre GL require them)', () => {
		expect(directive(csp, 'worker-src')).toBe('worker-src blob:');
		expect(directive(csp, 'child-src')).toBe('child-src blob:');
	});

	it('allows Mapbox + MapLibre data hosts on connect-src AND img-src', () => {
		const connectSrc = directive(csp, 'connect-src') ?? '';
		const imgSrc = directive(csp, 'img-src') ?? '';
		for (const host of [...MAPBOX_DATA_ORIGINS, ...MAPLIBRE_DATA_ORIGINS]) {
			expect(connectSrc).toContain(host);
			expect(imgSrc).toContain(host);
		}
	});

	it('allows import CDNs on script-src (so plugins like mapbox-gl-draw load)', () => {
		const scriptSrc = directive(csp, 'script-src') ?? '';
		for (const cdn of SCRIPT_CDN_ORIGINS) {
			expect(scriptSrc).toContain(cdn);
		}
	});

	it('confines unsafe-inline / unsafe-eval to script-src (+ inline styles)', () => {
		for (const d of csp.split(';').map((s) => s.trim())) {
			if (d.startsWith('script-src')) continue;
			expect(d).not.toContain(`'unsafe-eval'`);
			if (d.startsWith('style-src')) continue;
			expect(d).not.toContain(`'unsafe-inline'`);
		}
	});

	it('never uses a `*` or scheme wildcard', () => {
		expect(csp).not.toMatch(/\s\*(\s|$|;)/);
		expect(csp).not.toMatch(/\bhttps?:(?!\/\/[a-z])/);
	});

	it('carries no org id or customer-specific data (component-scoped, not per-tenant)', () => {
		expect(csp).not.toMatch(/org_[A-Za-z0-9]/);
	});

	it('adds per-project extra origins to connect-src + img-src only (never script-src)', () => {
		const withExtra = buildMapSandboxCsp(ORIGIN, ['https://tiles.customer.example']);
		expect(directive(withExtra, 'connect-src')).toContain('https://tiles.customer.example');
		expect(directive(withExtra, 'img-src')).toContain('https://tiles.customer.example');
		expect(directive(withExtra, 'script-src')).not.toContain('tiles.customer.example');
	});

	it('drops malformed extra origins so they cannot broaden or corrupt the policy', () => {
		const csp = buildMapSandboxCsp(ORIGIN, [
			'*',
			'https:',
			"'self'",
			'https://a.com; script-src *', // delimiter injection
			'https://good.example/path', // not a bare origin
			'ftp://nope.example',
			'https://ok.example' // the one legitimate entry
		]);
		expect(csp).not.toContain('*');
		expect(csp).not.toContain(';;');
		expect(csp).not.toMatch(/\bhttps?:(?!\/\/[a-z])/);
		expect(csp).not.toContain('good.example');
		expect(csp).not.toContain('ftp://');
		expect(directive(csp, 'connect-src')).toContain('https://ok.example');
	});

	it('validates canonical http(s) origins (unit)', () => {
		expect(isCanonicalHttpOrigin('https://a.example')).toBe(true);
		expect(isCanonicalHttpOrigin('https://a.example:8443')).toBe(true);
		expect(isCanonicalHttpOrigin('http://a.example')).toBe(true);
		expect(isCanonicalHttpOrigin('https://a.example/path')).toBe(false);
		expect(isCanonicalHttpOrigin('https://*.a.example')).toBe(false);
		expect(isCanonicalHttpOrigin('*')).toBe(false);
		expect(isCanonicalHttpOrigin('https:')).toBe(false);
		expect(isCanonicalHttpOrigin("'self'")).toBe(false);
		expect(isCanonicalHttpOrigin('https://a.example; script-src *')).toBe(false);
		expect(isCanonicalHttpOrigin('ftp://a.example')).toBe(false);
	});

	it('exposes MAP_DATA_ORIGINS as the union of provider host lists', () => {
		for (const host of MAP_DATA_ORIGINS) {
			expect(directive(csp, 'connect-src')).toContain(host);
		}
	});
});
