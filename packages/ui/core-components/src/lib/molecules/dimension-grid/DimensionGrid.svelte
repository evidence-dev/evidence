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
	/** @type {number | string} */
	export let limit = 10;
	/** @type {string} */
	export let name;
	/** @type {boolean} */
	export let multiple = false;
	/** @type {string} */
	export let fmt = undefined;
	/** @type {string | undefined}*/
	export let title = undefined;
	/** @type {string | undefined}*/
	export let subtitle = undefined;

	const handleLimitNum = () => {
		try {
			limit = typeof limit === 'string' ? parseInt(limit) : limit;
		} catch (e) {
			console.error('Limit must be a integer', e);
		}
	};

	handleLimitNum();

	$: handleLimitNum(limit);
</script>

<QueryLoad {data} let:loaded>
	<DimensionGrid
		data={loaded}
		{metric}
		{metricLabel}
		{limit}
		{name}
		{multiple}
		{fmt}
		{title}
		{subtitle}
	/>
	<svelte:fragment let:loaded slot="error">
		<DimensionGrid
			data={loaded}
			{metric}
			{metricLabel}
			{limit}
			{name}
			{multiple}
			{fmt}
			{title}
			{subtitle}
		/>
	</svelte:fragment>
	<svelte:fragment slot="skeleton">
		<!-- No loading state -->
	</svelte:fragment>
</QueryLoad>
