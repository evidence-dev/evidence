<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';

	import { getMainQuery } from './dimensionGridQuery.js';

	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import DimensionCut from './DimensionCut.svelte';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';

	/** @type {string} */
	export let name;
	/** @type {import('@evidence-dev/query-store').QueryStore} */
	export let data;
	export let metric = 'count(*)';
	export let fmt = '#,###.00';
	export let limit = 10;
	export let others = true;
	export let grandTotal = false;

	const inputs = getContext(INPUTS_CONTEXT_KEY);

	let dimensions = data?.columns?.filter((col) => col.evidenceType === 'string');
	let selectedDimensions = writable([]);
	setContext('selected-dimensions', selectedDimensions);

	$: mainQuery = getMainQuery(
		$data,
		dimensions,
		metric,
		$selectedDimensions,
		limit,
		grandTotal,
		others
	);

	let results = buildQuery(mainQuery);

	results.fetch();

	$: {
		const updatedResults = buildQuery(mainQuery);
		if (!updatedResults.loaded) {
			updatedResults.fetch().then(() => {
				results = updatedResults;
			});
		} else {
			results = updatedResults;
		}
	}
</script>

<!-- <pre>
	{mainQuery}
</pre>
{[...$results]} -->

<div class="flex flex-wrap gap-6 select-none">
	{#each dimensions as dimension}
		<DimensionCut data={$results} {dimension} {fmt} />
	{/each}
</div>
