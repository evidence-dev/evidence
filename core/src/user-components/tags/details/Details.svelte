<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { ChevronRightIcon } from 'lucide-svelte';
	import { cn } from '../../../shadcn/utils';
	import Ellipsis from '../../../viewer-components/Ellipsis.svelte';
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

	const { resolveText } = $derived(createResolvers(variableProcessor));

	const title = $derived(resolveText(props.title) ?? 'Details');
	let isOpen = $state(props.open ?? false);
	const children = $derived(props.children);
</script>

<div class="flex h-full flex-col">
	<button
		class="text-foreground/80 flex shrink-0 cursor-pointer gap-1 text-left text-sm"
		onclick={() => (isOpen = !isOpen)}
	>
		<ChevronRightIcon
			class={cn('mt-[3px] size-4 shrink-0 transition-transform', isOpen ? 'rotate-90' : 'rotate-0')}
		/>
		<Ellipsis class="cursor-pointer">
			{title}
		</Ellipsis>
	</button>

	{#if isOpen}
		<!-- This div needs this height set for the transition to look nice -->
		<div class="h-[calc(100%-16px)] pt-1 pl-5 text-sm" transition:slide>
			<div class="h-full overflow-y-auto *:h-full *:text-sm">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>
