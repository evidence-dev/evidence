<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../atoms/query-load/index.js';
	import DimensionGrid from './_DimensionGrid.svelte';

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
</script>

<QueryLoad {data} let:loaded>
	<DimensionGrid data={loaded} {metric} {metricLabel} {limit} {name} />
	<svelte:fragment let:loaded slot="error">
		<DimensionGrid data={loaded} {metric} {metricLabel} {limit} {name} />
	</svelte:fragment>
	<svelte:fragment slot="skeleton">
		<!-- No loading state -->
	</svelte:fragment>
</QueryLoad>
