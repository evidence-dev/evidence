<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../atoms/query-load/index.js';
	import { setContext } from 'svelte';
	import { TimeSeriesStore } from './timeSeriesStore.js';
	import TimeSeriesPanel from './_TimeSeriesPanel.svelte';
	import EmptyChart from '../../unsorted/viz/core/EmptyChart.svelte';
	import ErrorChart from '../../unsorted/viz/core/ErrorChart.svelte';

	export let data = undefined;

	export let x = undefined;
	// export let fmt = undefined;
	// export let defaultTimeRange = undefined;
	// let selectedMetric;
	// let metricStore = [];

	const store = new TimeSeriesStore();

	setContext('store', store);

	// $: store.updateData(data, x);

	// onMount(() => {
	// 	const unsubscribe = store.subscribeToMetrics((updatedMetrics) => {
	// 		metricStore = updatedMetrics;
	// 	});

	// 	if (metricStore.length > 0 && !selectedMetric) {
	// 		selectedMetric = metricStore[0].label;
	// 	} else if (metricStore.length === 0) {
	// 		console.warn('No metrics found');
	// 	}
	// 	return () => unsubscribe();
	// });
</script>

<QueryLoad {data} let:loaded>
	<!-- {#if loaded.length > 0}
		<div
			class="rounded-xl p-3 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-6 bg-gray-50 mb-4"
		>
			<MetricTable bind:selectedMetric data={loaded} {metricStore} {fmt} />
			<TimeSeriesPanelChart data={loaded} {selectedMetric} {store} {defaultTimeRange} />
		</div>
	{/if} -->
	<EmptyChart slot="empty" />
	<ErrorChart let:loaded slot="error" error={loaded.error.message} />
	{#if loaded}
		<TimeSeriesPanel data={loaded} {x} />
	{/if}
	<!-- <svelte:fragment slot="error"> -->
	<!-- <div class="big-red-100"></div>
	</svelte:fragment>

	<svelte:fragment slot="skeleton">
	</svelte:fragment> -->
</QueryLoad>

<div class="hidden">
	<slot />
</div>
