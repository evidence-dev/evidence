<script>
    import Chart from './Chart.svelte'
    import Line from './Line.svelte'

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
    export let yMin = undefined;

    export let lineColor = undefined;
    export let lineType = undefined;
    export let lineOpacity = undefined;
    export let lineWidth = undefined;

    export let markers = undefined;
    export let markerShape = undefined;
    export let markerSize = undefined;

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