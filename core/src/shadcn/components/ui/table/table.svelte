<script lang="ts">
	import type { HTMLTableAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '../../../../shadcn/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		showScrollIndicators = false,
		...restProps
	}: WithElementRef<HTMLTableAttributes> & {
		/**
		 * When true, show subtle left/right indicators when horizontally scrollable.
		 * Useful as a discoverability hint for overflow tables.
		 */
		showScrollIndicators?: boolean;
	} = $props();

	let containerRef: HTMLDivElement | null = $state(null);
	let showLeft = $state(false);
	let showRight = $state(false);

	const updateGradients = () => {
		if (!containerRef) return;
		const { scrollLeft, scrollWidth, clientWidth } = containerRef;
		const scrollable = scrollWidth - clientWidth > 1;
		showLeft = scrollable && scrollLeft > 0;
		showRight = scrollable && scrollLeft + clientWidth < scrollWidth - 1;
	};

	$effect(() => {
		if (!showScrollIndicators) return;
		updateGradients();
	});

	$effect(() => {
		if (!showScrollIndicators || !containerRef) return;

		updateGradients();

		const onScroll = () => updateGradients();
		containerRef.addEventListener('scroll', onScroll, { passive: true });

		const ro = new ResizeObserver(() => updateGradients());
		ro.observe(containerRef);

		return () => {
			containerRef?.removeEventListener('scroll', onScroll);
			ro.disconnect();
		};
	});
</script>

<div data-slot="table-wrapper" class="relative w-full">
	<div bind:this={containerRef} data-slot="table-container" class="w-full overflow-x-auto">
		<table
			bind:this={ref}
			data-slot="table"
			class={cn('w-full caption-bottom text-sm', className)}
			{...restProps}
		>
			{@render children?.()}
		</table>
	</div>

	{#if showScrollIndicators}
		<div
			aria-hidden="true"
			class={cn(
				'from-background pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r to-transparent transition-opacity duration-200',
				showLeft ? 'opacity-100' : 'opacity-0'
			)}
		></div>
		<div
			aria-hidden="true"
			class={cn(
				'from-background pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l to-transparent transition-opacity duration-200',
				showRight ? 'opacity-100' : 'opacity-0'
			)}
		></div>
	{/if}
</div>
