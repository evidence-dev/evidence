<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import MetricTable from './MetricTable.svelte';
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { getContext, onMount } from 'svelte';
	import { Skeleton } from '../../atoms/skeletons';

	export let data = undefined;
	export let x = undefined;
	export let fmt = undefined;
	export let defaultTimeRange = undefined;
	export let selectedMetric;
	export let metricsStore = [];

	const store = getContext('store');

	$: store.updateData(data, x);

	onMount(() => {
		const unsubscribe = store.subscribeToMetrics((updatedMetrics) => {
			metricsStore = updatedMetrics;
			if (metricsStore.length > 0 && !selectedMetric) {
				selectedMetric = metricsStore[0].label;
			} else if (metricsStore.length === 0) {
				console.warn('No metrics found');
			}
		});

		return () => unsubscribe();
	});

	$: if ($store.metricsStore.length > 0 && !selectedMetric) {
		selectedMetric = $store.metricsStore[0].label;
	}

	$: console.log(metricsStore);
</script>

{#if $store.data.length > 0 && metricsStore.length > 0}
	<div class="rounded-xl p-3 grid lg:grid-cols-2 md:grid-cols-1 gap-6 alert mb-4">
		<MetricTable bind:selectedMetric data={$store.data} {metricsStore} {fmt} />
		<TimeSeriesPanelChart data={$store.data} {selectedMetric} {store} {defaultTimeRange} />
	</div>
{:else}
	<div class="w-full h-64">
		<Skeleton />
	</div>
{/if}
