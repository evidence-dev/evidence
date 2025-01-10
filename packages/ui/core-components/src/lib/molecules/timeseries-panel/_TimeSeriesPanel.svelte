<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import MetricTable from './MetricTable.svelte';
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { getContext } from 'svelte';
	import { Skeleton } from '../../atoms/skeletons';
	import ErrorChart from '../../unsorted/viz/core/ErrorChart.svelte';

	export let data = undefined;
	export let x = undefined;
	export let fmt = undefined;
	export let defaultTimeRange = undefined;
	export let selectedMetric;

	const store = getContext('store');

	$: store.updateData(data, x);

	$: if ($store.value.metricsStore.length > 0 && !selectedMetric) {
		selectedMetric = $store.value.metricsStore[0].label;
	}
</script>

{#if $store.value.data.length > 0 && $store.value.metricsStore.length > 0}
	<div class="rounded-xl p-3 grid lg:grid-cols-2 md:grid-cols-1 gap-6 alert mb-4">
		<MetricTable
			bind:selectedMetric
			data={$store.value.data}
			{fmt}
			metricsStore={$store.value.metricsStore}
		/>
		<TimeSeriesPanelChart data={$store.value.data} {selectedMetric} {store} {defaultTimeRange} />
	</div>
{:else if $store.error}
	<div class="w-full h-64">
		<ErrorChart title={'Time Series Panel'} error={$store.error} />
	</div>
{:else}
	<div class="w-full h-64">
		<Skeleton />
	</div>
{/if}
