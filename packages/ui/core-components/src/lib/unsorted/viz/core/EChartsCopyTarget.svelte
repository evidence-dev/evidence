<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getContext } from 'svelte';
	import eChartsCopy from '@evidence-dev/component-utilities/echartsCopy';

	export let config = undefined;
	export let height = '291px';
	export let width = '100%';
	export let copying = false;
	export let printing = false;
	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let seriesColors = undefined;

	// Grid Context:
	let inGrid = false;
    let gridCols;
	let gridId;
	let gapWidth;

    // Attempt to get the grid context
    const gridConfig = getContext('gridConfig');

    if (gridConfig) {
        inGrid = true;
        ({ gridId, cols: gridCols, gapWidth } = gridConfig);
    }

	$: portraitCols = Math.min(Number(gridCols), 2);
	$: portraitWidth = `${(650 / portraitCols) - (Number(gapWidth) * (portraitCols - 1))}px`;
	$: landscapeCols = Math.min(Number(gridCols), 3);
	$: landscapeWidth = `${(650 / landscapeCols) - (Number(gapWidth) * (landscapeCols - 1))}px`;
</script>


{#if copying}
	<div
		class="chart"
		style="
          height: {height};
          width: {width};
          margin-left: 0;
          margin-top: 15px;
          margin-bottom: 10px;
          overflow: visible;
          break-inside: avoid;
      "
		use:eChartsCopy={{ config, ratio: 2, echartsOptions, seriesOptions, seriesColors }}
	/>
{:else if printing}
	{#if inGrid}
		<div
			class="chart md:hidden"
			style="
			height: {height};
			width: {portraitWidth};
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{ config, ratio: 4, echartsOptions, seriesOptions, seriesColors }}
		/>
		<div
			class="chart hidden md:block"
			style="
			height: {height};
			width: {landscapeWidth};
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{ config, ratio: 4, echartsOptions, seriesOptions, seriesColors }}
		/>
	{:else}
		<div
			class="chart"
			style="
			height: {height};
			width: 650px;
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{ config, ratio: 4, echartsOptions, seriesOptions, seriesColors }}
		/>
	{/if}
{/if}
