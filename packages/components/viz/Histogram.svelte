<script>
    import Chart from './Chart.svelte'
    import Hist from './Hist.svelte'

    export let data = undefined;
    export let x = undefined;
    export let legend = false;

    export let title = undefined;
    export let subtitle = undefined;
    export let xAxisTitle = undefined;
    export let yAxisTitle = undefined;
    export let xGridlines = undefined;
    export let yGridlines = undefined;
    export let yMin = 0;

    export let fillColor = undefined;
    export let fillOpacity = undefined;

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
