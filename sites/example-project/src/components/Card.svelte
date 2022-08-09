<script> 
    import Value from "$lib/viz/Value.svelte";
    import getColumnSummary from "$lib/modules/getColumnSummary";
    import { LinkedChart, LinkedLabel, LinkedValue } from "svelte-tiny-linked-charts"
    import getSortedData from "$lib/modules/getSortedData";

    export let data 
    export let metric 
    export let title 
    export let delta 
    export let deltaTitle 
    export let timeSeries 

    let fallBackTitle 
    let fallBackDeltaTitle 
    let positive = true

    if(data && metric) {
        fallBackTitle = getColumnSummary(data)[metric]["title"]

    }

    if(data && delta) {
        fallBackDeltaTitle = getColumnSummary(data)[delta]["title"]
        positive = data[0][delta] >= 0
    }

    let sparklineData = {}

    // populate sparklineData from data where timeseries is the key and metric is the value
    if(data && timeSeries && metric) {
        let sortedData = getSortedData(data, timeSeries, true)
        for(let i = 0; i < sortedData.length; i++) {
            sparklineData[sortedData[i][timeSeries]] = sortedData[i][metric]
        }
    }

</script>

<div class=container>
    <p class=title>{title ?? fallBackTitle}</p> 
    <div class=metric> 
        <Value {data} column={metric}/> 
        {#if timeSeries}
        <div class=sparkline>
            <LinkedChart 
            data = {sparklineData}
            type = line
            grow = {true}
            barMinWidth = 0
            gap = 0
            fill = var(--grey-300)
            align = left
            hover = {false}
            linked = 'id'
            width = 90
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
<p> </p>

<style>
    :global(.sparkline svg) {
        height: 20px;
    }

    div.sparkline {
        width: 100%;
        height: 100%; 
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
        /* display: inline-block; */
    }

    div.metric {
        position:relative;
    }


    div.container {
        display: inline-block;
        font-family: var(--ui-font-family);
        font-size: 14px;
        padding: .75em .75em .75em 0;; 
        margin-right: 0.75em;
        margin-block-end: 1.5em;
        align-items: center;
        user-select: none;
        -webkit-user-select:none ;
        /* border-right: solid 1px var(--grey-200); */
    }
    p {
        margin: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
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