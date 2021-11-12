<script>
    import Chart from './Chart.svelte'
    import Bubble from './Bubble.svelte'

    export let data;
    export let x;
    export let y;
    export let size;
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
    export let minSize;
    export let maxSize;

    if(!series && typeof y !== 'object'){
        legend = legend ?? false
    }

    let chartType = "Bubble Chart";
    let bubble = true;

</script>

<Chart
    {data}
    {x}
    {y}
    {size}
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
    {bubble}
    >
    <Bubble
        {shape}
        {fillColor}
        {opacity}
        {outlineColor}
        {outlineWidth}
        {minSize}
        {maxSize}
    />
</Chart>