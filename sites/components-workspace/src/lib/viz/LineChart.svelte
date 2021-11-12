<script>
    import Chart from './Chart.svelte'
    import Line from './Line.svelte'

    export let data;
    export let x;
    export let y;
    export let series;
    export let xType;

    export let title;
    export let subtitle;
    export let legend;
    export let xAxisTitle;
    export let yAxisTitle;
    export let xGridlines;
    export let yGridlines;
    export let yMin;

    export let lineColor;
    export let lineType;
    export let lineOpacity;
    export let lineWidth;

    export let markers;
    export let markerShape;
    export let markerSize;

    if(!series && typeof y !== 'object'){
        legend = legend ?? false
    }

    let chartType = "Line Chart";

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
    {yMin}
    {title}
    {subtitle}
    {chartType}
    >
    <Line
        {lineColor}
        {lineWidth}
        {lineOpacity}
        {lineType}
        {markers}
        {markerShape}
        {markerSize}
    />
</Chart>