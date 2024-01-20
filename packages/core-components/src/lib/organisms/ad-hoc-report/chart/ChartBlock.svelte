<script>
	import { fade } from 'svelte/transition';

	import clickOutside from '@evidence-dev/component-utilities/clickOutside';

	import ChartControls from './ChartControls.svelte';

	import { chartToComponentLookup } from '../blocks';

	/** @type {import("../blocks").Chart} */
	export let block;

	/** @type {import("../blocks").Query[]}*/
	export let queries;

	/** @type {boolean} */
	export let showControls = false;

	$: chartComponent = chartToComponentLookup[block.chartType];

	/** @type {import("@evidence-dev/query-store").QueryStore | undefined} */
	$: query = queries.find((q) => q.id === block.source)?.data;

	const checkDefaultCols = () => {
		if (!block.xCol) {
			block.xCol = $query.columns[0].name;
			block = block;
		}
		if (!block.yCol) {
			block.yCol = $query.columns.find((c) => c.type === 'number')?.name ?? $query.columns[0].name;
			block = block;
		}
	};
	// This is wrapped in a function because svelte reactivity was being silly
	$: $query && checkDefaultCols();
</script>

<!-- TODO: Catch queries that are too big -->
<div class="relative">
	{#if $query}
		<div class="flex flex-col gap-2 !z-0">
			{#if showControls}
				<div
					class="bg-gray-100 absolute top-10 rounded right-2 z-40 px-2 py-2"
					transition:fade
					use:clickOutside={{ enabled: true, callback: () => (showControls = false) }}
				>
					<div class="whitespace-nowrap bg-gray-100 flex flex-col gap-2">
						<ChartControls bind:block query={$query} />
					</div>
				</div>
			{/if}
			{#if block.xCol && block.yCol && chartComponent}
				<svelte:component
					this={chartComponent}
					title={block.title}
					x={block.xCol}
					y={block.yCol}
					data={$query}
					series={block.series}
				/>
			{:else}
				<div />
			{/if}
		</div>
	{/if}
</div>
