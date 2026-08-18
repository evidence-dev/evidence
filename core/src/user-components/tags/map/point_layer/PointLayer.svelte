<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import { getMapContext } from '../map-context';
	import { onMount } from 'svelte';
	import type { SQLProps } from '../../../common/sql-options';
	import { getComponentWrapperContext } from '../../../common/component-wrapper-context';
	import { getQueryInfoContext } from '../../../../query-info-context.svelte';

	export type PointLayerUserProps = UserComponentProps<typeof schema> & SQLProps;
	export type PointLayerProps = PointLayerUserProps;

	const props: PointLayerProps = $props();

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	const mapContext = getMapContext();

	let pointLayer: ReturnType<typeof mapContext.addPointLayer>['pointLayer'] | undefined = $state();

	onMount(() => {
		const { pointLayer: layer, removePointLayer } = mapContext.addPointLayer(() => props);
		pointLayer = layer;
		return removePointLayer;
	});

	// Register query with query info context
	$effect(() => {
		if (!pointLayer) return;
		return queryInfoContext?.registerQuery(componentId, 'point_layer', pointLayer.query, '');
	});

	// Set errors
	$effect(() => {
		if (!pointLayer) return;
		setError(pointLayer.query.error ?? undefined);
	});
</script>
