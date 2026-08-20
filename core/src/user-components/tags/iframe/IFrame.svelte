<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { sanitizeUrl } from '../../common/transform-internal-link';
	import { safeIframeAttrs } from './safe-attrs';

	let props: UserComponentProps<typeof schema> = $props();

	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
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

	// Resolved props
	const src = $derived(sanitizeUrl(resolveText(props.src)));
	const height = $derived(props.height);
	const attrs = $derived(safeIframeAttrs(props.attrs));
</script>

<iframe
	class="w-full"
	class:h-full={!height}
	style:height={height ? `${height}px` : undefined}
	{...attrs}
	{src}
></iframe>
