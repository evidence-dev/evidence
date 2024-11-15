<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../themes.js';

	import Chart from '../core/Chart.svelte';
	import Area from './Area.svelte';

	const { resolveColor, resolveColorPalette } = getThemeStores();

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
	export let yMin = undefined;
	export let yMax = undefined;
	export let yScale = undefined;

	export let line = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let fillOpacity = undefined;
	export let chartAreaHeight = undefined;

	export let markers = undefined;
	export let markerShape = undefined;
	export let markerSize = undefined;

	export let handleMissing = undefined;

	export let step = undefined;
	export let stepPosition = undefined;

	export let sort = undefined;

	export let type = 'stacked'; // stacked or stacked100
	let stacked100 = type === 'stacked100';

	let chartType = 'Area Chart';

	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let labels = undefined;
	export let labelSize = undefined;
	export let labelPosition = undefined;

	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	export let labelFmt = undefined;
	export let showAllLabels = undefined;

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;

	export let emptySet = undefined;
	export let emptyMessage = undefined;

	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;

	// TODO how to use ThemeStores.resolve* here?
	export let seriesColors = undefined;
	export let seriesOrder = undefined;

	export let connectGroup = undefined;
</script>

<Chart
	{data}
	{x}
	{y}
	{xFmt}
	{yFmt}
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
	{yScale}
	{title}
	{subtitle}
	{chartType}
	{sort}
	stackType={type}
	{stacked100}
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
	{seriesColors}
>
	<Area
		{line}
		fillColor={$fillColorStore}
		lineColor={$lineColorStore}
		{fillOpacity}
		{handleMissing}
		{type}
		{step}
		{stepPosition}
		{markers}
		{markerShape}
		{markerSize}
		{labels}
		{labelSize}
		{labelPosition}
		labelColor={$labelColorStore}
		{labelFmt}
		{showAllLabels}
		{seriesOrder}
	/>
	<slot />
</Chart>
