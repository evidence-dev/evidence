<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../../atoms/query-load';
	import InnerBigValue from './_BigValue.svelte';
	import Value from './Value.svelte';
	export let data;

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined));
</script>

<!-- Pass all the props through-->
<QueryLoad {data} let:loaded>
	<!-- this is copy pasted straight from bigvalue, which isn't great -->
	<div
		class="inline-block font-sans pt-2 pb-3 pr-3 pl-0 mr-3 items-center align-top"
		style={`
			min-width: ${$$props.minWidth};
			max-width: ${$$props.maxWidth};
		`}
		slot="skeleton"
	>
		<p class="text-sm text-gray-700">{$$props.title ?? ' '}</p>
		<Value column={$$props.value} fmt={$$props.fmt} data={loaded} />
	</div>

	<InnerBigValue {...spreadProps} data={loaded?.__isQueryStore ? Array.from(loaded) : loaded}>
		<slot />
	</InnerBigValue>
</QueryLoad>
