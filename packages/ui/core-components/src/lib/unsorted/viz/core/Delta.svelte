<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../../atoms/query-load/index.js';
	import Delta from './_Delta.svelte';
	import EmptyChart from '../core/EmptyChart.svelte';

	export let data = undefined;

	const initialHash = typeof data === 'object' && '__isQueryStore' in data ? data.hash : undefined;

	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {"pass" | "warn" | "error"}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	let chartType = 'Delta';

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
	<p slot="skeleton" class="text-base-content-muted">Loading...</p>
	<Delta {...spreadProps} data={loaded?.__isQueryStore ? Array.from(loaded) : loaded} />
</QueryLoad>
