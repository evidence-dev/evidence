<script lang="ts">
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { crossfade } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { browser } from '../../../shims/env';
	import { tv } from 'tailwind-variants';
	import { cn } from '../../../shadcn/utils';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';
	import { getPrintModeContext } from '../../../print-mode.context';

	const listVariants = tv({
		base: 'inline-flex items-center',
		variants: {
			variant: {
				well: 'bg-muted text-muted-foreground border rounded-lg',
				default: 'bg-transparent text-muted-foreground border-b border-border'
			},
			full_width: {
				true: 'w-full',
				false: 'w-fit'
			},
			align: {
				left: 'justify-start',
				right: 'justify-end'
			}
		},
		compoundVariants: [
			{
				variant: 'default',
				full_width: true,
				class: 'w-full justify-center'
			},
			{
				variant: 'default',
				full_width: false,
				class: 'w-full'
			},
			{
				variant: 'well',
				full_width: true,
				class: 'justify-center'
			}
		],
		defaultVariants: {
			variant: 'default',
			full_width: false,
			align: 'left'
		}
	});

	const triggerVariants = tv({
		base: 'relative flex items-center justify-center text-sm transition-colors',
		variants: {
			variant: {
				well: 'data-[state=active]:text-primary hover:text-primary',
				default: 'data-[state=active]:text-foreground hover:text-foreground'
			},
			full_width: {
				true: 'flex-1  p-1',
				false: 'flex-1 p-0.5'
			}
		},
		compoundVariants: [
			{
				variant: 'default',
				full_width: false,
				class: 'flex-none p-0.5'
			}
		],
		defaultVariants: {
			variant: 'default',
			full_width: false
		}
	});

	const indicatorVariants = tv({
		base: 'absolute z-0',
		variants: {
			variant: {
				well: 'bg-background border shadow-xs',
				default: 'border-b border-primary h-0'
			},
			full_width: {
				true: '',
				false: ''
			}
		},
		compoundVariants: [
			{
				variant: 'well',
				full_width: true,
				class: 'inset-0.5 rounded-md'
			},
			{
				variant: 'well',
				full_width: false,
				class: 'top-0 h-full w-full left-0 rounded-md'
			},
			{
				variant: 'default',
				full_width: true,
				class: '-bottom-px top-auto left-0 right-0 rounded-full'
			},
			{
				variant: 'default',
				full_width: false,
				class: '-bottom-[3px] top-auto !left-0 !right-0 -mx-[2px] rounded-none'
			}
		],
		defaultVariants: {
			variant: 'default',
			full_width: false
		}
	});

	type Props = UserComponentProps<typeof schema>;

	// Define the tab data structure
	type TabData = {
		id: string;
		title: string;
		icon?: string;
		print_break?: string;
		default?: boolean;
		content: Snippet | null;
	};

	// Create writable store for tabs - make this stable, not reactive to props
	const tabsStore = writable<Map<string, TabData>>(new Map());

	// Set context so child Tab components can access the store - do this once
	setContext('tabs', tabsStore);

	// Create state for tabs array and selected tab
	let tabs = $state<TabData[]>([]);
	let selectedTab = $state<string>('');
	let tabIcons = $state<Map<string, Component | null>>(new Map());

	// Create crossfade transitions
	const [send, receive] = crossfade({
		duration: 200
	});

	// Subscribe to store changes to update the displayed tabs
	$effect(() => {
		return tabsStore.subscribe((tabsMap) => {
			const newTabs = Array.from(tabsMap.values());
			tabs = newTabs;

			if (newTabs.length > 0 && (!selectedTab || !newTabs.find((t) => t.id === selectedTab))) {
				const defaultTab = newTabs.find((t) => t.default);
				selectedTab = defaultTab ? defaultTab.id : newTabs[0].id;
			}
		});
	});

	// Load icons when tabs change
	$effect(() => {
		if (browser) {
			const newIcons = new Map<string, Component | null>();
			for (const tab of tabs) {
				if (tab.icon) {
					newIcons.set(tab.id, loadLucideIcon(tab.icon));
				} else {
					newIcons.set(tab.id, null);
				}
			}
			tabIcons = newIcons;
		}
	});

	let props: Props = $props();

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

	const variant = $derived(props.variant ?? 'default');
	const full_width = $derived(props.full_width ?? false);
	const color = $derived(resolveText(props.color));
	const align = $derived(props.align ?? 'left');
	const children = $derived(props.children);

	const isPrintMode = getPrintModeContext();
</script>

<div class="w-full" style={color ? `--tab-color: ${color}` : ''}>
	{#if isPrintMode}
		<!-- Print mode: unfurl tabs into h1 headings with content -->
		<div class="flex flex-col gap-6">
			{#each tabs as tab}
				<div class={tab.print_break !== 'auto' ? 'break-inside-avoid' : ''}>
					<h1 class="mb-2 text-xl font-semibold">{tab.title}</h1>
					{#if tab.content}
						{@render tab.content()}
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<!-- Display the list of tab titles -->
		<TabsPrimitive.Root bind:value={selectedTab} class="flex w-full flex-col gap-1">
			<div class="overflow-x-auto">
				<TabsPrimitive.List class={cn(listVariants({ variant, full_width, align }))}>
					{#each tabs as tab}
						<TabsPrimitive.Trigger
							value={tab.id}
							class={cn(
								triggerVariants({ variant, full_width }),
								color && 'hover:text-[var(--tab-color)] data-[state=active]:text-[var(--tab-color)]'
							)}
						>
							{#if full_width && selectedTab === tab.id}
								<div
									class={cn(
										indicatorVariants({ variant, full_width }),
										color && variant === 'default' && 'border-b-[var(--tab-color)]'
									)}
									in:receive={{ key: 'tab-indicator' }}
									out:send={{ key: 'tab-indicator' }}
								></div>
							{/if}
							<div class="relative z-10 h-full px-2 py-1">
								{#if !full_width && selectedTab === tab.id}
									<div
										class={cn(
											indicatorVariants({ variant, full_width }),
											color && variant === 'default' && 'border-b-[var(--tab-color)]'
										)}
										in:receive={{ key: 'tab-indicator' }}
										out:send={{ key: 'tab-indicator' }}
									></div>
								{/if}
								<span class="relative z-20 flex items-center gap-1.5 whitespace-nowrap">
									{#if tab.icon}
										{@const IconComponent = tabIcons.get(tab.id)}
										{#if IconComponent}
											<IconComponent class="size-4" />
										{/if}
									{/if}
									{tab.title}
								</span>
							</div>
						</TabsPrimitive.Trigger>
					{/each}
				</TabsPrimitive.List>
			</div>

			<!-- Content area for selected tab -->
			{#if selectedTab}
				{@const selectedTabData = tabs.find((tab) => tab.id === selectedTab)}
				{#if selectedTabData}
					<TabsPrimitive.Content value={selectedTab} class="mt-2">
						{#if selectedTabData.content}
							{@render selectedTabData.content()}
						{/if}
					</TabsPrimitive.Content>
				{/if}
			{/if}
		</TabsPrimitive.Root>
	{/if}

	<!-- Render all tab children hidden so they mount and register -->
	{#key 'stable-tabs-children'}
		<div class="hidden">
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/key}
</div>
