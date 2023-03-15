<script> 
    import Value from "$lib/viz/Value.svelte";
    import getColumnSummary from "$lib/modules/getColumnSummary";
    import { LinkedChart } from "svelte-tiny-linked-charts"
    import getSortedData from "$lib/modules/getSortedData";
    import checkInputs from "$lib/modules/checkInputs";
    import ErrorChart from './ErrorChart.svelte';
    import { strictBuild } from './context';
    export let data   
    export let value = null
    export let comparison = null
    export let sparkline = null 

    export let title = null
    export let comparisonTitle = null 

    // Delta controls 
    export let downIsGood = false

    export let maxWidth = "none"
    export let minWidth = "18%"

    let positive = true
    let comparisonColor = "var(--grey-700)"

    let sparklineData = {}  

    let error;

    $: try {
        error = undefined

        if(!value){
            throw new Error("value is required")
        }

        checkInputs(data, [value])

        let columnSummary = getColumnSummary(data, 'array')

        // Fall back titles 
        let valueColumnSummary = columnSummary.find(d => d.id === value)
        title = title ?? (valueColumnSummary ? valueColumnSummary.title : null)

        if(comparison){
            checkInputs(data, [comparison])
            let comparisonColumnSummary = columnSummary.find(d => d.id === comparison)
            comparisonTitle = comparisonTitle ?? (comparisonColumnSummary ? comparisonColumnSummary.title : null)
        }

        
        if(data && comparison) {
            positive = data[0][comparison] >= 0
            comparisonColor = (positive && !downIsGood) || (!positive && downIsGood) ? "var(--green-700)" : "var(--red-700)" 
        }

        // populate sparklineData from data where timeseries is the key and value is the value
        if(data && sparkline && value) {
            // allow to load the LinkedChart
            if(LinkedChart === undefined){
                throw new Error('fail to import <LinkedChart/>')
            }
            let sortedData = getSortedData(data, sparkline, true)
            for(let i = 0; i < sortedData.length; i++) {
                    sparklineData[sortedData[i][sparkline]] = sortedData[i][value]
                }
            }

    } catch(e) {
        error = e
        if (strictBuild){
            throw error
        }
    }

</script>


<div
    class=container 
    style={`
        min-width: ${minWidth};
        max-width: ${maxWidth};
    `}
>
    {#if error}
    <ErrorChart chartType="Big Value" error={error.message}/>
    {:else}
    <p class=title>{title}</p> 
    <div class=value> 
        <Value {data} column={value}/> 
        {#if sparkline}
            <div class=sparkline>
                <svelte:component this={LinkedChart}
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
                tabindex = {-1}
                />
            </div>
        {/if}
    </div> 
    {#if comparison}
        <p class=comparison style={`color:${comparisonColor}`}> 
            {@html positive ? "&#9650;" : "&#9660;"} 
            <Value {data} column={comparison}/>
            <span class="comparison-type">{comparisonTitle}</span>
        </p> 
    {/if}
    {/if}
</div>  

<style>
    :global(.sparkline svg) {
        height: 16px;
    }

    div.sparkline {
        display: inline-block;
    }

    div.value {
        position:relative;
    }

    div.container {
        display: inline-block;
        font-family: var(--ui-font-family);
        padding: .75em .75em .75em 0; 
        margin-right: 0.75em;
        margin-block-end: 1.0em;
        align-items: center;
        user-select: none;
        -webkit-user-select:none ;
        vertical-align:top;
    }
    p {
        margin: 0;
    }

    .title {
        font-size: 0.8em;
        font-weight: 500;
        color: var(--grey-700);
        text-shadow: 1px solid white;
    }

    .value {
        font-size: 1.2em;
        font-weight: 500;
        color: var(--grey-700);
    }

    .comparison {
        font-size: .65em;
        font-weight: 500;
        font-family: var(--ui-compact-font-family);
        font-feature-settings: normal;
    }

    .comparison-type {
        color: var(--grey-700);
        font-weight: normal;
    }

</style> 