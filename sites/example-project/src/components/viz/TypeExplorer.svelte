<script>
    export let queryID
    export let data 
    import getColumnSummary from '$lib/modules/getColumnSummary.js'
    import checkInputs from '$lib/modules/checkInputs.js'
    import { PAGE_QUERY_RESULTS } from '$lib/modules/globalContexts.js';
    import {getContext} from 'svelte'

    try {
      if (queryID && data) {
        throw Error('Only one of "queryID" or "data" attributes should be provided');
      } else if (queryID) {
        data = getContext(PAGE_QUERY_RESULTS).getData(queryID);
      }
      checkInputs(data);
    } catch (err) {
        throw err;
    }

    let columnSummary = getColumnSummary(data, 'array');

</script> 


<div> 
<table class=component-table>
  <tr>
    <th>ID</th>
    <th>Legacy Type</th>
    <th>Evidence Type</th>
    <th>Min</th>
    <th>Max</th>
  </tr>
{#each columnSummary as column}
<tr>
  <td>{column.id}</td>
  <td>{column.legacyType}</td>
  <td>{column.type}</td>
  <td>{column.extentsLegacy[0]}</td>
  <td>{column.extentsLegacy[1]}</td>
</tr>
{/each}
</table>
{#each columnSummary as column, i}
<div class="json">
  {JSON.stringify(column)}
</div>
{/each}
</div>


<style>
  table {
    width: 100%;
    text-align: right;
    font-family: var(--ui-font-family-compact);
    font-size: 0.6em;
  }

  .json {
    font-family: var(--monospace-font-family);
    font-size: 0.55em; 
    border-radius: 4px;
    border: 1px solid var(--grey-200); 
    background-color: var(--blue-100); 
    margin-top: 1em;
  }
</style>