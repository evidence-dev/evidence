<script lang="ts">
	import Recursive from './Recursive.svelte';
	import type { RenderableTreeNode, ValidateError } from '@markdoc/markdoc';
	import { setRendererContext } from './renderer-context';
	import { registerRendererOutline } from './tree-registry';
	import { page } from '$app/state';
	import { resolveOutline } from '../../print-outline/resolve-outline';
	import { getPageFiltersContext } from '../../page-filters-context';
	import { getInlineQueriesContext } from '../common/inline-queries';
	import { getConnectionRegistryOptional } from '../../connection/context';
	import { getProjectSettingsContext } from '../../project-settings.context';
	import { connectionForReferenceString } from '../common/connection-for-attributes';

	type Props = {
		tree: RenderableTreeNode;
		validationErrors: ValidateError[];
	};

	let { tree, validationErrors }: Props = $props();
	let rootEl = $state<HTMLDivElement | null>(null);

	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();
	const connections = getConnectionRegistryOptional();
	const projectSettings = getProjectSettingsContext();

	$effect(() => {
		if (!rootEl || !connections) return;
		const currentTree = tree;
		registerRendererOutline(rootEl, (mode) =>
			resolveOutline(
				currentTree,
				{
					pageFilters,
					inlineQueries,
					defaultConnection: connections.default,
					connectionFor: (data) =>
						connections.get(data ? connectionForReferenceString(data, inlineQueries) : undefined),
					projectSettings
				},
				mode
			)
		);
	});

	setRendererContext({
		get context() {
			const routeId: string | null = page.route.id;
			if (routeId === '/(app)/[projectSlug=notOrganizationId]/[[branch]]/[...path]/edit')
				return 'edit';
			if (
				routeId ===
				'/preview/working/[organizationId=organizationId]/[projectSlug]/[branch]/[...path]'
			)
				return 'preview';
			if (
				routeId ===
				'/(published)/[organizationId=organizationId]/[projectSlug]/[[branch]]/[...path]'
			)
				return 'published';
			return undefined;
		}
	});
</script>

<!-- baseFontSize scales the report text. Use `em` (relative to the inherited
	 size), not `rem`: an absolute 1rem reset would force 16px onto the Renderer
	 wherever it's embedded in a smaller-font host (e.g. the AI chat at 12.5px).
	 On report pages the host is 16px, so this resolves to the same value. -->
<div
	class="*:space-y-block-gap font-sans"
	style="font-size: calc(var(--theme-font-scale, 1) * 1em);"
	data-markdoc-content
	bind:this={rootEl}
>
	<Recursive treeNode={tree} {validationErrors} />
</div>
