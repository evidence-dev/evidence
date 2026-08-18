<script lang="ts">
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import * as Accordion from '../../../shadcn/components/ui/accordion';
	import type { Snippet } from 'svelte';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { browser } from '../../../shims/env';
	import { tv } from 'tailwind-variants';
	import { cn } from '../../../shadcn/utils';
	import NoCardScope from '../../common/NoCardScope.svelte';

	const accordionVariants = tv({
		base: '',
		variants: {
			variant: {
				default: '',
				well: 'bg-accent rounded-lg px-4 py-2 border',
				card: 'bg-card rounded-lg px-4 py-2 border shadow-xs'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	type Props = UserComponentProps<typeof schema>;

	// Define the accordion item data structure
	type AccordionItemData = {
		id: string;
		title: string;
		icon?: string;
		open?: boolean;
		titleSnippet: Snippet | null;
		titlePadding: { top: number; bottom: number } | null;
		bodySnippet: Snippet | null;
	};

	// Inline style overrides the shadcn trigger's `py-4` class for the slotted-title case.
	const triggerStyle = (item: AccordionItemData) =>
		item.titlePadding
			? `padding-top: ${item.titlePadding.top}px; padding-bottom: ${item.titlePadding.bottom}px;`
			: undefined;

	// Create writable store for accordion items - make this stable, not reactive to props
	const accordionStore = writable<Map<string, AccordionItemData>>(new Map());

	// Set context so child AccordionItem components can access the store
	setContext('accordion', accordionStore);

	// Create state for accordion items array and selected value(s)
	let accordionItems = $state<AccordionItemData[]>([]);
	let itemIcons = $state<Map<string, Component | null>>(new Map());
	let initialized = $state<boolean>(false);

	let { single = false, variant = 'default', children }: Props = $props();

	// Create separate state variables for single vs multiple mode to satisfy type constraints
	let singleValue = $state<string>('');
	let multipleValue = $state<string[]>([]);

	// Subscribe to store changes to update the displayed accordion items
	$effect(() => {
		return accordionStore.subscribe((itemsMap) => {
			const newItems = Array.from(itemsMap.values());
			accordionItems = newItems;
		});
	});

	// Initialize open items only once when items are first loaded
	$effect(() => {
		if (accordionItems.length > 0 && !initialized) {
			const openItems = accordionItems.filter((item) => item.open).map((item) => item.id);

			if (single) {
				// For single mode, only open the first item that has open=true
				if (openItems.length > 0) {
					singleValue = openItems[0];
				}
			} else {
				// For multiple mode, open all items that have open=true
				if (openItems.length > 0) {
					multipleValue = openItems;
				}
			}

			initialized = true;
		}
	});

	// Load icons when accordion items change
	$effect(() => {
		if (browser) {
			const newIcons = new Map<string, Component | null>();
			for (const item of accordionItems) {
				if (item.icon) {
					newIcons.set(item.id, loadLucideIcon(item.icon));
				} else {
					newIcons.set(item.id, null);
				}
			}
			itemIcons = newIcons;
		}
	});
</script>

{#snippet trigger(item: AccordionItemData)}
	<div class="flex items-center gap-2">
		{#if item.icon}
			{@const IconComponent = itemIcons.get(item.id)}
			{#if IconComponent}
				<IconComponent class="size-4" />
			{/if}
		{/if}
		{#if item.titleSnippet}
			<!-- Block container so slotted content (e.g. big_value + a text paragraph) stacks naturally instead of laying out as flex siblings next to the icon. -->
			<div class="flex-1">
				<NoCardScope>
					{@render item.titleSnippet()}
				</NoCardScope>
			</div>
		{:else}
			<span>{item.title}</span>
		{/if}
	</div>
{/snippet}

{#snippet content(item: AccordionItemData)}
	{#if item.bodySnippet}
		{@render item.bodySnippet()}
	{/if}
{/snippet}

<div class={cn(accordionVariants({ variant }))}>
	<!-- Display the accordion using shadcn components -->
	{#if single}
		<Accordion.Root bind:value={singleValue} type="single" class="w-full">
			{#each accordionItems as item}
				<Accordion.Item value={item.id}>
					<Accordion.Trigger
						class={cn(
							'[&>svg]:self-center [&>svg]:translate-y-0',
							item.titleSnippet && 'hover:no-underline'
						)}
						style={triggerStyle(item)}
					>
						{@render trigger(item)}
					</Accordion.Trigger>
					<Accordion.Content class={cn((variant === 'well' || variant === 'card') && 'pb-3')}>
						{@render content(item)}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	{:else}
		<Accordion.Root bind:value={multipleValue} type="multiple" class="w-full">
			{#each accordionItems as item}
				<Accordion.Item value={item.id}>
					<Accordion.Trigger
						class={cn(
							'[&>svg]:self-center [&>svg]:translate-y-0',
							item.titleSnippet && 'hover:no-underline'
						)}
						style={triggerStyle(item)}
					>
						{@render trigger(item)}
					</Accordion.Trigger>
					<Accordion.Content class={cn((variant === 'well' || variant === 'card') && 'pb-3')}>
						{@render content(item)}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	{/if}

	<!-- Render all accordion item children hidden so they mount and register -->
	{#key 'stable-accordion-children'}
		<div class="hidden">
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/key}
</div>
