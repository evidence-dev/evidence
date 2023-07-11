<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Chart from './Chart.svelte';
	import Bar from './Bar.svelte';

	export let data = undefined;
	export let x = undefined;
	export let y = undefined;
	export let series = undefined;
	export let xType = undefined;

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
</script>

<Chart
	{data}
	{x}
	{y}
	{xFmt}
	{yFmt}
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
>
	<Bar {type} {fillColor} {fillOpacity} {outlineColor} {outlineWidth} />
	<slot />
</Chart>
