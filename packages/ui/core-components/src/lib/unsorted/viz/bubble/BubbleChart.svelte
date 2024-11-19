<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../themes.js';

	import Chart from '../core/Chart.svelte';
	import Bubble from './Bubble.svelte';

	const { resolveColor, resolveColorPalette } = getThemeStores();

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let size = undefined;
	export let series = undefined;
	export let xType = undefined;
	export let yLog = undefined;
	export let yLogBase = undefined;

	export let yFmt = undefined;
	export let xFmt = undefined;
	export let sizeFmt = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = undefined;
	export let xAxisTitle = 'true';
	export let yAxisTitle = 'true';
	export let xGridlines = undefined;
	export let yGridlines = undefined;
	export let xAxisLabels = undefined;
	export let yAxisLabels = undefined;
	export let xBaseline = undefined;
	export let yBaseline = undefined;
	export let xTickMarks = undefined;
	export let yTickMarks = undefined;
	export let yMin = undefined;
	export let yMax = undefined;

	export let shape = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let opacity = undefined; // opacity of both fill and outline (ECharts limitation)

	export let outlineColor = undefined;
	$: outlineColorStore = resolveColor(outlineColor);

	export let outlineWidth = undefined;
	export let scaleTo = undefined;
	export let chartAreaHeight = undefined;

	export let sort = undefined;

	export let tooltipTitle = undefined;

	let chartType = 'Bubble Chart';
	let bubble = true;

	let useTooltip = true;

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

	export let seriesColors = undefined;
	$: seriesColorsStore = resolveColor(seriesColors);

	export let seriesOrder = undefined;

	export let connectGroup = undefined;
</script>

<Chart
	{data}
	{x}
	{y}
	{size}
	{xFmt}
	{yFmt}
	{sizeFmt}
	{tooltipTitle}
	{series}
	{xType}
	{yLog}
	{yLogBase}
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
	{chartType}
	{bubble}
	{sort}
	{chartAreaHeight}
	colorPalette={$colorPaletteStore}
	{echartsOptions}
	{seriesOptions}
	{printEchartsConfig}
	{emptySet}
	{emptyMessage}
	{renderer}
	{downloadableData}
	{downloadableImage}
	{connectGroup}
	seriesColors={$seriesColorsStore}
>
	<Bubble
		{shape}
		fillColor={$fillColorStore}
		{opacity}
		outlineColor={$outlineColorStore}
		{outlineWidth}
		{scaleTo}
		{useTooltip}
		{seriesOrder}
	/>
	<slot />
</Chart>
