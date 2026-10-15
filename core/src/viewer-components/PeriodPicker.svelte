<script lang="ts">
	import { getPageFiltersContext } from '../page-filters-context';
	import { getWorkflowPeriodFilter } from '../user-components/tags/workflow_period/PeriodFilter.svelte';
	import PeriodControl from '../user-components/tags/period_selector/PeriodControl.svelte';

	interface Props {
		/** Render the selected period as a static label, for PDF and screenshot routes. */
		readonly?: boolean;
		class?: string;
	}

	let { readonly = false, class: className }: Props = $props();

	const pageFilters = getPageFiltersContext();

	// Undefined unless the page declared `workflow.period`, so every surface can
	// drop this in unconditionally.
	const filter = $derived(getWorkflowPeriodFilter(pageFilters));
</script>

<!-- A page that places its own period_selector gets that one instead. -->
{#if filter && !filter.attributes.placed}
	<PeriodControl {filter} {readonly} class={className} />
{/if}
