/**
 * Chooses the basemap provider + token for a `{% custom_map %}` block.
 *
 * Goal: authors never have to touch a key in the common case.
 *   - No token anywhere  → MapLibre + OpenFreeMap (keyless, free, no bill).
 *   - A token available  → Mapbox, using that token. The token is Evidence's
 *     own shared `PUBLIC_MAPBOX_TOKEN` unless the author supplied their own —
 *     so "Evidence's key under the hood" is the default Mapbox experience,
 *     matching what the built-in `{% map %}` component already does
 *     (`mapProvider = PUBLIC_MAPBOX_TOKEN ? 'mapbox' : 'maplibre'`).
 *
 * `forceProvider` lets a block pin MapLibre even when a Mapbox token exists —
 * the escape hatch for keeping a given map off the shared Mapbox bill.
 */
export type MapProvider = 'mapbox' | 'maplibre';

export interface ResolvedMapProvider {
	provider: MapProvider;
	/** Present only for Mapbox; MapLibre + OpenFreeMap needs no token. */
	token?: string;
}

export interface ResolveMapProviderInput {
	/** Author-supplied token (`token=`), if any. Bills the author's account. */
	userToken?: string | null;
	/** Evidence's shared `PUBLIC_MAPBOX_TOKEN`, injected under the hood. */
	evidenceToken?: string | null;
	/** Author override: pin a provider regardless of token availability. */
	forceProvider?: MapProvider | null;
}

function clean(token: string | null | undefined): string | undefined {
	const t = token?.trim();
	return t ? t : undefined;
}

export function resolveMapProvider(input: ResolveMapProviderInput): ResolvedMapProvider {
	// Explicit MapLibre wins outright — the way to keep a map off the Mapbox
	// bill even when a token is available.
	if (input.forceProvider === 'maplibre') return { provider: 'maplibre' };

	// Author token takes precedence over Evidence's shared token.
	const token = clean(input.userToken) ?? clean(input.evidenceToken);

	// Mapbox needs a token; without one we can't honour a Mapbox request, so we
	// fall back to the keyless MapLibre basemaps rather than render a broken map.
	if (!token) return { provider: 'maplibre' };

	return { provider: 'mapbox', token };
}
