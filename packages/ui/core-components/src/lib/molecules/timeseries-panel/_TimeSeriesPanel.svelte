<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import MetricTable from './MetricTable.svelte';
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { getContext, onMount } from 'svelte';

	export let data = undefined;
	export let x = undefined;
	export let fmt = undefined;
	export let defaultTimeRange = undefined;
	export let selectedMetric;
	export let metricStore = [];

	const store = getContext('store');

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

<div class="rounded-xl p-3 grid lg:grid-cols-2 md:grid-cols-1 gap-6 alert mb-4 bg-base-200">
	<MetricTable bind:selectedMetric data={$store} {metricStore} {fmt} />
	<TimeSeriesPanelChart data={$store} {selectedMetric} {store} {defaultTimeRange} />
</div>
