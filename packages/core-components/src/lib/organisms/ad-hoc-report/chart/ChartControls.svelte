<script>
	import ChartControl from './ChartControl.svelte';
	import ColOptions from './ColOptions.svelte';

	/** @type {import("../blocks").Chart} */
	export let block;

	/** @type {import("@evidence-dev/query-store").QueryStore} */
	export let query;
</script>

<ChartControl title="X Column" bind:value={block.xCol} loading={!$query.loaded}>
	<ColOptions {query} />
</ChartControl>
<ChartControl title="Y Column" bind:value={block.yCol} loading={!$query.loaded}>
	<!-- TODO: Filter by valid y types? -->
	<ColOptions {query} />
</ChartControl>
<ChartControl title="Series" bind:value={block.series} loading={!$query.loaded}>
	<!-- TODO: Filter by valid y types? -->
	<option value={undefined}>None</option>
	<ColOptions {query} />
</ChartControl>
<ChartControl title="Chart Type" bind:value={block.chartType} loading={!$query.loaded}>
	<option value="bar">Bar</option>
	<option value="line">Line</option>
</ChartControl>
