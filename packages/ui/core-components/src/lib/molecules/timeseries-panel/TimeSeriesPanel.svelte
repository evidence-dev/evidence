<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import MetricTable from './MetricTable.svelte';
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { QueryLoad } from '../../atoms/query-load/index.js';
	import { setContext, onMount } from 'svelte';
	import { TimeSeriesStore } from './timeSeriesStore.js';

	export let data = undefined;
	export let x = undefined;
	export let fmt = undefined;
	export let defaultTimeRange = undefined;
	let selectedMetric;
	let metricStore = [];

	const store = new TimeSeriesStore();

	setContext('store', store);

	$: store.updateData(data, x);

	onMount(() => {
		const unsubscribe = store.subscribeToMetrics((updatedMetrics) => {
			metricStore = updatedMetrics;
		});

		if (metricStore.length > 0 && !selectedMetric) {
			selectedMetric = metricStore[0].label;
		} else if (metricStore.length === 0) {
			console.warn('No metrics found');
		}
		return () => unsubscribe();
	});
</script>

<QueryLoad data={$store} let:loaded>
	<div class="rounded-xl p-3 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-6 bg-gray-50 mb-4">
		<MetricTable bind:selectedMetric data={loaded} {metricStore} {fmt} />
		<TimeSeriesPanelChart data={loaded} {selectedMetric} {store} {defaultTimeRange} />
	</div>
	<svelte:fragment let:loaded slot="error">
		<div class="big-red-100">{data.error}</div>
	</svelte:fragment>
	<svelte:fragment slot="skeleton">
		<!-- No loading state -->
	</svelte:fragment>
</QueryLoad>

<div class="hidden">
	<slot />
</div>
