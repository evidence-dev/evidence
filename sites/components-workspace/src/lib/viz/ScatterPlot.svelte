<script>
    import Chart from './Chart.svelte'
    import Scatter from './Scatter.svelte'

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

    export let shape = undefined;
    export let fillColor = undefined;
    export let opacity = undefined; // opacity of both fill and outline (ECharts limitation)
    export let outlineColor = undefined;
    export let outlineWidth = undefined;
    export let pointSize = undefined;

    if(!series && typeof y !== 'object'){
        legend = legend ?? false
    }

    let chartType = "Scatter Plot";

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
    <Scatter
        {shape}
        {fillColor}
        {opacity}
        {outlineColor}
        {outlineWidth}
        {pointSize}
    />
</Chart>