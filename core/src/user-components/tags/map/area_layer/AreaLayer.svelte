<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import { schema } from './schema';
	import { getMapContext } from '../map-context';
	import { onMount } from 'svelte';
	import type { SQLProps } from '../../../common/sql-options';
	import { getComponentWrapperContext } from '../../../common/component-wrapper-context';
	import { getQueryInfoContext } from '../../../../query-info-context.svelte';
	import { getRepeatContext } from '../../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../../page-filters-context';
	import { getInlineQueriesContext } from '../../../common/inline-queries';
	import { VariableProcessor } from '../../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../../common/use-variable-processing';

	export type AreaLayerUserProps = UserComponentProps<typeof schema> & SQLProps;
	export type AreaLayerProps = AreaLayerUserProps;

	const props: AreaLayerProps = $props();

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();

	// === VARIABLE INTERPOLATION ===
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText, resolveColumn } = $derived(createResolvers(variableProcessor));

	// Create processed props getter for the model
	const processedProps = $derived.by(() => ({
		...props,
		data: resolveText(props.data) ?? props.data,
		area_id: resolveColumn(props.area_id) ?? props.area_id,
		value: resolveColumn(props.value) ?? props.value,
		value_fmt: resolveText(props.value_fmt) ?? props.value_fmt,
		legend_label: resolveText(props.legend_label) ?? props.legend_label,
		date_range: resolveText(props.date_range) ?? props.date_range
	}));

	const mapContext = getMapContext();

	let areaLayer: ReturnType<typeof mapContext.addAreaLayer>['areaLayer'] | undefined = $state();

	onMount(() => {
		const { areaLayer: layer, removeAreaLayer } = mapContext.addAreaLayer(() => processedProps);
		areaLayer = layer;
		return removeAreaLayer;
	});

	// Register query with query info context
	$effect(() => {
		if (!areaLayer) return;
		return queryInfoContext?.registerQuery(componentId, 'area_layer', areaLayer.query, '');
	});

	// Set errors
	$effect(() => {
		if (!areaLayer) return;
		setError(areaLayer.query.error ?? undefined);
	});
</script>
