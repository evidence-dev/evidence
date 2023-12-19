<script>
	import { onDestroy } from 'svelte';
	import { Skeleton } from '../skeletons';
	/** @type {import("@evidence-dev/query-store).QueryStore | unknown}*/
	export let data;

	$: if (data?.__isQueryStore) {
		data.fetch(); // Somebody wants this to load. Without this the query builder features don't work
		unsub();
		unsub = data.subscribe((v) => {
			console.log({ v });
			_data = v;
		});
	}

	let unsub = () => {};

	let _data;
	onDestroy(unsub);
</script>

{#if !data || !data?.__isQueryStore}
	<!-- Not a query store, nothing to be done -->
	<slot loaded={data} />
{:else if !_data || (!_data?.loaded && !_data.error)}
	<!-- Data is loading -->
	<slot name="skeleton">
		<div class="w-full h-64">
			<Skeleton />
		</div>
	</slot>
{:else if _data.error}
	<slot name="error" />
{:else}
	<slot loaded={_data} />
{/if}
