<script> 
    import Value from "$lib/viz/Value.svelte";
    import getColumnSummary from "$lib/modules/getColumnSummary";
    import { LinkedChart } from "svelte-tiny-linked-charts"
    import getSortedData from "$lib/modules/getSortedData";
    import checkInputs from "./modules/checkInputs";

    // To Do: 

    export let data   
    export let value = null
    export let comparison = null
    export let sparkline = null 

    export let title =  null
    export let comparisonTitle = null 

    // Delta controls 
    export let downIsGood = false
    let positive = true
    let comparisonColor = "var(--grey-700)"

    let sparklineData = {}  

    let error;

    $: try {
        error = undefined
        checkInputs(data)
        // fall back items 
        let columnSummary = getColumnSummary(data, 'array')
        let firstNonDateCol = columnSummary.find(d => d.type !== "date")
        let secondNonDateCol = columnSummary.find(d => d.type !== "date" && d.id !== firstNonDateCol.id) 
        let firstDateCol = columnSummary.find(d => d.type === "date")

        value = value ?? (firstNonDateCol ? firstNonDateCol.id : null)
        comparison = comparison ?? (secondNonDateCol ? secondNonDateCol.id : null)
        sparkline = sparkline ?? (firstDateCol ? firstDateCol.id : null) 

        checkInputs(data, [value, comparison])

        let valueColumnSummary = columnSummary.find(d => d.id === value)
        let comparisonColumnSummary = columnSummary.find(d => d.id === comparison)

        title = title ?? (valueColumnSummary ? valueColumnSummary.title : null)
        comparisonTitle = comparisonTitle ?? (comparisonColumnSummary ? comparisonColumnSummary.title : null)
    
        if(data && comparison) {
            positive = data[0][comparison] >= 0
            comparisonColor = (positive && !downIsGood) || (!positive && downIsGood) ? "var(--green-700)" : "var(--red-700)" 
        }

        // populate sparklineData from data where timeseries is the key and value is the value
        if(data && sparkline && value) {
            let sortedData = getSortedData(data, sparkline, true)
            for(let i = 0; i < sortedData.length; i++) {
                    sparklineData[sortedData[i][sparkline]] = sortedData[i][value]
                }
            }

    } catch(e) {
        error = e
    }

</script>


<div class=container>
    {#if error}
    <div class=error>
        {error.message}
    </div>
    {:else}
    <p class=title>{title}</p> 
    <div class=value> 
        <Value {data} column={value}/> 
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
        font-size: 0.8em;
        padding: .75em .75em .75em 0; 
        margin-right: 0.75em;
        margin-block-end: 1.0em;
        align-items: center;
        user-select: none;
        -webkit-user-select:none ;
        /* box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.10);
        border-radius: 4px; */
        /* border-right: solid 1px var(--grey-200); */
    }

    div.error {
        background-color: var(--red-50);
        border: solid 1px var(--red-100);
        padding: 1em;
        max-width: 8em;
        color: var(--grey-700);
        font-size: 0.75em;
        border-radius: 4px;
    }
    p {
        margin: 0;
    }

    .title {
        font-weight: bold;
        color: var(--grey-700);
        text-shadow: 1px solid white;
    }

    .value{
        font-size: 1.2em;
        font-weight: bold;
        color: var(--grey-700);
    }

    .comparison{
        font-size: .8em;
        font-weight: bold;
        font-family: var(--ui-compact-font-family);
    }

    .comparison-type {
        color: var(--grey-700);
        font-weight: normal;
    }

</style> 