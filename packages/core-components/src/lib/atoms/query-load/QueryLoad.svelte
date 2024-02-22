<script>
	import { onDestroy } from 'svelte';
	import { Skeleton } from '../skeletons';
	import isEmptyDataset from '@evidence-dev/component-utilities/isEmptyDataset';

	/** @type {import("@evidence-dev/query-store).QueryStore | unknown}*/
	export let data;

	$: if (data?.__isQueryStore) {
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
{:else if !data?.__isQueryStore}
	<!-- data prop was provided, but it is not a query store -->
	{#if !data?.__isQueryStore && isEmptyDataset(data) && $$slots.empty}
		<!-- handle case where data is not a query store but is also empty -->
		<slot name="empty" />
	{:else}
		<!-- Not a query store, nothing to be done -->
		<slot loaded={data} />
	{/if}
{:else if !_data || (!_data?.loaded && !_data.error)}
	<!-- Data is loading -->
	<slot name="skeleton">
		<div class="w-full h-64">
			<Skeleton />
		</div>
	</slot>
{:else if _data.error && $$slots.error}
	<!-- loading data returned an error -->
	<slot name="error" />
{:else if isEmptyDataset(_data) && !_data.error && $$slots.empty}
	<!-- data loaded successfully, but the dataset is empty-->
	<slot name="empty" />
{:else}
	<!-- data loaded successfully -->
	<slot loaded={_data} />
{/if}
