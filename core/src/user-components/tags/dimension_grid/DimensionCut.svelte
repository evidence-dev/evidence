<script lang="ts">
	import { flip } from 'svelte/animate';
	import DimensionRow from './DimensionRow.svelte';
	import formatTitle from '../../formatTitle';

	export type DimensionQueryRow = {
		dimension_value: string | null;
		metric_value: number | null;
		percent_of_top: number;
	};

	let {
		dimension,
		rows,
		selectedValues,
		metricLabel,
		fmt,
		onToggle,
		onClear
	}: {
		dimension: string;
		rows: DimensionQueryRow[];
		selectedValues: string[];
		metricLabel?: string;
		fmt?: string;
		onToggle: (value: string) => void;
		onClear: () => void;
	} = $props();

	const hasSelections = $derived(selectedValues.length > 0);
	const title = $derived(formatTitle(dimension));
</script>

<div class="w-60 shrink-0 pr-4 pb-2 text-xs antialiased sm:w-1/4">
	<!-- Header -->
	<div class="flex items-center justify-between border-b pb-1">
		<div class="flex min-w-0 flex-1 items-center justify-between">
			<span class="truncate font-medium" title={dimension}>{title}</span>
			{#if metricLabel}
				<span class="text-muted-foreground truncate text-right">{metricLabel}</span>
			{/if}
		</div>
		{#if hasSelections}
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground ml-2 shrink-0 text-xs underline"
				onclick={onClear}
			>
				Clear
			</button>
		{/if}
	</div>

	<!-- Values -->
	<div class="overflow-clip">
		{#if rows.length === 0}
			<div class="text-muted-foreground py-2 text-center">No values</div>
		{:else}
			{#each rows as row (row.dimension_value)}
				<div animate:flip={{ duration: 300 }} style="will-change: transform;">
					<DimensionRow
						value={row.dimension_value}
						metric={row.metric_value}
						percentOfTop={row.percent_of_top}
						selected={row.dimension_value !== null && selectedValues.includes(row.dimension_value)}
						{fmt}
						onclick={() => {
							if (row.dimension_value !== null) {
								onToggle(row.dimension_value);
							}
						}}
					/>
				</div>
			{/each}
		{/if}
	</div>
</div>
