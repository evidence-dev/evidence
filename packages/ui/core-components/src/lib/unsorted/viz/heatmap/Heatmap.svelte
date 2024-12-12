<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { QueryLoad } from '../../../atoms/query-load';
	import Heatmap from './_Heatmap.svelte';
	import EmptyChart from '../core/EmptyChart.svelte';
	import ErrorChart from '../core/ErrorChart.svelte';

	export let data;

	const initialHash = Query.isQuery(data) ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {'pass' | 'warn' | 'error'}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	let chartType = 'Heatmap';

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined));

	let queryID = data?.id;
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<EmptyChart slot="empty" {emptyMessage} {emptySet} {chartType} {isInitial} />
	<ErrorChart let:loaded slot="error" {chartType} error={loaded.error.message} />
	<Heatmap {...spreadProps} data={loaded} {queryID}>
		<slot />
	</Heatmap>
</QueryLoad>
