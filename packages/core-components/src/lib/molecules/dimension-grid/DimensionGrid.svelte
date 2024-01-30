<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';

	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import DimensionCut from './DimensionCut.svelte';

	/** @type {string} */
	export let name;
	/** @type {import('@evidence-dev/query-store').QueryStore} */
	export let data;
	export let metric = 'count(*)';
	export let fmt = '#,###.00';
	export let limit = 10;
	export let others = true;
	export let grandTotal = false;

	let dimensions = data?.columns?.filter((col) => col.evidenceType === 'string');

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	let selectedDimensions = writable([]);

	setContext('selected-dimensions', selectedDimensions);

	let whereClause = 'true';

	$: if ($selectedDimensions.length > 0) {
		whereClause = $selectedDimensions
			.map((d) => {
				return `${d.dimension} = '${d.value}'`;
			})
			.join(' and ');
	} else {
		whereClause = 'true';
	}

	$: internallyFilteredData = data.where(whereClause);
</script>

<!-- {$internallyFilteredData.originalText} -->

<div class="flex flex-wrap gap-6 select-none">
	{#each dimensions as dimension}
		<DimensionCut
			{data}
			{whereClause}
			{dimension}
			{metric}
			{fmt}
			{limit}
			{others}
			{grandTotal}
			{name}
		/>
	{/each}
</div>
