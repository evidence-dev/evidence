<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { QueryLoad } from '../../../atoms/query-load';
	import Value from './_Value.svelte';
	import EmptyChart from './EmptyChart.svelte';

	export let data;
	export let column;
	export let agg;

	const initialHash = Query.isQuery(data) ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {"pass" | "warn" | "error"}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	let chartType = 'Value';

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined));

	$: if (agg) {
		data = data.groupBy(undefined).agg({ [agg]: { col: column, as: column } });
	}
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<span slot="empty">
		{#if !spreadProps.placeholder}
			<EmptyChart {emptyMessage} {emptySet} {chartType} {isInitial} />
		{/if}
	</span>
	<span slot="skeleton" class="text-base-content-muted">Loading...</span>
	<Value {...spreadProps} data={Query.isQuery(loaded) ? Array.from(loaded) : loaded}>
		<slot />
	</Value>
</QueryLoad>
