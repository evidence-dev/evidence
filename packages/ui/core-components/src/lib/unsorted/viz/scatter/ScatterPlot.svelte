<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Chart from '../core/Chart.svelte';
	import Scatter from './Scatter.svelte';

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
	export let opacity = undefined; // opacity of both fill and outline (ECharts limitation)
	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let pointSize = undefined;
	export let chartAreaHeight = undefined;

	export let sort = undefined;

	export let tooltipTitle = undefined;

	let chartType = 'Scatter Plot';

	let useTooltip = true;

	export let colorPalette = undefined;
	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;

	export let emptySet = undefined;
	export let emptyMessage = undefined;

	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;
	export let seriesColors = undefined;
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
	{colorPalette}
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
	<Scatter
		{shape}
		{fillColor}
		{opacity}
		{outlineColor}
		{outlineWidth}
		{pointSize}
		{useTooltip}
		{seriesOrder}
		{seriesLabelFmt}
	/>
	<slot />
</Chart>
