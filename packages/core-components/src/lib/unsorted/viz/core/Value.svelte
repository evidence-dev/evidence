<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import {QueryLoad} from "../../../atoms/query-load"
	import Value from "./_Value.svelte"
	export let data

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = Object.fromEntries(Object.entries($$props).filter(([k,v]) => v !== undefined))
</script>

<!-- Pass all the props through-->
<QueryLoad {data}>
	<Value {...spreadProps} data={data ? Array.from(data) : null}>
		<slot/>
	</Value>
</QueryLoad>
