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
    export let pointSize = undefined;

    export let sort = undefined;

    export let tooltipTitle = undefined;

    let chartType = "Scatter Plot";

    let useTooltip = true;

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
    {title}
    {subtitle}
    {chartType}
    {sort}
    >
    <Scatter
        {shape}
        {fillColor}
        {opacity}
        {outlineColor}
        {outlineWidth}
        {pointSize}
        {useTooltip}
        {tooltipTitle}
    />
</Chart>