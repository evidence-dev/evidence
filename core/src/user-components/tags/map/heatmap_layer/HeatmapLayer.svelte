<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import { getMapContext } from '../map-context';
	import { onMount } from 'svelte';
	import type { SQLProps } from '../../../common/sql-options';
	import { getComponentWrapperContext } from '../../../common/component-wrapper-context';
	import { getQueryInfoContext } from '../../../../query-info-context.svelte';

	export type HeatmapLayerUserProps = UserComponentProps<typeof schema> & SQLProps;
	export type HeatmapLayerProps = HeatmapLayerUserProps;

	const props: HeatmapLayerProps = $props();

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	const mapContext = getMapContext();

	let heatmapLayer: ReturnType<typeof mapContext.addHeatmapLayer>['heatmapLayer'] | undefined =
		$state();

	onMount(() => {
		const { heatmapLayer: layer, removeHeatmapLayer } = mapContext.addHeatmapLayer(() => props);
		heatmapLayer = layer;
		return removeHeatmapLayer;
	});

	// Register query with query info context
	$effect(() => {
		if (!heatmapLayer) return;
		return queryInfoContext?.registerQuery(componentId, 'heatmap_layer', heatmapLayer.query, '');
	});

	// Set errors
	$effect(() => {
		if (!heatmapLayer) return;
		setError(heatmapLayer.query.error ?? undefined);
	});
</script>
