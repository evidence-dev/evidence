<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../themes/themes.js';

	import Chart from '../core/Chart.svelte';
	import Line from './Line.svelte';

	const { resolveColor, resolveColorsObject, resolveColorPalette } = getThemeStores();

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let y2 = undefined;
	export let series = undefined;
	export let xType = undefined;
	export let yLog = undefined;
	export let yLogBase = undefined;

	export let y2SeriesType = undefined;

	export let yFmt = undefined;
	export let xFmt = undefined;
	export let y2Fmt = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = undefined;
	export let xAxisTitle = undefined;
	export let yAxisTitle = y2 ? 'true' : undefined;
	export let y2AxisTitle = y2 ? 'true' : undefined;

	export let xGridlines = undefined;
	export let yGridlines = undefined;
	export let y2Gridlines = undefined;

	export let xAxisLabels = undefined;
	export let yAxisLabels = undefined;
	export let y2AxisLabels = undefined;

	export let xBaseline = undefined;
	export let yBaseline = undefined;
	export let y2Baseline = undefined;

	export let xTickMarks = undefined;
	export let yTickMarks = undefined;
	export let y2TickMarks = undefined;

	export let yMin = undefined;
	export let yMax = undefined;
	export let yScale = undefined;

	export let y2Min = undefined;
	export let y2Max = undefined;
	export let y2Scale = undefined;

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let lineType = undefined;
	export let lineOpacity = undefined;
	export let lineWidth = undefined;
	export let chartAreaHeight = undefined;

	export let markers = undefined;
	export let markerShape = undefined;
	export let markerSize = undefined;

	export let handleMissing = undefined;

	export let step = undefined;
	export let stepPosition = undefined;

	export let sort = undefined;

	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let labels = undefined;
	export let labelSize = undefined;
	export let labelPosition = undefined;

	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	export let labelFmt = undefined;
	export let yLabelFmt = undefined;
	export let y2LabelFmt = undefined;
	export let showAllLabels = undefined;

	export let yAxisColor = undefined;
	$: yAxisColorStore = resolveColor(yAxisColor);

	export let y2AxisColor = undefined;
	$: y2AxisColorStore = resolveColor(y2AxisColor);

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
	{y2}
	{xFmt}
	{yFmt}
	{y2Fmt}
	{series}
	{xType}
	{yLog}
	{yLogBase}
	{legend}
	{xAxisTitle}
	{yAxisTitle}
	{y2AxisTitle}
	{xGridlines}
	{yGridlines}
	{y2Gridlines}
	{xAxisLabels}
	{yAxisLabels}
	{y2AxisLabels}
	{xBaseline}
	{yBaseline}
	{y2Baseline}
	{xTickMarks}
	{yTickMarks}
	{y2TickMarks}
	yAxisColor={$yAxisColorStore}
	y2AxisColor={$y2AxisColorStore}
	{yMin}
	{yMax}
	{yScale}
	{y2Min}
	{y2Max}
	{y2Scale}
	{title}
	{subtitle}
	chartType="Line Chart"
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
	<Line
		lineColor={$lineColorStore}
		{lineWidth}
		{lineOpacity}
		{lineType}
		{markers}
		{markerShape}
		{markerSize}
		{handleMissing}
		{step}
		{stepPosition}
		{labels}
		{labelSize}
		{labelPosition}
		labelColor={$labelColorStore}
		{labelFmt}
		{yLabelFmt}
		{y2LabelFmt}
		{showAllLabels}
		{y2SeriesType}
		{seriesOrder}
		{seriesLabelFmt}
	/>
	<slot />
</Chart>
