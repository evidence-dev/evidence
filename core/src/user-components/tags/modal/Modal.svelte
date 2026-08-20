<script lang="ts">
	import { browser } from '../../../shims/env';
	import * as Dialog from '../../../shadcn/components/ui/dialog/index.js';
	import * as Drawer from '../../../shadcn/components/ui/drawer/index.js';
	import * as Tooltip from '../../../shadcn/components/ui/tooltip/index.js';
	import { userControlledButtonVariants } from '../../common/userControlledButtonVariant';
	import { setPageSettingsContext } from '../../../page-settings.context';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { loadLucideIcon } from '../../common/dynamic-icon';
	import type { Component } from 'svelte';
	import { cn } from '../../../shadcn/utils';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { VariableProcessor } from '../../../filter-variables/VariableProcessor';
	import { createResolvers } from '../../common/use-variable-processing';

	type Props = UserComponentProps<typeof schema>;

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

	const title = $derived(resolveText(props.title));
	const buttonText = $derived(resolveText(props.buttonText));
	const icon = $derived(resolveText(props.icon));
	const variant = $derived(props.variant ?? 'default');
	const icon_only = $derived(props.icon_only ?? false);
	const children = $derived(props.children);

	// Default buttonText to title if not provided
	let displayButtonText = $derived(buttonText || title);

	let dialogOpen = $state(false);
	let drawerOpen = $state(false);
	let isDesktop = $state(true); // Default for SSR
	let IconComponent = $state<Component | null>(null);
	let closeButtonRef: HTMLButtonElement | null = $state(null);

	// Provide default page settings for components inside modal
	setPageSettingsContext(() => ({
		cards: false, // No cards inside modal for cleaner look
		page_width: 'full', // Full width to use modal space
		table_of_contents: false,
		sidebar_position: null,
		icon: null
	}));

	// Load icon when icon prop changes
	$effect(() => {
		if (icon && browser) {
			IconComponent = loadLucideIcon(icon);
		} else {
			IconComponent = null;
		}
	});

	// Use media query to track desktop/mobile breakpoint
	$effect(() => {
		if (!browser) return;

		const mediaQuery = window.matchMedia('(min-width: 640px)');
		isDesktop = mediaQuery.matches;

		const handleChange = (e: MediaQueryListEvent) => {
			isDesktop = e.matches;
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});

	// Reset modal state when switching between desktop/mobile
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		isDesktop; // Track isDesktop changes
		dialogOpen = false;
		drawerOpen = false;
	});

	// Focus close button when drawer opens
	$effect(() => {
		if (drawerOpen && closeButtonRef && browser) {
			// Small delay to ensure drawer animation has started
			setTimeout(() => {
				closeButtonRef?.focus();
			}, 150);
		}
	});

	// Prevent modal/drawer from closing on outside interactions.
	// Users can still close with the X button or escape key.
	// This is necessary because many components inside modals (charts, dropdowns, etc.)
	// may render content in portals or use canvas/SVG elements that can incorrectly
	// trigger "outside" click detection.
	function handleInteractOutside(e: Event) {
		e.preventDefault();
	}
</script>

<div class="relative mb-3">
	{#if isDesktop}
		<Dialog.Root bind:open={dialogOpen}>
			{#if icon_only}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Dialog.Trigger
									{...props}
									class={cn(
										'flex items-center',
										userControlledButtonVariants({ variant, size: 'sm' })
									)}
								>
									{#if IconComponent}
										<IconComponent />
									{/if}
								</Dialog.Trigger>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content class="evidence-page-theme">
							{title}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{:else}
				<Dialog.Trigger
					class={cn('flex items-center', userControlledButtonVariants({ variant, size: 'sm' }))}
				>
					{#if IconComponent}
						<IconComponent />
					{/if}
					{displayButtonText}
				</Dialog.Trigger>
			{/if}
			<Dialog.Content
				class="evidence-page-theme flex max-h-[85vh] flex-col backdrop-blur-lg sm:max-w-[800px]"
				onInteractOutside={handleInteractOutside}
			>
				<Dialog.Header class="shrink-0">
					<Dialog.Title class="flex items-center gap-2">
						{#if IconComponent}
							<IconComponent class="size-5" />
						{/if}
						{title}
					</Dialog.Title>
				</Dialog.Header>
				<div class="flex-1 overflow-y-auto py-4">
					<div
						class="prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none max-w-none overflow-x-auto [&_.component-wrapper]:mb-4"
					>
						{#if children}
							{@render children()}
						{/if}
					</div>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Drawer.Root bind:open={drawerOpen}>
			{#if icon_only}
				<Drawer.Trigger class={userControlledButtonVariants({ variant, size: 'sm' })}>
					{#if IconComponent}
						<IconComponent />
					{/if}
				</Drawer.Trigger>
			{:else}
				<Drawer.Trigger class={userControlledButtonVariants({ variant, size: 'sm' })}>
					{#if IconComponent}
						<IconComponent />
					{/if}
					{displayButtonText}
				</Drawer.Trigger>
			{/if}
			<Drawer.Content class="flex max-h-[67vh] flex-col" onInteractOutside={handleInteractOutside}>
				<Drawer.Header class="shrink-0 text-left">
					<Drawer.Title class="flex items-center gap-2">
						{#if IconComponent}
							<IconComponent class="size-5" />
						{/if}
						{title}
					</Drawer.Title>
				</Drawer.Header>
				<div class="flex-1 overflow-y-auto px-4 pb-4">
					<div
						class="prose dark:prose-invert prose-code:before:content-none prose-code:after:content-none max-w-none overflow-x-auto [&_.component-wrapper]:mb-4"
					>
						{#if children}
							{@render children()}
						{/if}
					</div>
				</div>
				<Drawer.Footer class="shrink-0 pt-2">
					<Drawer.Close
						bind:ref={closeButtonRef}
						class={userControlledButtonVariants({ variant: 'default' })}
					>
						Close
					</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</div>
