<script>
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import DimensionCut from './DimensionCut.svelte';
	import { getWhereClause } from './dimensionGridQuery.js';
	import ErrorChart from '../../unsorted/viz/core/ErrorChart.svelte';

	/** @type {import('@evidence-dev/sdk/usql').Query} */
	export let data;
	/** @type {string} */
	export let metric = 'count(*)';
	/** @type {string} */
	export let metricLabel = undefined;
	/** @type {number} */
	export let limit = 10;
	/** @type {string} */
	export let name;
	/** @type {boolean} */
	export let multiple = false;
	/** @type {string} */
	export let fmt = undefined;

	$: dimensions = data?.columns?.filter((col) => col.column_type === 'VARCHAR');
	let selectedDimensions = writable([]);
	setContext('selected-dimensions', selectedDimensions);

	const inputs = getInputContext();
	$: $inputs[name] = getWhereClause($selectedDimensions);
</script>

{#if data === undefined}
	<ErrorChart title="Error: data is required" error="`data` is required" />
{:else if typeof data === 'string'}
	<ErrorChart
		title="Error: data must reference a query"
		error={`'data' must reference a query. Received: data=${data}. Try data={${data}}`}
	/>
{:else if data?.error}
	<ErrorChart title="Error in SQL Query" error={data.error} />
{:else if dimensions.length === 0}
	<ErrorChart
		title="No string columns found"
		error={`Data must contain at least 1 string column. To use DimensionGrid with non-string columns, first cast the columns to strings in your SQL query using '::VARCHAR'`}
	/>
{:else}
	<div class="flex flex-nowrap overflow-auto sm:flex-wrap select-none">
		{#each dimensions as dimension}
			<DimensionCut {data} {dimension} {metric} {limit} {metricLabel} {multiple} {fmt} />
		{/each}
	</div>
{/if}
