<script>
	import DimensionCut from './DimensionCut.svelte';

	/** @type {string} */
	export let name;
	/** @type {import('@evidence-dev/query-store').QueryStore} */
	export let data;
	export let metric = 'count(*)';
	export let fmt = 'number';
	export let limit = 10;
	export let others = true;
	export let grandTotal = false;

	let dimensions = data?.columns?.filter((col) => col.evidenceType === 'string');
</script>

<div class="flex flex-wrap gap-6">
	{#each dimensions as dimension}
		<DimensionCut {dimension} {metric} {data} {fmt} {limit} {others} {grandTotal} />
	{/each}
</div>
