<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import MetricTable from './MetricTable.svelte';
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { QueryLoad } from '../../atoms/query-load/index.js';
	import { writable } from 'svelte/store';
	import { setContext, onMount } from 'svelte';

	export let data = undefined;
	let metricStore = writable([]);
	setContext('metrics', metricStore);
	let selectedMetric;

	onMount(() => {
		const unsubscribe = metricStore.subscribe((metrics) => {
			if (metrics.length > 0 && !selectedMetric) {
				selectedMetric = metrics[0].label;
			}
		});

		return unsubscribe;
	});
</script>

<QueryLoad {data} let:loaded>
	<div class="rounded-xl p-3 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-6 bg-gray-50 mb-4">
		<MetricTable bind:selectedMetric {metricStore} />
		<TimeSeriesPanelChart {data} {selectedMetric} />
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
