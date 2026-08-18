<script lang="ts">
	import { tv } from 'tailwind-variants';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	const callout = tv({
		base: 'px-3 py-2.5 rounded-sm border max-h-full h-fit flex flex-col',
		variants: {
			type: {
				info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-200',
				success:
					'bg-fern-50 border-fern-200 text-fern-900 dark:bg-fern-500/10 dark:border-fern-500/20 dark:text-fern-200',
				warning:
					'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-200',
				error:
					'bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200'
			}
		},
		defaultVariants: {
			type: 'info'
		}
	});

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

	const type = $derived(resolveText(props.type) as 'info' | 'warning' | 'error' | 'success');
	const title = $derived(resolveText(props.title));
	const children = $derived(props.children);
</script>

<div class={callout({ type })}>
	{#if title}
		<h4 class="mt-0 mb-2 shrink-0 font-bold text-current">{title}</h4>
	{/if}
	<div class="flex-1 overflow-y-auto text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
		{@render children?.()}
	</div>
</div>
