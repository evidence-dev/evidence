<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getThemeStores } from '../../../themes/themes.js';

	import Chart from '../core/Chart.svelte';
	import Radar from './Radar.svelte';
	import { toBoolean } from '$lib/utils.js';

	const { resolveColor, resolveColorsObject, resolveColorPalette } = getThemeStores();

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let series = undefined;

	export let yFmt = undefined;
	export let xFmt = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = undefined;
	export let chartAreaHeight = undefined;

	export let fillColor = undefined;
	$: fillColorStore = resolveColor(fillColor);

	export let fillOpacity = undefined;

	export let lineColor = undefined;
	$: lineColorStore = resolveColor(lineColor);

	export let lineWidth = undefined;

	export let markers = undefined;
	export let markerShape = undefined;
	export let markerSize = undefined;

	export let labels = undefined;
	export let labelSize = undefined;
	export let labelPosition = undefined;

	export let labelColor = undefined;
	$: labelColorStore = resolveColor(labelColor);

	export let labelFmt = undefined;
	export let showAllLabels = undefined;

	export let colorPalette = 'default';
	$: colorPaletteStore = resolveColorPalette(colorPalette);

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	/** @type {Boolean} */
	export let printEchartsConfig = false;
	$: printEchartsConfig = toBoolean(printEchartsConfig);

	export let emptySet = undefined;
	export let emptyMessage = undefined;

	export let renderer = undefined;
	/** @type {Boolean | undefined} */
	export let downloadableData = undefined;
	$: downloadableData = toBoolean(downloadableData);
	/** @type {Boolean | undefined} */
	export let downloadableImage = undefined;
	$: downloadableImage = toBoolean(downloadableImage);

	export let seriesColors = undefined;
	$: seriesColorsStore = resolveColorsObject(seriesColors);

	export let seriesOrder = undefined;

	export let connectGroup = undefined;

	export let shape = undefined;
	export let max = undefined;
</script>

<Chart
	{data}
	{x}
	{y}
	{xFmt}
	{yFmt}
	{series}
	{legend}
	{title}
	{subtitle}
	chartType="Radar Chart"
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
	<Radar
		fillColor={fillColorStore}
		lineColor={lineColorStore}
		{fillOpacity}
		{lineWidth}
		{markers}
		{markerShape}
		{markerSize}
		{labels}
		{labelSize}
		{labelPosition}
		labelColor={labelColorStore}
		{labelFmt}
		{showAllLabels}
		{seriesOrder}
		{shape}
		{max}
	/>
	<slot />
</Chart>
