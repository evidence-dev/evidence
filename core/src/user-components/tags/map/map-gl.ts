import type * as maplibregl from 'maplibre-gl';
import { loadMapboxGl } from '../../common/mapbox-cdn';
import { PUBLIC_MAPBOX_TOKEN } from '../../../shims/public-env';

// Types are modeled on maplibre-gl (open source). Mapbox GL exposes the same API for the subset we
// use, so its module is cast to this shape when loaded.
export type MapGL = typeof import('maplibre-gl');

// Mapbox needs a billed token; without one (e.g. the open-source CLI) we use MapLibre + OpenFreeMap
export const mapProvider: 'mapbox' | 'maplibre' = PUBLIC_MAPBOX_TOKEN ? 'mapbox' : 'maplibre';

/**
 * Explicit carve-out from the query engine's default 10k `MAX_USER_LIMIT`.
 *
 * Tables cap raw client-side rows low and paginate the rest; a map can't
 * paginate a spatial view, so it must hold every point at once. WebGL renders
 * 100k points comfortably — the real ceiling is fetch payload, not the GPU.
 * Map layers pass this as `maxUserLimit` so an explicit `limit=` is honored up
 * to 100k instead of being sampled down to 2k. Keep map row limits pinned here
 * so the carve-out stays easy to find. Tune once measured on a mid-tier device.
 */
export const MAP_POINT_ROW_LIMIT = 100_000;

export const basemapStyles = {
	mapbox: {
		light: 'mapbox://styles/mapbox/light-v11',
		dark: 'mapbox://styles/mapbox/dark-v11'
	},
	maplibre: {
		light: 'https://tiles.openfreemap.org/styles/positron',
		dark: 'https://tiles.openfreemap.org/styles/dark'
	}
} as const;

// Layer below which data layers should be inserted so labels stay on top.
export function getLabelInsertionId(map: maplibregl.Map): string | undefined {
	const layers = map.getStyle()?.layers;
	if (!layers?.length) return undefined;

	// Mapbox's v11 styles keep all labels in one top block; the long-standing behavior is to
	// insert below the first label, which we leave untouched
	if (mapProvider === 'mapbox') {
		return layers.find((l) => l.type === 'symbol' && l.layout?.['text-field'])?.id;
	}

	// OpenFreeMap interleaves some labels (water/road names) below roads, so "first label" would
	// sink data under roads; insert below the topmost contiguous run of symbol layers instead
	let bottomOfLabelStack: string | undefined;
	for (let i = layers.length - 1; i >= 0 && layers[i].type === 'symbol'; i--) {
		bottomOfLabelStack = layers[i].id;
	}
	// Fallback for styles that don't end in a symbol run
	return (
		bottomOfLabelStack ?? layers.find((l) => l.type === 'symbol' && l.layout?.['text-field'])?.id
	);
}

let glPromise: Promise<MapGL> | null = null;

export function loadMapGL(): Promise<MapGL> {
	glPromise ??= (
		mapProvider === 'mapbox'
			? loadMapboxGl(PUBLIC_MAPBOX_TOKEN).then((m) => m as unknown as MapGL)
			: import('maplibre-gl').then((m) => m.default as unknown as MapGL)
	).catch((err) => {
		// Don't cache the rejection — let the next map mount retry the import
		glPromise = null;
		throw err;
	});
	return glPromise;
}
