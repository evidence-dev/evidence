<script>
  import {writable} from 'svelte/store'
  import {setContext} from 'svelte'
  import { slide } from 'svelte/transition';
  import { propKey } from './context'
  import getColumnSummary from '$lib/modules/getColumnSummary.js';
  import { convertColumnToDate } from "$lib/modules/dateParsing.js";
  import { formatValue } from '$lib/modules/formatting.js';
  import ErrorChart from './ErrorChart.svelte'
  import SearchBar from './SearchBar.svelte'
  import checkInputs from '$lib/modules/checkInputs.js'
  import DownloadData from '$lib/ui/DownloadData.svelte'

  import TiArrowSortedUp from 'svelte-icons/ti/TiArrowSortedUp.svelte'
  import TiArrowSortedDown from 'svelte-icons/ti/TiArrowSortedDown.svelte'

  import MdFirstPage from 'svelte-icons/md/MdFirstPage.svelte'
  import MdNavigateBefore from 'svelte-icons/md/MdNavigateBefore.svelte'
  import MdNavigateNext from 'svelte-icons/md/MdNavigateNext.svelte'
  import MdLastPage from 'svelte-icons/md/MdLastPage.svelte'

  // Set up props store
  let props = writable({})
  setContext(propKey, props)

  // Data, pagination, and row index numbers
  export let data;
  export let rows = 10; // number of rows to show
  rows = Number.parseInt(rows)

  let paginated = data.length > rows;
  
  export let rowNumbers = false;
  rowNumbers = (rowNumbers === "true" || rowNumbers === true);

  let hovering = false;

  let marginTop = '1.5em';
  let marginBottom = '1em';
  let paddingBottom = '1.5em';

  // Table features
  export let search = false;
  search = (search === "true" || search === true);

  export let sortable = true;
  sortable = (sortable === "true" || sortable === true);

  export let downloadable = true;
  downloadable = (downloadable === "true" || downloadable === true);

  let error = undefined;

  // ---------------------------------------------------------------------------------------
  // Add props to store to let child components access them
  // ---------------------------------------------------------------------------------------
  props.update(d => {return {...d, data, columns: []}});


  // ---------------------------------------------------------------------------------------
  // STYLING
  // ---------------------------------------------------------------------------------------
  export let rowShading = false;
  rowShading = (rowShading === "true" || rowShading === true);

  export let rowLines = true;
  rowLines = (rowLines === "true" || rowLines === true);

  export let headerColor;
  export let headerFontColor = "var(--grey-900)";

  export let formatColumnTitles = true;
  formatColumnTitles = (formatColumnTitles === "true" || formatColumnTitles === true);

  // ---------------------------------------------------------------------------------------
  // DATA SETUP
  // ---------------------------------------------------------------------------------------

  let columnSummary;

  $: try {
      // CHECK INPUTS
      checkInputs(data);
      
      // GET COLUMN SUMMARY
      columnSummary = getColumnSummary(data, 'array');

      // PROCESS DATES
      // Filter for columns with type of "date"
      let dateCols = columnSummary.filter(d => d.type === "date")
      dateCols = dateCols.map(d => d.id);

      if(dateCols.length > 0){
          for(let i = 0; i < dateCols.length; i++){
              data = convertColumnToDate(data, dateCols[i]);
          }
      }

  } catch (e) {
      error = e.message;
  }
  
      
  let index = 0



  // ---------------------------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------------------------
  let searchValue = "";
  let filteredData 
  $: filteredData = data;
  let thisRow;
  let thisValue;
  let showNoResults = false;
  $: runSearch = (searchValue) => {
          if(searchValue !== ""){
              filteredData = [];
              index = 0;
              for(let i=0;i<data.length;i++){
                  thisRow = data[i]
                  for(let j=0; j<columnSummary.length; j++){
                      if(columnSummary[j].type === "date"){
                          thisValue = thisRow[columnSummary[j].id].toISOString()
                      } else {
                          thisValue = thisRow[columnSummary[j].id].toString().toLowerCase();
                      }
                      if(thisValue.indexOf(searchValue.toLowerCase()) !=-1 && thisValue != null){
                          filteredData.push(thisRow)
                          break;
                      } 
                  }
              }
              showNoResults = filteredData.length === 0
          } else {
              filteredData = data;
              showNoResults = false;
          }
  }


  // ---------------------------------------------------------------------------------------
  // SORTING
  // ---------------------------------------------------------------------------------------

  let sortBy = {col: null, ascending: null};

  $: sort = (column) => {

      if (sortBy.col == column) {
          sortBy.ascending = !sortBy.ascending
      } else {
          sortBy.col = column
          sortBy.ascending = true
      }
      
      // Modifier to sorting function for ascending or descending
      let sortModifier = (sortBy.ascending) ? 1 : -1;
      
      let sort = (a, b) => 
          (a[column] < b[column]) 
          ? -1 * sortModifier 
          : (a[column] > b[column]) 
          ? 1 * sortModifier 
          : 0;
      
      data.sort(sort)
      filteredData = filteredData.sort(sort);
  }

  // Reset sort condition when data object is changed
  $: data, sortBy = {col: null, ascending: null};

  // ---------------------------------------------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------------------------------------------

  let totalRows 
  $: totalRows = filteredData.length;

  let displayedData = filteredData

  let pageCount
  let currentPage = 1

  $: currentPage = Math.ceil((index + rows) / rows);
  let max

  $: goToPage = (pageNumber) => {
          index = (pageNumber * rows);
          max = index + rows;
          currentPage = Math.ceil(max / rows);
          totalRows = filteredData.length;
          displayedData = filteredData.slice(index, index+rows);
      }

  $: if(paginated){
          pageCount = Math.ceil(filteredData.length / rows);
          displayedData = filteredData.slice(index, index+rows);
      } else {
          currentPage = 1;
          displayedData = filteredData;
      }

  // ---------------------------------------------------------------------------------------
  // DATA FOR EXPORT
  // ---------------------------------------------------------------------------------------

  function dataSubset(data, selectedCols){
      return data.map(obj=>{
          var toReturn={} //object that would give each desired key for each part in arr
          selectedCols.forEach(key=>toReturn[key]=obj[key]) //placing wanted keys in toReturn
          return toReturn
      })
  }

  let tableData
  $: tableData = $props.columns.length > 0 ? dataSubset(data, $props.columns.map(d => d.id)) : data;

