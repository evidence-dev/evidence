<script>
    import { getContext} from 'svelte';
    import { slide } from 'svelte/transition';
    import formatValue from '$lib/modules/formatValue.js';
    import ErrorChart from './ErrorChart.svelte'
    import checkInputs from '$lib/modules/checkInputs.js'
    import getColumnSummary from '$lib/modules/getColumnSummary.js';
    import getParsedDate from '$lib/modules/getParsedDate.js';
    import DownloadData from '$lib/ui/DownloadData.svelte'

    // 1 - Get Inputs
    export let data = undefined;
    export let queryID = undefined;
    export let rows = 5;
    export let marginTop = '1em';
    export let marginBottom = '0em';
    export let paddingBottom = '1.5em';
    export let rowNumbers = 'true';
    export let rowLines = 'true';

    export let hovering = false;
 
    let columnWidths;
    let index;
    let size;
    let max;
    let dataPage;
    let updatedSlice;

    let columnSummary;
    let error;

    function slice(){
      updatedSlice = data.slice(index, index+size);
      dataPage = updatedSlice;
    }

    try{
      // 2 - Check Inputs
      try {
        if (queryID && data) {
          throw Error('Only one of "queryID" or "data" attributes should be provided');
        } else if (queryID) {
          data = getContext('pageQueryResults').getData(queryID);
        }
        checkInputs(data);
      } catch (err) {
          throw err;
      }

      // 3 - Get Column Summary
      columnSummary = getColumnSummary(data, 'array');

      // 4 - Process Data
      // Filter for columns with type of "date"
      let dateCols = columnSummary.filter(d => d.type === "date")
      dateCols = dateCols.map(d => d.id);

      if(dateCols.length > 0){
        for(let i = 0; i < dateCols.length; i++){
          data = getParsedDate(data, dateCols[i]);
        }
      }

      // Table input:
      columnWidths = 98/(columnSummary.length+1)

      // Slicer:
      index = 0;
      size = Number.parseInt(rows);
      max = Math.max(data.length - size,0);
      dataPage = data.slice(index, index+size);
      updatedSlice = '';

    } catch(e) {
        error = e.message;
    }

</script>

{#if !error}
<div class="table-container" class:avoidbreaks={rows <= 20} transition:slide|local style="margin-top:{marginTop}; margin-bottom:{marginBottom}; padding-bottom: {paddingBottom}" on:mouseenter={() => hovering = true} on:mouseleave={() => hovering = false}>
<div class="container">
  <table>
      <thead>
        <tr>
          {#if rowNumbers === 'true'}
              <th class="index" style="width:2%"></th>
          {/if}
          {#each columnSummary as column}
              <th class="{column.type}" style="width:{columnWidths}%" 
                  evidenceType="{column.evidenceColumnType?.evidenceType || 'unavailable'}"
                  evidenceTypeFidelity="{column.evidenceColumnType?.typeFidelity || 'unavailable'}"> {column.title} </th>
          {/each}
        <tr/>
      </thead>
          <tbody>
              {#each dataPage as row, i}
                <tr class="data" style="{rowLines === "false" || i === dataPage.length-1 ? '' : 'border-bottom: thin solid rgb(231, 231, 231);'}">
                  {#if rowNumbers === 'true'}
                    <td class="index" style="width:2%">
                      {#if i === 0}
                      {(index+i+1).toLocaleString()}
                      {:else}
                      {(index+i+1).toLocaleString()}
                      {/if}
                    </td>
                  {/if}
                  {#each Object.values(row) as cell, j}
                    {#if cell == null}
                      <td class="null {columnSummary[j].type}" style="width:{columnWidths}%">
                          {"Ø"}                       
                      </td>
                    {:else if columnSummary[j].type === 'number'}
                      <td class="number" style="width:{columnWidths}%;">
                         {formatValue(cell, columnSummary[j].format, columnSummary[j].units)}
                      </td>
                    {:else if columnSummary[j].type === 'date'}
                    <td class="string" style="width:{columnWidths}%" title={formatValue(cell, columnSummary[j].format)}>
                      <div >
                          {formatValue(cell, columnSummary[j].format)}                       
                      </div>
                    </td>
                    {:else if columnSummary[j].type === 'string'}
                      <td class="string" style="width:{columnWidths}%" title={cell}>
                        <div >
                            {cell || "Ø"}                       
                        </div>
                      </td>
                    {:else}
                      <td class="other" style="width:{columnWidths}%">
                            {cell || "Ø"}                       
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
  </table> 
  {#if max > 0}
  <div class="pagination">
    <input type="range" max={max} step=1 bind:value={index} on:input={slice} class="slider">
    <span class="page-labels">
    {(index+size).toLocaleString()} of {(max+size).toLocaleString()} 
    </span>
  </div>
  {/if}
</div>   
<DownloadData {data} {queryID} onHover={true} {hovering}/>

</div>
{:else}
<ErrorChart {error} chartType="Data Table"/>
{/if}


<style>


  div.pagination {
    padding: 0px 5px;
    align-content: center;
    border-top: 1px solid rgb(235, 238, 240);
    height: 1.5em;
  }

  .slider {
    -webkit-appearance: none;
    width: 75%;
    height: 10px;
    margin:0 0;
    background: #dfeffe;
    outline: none;
    opacity: 0.7;
    -webkit-transition: .2s;
    transition: opacity .2s;
    border-radius:10px;
    display:inline-block;
    cursor:pointer;
  }

  .slider:hover {
    opacity: 1;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    background: #3488e9;
    cursor: pointer;
    border-radius:10px;

  }

  .slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    background: #3488e9;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    background: #3488e9;
    cursor: pointer;
  }

  .page-labels {
    line-height: 2em;
  }

  span {
    font-family: var(--ui-font-family-compact);
    -webkit-font-smoothing: antialiased;
    font-size: 0.8em;
    float: right;
    color: grey;
  }

  .container{
    width:100%;
    overflow-x: auto;
    overflow-y: hidden;
    border-bottom: 2px solid rgb(235, 238, 240); 
  }

  table{
    width:100%;
    font-size: calc(0.75em - 0px);
    border-collapse: collapse;
    font-family: sans-serif;
  }

  th{
    max-width: 1px;
    font-weight: 600;
    border-bottom: 1px solid rgb(110, 110, 110);
    padding:0px 8px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  td{
    max-width: 1px;
    padding: 4px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  td div{
    white-space: nowrap;
    overflow: hidden;         
    text-overflow: ellipsis;
  }

  .string{
    text-align: left;
  }

  .other{
    text-align: right;
  }

  .date, .object{
    text-align: left;
  }

  .number{
    text-align: right;
  }

  .null{
    color: var(--grey-300);
  }

  .index{
    color:var(--grey-300);
    text-align: left;
    max-width: min-content;
  }

  tr:hover {
    background-color: rgb(247, 249, 250);
  } 

  /* CSS below shows full text on hover if a cell has been cut off*/
  /* td > div:hover {
    overflow: visible;
    white-space: unset;
    text-overflow: none;
  } */

  @media print {
    .avoidbreaks {
      break-inside: avoid;
    }

    .pagination {
      break-inside: avoid;
    }

   .slider {
      display: none;
    }

  }

</style>
