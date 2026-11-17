<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tooltip from '../shadcn/components/ui/tooltip';

	type Props = {
		noTooltip?: boolean;
		tooltipDelay?: number;
		tooltipClass?: string;
		tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
		tooltipSideOffset?: number;
		class?: string;
		children?: Snippet;
	};

	let {
		noTooltip,
		tooltipDelay = 300,
		tooltipClass,
		tooltipSide = 'top',
		tooltipSideOffset = 0,
		class: className,
		children
	}: Props = $props();

	let element: HTMLDivElement | undefined = $state();
	let hasEllipsis: boolean = $state(false);

	const updateHasEllipsis = (element: HTMLElement) => {
		hasEllipsis = element.scrollWidth > element.clientWidth;
	};

	let resizeObserver: ResizeObserver | undefined;
	$effect(() => {
		if (!element) return;
		resizeObserver = new ResizeObserver(() => {
			if (!element) return;
			updateHasEllipsis(element);
		});
		resizeObserver.observe(element);
		return () => {
			resizeObserver?.disconnect();
		};
	});
</script>

<Tooltip.Provider disabled={noTooltip || !hasEllipsis} delayDuration={tooltipDelay}>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<div
					bind:this={element}
					{...props}
					class="min-w-0 cursor-[inherit] overflow-hidden text-left text-nowrap text-ellipsis {className}"
				>
					{@render children?.()}
				</div>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			side={tooltipSide}
			sideOffset={tooltipSideOffset}
			class="z-99999 {tooltipClass ?? ''}"
		>
			{@render children?.()}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
