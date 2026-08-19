<script lang="ts">
	import { setQueryService } from '../QueryService.context';
	import { setMetadataContext } from './context';
	import Consumer from '../connection/connection-wiring-consumer.fixture.svelte';
	import type { QueryService } from '../user-components/interfaces/query-service';
	import type { Metadata } from './Metadata.svelte';
	import type { Connection } from '../connection/types';

	let {
		queryService,
		metadata,
		onResolved
	}: {
		queryService: QueryService;
		metadata: Metadata;
		onResolved: (connection: Connection) => void;
	} = $props();

	// Mirror a layout: register the query service, then attach the catalog.
	setQueryService(queryService);
	setMetadataContext(metadata);
</script>

<Consumer {onResolved} />
