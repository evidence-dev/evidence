<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { mode } from 'mode-watcher';
	import { schema } from './schema';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getLogoUrl } from '../../../shims/logo-url';

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

	// Keep em-based sizing so logos scale with surrounding typography as documented.
	const sizeMap: Record<string, string> = {
		sm: '1em',
		base: '1.25em',
		lg: '1.75em',
		xl: '2.5em'
	};

	// Resolved props
	const domain = $derived(resolveText(props.domain));
	const alt = $derived(props.alt ? resolveText(props.alt) : domain);
	const size = $derived(props.size ?? 'base');
	const height = $derived(sizeMap[size] ?? sizeMap.base);
	const grayscale = $derived(props.grayscale ?? false);

	const logoUrl = $derived(
		domain ? getLogoUrl(domain, mode.current === 'dark' ? 'dark' : 'light', 'monogram', grayscale) : null
	);
</script>

{#if logoUrl}
	<img
		src={logoUrl}
		{alt}
		class="inline-block -translate-y-[0.1em] align-middle"
		style:height
		style:width="auto"
	/>
{/if}
