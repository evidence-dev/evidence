<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Query } from '@evidence-dev/sdk/usql';
	import { QueryLoad } from '../../../atoms/query-load';
	import EmptyChart from '$lib/unsorted/viz/core/EmptyChart.svelte';
	import Slider from './_Slider.svelte';

	export let data;

	let chartType = 'Slider';

	const initialHash = Query.isQuery(data) ? data.hash : undefined;
	let isInitial = data?.hash === initialHash;
	$: isInitial = data?.hash === initialHash;

	/** @type {"pass" | "warn" | "error"}*/
	export let emptySet = undefined;

	/** @type {string}*/
	export let emptyMessage = undefined;

	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined));
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<span slot="empty">
		{#if !spreadProps.placeholder}
			<EmptyChart {emptyMessage} {emptySet} {chartType} {isInitial} />
		{/if}
	</span>
	<span slot="skeleton" class="text-gray-500">Loading...</span>
	<Slider {...spreadProps} data={Query.isQuery(loaded) ? Array.from(loaded) : loaded} />
</QueryLoad>
