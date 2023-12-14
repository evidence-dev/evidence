<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import {QueryLoad} from "../../../atoms/query-load"
	import Chart from "./_Chart.svelte"
	export let data
</script>

<!-- Pass all the props through-->
<QueryLoad {data}>
	<Chart {...$$props}>
		<slot/>
	</Chart>
</QueryLoad>
