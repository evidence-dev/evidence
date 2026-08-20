<script lang="ts">
	import { cn } from '../../../shadcn/utils';
	import { formatValue } from '../../formatValue';

	let {
		value,
		metric,
		percentOfTop,
		selected,
		fmt,
		onclick
	}: {
		value: string | null;
		metric: number | null;
		percentOfTop: number;
		selected: boolean;
		fmt?: string;
		onclick: () => void;
	} = $props();

	const formattedMetric = $derived(metric !== null ? formatValue(metric, fmt) : '-');
	// Bar width based on percent of top value
	const barWidth = $derived(Math.min(Math.max((percentOfTop ?? 0) * 100, 0), 100));
	const displayValue = $derived(value ?? 'Missing');
</script>

<button
	type="button"
	class={cn(
		'group text-foreground relative flex w-full cursor-pointer items-center justify-between py-0.5 text-left transition duration-100',
		selected && 'text-primary font-medium',
		value === null && 'text-muted-foreground italic'
	)}
	{onclick}
>
	<!-- Full-width base background (selected only) -->
	{#if selected}
		<div class="dimension-bar-base absolute inset-0 z-[-2]"></div>
	{/if}

	<!-- Metric bar -->
	<div
		class={cn(
			'absolute inset-y-0 left-0 z-[-1]',
			selected ? 'dimension-bar-selected' : 'dimension-bar opacity-50'
		)}
		style="width: {barWidth}%; transition: width 300ms 300ms, background-color 200ms 0ms;"
	></div>

	<!-- Content -->
	<span class="min-w-0 flex-1 truncate pr-2" title={displayValue}>
		{displayValue}
	</span>

	<span class="text-muted-foreground shrink-0 tabular-nums">
		{formattedMetric}
	</span>
</button>

<style>
	.dimension-bar {
		/* Light mode: darken background, preserve its chroma & hue */
		background-color: oklch(from var(--background) calc(l - 0.1) c h);
	}

	:global(.dark) .dimension-bar {
		/* Dark mode: lighten background, preserve its chroma & hue */
		background-color: oklch(from var(--background) calc(l + 0.12) c h);
	}

	.dimension-bar-selected {
		/* Light mode: darker version for selected metric bar */
		background-color: oklch(from var(--background) calc(l - 0.2) c h);
	}

	:global(.dark) .dimension-bar-selected {
		/* Dark mode: lighter version for selected metric bar */
		background-color: oklch(from var(--background) calc(l + 0.2) c h);
	}

	.dimension-bar-base {
		/* Light mode: subtle background for selected rows */
		background-color: oklch(from var(--background) calc(l - 0.06) c h);
	}

	:global(.dark) .dimension-bar-base {
		/* Dark mode: subtle background for selected rows */
		background-color: oklch(from var(--background) calc(l + 0.08) c h);
	}
</style>
