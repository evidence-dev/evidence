<script>
    import Chart from './Chart.svelte'
    import Area from './Area.svelte'

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

    export let line = undefined;
    export let fillColor = undefined;
    export let fillOpacity = undefined;

    if(!series && typeof y !== 'object'){
        legend = legend ?? false
    }

    let chartType = "Area Chart";

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
    <Area
        {line}
        {fillColor}
        {fillOpacity}
     />
</Chart>