<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../themes/themes.js';

	import Chart from '../core/Chart.svelte';
	import Hist from './Hist.svelte';

	const { resolveColor, resolveColorPalette } = getThemeStores();

	export let data = undefined;
	export let x = undefined;
	export let legend = false;

	export let xFmt;

	export let title = undefined;
	export let subtitle = undefined;
	export let xAxisTitle = undefined;
	export let yAxisTitle = undefined;
	export let xGridlines = undefined;
	export let yGridlines = undefined;
	export let xAxisLabels = undefined;
	export let yAxisLabels = undefined;
	export let xBaseline = undefined;
	export let yBaseline = undefined;
	export let xTickMarks = undefined;
	export let yTickMarks = undefined;
	export let yMin = 0;
	export let yMax = undefined;
	export let chartAreaHeight = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let fillOpacity = undefined;

	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;

	export let emptySet = undefined;
	export let emptyMessage = undefined;

	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;

	export let connectGroup = undefined;
</script>

<Chart
	{data}
	{x}
	{xFmt}
	{legend}
	{xAxisTitle}
	{yAxisTitle}
	{xGridlines}
	{yGridlines}
	{xAxisLabels}
	{yAxisLabels}
	{xBaseline}
	{yBaseline}
	{xTickMarks}
	{yTickMarks}
	{yMin}
	{yMax}
	{title}
	{subtitle}
	chartType="Histogram"
	hist="true"
	{chartAreaHeight}
	colorPalette={colorPaletteStore}
	{echartsOptions}
	{seriesOptions}
	{printEchartsConfig}
	{emptySet}
	{emptyMessage}
	{renderer}
	{downloadableData}
	{downloadableImage}
	{connectGroup}
>
	<Hist fillColor={fillColorStore} {fillOpacity} />
	<slot />
</Chart>
