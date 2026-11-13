<script lang="ts">
	import {
		setPageRenderTrackerContext,
		type PageRenderTracker
	} from '../../../page-render-tracker.context.svelte';
	import DeltaDisplay from './DeltaDisplay.svelte';

	let { tracker, value }: { tracker: PageRenderTracker; value: unknown } = $props();

	// svelte-ignore state_referenced_locally
	setPageRenderTrackerContext(tracker);
</script>

<DeltaDisplay {value} />
