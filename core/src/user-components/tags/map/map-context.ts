import { getContext, setContext } from 'svelte';
import type * as maplibregl from 'maplibre-gl';
import type { AreaLayerProps } from './area_layer/AreaLayer.svelte';
import type { AreaLayerModel } from './area_layer/AreaLayerModel.svelte';
import type { PointLayerProps } from './point_layer/PointLayer.svelte';
import type { PointLayerModel } from './point_layer/PointLayerModel.svelte';
import type { HeatmapLayerProps } from './heatmap_layer/HeatmapLayer.svelte';
import type { HeatmapLayerModel } from './heatmap_layer/HeatmapLayerModel.svelte';

const MAP_CONTEXT_KEY = Symbol('MAP_CONTEXT');

export type MapContext = {
	addAreaLayer: (propsGetter: () => AreaLayerProps) => {
		areaLayer: AreaLayerModel;
		removeAreaLayer: () => void;
	};
	addPointLayer: (propsGetter: () => PointLayerProps) => {
		pointLayer: PointLayerModel;
		removePointLayer: () => void;
	};
	addHeatmapLayer: (propsGetter: () => HeatmapLayerProps) => {
		heatmapLayer: HeatmapLayerModel;
		removeHeatmapLayer: () => void;
	};
	getMap: () => maplibregl.Map | undefined;
	getDefaultColorScale: () => string[];
	getPointLayerIds: () => string[];
};

export const setMapContext = (context: MapContext): MapContext => {
	setContext(MAP_CONTEXT_KEY, context);
	return context;
};

export const getMapContext = (): MapContext => {
	const context = getContext<MapContext | undefined>(MAP_CONTEXT_KEY);
	if (!context) {
		throw new Error('Map Context not set!');
	}
	return context;
};
