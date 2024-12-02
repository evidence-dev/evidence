<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../../atoms/query-load';
	import DataTable from './_DataTable.svelte';
	import EmptyChart from '../core/EmptyChart.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';
	import { Query } from '@evidence-dev/sdk/usql';

	export let data;

	const initialHash = Query.isQuery(data) ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {'pass' | 'warn' | 'error'}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	let chartType = 'Data Table';

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined));

	let queryID = data?.id;
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
	<ErrorChart let:loaded slot="error" {chartType} error={loaded.error.message} />
	<!-- workaround for slot forwarding (svelte 5 makes this better) -->
	{#if $$slots.default}
		<DataTable {...spreadProps} data={loaded} {queryID}>
			<slot />
		</DataTable>
	{:else}
		<DataTable {...spreadProps} data={loaded} {queryID} />
	{/if}
</QueryLoad>
