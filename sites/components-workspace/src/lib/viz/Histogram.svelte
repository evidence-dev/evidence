<script>
    import Chart from './Chart.svelte'
    import Hist from './Hist.svelte'

    export let data;
    export let x;
    export let legend = false;

    export let title;
    export let subtitle;
    export let xAxisTitle;
    export let yAxisTitle;
    export let xGridlines;
    export let yGridlines;
    export let yMin = 0;

    export let fillColor;
    export let fillOpacity;

    let chartType = "Histogram";
    let hist = true;

</script>

<Chart 
    {data} 
    {x} 
    {legend}
    {xAxisTitle}
    {yAxisTitle}
    {xGridlines}
    {yGridlines}
    {yMin}
    {title}
    {subtitle}
    {chartType}
    {hist}
    >
        <Hist
            {fillColor}
            {fillOpacity}                
        />
</Chart>
