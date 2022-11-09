<script>
    import {writable} from 'svelte/store'
    import {setContext} from 'svelte'
    import { slide } from 'svelte/transition';
    import { propKey } from './context'
    import getColumnSummary from '$lib/modules/getColumnSummary.js';
    import getParsedDate from '$lib/modules/getParsedDate.js';
    import { formatValue } from '$lib/modules/formatting.js';
    import ErrorChart from './ErrorChart.svelte'
    import SearchBar from './SearchBar.svelte'
    import checkInputs from '$lib/modules/checkInputs.js'
    import { getContext} from 'svelte';
    import { PAGE_QUERY_RESULTS } from '$lib/modules/globalContexts.js';
    import { filter } from '@tidyjs/tidy';
    import Column from './Column.svelte';
    import DownloadData from '$lib/ui/DownloadData.svelte'

    import TiArrowUnsorted from 'svelte-icons/ti/TiArrowUnsorted.svelte'
    import TiArrowSortedUp from 'svelte-icons/ti/TiArrowSortedUp.svelte'
    import TiArrowSortedDown from 'svelte-icons/ti/TiArrowSortedDown.svelte'

    import MdFirstPage from 'svelte-icons/md/MdFirstPage.svelte'
    import MdNavigateBefore from 'svelte-icons/md/MdNavigateBefore.svelte'
    import MdNavigateNext from 'svelte-icons/md/MdNavigateNext.svelte'
    import MdLastPage from 'svelte-icons/md/MdLastPage.svelte'

    import IoIosSearch from 'svelte-icons/io/IoIosSearch.svelte'

    import FaSort from 'svelte-icons/fa/FaSort.svelte'
    import { page } from '$app/stores';

    let props = writable({})
    setContext(propKey, props)

    export let data;
    export let rows = 20; // number of rows to show
    rows = Number.parseInt(rows)

    let paginated = data.length > rows;
    
    export let rowNumbers = false;
    rowNumbers = (rowNumbers === "true" || rowNumbers === true);

    export let hovering = false;

    export let marginTop = '1em';
    export let marginBottom = '0em';
    export let paddingBottom = '1.5em';

    export let search = false;
    search = (search === "true" || search === true);

    export let sortable = true;
    sortable = (sortable === "true" || sortable === true);

    export let downloadable = true;
    downloadable = (downloadable === "true" || downloadable === true);

    // export let queryID;
    // let data = getContext(PAGE_QUERY_RESULTS).getData(queryID);

    // ---------------------------------------------------------------------------------------
    // Add props to store to let child components access them
    // ---------------------------------------------------------------------------------------
    props.update(d => {return {...d, columns: []}});


    // STYLING
    export let rowShading = false;
    rowShading = (rowShading === "true" || rowShading === true);

    export let fontSize = "small" // small, medium, large
    let fontSizeNumeric;
    let cellPadding; // left and right padding only
    switch (fontSize) {
        case "small":
            fontSizeNumeric = '8pt';
            cellPadding = '6px';
            break;
        case "medium":
            fontSizeNumeric = '10pt'
            cellPadding = '10px';
            break;
        case "large":
            fontSizeNumeric = '12pt';
            cellPadding = '12px';
            break;    
    }

    export let fontStyle = "sans-serif" // sans-serif, serif
    if(fontStyle === "serif"){
        fontStyle = "'Spectral', serif"
    }

    export let fontColor = "var(--grey-800)"

    export let borders = true;
    borders = (borders === "true" || borders === true);
    export let borderThickness = "1px"
    export let borderStyle = "solid"
    export let borderColor = "var(--grey-200)";

    borders = borders ? `${borderThickness} ${borderStyle} ${borderColor}` : 'none';
    let borderTop
    let borderBottom = borders ? `${borderThickness} ${borderStyle} ${borderColor}` : 'none';

    export let headerColor;
    export let headerFontColor = "var(--grey-900)";

    let columnSummary;

    export let formatColumnTitles = true;
    formatColumnTitles = (formatColumnTitles === "true" || formatColumnTitles === true);

    export let showColumnTypes = false;
    showColumnTypes = (showColumnTypes === "true" || showColumnTypes === true);

    let queryID;
    let error;

    try {
        // CHECK INPUTS
        if (queryID && data) {
          throw Error('Only one of "queryID" or "data" attributes should be provided');
        } else if (queryID) {
          data = getContext(PAGE_QUERY_RESULTS).getData(queryID);
        }
        checkInputs(data);
        
        // GET COLUMN SUMMARY
        columnSummary = getColumnSummary(data, 'array');

        // PROCESS DATES
        // Filter for columns with type of "date"
        let dateCols = columnSummary.filter(d => d.type === "date")
        dateCols = dateCols.map(d => d.id);

        if(dateCols.length > 0){
            for(let i = 0; i < dateCols.length; i++){
                data = getParsedDate(data, dateCols[i]);
            }
        }

    } catch (e) {
        error = e.message;
    }

    let index = 0



