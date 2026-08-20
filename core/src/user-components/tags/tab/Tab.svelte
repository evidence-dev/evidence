<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import type { Snippet } from 'svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	type TabData = {
		id: string;
		title: string;
		icon?: string;
		print_break?: string;
		default?: boolean;
		content: Snippet | null;
	};

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

	const title = $derived(resolveText(props.title));
	const icon = $derived(resolveText(props.icon));
	const print_break = $derived(props.print_break);
	const isDefault = $derived(props.default);
	const children = $derived(props.children);

	// Get the tabs store from context
	const tabsStore = getContext<Writable<Map<string, TabData>>>('tabs');

	// Generate a random ID for this tab
	const tabId = crypto.randomUUID();

	// Add this tab to the store on mount and set up reactive updates
	onMount(() => {
		if (!tabsStore) return;

		// Initial add to store
		tabsStore.update((tabs) => {
			tabs.set(tabId, { id: tabId, title, icon, print_break, default: isDefault, content: children || null });
			return tabs;
		});

		// Clean up on destroy
		return () => {
			if (tabsStore) {
				tabsStore.update((tabs) => {
					tabs.delete(tabId);
					return tabs;
				});
			}
		};
	});

	// Reactively update the store when title, icon, or children change
	$effect(() => {
		if (!tabsStore) return;

		tabsStore.update((tabs) => {
			const existingTab = tabs.get(tabId);
			if (existingTab) {
				tabs.set(tabId, { ...existingTab, title, icon, default: isDefault, content: children || null });
			}
			return tabs;
		});
	});
</script>

<!-- Tab component doesn't render anything directly - content is rendered by parent Tabs component -->
