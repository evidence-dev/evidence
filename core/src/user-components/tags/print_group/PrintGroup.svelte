<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	let props: UserComponentProps<typeof schema> = $props();

	// Get filter contexts for variable processing
	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	const inlineQueries = getInlineQueriesContext();

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveBoolean } = $derived(createResolvers(variableProcessor));

	const hide = $derived(resolveBoolean(props.hide) ?? false);
	const children = $derived(props.children);
</script>

<div class="space-y-block-gap break-inside-avoid" class:print:hidden={hide}>
	{#if children}
		{@render children()}
	{/if}
</div>
