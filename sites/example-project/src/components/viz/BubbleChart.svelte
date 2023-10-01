<script>
	import Chart from './Chart.svelte';
	import Bubble from './Bubble.svelte';

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let size = undefined;
	export let series = undefined;
	export let xType = undefined;

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
	export let opacity = undefined; // opacity of both fill and outline (ECharts limitation)
	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let scaleTo = undefined;
	export let chartAreaHeight = undefined;

	export let sort = undefined;

	export let tooltipTitle = undefined;

	let chartType = 'Bubble Chart';
	let bubble = true;

	let useTooltip = true;

	export let y2 = undefined;
	export let y2AxisTitle = undefined;
	export let y2Gridlines = undefined;
	export let y2AxisLabels = undefined;
	export let y2Baseline = undefined;
	export let y2TickMarks = undefined;
	export let y2Min = undefined;
	export let y2Max = undefined;

	export let yAxisColor = undefined;
	export let y2AxisColor = undefined;

</script>

<Chart
	{data}
	{x}
	{y}
	{y2}
	{y2AxisTitle}
	{y2Gridlines}
	{y2AxisLabels}
	{y2Baseline}
	{y2TickMarks}
	{y2Min}	
	{y2Max}
	{size}
	{tooltipTitle}
	{series}
	{xType}
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
	{yAxisColor}
	{y2AxisColor}
>
	<Bubble {shape} {fillColor} {opacity} {outlineColor} {outlineWidth} {scaleTo} {useTooltip} />
</Chart>
