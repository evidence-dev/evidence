<script>
    import Chart from './Chart.svelte'
    import Bar from './Bar.svelte'

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
    export let horiz = undefined;

    export let type = undefined; // stacked or grouped

    export let fillColor = undefined;
    export let fillOpacity = undefined;
    export let outlineColor = undefined;
    export let outlineWidth = undefined;

    export let sort = undefined;

    if(!series && typeof y !== 'object'){
        legend = legend ?? false
    }

    let chartType = "Bar Chart";

    // If axes are reversed, bar chart can only have category x-axis (ECharts limitation):
    if(horiz){
        xType = "category"
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
    {yMin}
    {horiz}
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