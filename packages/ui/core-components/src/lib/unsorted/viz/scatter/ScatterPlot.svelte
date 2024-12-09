<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../themes/themes.js';

	import Chart from '../core/Chart.svelte';
	import Scatter from './Scatter.svelte';

	const { resolveColor, resolveColorsObject, resolveColorPalette } = getThemeStores();

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let series = undefined;
	export let xType = undefined;
	export let yLog = undefined;
	export let yLogBase = undefined;

	export let yFmt = undefined;
	export let xFmt = undefined;

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
	export let xMin = undefined;
	export let xMax = undefined;
	export let yMin = undefined;
	export let yMax = undefined;

	export let shape = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let opacity = undefined; // opacity of both fill and outline (ECharts limitation)

	export let outlineColor = undefined;
	$: outlineColorStore = resolveColor(outlineColor);

	export let outlineWidth = undefined;
	export let pointSize = undefined;
	export let chartAreaHeight = undefined;

	export let sort = undefined;

	export let tooltipTitle = undefined;

	let chartType = 'Scatter Plot';

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
	$: seriesColorsStore = resolveColorsObject(seriesColors);

	export let seriesOrder = undefined;

	export let connectGroup = undefined;
	/** @type {string | undefined} */
	export let seriesLabelFmt = undefined;
</script>

<Chart
	{data}
	{x}
	{y}
	{xFmt}
	{yFmt}
	{series}
	{tooltipTitle}
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
	{xMin}
	{xMax}
	{yMin}
	{yMax}
	{title}
	{subtitle}
	{chartType}
	{sort}
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
	seriesColors={seriesColorsStore}
>
	<Scatter
		{shape}
		fillColor={fillColorStore}
		{opacity}
		outlineColor={outlineColorStore}
		{outlineWidth}
		{pointSize}
		{useTooltip}
		{seriesOrder}
		{seriesLabelFmt}
	/>
	<slot />
</Chart>
