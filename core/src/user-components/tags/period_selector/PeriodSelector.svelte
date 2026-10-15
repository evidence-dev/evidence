<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getPrintModeContext } from '../../../print-mode.context';
	import { getPeriodReadonlyContext } from './period-readonly.context';
	import { PeriodFilter } from '../workflow_period/PeriodFilter.svelte';
	import PeriodControl from './PeriodControl.svelte';

	const props: UserComponentProps<typeof schema> = $props();

	const pageFilters = getPageFiltersContext();
	const readonly = getPrintModeContext() || getPeriodReadonlyContext();

	// With `id="period"` on a workflow page this is the frontmatter's filter, not one of our own.
	const filter = $derived.by(() => {
		const found = props.id ? pageFilters?.get(props.id) : undefined;
		return found instanceof PeriodFilter ? found : undefined;
	});
</script>

{#if filter}
	<!-- mb-4 matches the spacing other inputs leave below their control, so a row of them lines up. -->
	<PeriodControl {filter} {readonly} class="mb-4" />
{/if}
