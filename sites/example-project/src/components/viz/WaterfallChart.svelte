<script>
	import Chart from './Chart.svelte';
	import Waterfall from './Waterfall.svelte';

	export let data = undefined;
	export let y = undefined;
	export let series = undefined;
	export let xType = undefined;

	export let category = undefined;
	export let x = category;

	export let value = undefined;
	export let total = undefined;

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

	export let sort = undefined;
</script>

<Chart
	{data}
	{x}
	{y}
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
	chartType="Waterfall Chart"
	{sort}
>
	<Waterfall {data} {category} {value} {total} />
</Chart>
