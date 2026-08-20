<script lang="ts">
	import { logger } from '../../../shims/logger';
	import { getComparisonTooltipContext } from './ComparisonTooltip.svelte';
	import { computePosition, flip, shift, offset } from '@floating-ui/dom';
	import { scale } from 'svelte/transition';

	let tooltipElement: HTMLElement | undefined = $state.raw();

	const tooltip = getComparisonTooltipContext();

	// Update tooltip position when anchor changes
	$effect(() => {
		if (tooltip.open && tooltip.anchor && tooltipElement) {
			updatePosition(tooltip.anchor);
		}
	});

	async function updatePosition(anchor: HTMLElement) {
		if (!tooltipElement) return;

		try {
			const { x, y } = await computePosition(anchor, tooltipElement, {
				placement: 'top',
				middleware: [offset(8), flip(), shift({ padding: 8 })],
				strategy: 'fixed' // Explicitly set strategy to handle complex layouts
			});

			Object.assign(tooltipElement.style, {
				left: `${x}px`,
				top: `${y}px`
			});
		} catch (error) {
			logger.warn(error, 'Failed to position tooltip');
			// Fallback: position manually using anchor's bounding rect
			try {
				const anchorRect = anchor.getBoundingClientRect();
				const tooltipRect = tooltipElement.getBoundingClientRect();

				let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
				let top = anchorRect.top - tooltipRect.height - 8;

				// Keep tooltip within viewport
				left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
				if (top < 8) {
					top = anchorRect.bottom + 8; // Show below if no room above
				}

				Object.assign(tooltipElement.style, {
					left: `${left}px`,
					top: `${top}px`
				});
			} catch (fallbackError) {
				logger.warn(fallbackError, 'Tooltip fallback positioning failed');
			}
		}
	}
</script>

{#if tooltip.open}
	<!-- Use a portal-like approach by positioning absolutely -->
	{#key tooltip.anchor}
		<div
			bind:this={tooltipElement}
			class="bg-background text-foreground fixed z-50 max-w-md rounded-sm border px-2 py-1.5 font-sans text-xs shadow-sm"
			role="tooltip"
			in:scale={{ duration: 200, start: 0.5 }}
			out:scale={{ duration: 100, start: 1 }}
		>
			<div class="space-y-1">
				<div class="text-foreground text-left font-medium">
					{tooltip.title}
				</div>
				<div class="space-y-0.5">
					{#each tooltip.rows as row}
						{#if row.label === 'separator'}
							<div class="border-muted-foreground/40 my-1 border-t"></div>
						{:else}
							<div class="flex items-center justify-between gap-6">
								<span class="text-muted-foreground">{row.label}:</span>
								<span class="text-foreground font-normal tabular-nums">{row.value}</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	{/key}
{/if}
