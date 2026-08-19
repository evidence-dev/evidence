<script lang="ts">
	import { setQueryService } from '../../../QueryService.context';
	import type { QueryService } from '../../interfaces/query-service';
	import Map from './Map.svelte';
	import MapTestLayer from './MapTestLayer.svelte';

	let { queryService }: { queryService: QueryService } = $props();
	// svelte-ignore state_referenced_locally
	setQueryService(queryService);
</script>

<Map
	height={300}
	zoomable={true}
	pannable={true}
	base_style="mono"
	projection="flat"
	legend={false}
	legend_location="bottom_right"
>
	<MapTestLayer />
</Map>
