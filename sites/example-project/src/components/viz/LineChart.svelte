<script>
	import Chart from './Chart.svelte';
	import Line from './Line.svelte';

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let y2 = undefined;
	export let series = undefined;
	export let xType = undefined;

	export let title = undefined;
	export let subtitle = undefined;
	export let legend = undefined;
	export let xAxisTitle = undefined;
	export let yAxisTitle = undefined;
	export let y2AxisTitle = undefined;

	export let xGridlines = undefined;
	export let yGridlines = undefined;
	export let y2Gridlines = undefined;

	export let xAxisLabels = undefined;
	export let yAxisLabels = undefined;
	export let y2AxisLabels = undefined;

	export let yAxisColor = undefined;
	export let y2AxisColor = undefined;

	export let xBaseline = undefined;
	export let yBaseline = undefined;
	export let y2Baseline = undefined;
	export let xTickMarks = undefined;
	export let yTickMarks = undefined;
	export let y2TickMarks = undefined;

	export let yMin = undefined;
	export let yMax = undefined;
	export let y2Min = undefined;
	export let y2Max = undefined;


	export let lineColor = undefined;
	export let lineType = undefined;
	export let lineOpacity = undefined;
	export let lineWidth = undefined;
	export let chartAreaHeight = undefined;

	export let markers = undefined;
	export let markerShape = undefined;
	export let markerSize = undefined;

	export let handleMissing = undefined;

	export let sort = undefined;

</script>

<Chart
	{data}
	{x}
	{y}
	{y2}
	
	{series}
	{xType}
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

	{yAxisColor}
	{y2AxisColor}

	{xBaseline}
	{yBaseline}
	{y2Baseline}

	{xTickMarks}
	{yTickMarks}
	{y2TickMarks}

	{yMin}
	{yMax}
	{y2Min}
	{y2Max}

	{title}
	{subtitle}
	chartType="Line Chart"
	{sort}
	{chartAreaHeight}
>
	<Line
		{lineColor}
		{lineWidth}
		{lineOpacity}
		{lineType}
		{markers}
		{markerShape}
		{markerSize}
		{handleMissing}
	/>
</Chart>
