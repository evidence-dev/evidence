<script>
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import DimensionCut from './DimensionCut.svelte';
	import ComponentTitle from '../../unsorted/viz/core/ComponentTitle.svelte';
	import { getWhereClause } from './dimensionGridQuery.js';
	import Alert from '../../atoms/alert/Alert.svelte';
	import { hydrateFromUrlParam, updateUrlParam } from '@evidence-dev/sdk/utils/svelte';

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
	/** @type {string | undefined}*/
	export let title = undefined;
	/** @type {string | undefined}*/
	export let subtitle = undefined;

	$: dimensions = data?.columns?.filter((col) => col.column_type === 'VARCHAR');
	let selectedDimensions = writable([]);
	setContext('selected-dimensions', selectedDimensions);

	const inputs = getInputContext();
	$: $inputs[name] = getWhereClause($selectedDimensions);
	$: updateUrlParam(name, encodeURIComponent($inputs[name]));
</script>

{#if data === undefined}
	<Alert status="negative">`data` is required</Alert>
{:else if typeof data === 'string'}
	<Alert status="negative">
		`data` must reference a query. Received: data={data}. Try data={'{'}{data}{'}'}.
	</Alert>
{:else if data?.error}
	<Alert status="negative">
		{data.error}
	</Alert>
{:else}
	<div class="mt-2">
		{#if title || subtitle}
			<ComponentTitle {title} {subtitle} />
		{/if}
		<div class="flex flex-nowrap overflow-auto sm:flex-wrap select-none">
			{#each dimensions as dimension}
				<DimensionCut {data} {dimension} {metric} {limit} {metricLabel} {multiple} {fmt} />
			{/each}
		</div>
	</div>
{/if}
