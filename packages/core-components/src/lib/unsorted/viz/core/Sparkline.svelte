<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../../atoms/query-load/index.js';
	import Sparkline from './_Sparkline.svelte';
	import EmptyChart from './EmptyChart.svelte';
	import ErrorChart from './ErrorChart.svelte';

	/** @type {import("@evidence-dev/query-store).QueryStore | unknown}*/
	export let data;

	const initialHash = typeof data === 'object' && '__isQueryStore' in data ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {'pass' | 'warn' | 'error'}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	let chartType = 'Sparkline';

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
	<ErrorChart let:loaded slot="error" {chartType} error={loaded.error.message} />
	<Sparkline {...spreadProps} data={loaded?.__isQueryStore ? Array.from(loaded) : loaded} {queryID}>
		<slot />
	</Sparkline>
</QueryLoad>
