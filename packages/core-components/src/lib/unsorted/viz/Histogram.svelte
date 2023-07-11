<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Chart from './Chart.svelte';
	import Hist from './Hist.svelte';

	export let data = undefined;
	export let x = undefined;
	export let legend = false;

	export let xFmt;

	export let title = undefined;
	export let subtitle = undefined;
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
	export let yMin = 0;
	export let yMax = undefined;
	export let chartAreaHeight = undefined;

	export let fillColor = undefined;
	export let fillOpacity = undefined;
</script>

<Chart
	{data}
	{x}
	{xFmt}
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
	chartType="Histogram"
	hist="true"
	{chartAreaHeight}
>
	<Hist {fillColor} {fillOpacity} />
	<slot />
</Chart>
