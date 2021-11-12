<script>
    import Chart from './Chart.svelte'
    import Scatter from './Scatter.svelte'

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

    export let shape;
    export let fillColor;
    export let opacity; // opacity of both fill and outline (ECharts limitation)
    export let outlineColor;
    export let outlineWidth;
    export let pointSize;

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