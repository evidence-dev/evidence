<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	// import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import DimensionCut from './DimensionCut.svelte';

	/** @type {string} */
	/** @type {import('@evidence-dev/query-store').QueryStore} */
	export let data;
	export let metric = 'count(*)';
	export let metricLabel = undefined;
	export let limit = 10;

	// const inputs = getContext(INPUTS_CONTEXT_KEY);
	let dimensions = data?.columns?.filter((col) => col.evidenceType === 'string');
	let selectedDimensions = writable([]);
	setContext('selected-dimensions', selectedDimensions);
</script>

<div class="flex flex-wrap select-none">
	{#each dimensions as dimension}
		<DimensionCut data={$data} {dimension} {metric} {limit} {metricLabel} />
	{/each}
</div>
