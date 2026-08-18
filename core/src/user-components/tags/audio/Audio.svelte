<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	let props: UserComponentProps<typeof schema> = $props();

	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	const inlineQueries = getInlineQueriesContext();

	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText } = $derived(createResolvers(variableProcessor));

	const url = $derived(resolveText(props.url) ?? props.url);
	const title = $derived(resolveText(props.title));
	const mimeType = $derived(`audio/${props.type ?? 'mpeg'}`);
</script>

{#key `${url ?? ''}|${mimeType}`}
	<audio controls preload="metadata" aria-label={title} class="w-full">
		<source src={url} type={mimeType} />
		Your browser does not support the audio element.
	</audio>
{/key}
