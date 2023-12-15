<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { QueryLoad } from '../../../atoms/query-load';
	import EChartsMap from './_EChartsMap.svelte';
	export let data;

	// Remove any undefined props (e.g. w/o defaults) to prevent them from being passed
	$: spreadProps = {
		...Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== undefined)),
		data: data?.__isQueryStore ? Array.from(data) : data
	};
</script>

<!-- Pass all the props through-->
<QueryLoad {data}>
	<EChartsMap {...spreadProps}>
		<slot />
	</EChartsMap>
</QueryLoad>
