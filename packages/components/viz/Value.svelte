<script>
    import getColumnSummary from "../modules/getColumnSummary.js";
    import formatValue from "../modules/formatValue.js";
    import getParsedDate from "../modules/getParsedDate.js";
    import checkInputs from "../modules/checkInputs.js";
    
    // Passing in value from dataset:
    export let data = null
    export let row = 0    
    export let column = null

    // Passing in single value directly:
    export let value = null

    // Overrides for format and units:
    export let fmt = null
    let units = null

    // Placeholder text when data not supplied:
    export let placeholder = null
    let errorColor = 'var(--red-600)';
    if(placeholder){
        errorColor = 'blue';
    } else {
        placeholder = "value";
    }

    let error;
    try {
    if(data) {

        if(isNaN(row)){
            throw Error("row must be a number (row="+row+")")
        }

        try{
            Object.keys(data[row])[0]
        } catch(e) {
            throw Error("Row "+row+" does not exist in the dataset")
        }

        column = column ?? Object.keys(data[row])[0]

        checkInputs(data, [column]);

        let columnSummary = getColumnSummary(data, 'array');
        let dateCols = columnSummary.filter(d => d.type === "date")
        dateCols = dateCols.map(d => d.id);
        if(dateCols.length > 0){
            for(let i = 0; i < dateCols.length; i++){
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
        if(!value){
            throw Error("No value or data provided. If you referenced a query result, check that the name is correct.")
        }
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
    <span class="error" style='color:{errorColor}'>
        [{placeholder}]
        <span class="error-msg">{error}</span>
    </span>
{/if}

<style>
     .error {
        display: inline;
        position: relative;
        cursor: help;
    }

    .error .error-msg {
        visibility: hidden;
        position: absolute;
        top: -5px;
        left: 105%;
        white-space: nowrap;
        padding-left: 5px;
        padding-right: 5px;     
        padding-top: 2px;
        padding-bottom: 1px;   
        color: white;
        font-family: sans-serif;
        font-size: 0.8em;
        background-color: black;
        opacity: 0.85;
        border-radius: 6px;
        z-index: 1;
    }

    .error:hover .error-msg {
        visibility: visible;
    }

</style>