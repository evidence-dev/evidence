<script>
    import Chart from './Chart.svelte'
    import Bar from './Bar.svelte'
    import getStackPercentages from '$lib/modules/getStackPercentages.js';

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
    if(swapXY === "true" || swapXY === true){
        swapXY = true;
    } else {
        swapXY = false;
    }

    export let type = undefined; // stacked, grouped, or stacked100

    export let fillColor = undefined;
    export let fillOpacity = undefined;
    export let outlineColor = undefined;
    export let outlineWidth = undefined;

    export let sort = undefined;

    let chartType = "Bar Chart";

    if(type === "stacked100"){
        data = getStackPercentages(data, x, y);
        y = y + "_pct"
    }

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
    {chartType}
    {sort}
    >
    <Bar
        {type}
        {fillColor}
        {fillOpacity}
        {outlineColor}
        {outlineWidth}
    />
</Chart>