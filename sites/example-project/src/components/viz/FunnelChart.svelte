<script>
    import Chart from './Chart.svelte'
    import Funnel from "./Funnel.svelte"

    export let data = undefined;
    export let nameCol = undefined;
    export let valueCol = undefined;

    export let title = undefined;
    export let subtitle = undefined;
    export let legend = undefined;

    export let outlineColor = undefined;
    export let outlineWidth = undefined;
    export let labelPosition = undefined;
    export let funnelAlign = undefined;
    export let funnelSort = undefined;

    let areaHeight = 450;
</script>

<Chart
    funnel
    {areaHeight}
    {data}
    {nameCol}
    {valueCol}
    {legend}
    {title}
    {subtitle}
    chartType="Funnel Chart"
    >
    <Funnel
        {outlineColor}
        {outlineWidth}
        {labelPosition}
        {funnelAlign}
        {funnelSort}
    />
</Chart>