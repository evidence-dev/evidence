<script>
  import getColumnSummary from "$lib/modules/getColumnSummary.js";
  import { formatValue } from "$lib/modules/formatting.js";
  import { convertColumnToDate } from "$lib/modules/dateParsing.js";
  import checkInputs from "$lib/modules/checkInputs.js";
  import PulseNumber from "./PulseNumber.svelte";
  import IoIosHelpCircleOutline from 'svelte-icons/io/IoIosHelpCircleOutline.svelte'
  import { strictBuild } from "./context"

  // Passing in value from dataset:
  export let data = null
  export let row = 0    
  export let column = null

  // Placeholder text when data not supplied:
  export let placeholder = null

  let value 
  let fmt 
  let error;

  let columnSummary
  $: {
      try {
          error = undefined;
          if(!placeholder){
              if(data) {

                  if(typeof data == 'string') {
                      throw Error(`Received: data=${data}, expected: data={${data}}`)
                  }

                  if (!Array.isArray(data)){
                      // Accept bare objects 
                      data = [data]
                  }

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

                  columnSummary = getColumnSummary(data, 'array');
                  let dateCols = columnSummary.filter(d => d.type === "date")
                  dateCols = dateCols.map(d => d.id);
                  if(dateCols.length > 0){
                    for(let i = 0; i < dateCols.length; i++){
                    data = convertColumnToDate(data, dateCols[i]);
                    }
                  }

                  value = data[row][column]
                  columnSummary = columnSummary.filter(d => d.id === column);
                  fmt = columnSummary[0].format;

              } else {
                  throw Error("No data provided. If you referenced a query result, check that the name is correct.")
              }
          }
      } catch(e) {  
          error = e.message;
          if (strictBuild){
            throw error
          }
      }
  }
</script>

{#if placeholder}
  <span class="placeholder">[{placeholder}]<span class="error-msg">Placeholder: no data currently referenced.</span></span>
{:else if !error}
  <PulseNumber value={formatValue(value, fmt)}/>
{:else}
  <span class="error">
      <span class=error-label>Error</span>
      <span class="additional-info-icon">
          <IoIosHelpCircleOutline/>
      </span>
      <span class=error-msg>{error}</span>
  </span>

    
{/if}

<style>
  .error {
     display: inline-grid;
     grid-template-columns: auto auto;
     grid-row: auto;
     column-gap: 3px;
     position: relative;
     cursor: help;
     color: white;
     font-family: sans-serif;
     font-size: 0.75em;
     background-color: var(--red-700);
     border-radius: 20px;
     padding: 0px 6px 0px 6px;
     margin-left: 1px;
     margin-right: 2px;
  }

  .error-label {
      display: inline;
      vertical-align: middle;
      padding-left: 3px;
      margin-top: auto;
  }

  .additional-info-icon {
      display: inline;
      vertical-align: middle;
      width: 14px;
      color: white;
      cursor: help;
      position:relative;
      text-transform: none;
      margin-top: auto;
      line-height: 1.3em;
  }

  .error .error-msg {
     display: none;
     position: absolute;
     top: -5px;
     left: 105%;
     max-width: 400px;
     min-width: 150px;
     padding-left: 10px;
     padding-right: 8px;     
     padding-top: 5px;
     padding-bottom: 5px;   
     color: white;
     font-family: sans-serif;
     font-size: 0.9rem;
     background-color: var(--grey-900);
     opacity: 0.90;
     border-radius: 6px;
     z-index: 1;
  }

  .error:hover .error-msg {
      display: inline;
  }

  .placeholder {
     display: inline;
     position: relative;
     cursor: help;
     color: blue;
 }

 .placeholder .error-msg {
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

 .placeholder:hover .error-msg {
     display: inline;
 }

</style>