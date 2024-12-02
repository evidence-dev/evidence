<script>
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import DimensionCut from './DimensionCut.svelte';
	import { getWhereClause } from './dimensionGridQuery.js';

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
	<p
		class="my-2 font-mono text-red-600 text-xs bg-red-50 border-red-200 p-4 overflow-auto rounded border"
	>
		`data` is required
	</p>
{:else if typeof data === 'string'}
	<p
		class="my-2 font-mono text-red-600 text-xs bg-red-50 border-red-200 p-4 overflow-auto rounded border"
	>
		`data` must reference a query. Received: data={data}. Try data={'{'}{data}{'}'}.
	</p>
{:else if data?.error}
	<p
		class="my-2 font-mono text-red-600 text-xs bg-red-50 border-red-200 p-4 overflow-auto rounded border"
	>
		{data.error}
	</p>
{:else}
	<div class="flex flex-nowrap overflow-auto sm:flex-wrap select-none">
		{#each dimensions as dimension}
			<DimensionCut {data} {dimension} {metric} {limit} {metricLabel} {multiple} {fmt} />
		{/each}
	</div>
{/if}
