<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import QueryLoad from '../../query-load/QueryLoad.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import InputMap from './_InputMap.svelte';
	import EmptyChart from '../../../unsorted/viz/core/EmptyChart.svelte';
	import ErrorChart from '../../../unsorted/viz/core/ErrorChart.svelte';

	/** @type {import("@evidence-dev/sdk/usql").Query | unknown}*/
	export let data;

	const initialHash = Query.isQuery(data) ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {'pass' | 'warn' | 'error'}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = {
		...Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined))
	};

	let queryID = data?.id;
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<EmptyChart
		slot="empty"
		{emptyMessage}
		{emptySet}
		chartType={spreadProps.chartType}
		{isInitial}
	/>
	<ErrorChart
		let:loaded
		slot="error"
		chartType={spreadProps.chartType}
		error={loaded.error.message}
	/>
	<InputMap {...spreadProps} data={loaded} {queryID}>
		<slot />
	</InputMap>
</QueryLoad>
