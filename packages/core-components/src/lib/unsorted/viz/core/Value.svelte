<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '$lib';
	import Value from './_Value.svelte';
	import EmptyChart from './EmptyChart.svelte';

	export let data;

	const initialHash = typeof data === 'object' && '__isQueryStore' in data ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {"pass" | "warn" | "error"}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	let chartType = 'Value';

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined));
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<span slot="empty">
		{#if !spreadProps.placeholder}
			<EmptyChart {emptyMessage} {emptySet} {chartType} {isInitial} />
		{/if}
	</span>
	<p slot="skeleton" class="text-gray-500">Loading...</p>
	<Value {...spreadProps} data={loaded?.__isQueryStore ? Array.from(loaded) : loaded}>
		<slot />
	</Value>
</QueryLoad>
