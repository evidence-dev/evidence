<script lang="ts">
	import { untrack, type ComponentProps } from 'svelte';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip';
	import Commentary from './Commentary.svelte';
	import { setPageStateContext } from '../../../shims/page-state';
	import {
		setPageRenderTrackerContext,
		type PageRenderTracker
	} from '../../../page-render-tracker.context.svelte';

	let {
		props,
		pageState,
		renderTracker
	}: {
		props: ComponentProps<typeof Commentary>;
		pageState?: Parameters<typeof setPageStateContext>[0];
		renderTracker?: PageRenderTracker;
	} = $props();
	untrack(() => {
		if (pageState) setPageStateContext(pageState);
		if (renderTracker) setPageRenderTrackerContext(renderTracker);
	});
</script>

<Tooltip.Provider>
	<Commentary {...props} />
</Tooltip.Provider>
