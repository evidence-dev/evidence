<script>
    import getColumnSummary from "$lib/modules/getColumnSummary.js";
    import formatValue from "$lib/modules/formatValue.js";
    import getParsedDate from "$lib/modules/getParsedDate.js";
    import checkInputs from "$lib/modules/checkInputs.js";
    import PulseNumber from "./PulseNumber.svelte";
    
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

    let error;

    try {

        if(!placeholder){
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
            } else if(value) { 
                value = isNaN(value) ? value : Number.parseFloat(value);
                if(fmt == null){
                    fmt = (typeof value === "number" ? "num" : "str");
                }
            } else {
                throw Error("No value or data provided. If you referenced a query result, check that the name is correct.")
            }
        }
} catch(e) {  
    error = e.message;
}

</script>

{#if placeholder}
    <span class="error" style='color:blue'>[{placeholder}]<span class="error-msg">Placeholder: no data currently referenced.</span></span>
{:else if !error}
    <PulseNumber value={formatValue(value, fmt)}/>
{:else}
    <span class="error" style='color:var(--red-600)'>[value]<span class="error-msg">{error}</span></span>
{/if}

<style>
    .error {
       display: inline;
       position: relative;
       cursor: help;
   }

   .error .error-msg {
       visibility: hidden;
       display: none;
       position: absolute;
       top: -5px;
       left: 105%;
       max-width: 400px;
       min-width: 150px;
       padding-left: 5px;
       padding-right: 5px;     
       padding-top: 2px;
       padding-bottom: 1px;   
       color: white;
       font-family: sans-serif;
       font-size: 0.8em;
       background-color: var(--grey-900);
       opacity: 0.85;
       border-radius: 6px;
       z-index: 1;
       word-wrap: break-word;
   }

   .error:hover .error-msg {
       visibility: visible;
       display: inline;
   }

</style>