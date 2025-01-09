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

	const store = new TimeSeriesStore();

	setContext('store', store);
</script>

<QueryLoad {data} let:loaded>
	<EmptyChart slot="empty" />
	<ErrorChart let:loaded slot="error" error={loaded.error.message} title="Time Series Panel" />
	{#if loaded}
		<TimeSeriesPanel data={loaded} {x} />
	{/if}
</QueryLoad>

<div class="hidden">
	<slot />
</div>
