<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { onMount } from 'svelte';
	import { PanelLeftClose, PanelLeftOpen } from 'lucide-svelte';
	import { cn } from '../../shadcn/utils';
	import * as Tooltip from '../../shadcn/components/ui/tooltip';

	type Props = HTMLAttributes<HTMLDivElement> & {
		bannerHeight?: string;
		sidebarWidth?: string;
		// Background the chrome (header bar, sidebar, sticky nav headers, fades) sits
		// on. Defaults to the page background; pass var(--card-mode-background) on card
		// pages so the chrome stays flat with the report rather than reading as a
		// separate white panel. Drives --core-layout-surface; changes crossfade.
		surface?: string;
		contentRef?: HTMLElement | null;
		contentClass?: string;
		sidebarClass?: string;
		sidebarLabel?: string;
		brand?: Snippet;
		topActions?: Snippet;
		sidebarHeader?: Snippet;
		sidebar?: Snippet;
		sidebarFooter?: Snippet;
		children?: Snippet;
	};

	let {
		bannerHeight = '0px',
		sidebarWidth = '16rem',
		surface = 'var(--background)',
		sidebarLabel = 'Navigation',
		contentRef = $bindable<HTMLElement | null>(null),
		contentClass,
		sidebarClass,
		class: className,
		style,
		brand,
		topActions,
		sidebarHeader,
		sidebar,
		sidebarFooter,
		children,
		...restProps
	}: Props = $props();

	let mobileOpen = $state(false);
	let isDesktop = $state(false);

	const rootStyle = $derived(
		`--core-layout-banner-height: ${bannerHeight}; --core-layout-header-height: 3rem; --core-layout-sidebar-width: ${sidebarWidth}; --core-layout-surface: ${surface}; --core-layout-toc-top: calc(var(--core-layout-banner-height) + var(--core-layout-header-height) + 2rem); ${style ?? ''}`
	);

	function closeMobileSidebar() {
		mobileOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeMobileSidebar();
	}

	function handleSidebarClick(event: MouseEvent) {
		if (!mobileOpen) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		if (target.closest('a[href]')) closeMobileSidebar();
	}

	function closeOnLinkClick(node: HTMLElement) {
		node.addEventListener('click', handleSidebarClick);
		return {
			destroy() {
				node.removeEventListener('click', handleSidebarClick);
			}
		};
	}

	onMount(() => {
		const desktopQuery = window.matchMedia('(min-width: 64rem)');
		const closeOnDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
			isDesktop = event.matches;
			if (event.matches) closeMobileSidebar();
		};

		closeOnDesktop(desktopQuery);
		desktopQuery.addEventListener('change', closeOnDesktop);

		return () => {
			desktopQuery.removeEventListener('change', closeOnDesktop);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	{...restProps}
	style={rootStyle}
	class={cn(
		'text-foreground min-h-svh bg-[color:var(--core-layout-surface)] select-none',
		className
	)}
>
	<header
		class="core-chrome fixed right-0 left-0 z-50 flex h-(--core-layout-header-height) items-center justify-between gap-2 bg-[color:var(--core-layout-surface)] lg:left-(--core-layout-sidebar-width) print:hidden"
		style="top: var(--core-layout-banner-height);"
	>
		<div class="flex h-full min-w-0 flex-1 items-center gap-2 px-3 sm:px-4 lg:px-6">
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md transition-[width,opacity,transform,color,background-color,margin] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none lg:pointer-events-none lg:-mr-2 lg:w-0 lg:scale-95 lg:opacity-0"
				aria-label="Open sidebar"
				aria-expanded={mobileOpen}
				aria-hidden={isDesktop}
				tabindex={isDesktop ? -1 : 0}
				onclick={() => (mobileOpen = true)}
			>
				<PanelLeftOpen class="size-4" />
			</button>
			<div class="flex min-w-0 flex-1 items-center lg:hidden">
				{@render brand?.()}
			</div>
		</div>

		<div class="flex h-full shrink-0 items-center gap-2 px-3 sm:px-4 lg:px-6">
			<Tooltip.Provider delayDuration={400} disableHoverableContent>
				{@render topActions?.()}
			</Tooltip.Provider>
		</div>
	</header>

	<aside
		aria-label={sidebarLabel}
		class={cn(
			'core-chrome fixed bottom-0 left-0 z-30 hidden w-(--core-layout-sidebar-width) flex-col bg-[color:var(--core-layout-surface)] text-sm lg:flex print:hidden',
			sidebarClass
		)}
		style="top: var(--core-layout-banner-height);"
		use:closeOnLinkClick
	>
		<div class="flex h-(--core-layout-header-height) shrink-0 items-center px-2">
			{@render brand?.()}
		</div>
		{#if sidebarHeader}
			<div class="shrink-0 px-2 pt-1 pb-4">
				{@render sidebarHeader()}
			</div>
		{/if}
		<nav class="pretty-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-3">
			{@render sidebar?.()}
		</nav>
		{#if sidebarFooter}
			<div class="shrink-0 px-2 py-2">
				{@render sidebarFooter()}
			</div>
		{/if}
	</aside>

	<button
		type="button"
		aria-label="Close sidebar"
		aria-hidden={!mobileOpen}
		tabindex={mobileOpen ? 0 : -1}
		data-open={mobileOpen}
		class="fixed right-0 bottom-0 left-0 z-60 bg-black/8 opacity-0 backdrop-blur-none transition-[opacity,backdrop-filter] duration-200 ease-out data-[open=false]:pointer-events-none data-[open=true]:opacity-100 data-[open=true]:backdrop-blur-sm lg:pointer-events-none lg:opacity-0 print:hidden"
		style="top: var(--core-layout-banner-height);"
		onclick={closeMobileSidebar}
	></button>
	<aside
		aria-label={sidebarLabel}
		aria-hidden={!mobileOpen}
		data-open={mobileOpen}
		class={cn(
			'core-chrome fixed bottom-0 left-0 z-70 flex w-[min(22rem,100vw)] -translate-x-full flex-col bg-[color:var(--core-layout-surface)] text-sm transition-transform duration-200 ease-out data-[open=false]:pointer-events-none data-[open=true]:translate-x-0 data-[open=true]:shadow-[4px_0_12px_-2px_rgb(0_0_0/0.14),20px_0_48px_-12px_rgb(0_0_0/0.28)] lg:pointer-events-none lg:-translate-x-full print:hidden',
			sidebarClass
		)}
		style="top: var(--core-layout-banner-height);"
		use:closeOnLinkClick
	>
		<div
			class="flex h-(--core-layout-header-height) shrink-0 items-center justify-between gap-2 px-2"
		>
			<div class="flex min-w-0 items-center">
				{@render brand?.()}
			</div>
			<button
				type="button"
				aria-label="Close sidebar"
				onclick={closeMobileSidebar}
				class="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
			>
				<PanelLeftClose class="size-4" />
			</button>
		</div>
		{#if sidebarHeader}
			<div class="shrink-0 px-2 pt-1 pb-4">
				{@render sidebarHeader()}
			</div>
		{/if}
		<nav class="pretty-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-3">
			{@render sidebar?.()}
		</nav>
		{#if sidebarFooter}
			<div class="shrink-0 px-2 pt-2 pb-4">
				{@render sidebarFooter()}
			</div>
		{/if}
	</aside>

	<main
		bind:this={contentRef}
		class={cn(
			'core-layout-main pretty-scrollbar fixed right-0 bottom-0 left-0 overflow-auto overflow-x-hidden scroll-smooth bg-[color:var(--core-layout-surface)]',
			contentClass
		)}
	>
		{@render children?.()}
	</main>
</div>

<style>
	.core-layout-main {
		top: calc(var(--core-layout-banner-height) + var(--core-layout-header-height));
	}

	:global(:root) {
		--core-layout-toc-top: calc(
			var(--core-layout-banner-height, 0px) + var(--core-layout-header-height, 3rem) + 2rem
		);
	}

	@media (min-width: 64rem) {
		.core-layout-main {
			left: var(--core-layout-sidebar-width);
		}
	}

	@media print {
		.core-layout-main {
			position: static;
			height: auto !important;
			overflow: visible !important;
		}
	}
</style>
