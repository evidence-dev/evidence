<script>
	import { onDestroy } from 'svelte';
	import { Skeleton } from '../skeletons';
	import { Query } from '@evidence-dev/sdk/usql';
	import isEmptyDataset from '@evidence-dev/component-utilities/isEmptyDataset';

	/** @type {import("@evidence-dev/sdk/usql).Query | unknown}*/
	export let data;

	export let height = 200;

	export let skeletonClass = undefined;

	$: if (Query.isQuery(data)) {
		data.fetch(); // Somebody wants this to load. Without this the query builder features don't work
		unsub();
		unsub = data.subscribe((v) => {
			_data = v;
		});
	}

	let unsub = () => {};

	let _data;

	onDestroy(unsub);
</script>

{#if !data}
	<!-- data prop was not provided. Component to handle this prop-related error -->
	<slot loaded={data} />
{:else if !Query.isQuery(data)}
	<!-- data prop was provided, but it is not a query store -->
	{#if (Array.isArray(data) || !data) && isEmptyDataset(data) && $$slots.empty}
		<!-- handle case where data is not a query store but is also empty -->
		<slot name="empty" loaded={data} />
	{:else}
		<!-- Not a query store, nothing to be done -->
		<slot loaded={data} />
	{/if}
{:else if !_data || (!_data.dataLoaded && !_data.error)}
	<slot name="skeleton" loaded={_data}>
		<div class="w-full" style="height: {height}px">
			<Skeleton class={skeletonClass} />
		</div>
	</slot>
{:else if _data.error && $$slots.error}
	<slot name="error" loaded={_data} />
{:else if !_data.length && !_data.error && $$slots.empty}
	<slot name="empty" loaded={_data} />
{:else}
	<slot loaded={_data} />
{/if}
