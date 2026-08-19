<script lang="ts">
	import { mapAction } from './map.action';
	import { mapProvider } from './map-gl';
	import { mode } from 'mode-watcher';
	import type * as maplibregl from 'maplibre-gl';
	import { cn } from '../../../shadcn/utils';
	import { getPageRenderTrackerContext } from '../../../page-render-tracker.context.svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { setMapContext } from './map-context';
	import { AreaLayerModel } from './area_layer/AreaLayerModel.svelte';
	import { PointLayerModel } from './point_layer/PointLayerModel.svelte';
	import { HeatmapLayerModel } from './heatmap_layer/HeatmapLayerModel.svelte';
	import { transitionMapLayer, type MapLayerState } from './layer-state';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getPageSettingsContext } from '../../../page-settings.context';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { getAutoRefreshContext } from '../../../auto-refresh.context.svelte';
	import MapLegend from './MapLegend.svelte';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	type Props = UserComponentProps<typeof schema>;

	const props: Props = $props();
	const children = $derived(props.children);
	const height = $derived(props.height ?? 300);
	const initial_position = $derived(props.initial_position as [number, number] | undefined);
	const zoom = $derived(props.zoom ?? 3); // Default zoom for initial render only
	const userProvidedZoom = $derived(props.zoom !== undefined);
	const zoomable = $derived(props.zoomable ?? true);
	const pannable = $derived(props.pannable ?? true);
	const base_style = $derived(props.base_style ?? 'mono');
	const projection = $derived(props.projection ?? 'flat');
	const legend = $derived(props.legend ?? true);
	const legend_location = $derived(props.legend_location ?? 'bottom_right');

	const renderTracker = getPageRenderTrackerContext();
	// Started synchronously: map creation is async (GL chunk load), and PDF capture must not settle before it
	let markRenderComplete: (() => void) | undefined = renderTracker?.startTask('map');
	let isReady = $state(false);

	let _map: maplibregl.Map | undefined = $state(undefined);
	let styleLoadCounter = $state(0);
	let hasAutoZoomed = $state(false);
	let currentZoom = $state(3);

	// Handle variable interpolation for title props
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText } = $derived(createResolvers(variableProcessor));

	// Resolved props
	const title = $derived(resolveText(props.title) ?? '');
	const subtitle = $derived(resolveText(props.subtitle) ?? '');
	const info = $derived(resolveText(props.info) ?? '');
	const info_link = $derived(resolveText(props.info_link) ?? '');
	const info_link_title = $derived(resolveText(props.info_link_title) ?? '');

	// Get theme for color scale and background
	const themeContext = getThemeContext();
	const pageSettings = getPageSettingsContext();
	const defaultColorScale = $derived(
		themeContext.getBackgroundAdjustedColorScale(pageSettings().cards)
	);
	const backgroundColor = $derived(themeContext.activeTheme.background);

	// Track area layers
	let areaLayers: AreaLayerModel[] = $state([]);
	// Track point layers
	let pointLayers: PointLayerModel[] = $state([]);
	// Track heatmap layers
	let heatmapLayers: HeatmapLayerModel[] = $state([]);

	const hasConfiguredLayers = $derived(
		areaLayers.length + pointLayers.length + heatmapLayers.length > 0
	);
	const anyLayerLoading = $derived(
		areaLayers.some((layer) => layer.loading) ||
			pointLayers.some((layer) => layer.loading) ||
			heatmapLayers.some((layer) => layer.loading)
	);
	const anyLayerHasLoadedData = $derived(
		areaLayers.some((layer) => !layer.loading && layer.data.length > 0) ||
			pointLayers.some((layer) => !layer.loading && layer.data.length > 0) ||
			heatmapLayers.some((layer) => !layer.loading && layer.data.length > 0)
	);
	const showLoadingOverlay = $derived(
		isReady && hasConfiguredLayers && anyLayerLoading && !anyLayerHasLoadedData
	);

	// Counter for assigning definition order to layers
	// This ensures layers are rendered in the order they're defined in markup,
	// regardless of when their data finishes loading
	let layerDefinitionCounter = 0;

	const connection = getDefaultConnection();
	const autoRefreshCtx = getAutoRefreshContext();

	// Set up map context
	setMapContext({
		addAreaLayer: (propsGetter) => {
			const definitionIndex = layerDefinitionCounter++;
			const areaLayer = new AreaLayerModel(
				propsGetter,
				{
					connection,
					filterContexts: [repeatFilters, pageFilters],
					inlineQueries,
					projectSettings: getProjectSettingsContext(),
					defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
				},
				() => pointLayers.map((l) => l.layerId),
				definitionIndex
			);
			areaLayers.push(areaLayer);

			const removeAreaLayer = () => {
				const index = areaLayers.indexOf(areaLayer);
				if (index > -1) {
					// Remove from map if it exists
					if (_map) {
						areaLayer.removeFromMap(_map);
					}
					areaLayers.splice(index, 1);
				}
			};

			return { areaLayer, removeAreaLayer };
		},
		getPointLayerIds: () => pointLayers.map((l) => l.layerId),
		addPointLayer: (propsGetter) => {
			const definitionIndex = layerDefinitionCounter++;
			const pointLayer = new PointLayerModel(
				propsGetter,
				{
					connection,
					filterContexts: [repeatFilters, pageFilters],
					inlineQueries,
					projectSettings: getProjectSettingsContext(),
					defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
				},
				definitionIndex
			);
			pointLayers.push(pointLayer);

			const removePointLayer = () => {
				const index = pointLayers.indexOf(pointLayer);
				if (index > -1) {
					// Remove from map if it exists
					if (_map) {
						pointLayer.removeFromMap(_map);
					}
					pointLayers.splice(index, 1);
				}
			};

			return { pointLayer, removePointLayer };
		},
		addHeatmapLayer: (propsGetter) => {
			const definitionIndex = layerDefinitionCounter++;
			const heatmapLayer = new HeatmapLayerModel(
				propsGetter,
				{
					connection,
					filterContexts: [repeatFilters, pageFilters],
					inlineQueries,
					projectSettings: getProjectSettingsContext(),
					defaultRefreshInterval: () => autoRefreshCtx?.intervalSeconds ?? 0
				},
				definitionIndex
			);
			heatmapLayers.push(heatmapLayer);

			const removeHeatmapLayer = () => {
				const index = heatmapLayers.indexOf(heatmapLayer);
				if (index > -1) {
					// Remove from map if it exists
					if (_map) {
						heatmapLayer.removeFromMap(_map);
					}
					heatmapLayers.splice(index, 1);
				}
			};

			return { heatmapLayer, removeHeatmapLayer };
		},
		getMap: () => _map,
		getDefaultColorScale: () => defaultColorScale
	});

	// Cache the latest rows so new query results need one comparison, even for 100k-point layers.
	const layerState = new Map<string, MapLayerState>();
	let lastStyleLoad = 0;

	/**
	 * Find the correct beforeId for inserting a layer based on definition order.
	 * Returns the layerId of the layer that should be immediately above this one,
	 * ensuring consistent ordering regardless of load timing.
	 */
	function getBeforeIdForLayer(
		layerDefIndex: number,
		allLayers: Array<{ layerId: string; definitionIndex: number }>,
		map: maplibregl.Map
	): string | undefined {
		// Find all layers actually on the map with a higher definition index
		// We check map.getLayer() rather than layerState because layerState
		// marks layers as "added" before they're actually on the map
		const layersAbove = allLayers
			.filter((l) => {
				return map.getLayer(l.layerId) && l.definitionIndex > layerDefIndex;
			})
			.sort((a, b) => a.definitionIndex - b.definitionIndex);

		// Return the layerId of the layer with the smallest definition index
		// that is still greater than this layer's index (immediate successor)
		return layersAbove[0]?.layerId;
	}

	// Helper to add layers to map
	async function addLayersToMap() {
		if (!_map || !isReady) return;

		const map = _map;
		const currentTheme = mode.current ?? 'light';

		// Collect all layers with their definition indices for ordering calculation
		const allLayersForOrdering = [
			...areaLayers.map((l) => ({ layerId: l.layerId, definitionIndex: l.definitionIndex })),
			...pointLayers.map((l) => ({ layerId: l.layerId, definitionIndex: l.definitionIndex })),
			...heatmapLayers.map((l) => ({ layerId: l.layerId, definitionIndex: l.definitionIndex }))
		];

		// Determine which area layers need to be added
		const areaLayersToAdd: typeof areaLayers = [];

		for (const layer of areaLayers) {
			if (layer.loading) continue;
			const data = layer.data;
			const state = layerState.get(layer.layerId);
			const transition = transitionMapLayer(state, data);
			layerState.set(layer.layerId, transition.state);

			if (transition.action === 'remove') {
				layer.removeFromMap(map);
			} else if (transition.action === 'replace') {
				if (state?.added) layer.removeFromMap(map);
				areaLayersToAdd.push(layer);
			}
		}

		// Determine which point layers need to be added
		const pointLayersToAdd: typeof pointLayers = [];

		for (const layer of pointLayers) {
			if (layer.loading) continue;
			const data = layer.data;
			const state = layerState.get(layer.layerId);
			// The source's cluster flag can't be changed in place.
			const transition = transitionMapLayer(state, data, layer.clusteringEnabled);
			layerState.set(layer.layerId, transition.state);

			if (transition.action === 'remove') {
				layer.removeFromMap(map);
			} else if (transition.action === 'replace') {
				if (state?.added) layer.removeFromMap(map);
				pointLayersToAdd.push(layer);
			}
		}

		// Determine which heatmap layers need to be added
		const heatmapLayersToAdd: typeof heatmapLayers = [];

		for (const layer of heatmapLayers) {
			if (layer.loading) continue;
			const data = layer.data;
			const state = layerState.get(layer.layerId);
			const transition = transitionMapLayer(state, data);
			layerState.set(layer.layerId, transition.state);

			if (transition.action === 'remove') {
				layer.removeFromMap(map);
			} else if (transition.action === 'replace') {
				if (state?.added) layer.removeFromMap(map);
				heatmapLayersToAdd.push(layer);
			}
		}

		if (
			areaLayersToAdd.length === 0 &&
			pointLayersToAdd.length === 0 &&
			heatmapLayersToAdd.length === 0
		)
			return;

		// Add layers in definition order to ensure correct stacking
		// Combine all layers to add and sort by definition index
		type LayerToAdd =
			| { type: 'area'; layer: AreaLayerModel }
			| { type: 'point'; layer: PointLayerModel }
			| { type: 'heatmap'; layer: HeatmapLayerModel };

		const allLayersToAdd: LayerToAdd[] = [
			...areaLayersToAdd.map((l) => ({ type: 'area' as const, layer: l })),
			...pointLayersToAdd.map((l) => ({ type: 'point' as const, layer: l })),
			...heatmapLayersToAdd.map((l) => ({ type: 'heatmap' as const, layer: l }))
		].sort((a, b) => a.layer.definitionIndex - b.layer.definitionIndex);

		// Add layers in sorted order, calculating beforeId for each
		for (const { type, layer } of allLayersToAdd) {
			try {
				const beforeId = getBeforeIdForLayer(layer.definitionIndex, allLayersForOrdering, map);
				if (type === 'area') {
					await (layer as AreaLayerModel).addToMap(map, defaultColorScale, currentTheme, beforeId);
				} else if (type === 'point') {
					await (layer as PointLayerModel).addToMap(map, defaultColorScale, currentTheme, beforeId);
				} else {
					await (layer as HeatmapLayerModel).addToMap(
						map,
						defaultColorScale,
						currentTheme,
						beforeId
					);
				}
			} catch (_err) {
				// Layer failed to add, will retry on next effect run
			}
		}

		// Auto-zoom after all initial layers added
		// Only runs when initial_position is NOT provided
		const totalLayers = areaLayers.length + pointLayers.length + heatmapLayers.length;

		if (!hasAutoZoomed && !initial_position && layerState.size === totalLayers) {
			const allBounds = [...areaLayers, ...pointLayers, ...heatmapLayers]
				.map((l) => l.getCachedBounds())
				.filter((b): b is NonNullable<typeof b> => b !== null);

			if (allBounds.length > 0) {
				const combinedBounds = allBounds[0];
				allBounds.slice(1).forEach((bounds) => combinedBounds.extend(bounds));

				if (userProvidedZoom) {
					// Scenario 2: data + zoom → Center on data, use specified zoom
					const center = combinedBounds.getCenter();
					map.setCenter(center);
					map.setZoom(props.zoom!);
				} else {
					// Scenario 1: data only → Fit bounds to show all data
					map.fitBounds(combinedBounds, {
						padding: 40,
						animate: false,
						maxZoom: 15
					});
				}

				hasAutoZoomed = true;
			}
		}
	}

	// Watch for changes and trigger layer addition
	$effect(() => {
		// Establish reactivity by accessing reactive values
		const ready = isReady;
		const styleLoad = styleLoadCounter;
		// Access layer states to establish reactivity
		areaLayers.forEach((layer) => {
			void layer.loading;
			void layer.data.length;
		});
		pointLayers.forEach((layer) => {
			void layer.loading;
			void layer.data.length;
		});
		heatmapLayers.forEach((layer) => {
			void layer.loading;
			void layer.data.length;
		});

		// Clear layer state only when the basemap style actually reloads.
		if (styleLoad !== lastStyleLoad) {
			lastStyleLoad = styleLoad;
			layerState.clear();
		}

		// Call async function (doesn't return promise to effect)
		if (ready) {
			addLayersToMap();
		}
	});
