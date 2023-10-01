<script>
	import Chart from './Chart.svelte';
	import Bar from './Bar.svelte';

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let series = undefined;
	export let xType = undefined;

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
	$: {
		if (swapXY === 'true' || swapXY === true) {
			swapXY = true;
		} else {
			swapXY = false;
		}
	}

	export let type = undefined; // stacked, grouped, or stacked100
	let stacked100 = type === 'stacked100';

	export let fillColor = undefined;
	export let fillOpacity = undefined;
	export let outlineColor = undefined;
	export let outlineWidth = undefined;
	export let chartAreaHeight = undefined;

	export let sort = undefined;

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
	{swapXY}
	{title}
	{subtitle}
	chartType="Bar Chart"
	{sort}
	{stacked100}
	{chartAreaHeight}
	{yAxisColor}
	{y2AxisColor}
>
	<Bar {type} {fillColor} {fillOpacity} {outlineColor} {outlineWidth} />
</Chart>
