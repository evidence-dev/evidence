import { describe, it, expect } from 'vitest';
import { resolveMapProvider } from './resolve-map-provider';

describe('resolveMapProvider', () => {
	it('defaults to keyless MapLibre when no token is available', () => {
		expect(resolveMapProvider({})).toEqual({ provider: 'maplibre' });
		expect(resolveMapProvider({ userToken: '', evidenceToken: '   ' })).toEqual({
			provider: 'maplibre'
		});
	});

	it("uses Evidence's shared token under the hood when the author has none", () => {
		expect(resolveMapProvider({ evidenceToken: 'pk.evidence' })).toEqual({
			provider: 'mapbox',
			token: 'pk.evidence'
		});
	});

	it('prefers the author token over the shared Evidence token', () => {
		expect(resolveMapProvider({ userToken: 'pk.author', evidenceToken: 'pk.evidence' })).toEqual({
			provider: 'mapbox',
			token: 'pk.author'
		});
	});

	it('lets a block pin MapLibre even when a Mapbox token exists (bill escape hatch)', () => {
		expect(resolveMapProvider({ evidenceToken: 'pk.evidence', forceProvider: 'maplibre' })).toEqual(
			{ provider: 'maplibre' }
		);
	});

	it('falls back to MapLibre when Mapbox is forced but no token is available', () => {
		// Never render a broken keyless-Mapbox map; degrade to working MapLibre.
		expect(resolveMapProvider({ forceProvider: 'mapbox' })).toEqual({ provider: 'maplibre' });
	});

	it('trims whitespace-only tokens to nothing', () => {
		expect(resolveMapProvider({ userToken: '  pk.spaced  ', evidenceToken: null })).toEqual({
			provider: 'mapbox',
			token: 'pk.spaced'
		});
	});
});
