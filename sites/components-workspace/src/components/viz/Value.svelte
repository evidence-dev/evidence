<script>
    import getColumnSummary from "../modules/getColumnSummary.js";
    import formatValue from "../modules/formatValue.js";
    import getParsedDate from "../modules/getParsedDate.js";
    
    // Passing in value from dataset:
    export let data = null 
    export let row = 0    
    export let column = null

    // Passing in single value directly:
    export let value = null

    // Overrides for format and units:
    export let fmt = null
    let units = null

    let error;
    try {
    if(data) {
        if(!column){
            column = Object.keys(data[row])[0]
        }
        let columnSummary = getColumnSummary(data);

        let dateCols = columnSummary.filter(d => d.type === "date")
        dateCols = dateCols.map(d => d.id);
        if(dateCols.length > 0){
            for(var i = 0; i < dateCols.length; i++){
            data = getParsedDate(data, dateCols[i]);
            }
        }
        value = data[row][column]
        columnSummary = columnSummary.filter(d => d.id === column);

        if(fmt == null){
            fmt = columnSummary[0].format;
        }

        // Units (k, M, B) - not used in <Value> yet:
        // units = columnSummary[0].units;
    } else {
        value = isNaN(value) ? value : Number.parseFloat(value);
        if(fmt == null){
            fmt = (typeof value === "number" ? "num" : "str");
        }
    }
} catch(e) {
    error = e.message;
}
    
</script>

{#if !error}
{formatValue(value, fmt)} 
{:else}
    <div class="error">
        error
        <span class="error-msg">{error}</span>
    </div>
{/if}

<style>
     .error {
        display: inline;
        position: relative;
        color: red;
        cursor: help;
    }

    .error .error-msg {
        visibility: hidden;
        position: absolute;
        top: -5px;
        left: 105%;
        white-space: nowrap;
        padding-left: 4px;
        padding-right: 4px;        
        color: white;
        font-family: sans-serif;
        font-size: 0.8em;
        background-color: black;
        border-radius: 6px;
        z-index: 1;
    }

    .error:hover .error-msg {
        visibility: visible;
    }

</style>