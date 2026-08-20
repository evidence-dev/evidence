<script lang="ts">
	import { getContext, setContext, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import {
		ACCORDION_ITEM_SLOT_CONTEXT_KEY,
		type AccordionItemSlotContext,
		type AccordionTitlePadding
	} from './slot-context';

	type Props = UserComponentProps<typeof schema>;

	// Define the accordion item data structure
	type AccordionItemData = {
		id: string;
		title: string;
		icon?: string;
		open?: boolean;
		titleSnippet: Snippet | null;
		titlePadding: AccordionTitlePadding | null;
		bodySnippet: Snippet | null;
	};

	// Get the accordion store from context
	const accordionStore = getContext<Writable<Map<string, AccordionItemData>>>('accordion');

	if (!accordionStore) {
		throw new Error('AccordionItem must be used within an Accordion component');
	}

	// Generate unique ID for this accordion item
	const itemId = `accordion-item-${Math.random().toString(36).substr(2, 9)}`;

	let props: Props = $props();

	// Slot snippets provided by child accordion_title / accordion_body_slot tags.
	// The tree transform wraps the item's body children in accordion_body_slot and
	// keeps any accordion_title tag; both register here synchronously on mount.
	let titleSnippet = $state<Snippet | null>(null);
	let titlePadding = $state<AccordionTitlePadding | null>(null);
	let bodySnippet = $state<Snippet | null>(null);

	setContext<AccordionItemSlotContext>(ACCORDION_ITEM_SLOT_CONTEXT_KEY, {
		setTitle(snippet, padding) {
			titleSnippet = snippet;
			titlePadding = snippet ? (padding ?? null) : null;
		},
		setBody(snippet) {
			bodySnippet = snippet;
		}
	});

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

	// Extract processed values
	const title = $derived(resolveText(props.title ?? ''));
	const icon = $derived(resolveText(props.icon));
	const open = $derived(props.open ?? false);
	const children = $derived(props.children);

	// Register this accordion item with the parent accordion when component mounts.
	// Uses untrack so this only runs once on mount/unmount — the second $effect handles prop updates.
	// Without untrack, prop changes would re-run this effect, causing delete + re-insert
	// which moves the item to the end of the Map, breaking document order.
	$effect(() => {
		untrack(() => {
			accordionStore.update((items) => {
				const newItems = new Map(items);
				newItems.set(itemId, {
					id: itemId,
					title,
					icon,
					open,
					titleSnippet,
					titlePadding,
					bodySnippet
				});
				return newItems;
			});
		});

		return () => {
			accordionStore.update((items) => {
				const newItems = new Map(items);
				newItems.delete(itemId);
				return newItems;
			});
		};
	});

	// Update accordion item data when props or slot snippets change
	$effect(() => {
		accordionStore.update((items) => {
			const newItems = new Map(items);
			const existingItem = newItems.get(itemId);
			if (existingItem) {
				newItems.set(itemId, {
					...existingItem,
					title,
					icon,
					open,
					titleSnippet,
					titlePadding,
					bodySnippet
				});
			}
			return newItems;
		});
	});
</script>

<!--
	Render children in a hidden div so the child slot components (accordion_title and
	accordion_body_slot, injected by the tree transform) mount and register their
	children snippets via context. The slot components themselves render nothing,
	so no content is visibly rendered here — the snippets are rendered visibly by
	the parent Accordion in the trigger / content areas.
-->
<div class="hidden" aria-hidden="true">
	{#if children}
		{@render children()}
	{/if}
</div>