// SEARCH
let searchValue = "";
let filteredData = data;
let thisRow;
let thisValue;
$: runSearch = (searchValue) => {
        if(searchValue !== ""){
            filteredData = [];
            index = 0;
            for(let i=0;i<data.length;i++){
                thisRow = data[i]
                for(let j=0; j<columnSummary.length; j++){
                    thisValue = thisRow[columnSummary[j].id].toLocaleString().toLowerCase();
                    if(thisValue.indexOf(searchValue.toLowerCase()) !=-1){
                        filteredData.push(thisRow)
                        break;
                    }
                }
            }
        } else {
            filteredData = data;
        }
}

    // SORTING

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

 // PAGINATION & DISPLAY

 let totalRows 
 $: totalRows = filteredData.length;

 let displayedData = filteredData

 let pageCount
 let currentPage = 1

 $: currentPage = Math.ceil((index + rows) / rows);
 let max

$: goToPage = (pageNumber) => {
    console.log(currentPage - 1)

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

</script>


{#if !error}

<slot></slot>
<div class="table-container" transition:slide|local style="margin-top:{marginTop}; margin-bottom:{marginBottom}; padding-bottom: {paddingBottom}" on:mouseenter={() => hovering = true} on:mouseleave={() => hovering = false}>

    {#if search}
    <!-- <span class=search-icon><IoIosSearch/></span> -->
    <!-- <input class=search-bar style="font-size: {fontSizeNumeric}" type=text placeholder={searchPlaceholder} bind:value={searchValue} on:keyup={runSearch(searchValue)}/> -->
    <SearchBar bind:value={searchValue} searchFunction={runSearch}/>
    {/if}
<div class=container>
    <table
        style="
            font-size: {fontSizeNumeric};
            font-family: {fontStyle};
            color: {fontColor}
    ">
        <thead>
            <tr>
                {#if rowNumbers}
                <th 
                    class="index" 
                    style="
                        width:2%;
                        border-bottom: {borders};
                        background-color: {headerColor};
                        "></th>
                {/if}
            {#if $props.columns.length > 0}
                {#each $props.columns as column, i}
                    <th
                        class="{columnSummary.filter(d => d.id === column.name)[0].type}"
                        style="
                        text-align: {column.align};
                        color: {headerFontColor};
                        border-bottom: {borders};
                        background-color: {headerColor};
                        padding: 0 {cellPadding} 0 {cellPadding};
                        cursor: {sortable ? 'pointer' : 'auto'};
                        "
                        on:click={sortable ? sort(column.name) : ''}
                    >
                        {column.label ?? formatColumnTitles ? columnSummary.filter(d => d.id === column.name)[0].title : columnSummary.filter(d => d.id === column.name)[0].id}
                        {#if sortBy.col === column.name}
                            <span class=icon-container>
                                {#if sortBy.ascending}
                                    <span class=sort-icon style="height: {fontSizeNumeric}; width: {fontSizeNumeric};">
                                        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="s-zV66bAK704iV"><path d="M18.2 13.3l-6.2-6.3-6.2 6.3c-.2.2-.3.5-.3.7s.1.5.3.7c.2.2.4.3.7.3h11c.3 0 .5-.1.7-.3.2-.2.3-.5.3-.7s-.1-.5-.3-.7z"></path></svg> -->
                                        <TiArrowSortedUp/>
                                    </span>
                                {:else}
                                    <span class=sort-icon style="height: {fontSizeNumeric}; width: {fontSizeNumeric};">
                                        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="s-zV66bAK704iV"><path d="M5.8 9.7l6.2 6.3 6.2-6.3c.2-.2.3-.5.3-.7s-.1-.5-.3-.7c-.2-.2-.4-.3-.7-.3h-11c-.3 0-.5.1-.7.3-.2.2-.3.4-.3.7s.1.5.3.7z"></path></svg> -->
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
                    border-bottom: {borders};
                    background-color: {headerColor};
                    padding: 0 {cellPadding} 0 {cellPadding};
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
                            <span class=sort-icon style="height: {fontSizeNumeric}; width: {fontSizeNumeric};">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="s-zV66bAK704iV"><path d="M18.2 13.3l-6.2-6.3-6.2 6.3c-.2.2-.3.5-.3.7s.1.5.3.7c.2.2.4.3.7.3h11c.3 0 .5-.1.7-.3.2-.2.3-.5.3-.7s-.1-.5-.3-.7z"></path></svg>
                                <!-- <TiArrowSortedUp/> -->
                            </span>
                        {:else}
                            <span class=sort-icon style="height: {fontSizeNumeric}; width: {fontSizeNumeric};">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="s-zV66bAK704iV"><path d="M5.8 9.7l6.2 6.3 6.2-6.3c.2-.2.3-.5.3-.7s-.1-.5-.3-.7c-.2-.2-.4-.3-.7-.3h-11c-.3 0-.5.1-.7.3-.2.2-.3.4-.3.7s.1.5.3.7z"></path></svg>
                                <!-- <TiArrowSortedDown/> -->
                            </span>
                        {/if}
                        </span>
                    {/if}
                </th>
                {/each}
            {/if}
            </tr>
            {#if showColumnTypes}
                {#if $props.columns.length > 0}
                    <tr class=type-indicator>
                        <th class="index type-indicator" style="width:10%"></th>
                        {#each $props.columns as column}
                        <th class="{columnSummary.filter(d => d.id === column.name)[0].type} type-indicator" 
                            evidenceType="{columnSummary.filter(d => d.id === column.name)[0].evidenceColumnType?.evidenceType || 'unavailable'}"
                            evidenceTypeFidelity="{column.evidenceColumnType?.typeFidelity || 'unavailable'}"> {columnSummary.filter(d => d.id === column.name)[0].type} </th>
                        {/each}
                    <tr/>
                {:else}
                    <tr class=type-indicator>
                        <th class="index type-indicator" style="width:10%"></th>
                        {#each columnSummary as column}
                        <th class="{column.type} type-indicator" 
                            evidenceType="{column.evidenceColumnType?.evidenceType || 'unavailable'}"
                            evidenceTypeFidelity="{column.evidenceColumnType?.typeFidelity || 'unavailable'}"> {column.type} </th>
                        {/each}
                    <tr/>
                {/if}
            {/if}
        </thead>

        {#each displayedData as row, i}
        
        <tr class:shaded-row={rowShading && i % 2 === 0}>
            {#if rowNumbers}
            <td 
                class="index" 
                style="
                    width:2%;
                    border-bottom: {borders};
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
                    class="{columnSummary.filter(d => d.id === column.name)[0].type}"
                    style="
                        background-color: {column.color};
                        text-align: {column.align};
                        color: {column.fontColor};
                        border-bottom: {borders};
                        padding: 0 {cellPadding} 0 {cellPadding};
                    ">{formatValue(row[column.name], columnSummary.filter(d => d.id === column.name)[0].format)}</td>
                {/each}
            {:else}
                {#each columnSummary as column, i}
                <td 
                class="{column.type}"
                style="
                    border-bottom: {borders};
                    padding: 0 {cellPadding} 0 {cellPadding};
                ">{formatValue(row[column.id], column.format)}</td>
                {/each}
            {/if}
        </tr>
        {/each}
    </table>
</div>

<!-- {#if paginated && pageCount > 1}
<div class=pagination>
    <div class=page-labels>
    Page {currentPage} of {pageCount} | {index + 1} to {Math.min(index + rows, totalRows)} of {totalRows}
    <button class=page-changer disabled={currentPage === 1} on:click={() => goToPage(currentPage - 2)}>&lsaquo;</button>
    {#each Array(pageCount) as page, i}
        <button class="page-button" class:selected={(i + 1) === currentPage} on:click={() => goToPage(i)}>{i + 1}</button>
    {/each}
    <button class=page-changer disabled={currentPage === pageCount} on:click={() => goToPage(currentPage)}>&rsaquo;</button>
    </div>
</div>
{/if} -->

{#if paginated && pageCount > 1}
<div class=pagination style="text-align: right; margin-right: 5px; margin-top: 5px; margin-bottom: 3px;">
    <div class=page-labels style="font-size: {fontSizeNumeric}">
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

<!-- {#if paginated && pageCount > 1}
<div class=pagination>
    <div class=page-labels>
    <button class=page-changer disabled={currentPage === 1} on:click={() => goToPage(0)}><div class=page-icon><MdFirstPage/></div></button>
    <button class=page-changer disabled={currentPage === 1} on:click={() => goToPage(currentPage - 2)}><div class=page-icon><MdNavigateBefore/></div></button>
    <button class=page-changer disabled={currentPage === pageCount} on:click={() => goToPage(currentPage)}><div class=page-icon><MdNavigateNext/></div></button>
    <button class=page-changer disabled={currentPage === pageCount} on:click={() => goToPage(pageCount - 1)}><div class=page-icon><MdLastPage/></div></button>
    </div>
</div>
{/if} -->

{#if downloadable}
<DownloadData {data} {queryID} onHover={true} {hovering}/>
{/if}
</div>

{:else}
<ErrorChart {error} chartType="Data Table"/>
{/if}

<style>

    .container{
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
        padding: 2px 5px 2px 5px;
        white-space: nowrap;
        overflow: hidden;
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

    svg {
        display: block;
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
        font-size: 9pt;
        height: 20px;
        font-family: sans-serif;
        color: var(--grey-500);
        user-select: none;
    }


    .page-labels {
        display: grid;
        justify-content: center;
        align-content: center;
        gap: 4px;
        grid-auto-flow: column;
    }

    .pages {
    }

    .page-number {
        /* position: absolute; */
        /* top: 50%;
        transform: translateY(-50%);
        -ms-transform: translateY(-50%); */
    }
    .page-button {
        font-size: 9pt;
        font-family: sans-serif;
        color: var(--blue-600);
        background: none;
        border: none;
        cursor: pointer;
    }

    .selected {
        background: var(--grey-200);
        border-radius: 4px;
    }

    .page-changer {
        font-size: 12pt;
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

    .search-bar {
        border: 1px solid var(--grey-200);
        border-radius: 2px;
        font-size: 8pt;
        float: right;
        margin-bottom: 5px;
        padding: 3px 4px 3px 4px;
    }

    .search-icon {
        height: 16px;
        width: 16px;
        color: var(--grey-400);
        float: right;
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


</style>