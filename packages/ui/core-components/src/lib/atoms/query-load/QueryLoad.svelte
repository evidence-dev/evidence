<script>
	import { onDestroy } from 'svelte';
	import { Skeleton } from '../skeletons';
	import { Query } from '@evidence-dev/sdk/usql';
	import isEmptyDataset from '@evidence-dev/component-utilities/isEmptyDataset';

	/** @type {import("@evidence-dev/sdk/usql).Query | unknown}*/
	export let data;

	$: if (Query.isQuery(data)) {
		const c = data.fetch(); // Somebody wants this to load. Without this the query builder features don't work
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
{:else if !_data || (!_data?.ready && !_data.error)}
	<!-- Data is loading -->
	<slot name="skeleton">
		<div class="w-full h-64">
			<Skeleton />
		</div>
	</slot>
{:else if _data.error && $$slots.error}
	<!-- loading data returned an error -->
	<slot name="error" loaded={_data} />
{:else if isEmptyDataset(_data) && !_data.error && $$slots.empty}
	<!-- data loaded successfully, but the dataset is empty-->
	<slot name="empty" loaded={_data} />
{:else}
	<!-- data loaded successfully -->
	<slot loaded={_data} />
{/if}