</script>

<div class="flex flex-col">
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<div style:height="{height}px">
		<div class={cn('relative h-full w-full overflow-hidden rounded-sm')} data-map-ready={isReady}>
			<!-- Legend overlay -->
			{#if legend}
				<div
					class={cn(
						'absolute z-10',
						legend_location === 'top_left' && 'top-2 left-2',
						legend_location === 'top_right' && 'top-2 right-2',
						legend_location === 'bottom_left' && 'bottom-6 left-2',
						legend_location === 'bottom_right' && 'right-2 bottom-6'
					)}
				>
					<MapLegend layers={[...areaLayers, ...pointLayers]} {currentZoom} />
				</div>
			{/if}

			<!-- Sea-colored fill behind the canvas: covers the gap before the tuned style renders so
			     the stock OpenFreeMap basemap never flashes through (MapLibre only). Color is set via
			     CSS .dark so it tracks the theme pre-hydration, before mode-watcher resolves. -->
			{#if mapProvider === 'maplibre'}
				<div
					class={cn('absolute inset-0', base_style === 'blank' ? 'bg-background' : 'map-load-fill')}
				></div>
			{/if}

			<div
				class="absolute inset-0 h-full w-full"
				style:opacity={mapProvider !== 'maplibre' || isReady ? 1 : 0}
				use:mapAction={{
					theme: mode.current ?? 'light',
					zoom,
					initial_position,
					zoomable,
					pannable,
					base_style,
					projection,
					backgroundColor,
					onCreate: (m) => {
						_map = m;

						// Track zoom for legend visibility
						currentZoom = m.getZoom();
						m.on('zoom', () => {
							currentZoom = m.getZoom();
						});
					},
					onDestroy: () => {
						_map = undefined;
						markRenderComplete?.();
						markRenderComplete = undefined;
						isReady = false;
					},
					onReady: () => {
						markRenderComplete?.();
						markRenderComplete = undefined;
						isReady = true;
					},
					onStyleLoad: () => {
						// Increment counter to trigger layer re-add
						styleLoadCounter++;
					},
					onError: () => {
						// Map never created — release the render task so PDF capture isn't blocked
						markRenderComplete?.();
						markRenderComplete = undefined;
					}
				}}
			></div>

			{#if showLoadingOverlay}
				<div
					class="text-foreground pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
					role="status"
					aria-live="polite"
				>
					<div
						class="bg-background/85 border-border flex items-center gap-2 rounded-md border px-3 py-2 text-xs shadow-sm"
					>
						<LoaderCircle class="h-4 w-4 animate-spin [animation-duration:1s]" />
						<span>Loading map data...</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<div class="hidden">
	{@render children?.()}
</div>

<style>
	/* Sea color of the tuned MapLibre basemaps; matches the water fill in tunePositron / tuneDark */
	.map-load-fill {
		background-color: #dbdbdc;
	}
	:global(.dark) .map-load-fill {
		background-color: hsl(0, 0%, 12%);
	}

	/* Make attribution subtle (control-class prefix depends on the active renderer) */
	:global(.mapboxgl-ctrl-attrib),
	:global(.maplibregl-ctrl-attrib) {
		opacity: 0.4;
		font-size: 8px !important;
		line-height: 1.2 !important;
		padding: 1px 3px !important;
	}

	:global(.mapboxgl-ctrl-attrib:hover),
	:global(.maplibregl-ctrl-attrib:hover) {
		opacity: 1;
	}

	/* Prose styling leaks into attribution links (weight 500, underline); OpenFreeMap's "Data from"
	   is bare text, so pin one uniform style for text and links */
	:global(.mapboxgl-ctrl-attrib),
	:global(.mapboxgl-ctrl-attrib a),
	:global(.maplibregl-ctrl-attrib),
	:global(.maplibregl-ctrl-attrib a) {
		color: rgba(0, 0, 0, 0.75);
		font-weight: 400;
		text-decoration: none;
	}

	:global(.mapboxgl-ctrl-logo) {
		opacity: 0.3;
		width: 60px !important;
		height: 16px !important;
		transform: translateY(2px) !important;
	}

	:global(.mapboxgl-ctrl-logo:hover) {
		opacity: 0.6;
	}

	/* Style map tooltips to match echarts */
	:global(.mapboxgl-popup.map-tooltip),
	:global(.maplibregl-popup.map-tooltip) {
		max-width: 300px;
		z-index: 1000 !important;
		pointer-events: none !important;
	}

	:global(.mapboxgl-popup.map-tooltip .mapboxgl-popup-content),
	:global(.maplibregl-popup.map-tooltip .maplibregl-popup-content) {
		background: white !important;
		color: #333 !important;
		padding: 8px 10px !important;
		border-radius: 4px !important;
		border: 1px solid rgba(0, 0, 0, 0.15) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
		font-size: 12px !important;
		line-height: 1.4 !important;
	}

	:global(.dark .mapboxgl-popup.map-tooltip .mapboxgl-popup-content),
	:global(.dark .maplibregl-popup.map-tooltip .maplibregl-popup-content) {
		background: #09090b !important;
		color: #e5e5e5 !important;
		border-color: rgba(255, 255, 255, 0.15) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
	}

	/* Hide the arrow/tip */
	:global(.mapboxgl-popup.map-tooltip .mapboxgl-popup-tip),
	:global(.maplibregl-popup.map-tooltip .maplibregl-popup-tip) {
		display: none !important;
	}
</style>
