<script lang="ts">
	import { page } from '$app/state';
	import { userControlledButtonVariants } from '../../common/userControlledButtonVariant';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { cn } from '../../../shadcn/utils';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { sanitizeUrl, transformInternalLink } from '../../common/transform-internal-link';
	import { getRendererContext } from '../../Renderer/renderer-context';

	type Props = UserComponentProps<typeof schema>;

	let props: Props = $props();

	// Get filter contexts for variable processing
	const pageFilters = getPageFiltersContext();
	const repeatFilters = getRepeatContext()?.filters;
	const inlineQueries = getInlineQueriesContext();
	const rendererContext = getRendererContext();

	// === VARIABLE INTERPOLATION ===
	const variableProcessor = $derived.by(() => {
		const filterContexts = [repeatFilters, pageFilters].filter(
			(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
		);
		if (filterContexts.length === 0 || !inlineQueries) return null;
		return new VariableProcessor(filterContexts, inlineQueries);
	});

	const { resolveText } = $derived(createResolvers(variableProcessor));

	const resolvedUrl = $derived(sanitizeUrl(resolveText(props.url)));
	// A fragment or query stays on the current page and `//host` is protocol-relative, so none of
	// the three is a project path — prefixing them would send the button somewhere else entirely.
	// Page-relative (`/path` or `path`) matches how table dimension links already resolve.
	const url = $derived(
		resolvedUrl.startsWith('#') || resolvedUrl.startsWith('?') || resolvedUrl.startsWith('//')
			? resolvedUrl
			: transformInternalLink(resolvedUrl, rendererContext.context, page.params, {
					hrefIncludesProjectSlug: false
				})
	);
	const title = $derived(resolveText(props.title));
	const new_tab = $derived(props.new_tab ?? false);
	const variant = $derived(props.variant ?? 'default');
</script>

<a
	href={url}
	target={new_tab ? '_blank' : undefined}
	rel={new_tab ? 'noopener noreferrer' : undefined}
	class={cn(
		'flex items-center no-underline',
		userControlledButtonVariants({ variant, size: 'sm' })
	)}
>
	{title}
</a>