</script>

{#if $props.error}
<ErrorChart/>
{/if}

{#if !error}

<slot></slot>
<div class="table-container" transition:slide|local style="margin-top:{marginTop}; margin-bottom:{marginBottom}; padding-bottom: {paddingBottom}" on:mouseenter={() => hovering = true} on:mouseleave={() => hovering = false}>
  {#if search}
      <SearchBar bind:value={searchValue} searchFunction={runSearch}/>
  {/if}
<div class=container>
  <table>
      <thead>
          <tr>
              {#if rowNumbers}
              <th 
                  class="index" 
                  style="
                      width:2%;
                      background-color: {headerColor};
                      "></th>
              {/if}
          {#if $props.columns.length > 0}
              {#each $props.columns as column, i}
                  <th
                      class="{columnSummary.filter(d => d.id === column.id)[0].type}"
                      style="
                      text-align: {column.align};
                      color: {headerFontColor};
                      background-color: {headerColor};
                      cursor: {sortable ? 'pointer' : 'auto'};
                      "
                      on:click={sortable ? sort(column.id) : ''}
                  >
                      {column.title ? column.title : formatColumnTitles ? columnSummary.filter(d => d.id === column.id)[0].title : columnSummary.filter(d => d.id === column.id)[0].id}
                      {#if sortBy.col === column.id}
                          <span class=icon-container>
                              {#if sortBy.ascending}
                                  <span class=sort-icon>
                                      <TiArrowSortedUp/>
                                  </span>
                              {:else}
                                  <span class=sort-icon>
                                      <TiArrowSortedDown/>
                                  </span>
                              {/if}
                          </span>
                      {/if}
                  </th>
              {/each}
          {:else}
              {#each columnSummary as column, i}
              <th
                  class="{column.type}"
                  style="
                  color: {headerFontColor};
                  background-color: {headerColor};
                  cursor: {sortable ? 'pointer' : 'auto'};
                  "
                  on:click={sortable ? sort(column.id) : ''}
                  >
                  <span class=col-header>
                  {formatColumnTitles ? column.title : column.id}
                  </span>
                  {#if sortBy.col === column.id}
                      <span class=icon-container>
                      {#if sortBy.ascending}
                          <span class=sort-icon>
                              <TiArrowSortedUp/>
                          </span>
                      {:else}
                          <span class=sort-icon>
                              <TiArrowSortedDown/>
                          </span>
                      {/if}
                      </span>
                  {/if}
              </th>
              {/each}
          {/if}
          </tr>
      </thead>

      {#each displayedData as row, i}
      
      <tr class:shaded-row={rowShading && i % 2 === 0}>
          {#if rowNumbers}
          <td 
              class="index" 
              class:row-lines={rowLines}
              style="
                  width:2%;
              ">
          {#if i === 0}
          {(index+i+1).toLocaleString()}
          {:else}
          {(index+i+1).toLocaleString()}
          {/if}
          </td>
          {/if}
          
          {#if $props.columns.length > 0}
              {#each $props.columns as column, i}
                  <td 
                  class="{columnSummary.filter(d => d.id === column.id)[0].type}"
                  class:row-lines={rowLines}
                  style="
                        text-align: {column.align};
                        height: {column.height};
                        width: {column.width};
                  ">
                  {#if column.img}
                  <img 
                  src={row[column.img]} 
                  alt={row[column.id]} 
                  style="
                      margin: 0.5em auto 0.5em auto;
                      height: {column.height};
                      width: {column.width};
                      "
                  />
                  {:else}
                  {formatValue(row[column.id], columnSummary.filter(d => d.id === column.id)[0].format)}
                  {/if}
                  </td>
              {/each}
          {:else}
              {#each columnSummary as column, i}
              <td 
              class="{column.type}"
              class:row-lines={rowLines}
              >{formatValue(row[column.id], column.format)}</td>
              {/each}
          {/if}
      </tr>
      {/each}
  </table>
</div>

{#if paginated && pageCount > 1}
<div class=pagination>
  <div class=page-labels>
      <button class=page-changer disabled={currentPage === 1} on:click={() => goToPage(0)}><div class=page-icon >
          <MdFirstPage/>
      </div></button>
      <button class=page-changer disabled={currentPage === 1} on:click={() => goToPage(currentPage - 2)}><div class=page-icon >
          <MdNavigateBefore/>
      </div></button>
      <span>Page {currentPage} / {pageCount}</span>
      <button class=page-changer disabled={currentPage === pageCount} on:click={() => goToPage(currentPage)}><div class=page-icon >
          <MdNavigateNext/>
      </div></button>
      <button class=page-changer disabled={currentPage === pageCount} on:click={() => goToPage(pageCount - 1)}><div class=page-icon >
          <MdLastPage/>
      </div></button>
  </div>
</div>
{/if}

<div class=noresults class:shownoresults={showNoResults}>No Results</div>

{#if downloadable}
  <DownloadData class=download-button data={tableData}/>
{/if}

</div>

{:else}
  <ErrorChart {error} chartType="Data Table"/>
{/if}

<style>

  .table-container {
      font-size: 9.5pt;
      width: 97%;
  }

  .container {
      width:100%;
      overflow-x: auto;
      /* border-bottom: 1px solid var(--grey-200);    */
      scrollbar-width: thin; 
      scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
      background-color: white;
  }

  :root {
    --scrollbar-track-color: transparent;
    --scrollbar-color: rgba(0,0,0,.2);
    --scrollbar-active-color: rgba(0,0,0,.4);
    --scrollbar-size: .75rem;
    --scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
}

  .container::-webkit-scrollbar {
    height: var(--scrollbar-size);
    width: var(--scrollbar-size);
  }
  .container::-webkit-scrollbar-track {
    background-color: var(--scrollbar-track-color);
  }
  .container::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-color);
    border-radius: 7px;
    background-clip: padding-box;
  }
  .container::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-active-color);
  }
  .container::-webkit-scrollbar-thumb:vertical {
    min-height: var(--scrollbar-minlength);
    border: 3px solid transparent;
  }
  .container::-webkit-scrollbar-thumb:horizontal {
    min-width: var(--scrollbar-minlength);
    border: 3px solid transparent;
  }

  table {
      display: table;
      font-family: sans-serif;
      width: 100%;
      border-collapse: collapse;
      font-variant-numeric: tabular-nums;
  }

  th, td {
      padding: 2px 8px;
      white-space: nowrap;
      overflow: hidden;
  }

  th {
      border-bottom: thin solid var(--grey-600);
  }

  .row-lines {
      border-bottom: thin solid var(--grey-200);
  }

  .shaded-row {
      background-color: var(--grey-100);
  }

  .string {
      text-align: left;
  }

  .date {
      text-align: left;
  }

  .number {
      text-align: right;
  }

  .boolean{
      text-align: left; 
  }

  .sort-icon {
      width: 12px;
      height: 12px;
      vertical-align: middle;
  }

  .icon-container {
      display: inline-flex;
      align-items: center;
  }

  .page-changer {
      padding: 0;
      vertical-align: middle;
      height: 1.1em;
      width: 1.1em;
  }

  .index{
      color:var(--grey-300);
      text-align: left;
      max-width: min-content;
  }

  .pagination {
      font-size: 10pt;
      height: 5px;
      font-family: sans-serif;
      color: var(--grey-500);
      user-select: none;
      text-align: right; 
      margin-right: 5px; 
      margin-top: 8px; 
      margin-bottom: 3px;
  }


  .page-labels {
      display: grid;
      justify-content: center;
      align-content: center;
      gap: 4px;
      grid-auto-flow: column;
  }

  .selected {
      background: var(--grey-200);
      border-radius: 4px;
  }

  .page-changer {
      font-size: 15pt;
      font-family: sans-serif;
      color: var(--blue-600);
      background: none;
      border: none;
      cursor: pointer;
  }

  .page-changer:disabled {
      cursor: auto;
      color: var(--grey-300);
      user-select: none;
  }

  .page-icon {
      height: 1em;
      width: 1em;
  }

  button:enabled > .page-icon:hover {
      color: var(--blue-800);
  }

  *:focus {
      outline: none;
  }

  ::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: var(--grey-400);
      opacity: 1; /* Firefox */
  }

  :-ms-input-placeholder { /* Internet Explorer 10-11 */
      color: var(--grey-400);
  }

  ::-ms-input-placeholder { /* Microsoft Edge */
      color: var(--grey-400);
  }

  th {
      user-select: none;
  }

  th.type-indicator {
  color:var(--grey-400);
  font-weight:normal;
  font-style: italic;
}

.noresults {
  display: none;
  color: var(--grey-400);
  font-family: sans-serif;
  text-align: center;
  margin-top: 5px;
}

.shownoresults {
  display: block;
}

.table-container :global(.download-button) {
    visibility: hidden;
}

.table-container:hover :global(.download-button) {
  visibility: visible;
  margin-top: 8px;
}

@media print {
  .avoidbreaks {
    break-inside: avoid;
  }

  .pagination {
    break-inside: avoid;
  }

}

</style>