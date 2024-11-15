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

	// TODO how to use ThemeStores.resolve* here?
	export let seriesColors = undefined;
	export let isMap = false;
	export let extraHeight = undefined;

	// Grid Context:
	let inGrid = false;
	let gridCols;
	let gapWidth;

	// Attempt to get the grid context
	const gridConfig = getContext('gridConfig');

	if (gridConfig) {
		inGrid = true;
		({ cols: gridCols, gapWidth } = gridConfig);
	}

	// Browsers have different widths, so we need to set print width at the smallest level we expect to see across browsers to
	// avoid overlap. This is 650px for portrait and 841px for landscape (assuming an 8.5x11 page)
	$: portraitCols = Math.min(Number(gridCols), 2);
	$: portraitWidth = (650 - Number(gapWidth) * (portraitCols - 1)) / portraitCols;
	$: landscapeCols = Math.min(Number(gridCols), 3);
	$: landscapeWidth = (841 - Number(gapWidth) * (landscapeCols - 1)) / landscapeCols;
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
			width: {portraitWidth}px;
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{
				config,
				ratio: 4,
				echartsOptions,
				seriesOptions,
				seriesColors,
				isMap,
				extraHeight,
				width: portraitWidth
			}}
		/>
		<div
			class="chart hidden md:block"
			style="
			height: {height};
			width: {landscapeWidth}px;
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{
				config,
				ratio: 4,
				echartsOptions,
				seriesOptions,
				seriesColors,
				isMap,
				extraHeight,
				width: landscapeWidth
			}}
		/>
	{:else}
		<div
			class="chart md:hidden"
			style="
			height: {height};
			width: 650px;
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{
				config,
				ratio: 4,
				echartsOptions,
				seriesOptions,
				seriesColors,
				isMap,
				extraHeight,
				width: 650
			}}
		/>

		<div
			class="chart hidden md:block"
			style="
			height: {height};
			width: 841px;
			margin-left: 0;
			margin-top: 15px;
			margin-bottom: 10px;
			overflow: visible;
			break-inside: avoid;
		"
			use:eChartsCopy={{
				config,
				ratio: 4,
				echartsOptions,
				seriesOptions,
				seriesColors,
				isMap,
				extraHeight,
				width: 841
			}}
		/>
	{/if}
{/if}
