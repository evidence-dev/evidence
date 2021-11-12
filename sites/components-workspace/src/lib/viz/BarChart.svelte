<script>
    import Chart from './Chart.svelte'
    import Bar from './Bar.svelte'

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
    export let horiz;

    export let type; // stacked or grouped

    export let fillColor;
    export let fillOpacity;
    export let outlineColor;
    export let outlineWidth;

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
    >
    <Bar
        {type}
        {fillColor}
        {fillOpacity}
        {outlineColor}
        {outlineWidth}
    />
</Chart>