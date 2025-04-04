<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Chart from '../core/Chart.svelte';
	import Box from './Box.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import { generateBoxPlotData } from '@evidence-dev/component-utilities/generateBoxPlotData';
	import { getThemeStores } from '../../../themes/themes.js';

	const { theme, resolveColor } = getThemeStores();

	export let data = undefined;
	export let name = undefined;
	export let min = undefined;
	export let intervalBottom = undefined;
	export let intervalTop = undefined;
	export let midpoint = undefined;
	export let max = undefined;
	export let confidenceInterval = undefined;

	export let color = undefined;
	$: colorStore = resolveColor(color);

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
	export let swapXY = false;
	export let chartAreaHeight = undefined;

	export let echartsOptions = undefined;
	export let seriesOptions = undefined;
	export let printEchartsConfig = false;
	export let renderer = undefined;
	export let downloadableData = undefined;
	export let downloadableImage = undefined;

	export let connectGroup = undefined;

	export let seriesColors = undefined;

	export let emptySet = undefined;
	export let emptyMessage = undefined;

	export let leftPadding = undefined;
	export let rightPadding = undefined;

	export let xLabelWrap = undefined;

	$: {
		if (swapXY === 'true' || swapXY === true) {
			swapXY = true;
		} else {
			swapXY = false;
		}
	}

	/** @type {{ colors: Readable<string[]> }}*/
	let boxPlotData;
	const updateBoxPlotData = () => {
		boxPlotData = generateBoxPlotData(
			data,
			min,
			intervalBottom,
			midpoint,
			intervalTop,
			max,
			name,
			$colorStore,
			confidenceInterval,
			resolveColor
		);
	};

	updateBoxPlotData();
	$: {
		$theme;
		$colorStore;
		if (data) {
			(async () => {
				if (Query.isQuery(data)) await data.fetch();
				updateBoxPlotData();
			})();
		}
	}
</script>

<Chart
	{data}
	x={name}
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
	{swapXY}
	{title}
	{subtitle}
	chartType="Box Plot"
	{chartAreaHeight}
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
	{leftPadding}
	{rightPadding}
	{xLabelWrap}
>
	<Box {boxPlotData} color={colorStore} {max} />
	<slot />
</Chart>
