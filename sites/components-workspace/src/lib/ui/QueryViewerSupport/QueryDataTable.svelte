<script>
    import {blur, slide, fade } from 'svelte/transition';

    export let data 

    let columns = []
    for (const [key, value] of Object.entries(data[0])) {
        columns.push({
            id: key,
            title: key,
            type: typeof(value)
        })
    }

    // Table input 
    let columnWidths = 90/(columns.length+1);

    // Slicer 
    let index = 0;
    let size = 5;
    let max = Math.max(data.length - size,0);
    let dataPage = data.slice(index, index+size);
    let updatedSlice = ''

    function slice(){
    updatedSlice = data.slice(index, index+size);
    dataPage = updatedSlice
    }

</script>

<div class="container"  transition:slide|local>
  <table >
      <thead>
        <tr>
          <th class="index" style="width:10%"></th>
          {#each columns as column}
              {#if column.type === 'number'}
              <th class="number" style="width:{columnWidths}%"> {column.title} </th>
              {:else}
              <th class="other" style="width:{columnWidths}%"> {column.title} </th>
              {/if}
          {/each}
        <tr/>
      </thead>
          <tbody>
              {#each dataPage as row, i}
                <tr>
                    <td class="index" style="width:10%">
                      {#if i === 0}
                      <!-- <input type="number" bind:value={index} max={max} min=0 on:input={slice} class="index-key" autofocus reversed> -->
                      {(index+i+1).toLocaleString()}
                      {:else}
                      {(index+i+1).toLocaleString()}
                      {/if}
                    </td>
                  {#each Object.values(row) as cell}
                    {#if typeof(cell) === 'number'}
                    <td class="number" style="width:{columnWidths}%" >
                    {cell.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }) || "Ø"}</td>
                    {:else}             
                    <td class="other" style="width:{columnWidths}%">
                      <div >
                          {cell || "Ø"}                       
                      </div>
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
    <span>
    {(index+size).toLocaleString()} of {(max+size).toLocaleString()} 
    </span>
  </div>
  {/if}
</div>   


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
    background: var(--blue-100);
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
    background: var(--blue-500);
    cursor: pointer;
    border-radius:10px;

  }

  .slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    background: var(--blue-500);
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    background: var(--blue-500);
    cursor: pointer;
  }



  span {
    font-family: var(--ui-font-family-compact);
    -webkit-font-smoothing: antialiased;
    font-size: 0.8em;
    float: right;

  }

  .container{
    width:100%;
    overflow-x: scroll;
    border-bottom: 1px solid var(--grey-200);   
  }

  table{
    width:100%;
    font-size: calc(1em - 4px);
    border-collapse: collapse;
    font-family: sans-serif;
  }

  th{
    font-weight: bold;
    /* border-bottom: thin solid lightgray; */
    padding:0px 8px;
  }

  td{
    padding:2px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  td div{
    width: 100px;
    white-space: nowrap;
    overflow: hidden;         
    text-overflow: ellipsis;
  }

  .other{
    text-align: left;
  }

  .number{
    text-align: right;
  }

  .index{
    color:var(--grey-300);
    text-align: left;
    max-width: min-content;
  }

</style>