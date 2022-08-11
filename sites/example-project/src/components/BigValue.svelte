<script> 
    import Value from "$lib/viz/Value.svelte";
    import getColumnSummary from "$lib/modules/getColumnSummary";
    import { LinkedChart } from "svelte-tiny-linked-charts"
    import getSortedData from "$lib/modules/getSortedData";

    export let data 

    let columnSummary = getColumnSummary(data, 'array')

    // fall back items 
    let firstNonDateCol = columnSummary.find(d => d.type !== "date")
    let secondNonDateCol = columnSummary.find(d => d.type !== "date" && d.id !== firstNonDateCol.id) 
    let firstDateCol = columnSummary.find(d => d.type === "date")

    export let metric = firstNonDateCol ? firstNonDateCol.id : null
    export let delta = secondNonDateCol ? secondNonDateCol.id : null
    export let sparkline = firstDateCol ? firstDateCol.id : null 

    export let title 
    export let deltaTitle = delta ? getColumnSummary(data)[delta]["title"] : null 

    let fallBackTitle 
    let fallBackDeltaTitle 
    let positive = true

    if(data && metric) {
        fallBackTitle = getColumnSummary(data)[metric]["title"]
    }

    if(data && delta) {
        positive = data[0][delta] >= 0
    }

    let sparklineData = {}

    // populate sparklineData from data where timeseries is the key and metric is the value
    if(data && sparkline && metric) {
        let sortedData = getSortedData(data, sparkline, true)
        for(let i = 0; i < sortedData.length; i++) {
            sparklineData[sortedData[i][sparkline]] = sortedData[i][metric]
        }
    }

</script>

<div class=container>
    <p class=title>{title ?? fallBackTitle}</p> 
    <div class=metric> 
        <Value {data} column={metric}/> 
        {#if sparkline}
            <div class=sparkline>
                <LinkedChart 
                    data = {sparklineData}
                    type = line
                    grow = {true}
                    barMinWidth = 0
                    gap = 0
                    fill = var(--grey-400)
                    align = left
                    hover = {false}
                    linked = 'id'
                    width = 75
                />
            </div>
        {/if}
    </div> 
 
    {#if delta}
        <p class=delta class:negative="{!positive}"> 
            {@html positive ? "&#9650;" : "&#9660;"} 
            <Value {data} column={delta}/> 
            <span class="delta-type">{deltaTitle ?? fallBackDeltaTitle}</span>
        </p> 
    {/if}
</div>  

<style>
    :global(.sparkline svg) {
        height: 16px;
    }

    div.sparkline {
        display: inline-block;
    }

    div.metric {
        position:relative;
    }


    div.container {
        display: inline-block;
        font-family: var(--ui-font-family);
        font-size: 0.8em;
        padding: .75em .75em .75em 0; 
        margin-right: 0.75em;
        margin-block-end: 1.5em;
        align-items: center;
        user-select: none;
        -webkit-user-select:none ;
        /* box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.10);
        border-radius: 4px; */
        /* border-right: solid 1px var(--grey-200); */
    }
    p {
        margin: 0;
    }

    p.negative {
        color: var(--red-700);
    }

    .title {
        font-weight: bold;
        color: var(--grey-700);
        text-shadow: 1px solid white;
    }

    .metric{
        font-size: 1.2em;
        font-weight: bold;
        color: var(--grey-700);
    }

    .delta{
        font-size: .8em;
        font-weight: bold;
        color: var(--green-700);
        font-family: var(--ui-compact-font-family);
    }

    .delta-type {
        color: var(--grey-700);
        font-weight: normal;
    }

</style> 