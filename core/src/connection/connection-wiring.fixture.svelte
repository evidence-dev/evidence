<script lang="ts">
	import { setQueryService } from '../QueryService.context';
	import Consumer from './connection-wiring-consumer.fixture.svelte';
	import type { QueryService } from '../user-components/interfaces/query-service';
	import type { Connection } from './types';

	let {
		queryService,
		onResolved
	}: { queryService: QueryService; onResolved: (connection: Connection) => void } = $props();

	// Mirror a route layout: register the ambient query service (which sets the registry-of-one).
	// A nested consumer then resolves it via `getDefaultConnection()`, exercising the real
	// ancestor-sets / descendant-reads context flow the migration relies on.
	setQueryService(queryService);
</script>

<Consumer {onResolved} />
