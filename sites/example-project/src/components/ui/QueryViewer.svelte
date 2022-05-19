<script>
  import { slide } from 'svelte/transition';
  import { dev } from '$app/env';
  import DataTable from './QueryViewerSupport/QueryDataTable.svelte'
  import ChevronToggle from "./ChevronToggle.svelte"
  import Prism from "./QueryViewerSupport/Prismjs.svelte";
  import {showQueries} from './stores.js'
  import CompilerToggle from './QueryViewerSupport/CompilerToggle.svelte';
  import { writable } from 'svelte/store';
  import { browser } from '$app/env';

  export let queryID; 
  export let pageQueries
  export let queryResult;

  // Title & Query Toggle
  // Create a copy of the showSQL variable in the local storage, for each query. Access this to determine state of each query dropdown.
  let showSQL = writable(browser && (localStorage.getItem('showSQL_'.concat(queryID))==='true'  || false));
  showSQL.subscribe((value) => browser && (localStorage.setItem('showSQL_'.concat(queryID),(value))));
  
  const toggleSQL = function() {
    $showSQL = !$showSQL
  }

  // Query text & Compiler Toggle 
  let queries = pageQueries.filter(d => d.id === queryID)
  let inputQuery = queries[0].inputQueryString
  let compiledQuery = queries[0].compiledQueryString
  let showCompilerToggle = (queries[0].compiled && queries[0].compileError === undefined)
  let showCompiled = showCompilerToggle
      // Pre-calculate the container height for smooth slide transition 
  let codeContainerHeight =  Math.min(Math.max(compiledQuery.split(/\r\n|\r|\n/).length, inputQuery.split(/\r\n|\r|\n/).length)*1.5 +1, 30)

  // Status Bar & Results Toggle 
  let error = queryResult[0]?.error_object?.error
  let nRecords = null
  let nProperties = null
  // Create a copy of the showResults variable in the local storage, for each query. Access this to determine state of each query dropdown.
  let showResults = writable(browser && (localStorage.getItem('showResults_'.concat(queryID))==='true'  || false));
  showResults.subscribe((value) => browser && (localStorage.setItem('showResults_'.concat(queryID),(value))));
  

  if(!error){
    nRecords = queryResult.length
    if(nRecords > 0){
      nProperties = Object.keys(queryResult[0]).length
    }
  }
  
  const toggleResults = function() {
    if(!error && nRecords > 0){
      $showResults = !$showResults
    }
  }

  
 </script>

 <div> 
 {#if $showQueries}
    <!-- Title -->
    <div class="container" transition:slide|local>
      <div class="container-a">
        <div on:click={toggleSQL} class="title">
          <span><ChevronToggle toggled={$showSQL}/> {queryID}</span>
        </div>
        <!-- Compile Toggle  -->
          {#if $showSQL && showCompilerToggle}
            <CompilerToggle bind:showCompiled = {showCompiled}/>
          {/if }
          <!-- Query Display -->
          {#if $showSQL}
            <div class=code-container transition:slide|local style={`height: ${codeContainerHeight}em;`}>
              {#if showCompiled}
                <Prism language="sql" code={compiledQuery}/>
              {:else}
                <Prism language="sql" code={inputQuery}/>
              {/if}
            </div>  
          {/if}
      </div>
      <!-- Status -->
      <div class = {"status-bar" + (error ? " error": " success") + ($showResults ? " open": " closed")} on:click={toggleResults}>  
        <span> 
          {#if error}
            {#if dev && error.message === "Missing database credentials"}
              {error.message}.
              <a class=credentials-link href='/settings'> Add credentials &rarr;</a>
            {:else}
              {error.message} 
            {/if}
          {:else if nRecords > 0}
            <ChevronToggle toggled={$showResults} color="#3488e9"/> {nRecords.toLocaleString()} {nRecords > 1 ? "records" : "record"} with {nProperties.toLocaleString()} {nProperties > 1 ? "properties" : "property"} 
          {:else}
              ran successfully but no data was returned
          {/if}
        </span>  
      <!-- Results -->
      </div>
        {#if queryResult.length > 0 && !error && $showResults}
            <DataTable data={queryResult} queryID={queryID}/>
            {/if}
    </div>
 {/if}
</div>
 
<style>
    :root {
      --scrollbar-track-color: transparent;
      --scrollbar-color: rgba(0,0,0,.2);
      --scrollbar-active-color: rgba(0,0,0,.4);
      --scrollbar-size: .75rem;
      --scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
    }

    .code-container {
        background-color: var(--grey-100);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        overflow: auto;
        padding: 0 12px 6px 12px; 
        scrollbar-width: thin; 
        scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
    }
    .code-container::-webkit-scrollbar {
      height: var(--scrollbar-size);
      width: var(--scrollbar-size);
    }
    .code-container::-webkit-scrollbar-track {
      background-color: var(--scrollbar-track-color);
    }
    .code-container::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-color);
      border-radius: 7px;
      background-clip: padding-box;
    }
    .code-container::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-active-color);
    }
    .code-container::-webkit-scrollbar-thumb:vertical {
      min-height: var(--scrollbar-minlength);
      border: 3px solid transparent;
    }
    .code-container::-webkit-scrollbar-thumb:horizontal {
      min-width: var(--scrollbar-minlength);
      border: 3px solid transparent;
    }

    .status-bar{
        margin-top: 0px;
        margin-bottom: 0px;
        background-color: var(--grey-100);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        border-bottom: 1px solid var(--grey-200);
        overflow-x: auto;
        scrollbar-width: thin; 
        scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
    }

    .status-bar::-webkit-scrollbar {
      height: var(--scrollbar-size);
      width: var(--scrollbar-size);
    }
    .status-bar::-webkit-scrollbar-track {
      background-color: var(--scrollbar-track-color);
    }
    .status-bar::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-color);
      border-radius: 7px;
      background-clip: padding-box;
    }
    .status-bar::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-active-color);
    }
    .status-bar::-webkit-scrollbar-thumb:vertical {
      min-height: var(--scrollbar-minlength);
      border: 3px solid transparent;
    }
    .status-bar::-webkit-scrollbar-thumb:horizontal {
      min-width: var(--scrollbar-minlength);
      border: 3px solid transparent;
    }
    
    .closed {
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        transition:400ms;
        transition-delay: 400ms; 
        /* 400ms is the default duration for the slide */
    }

    .open {
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
        transition: 400ms;
    }
    
    .status-bar.success{
        color: var(--blue-500);
        cursor: pointer;
    }
    
    .status-bar.error {
        color: var(--red-600);  
    }

    .credentials-link {
      color: var(--blue-500);
      text-decoration: none;
    } 

    .credentials-link:hover {
      color: var(--blue-700);
    }

    div.title {
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        background-color: var(--grey-100);
        border-top: 1px solid var(--grey-200);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        margin-bottom: 0px;
        cursor: pointer;
    }

    span{
        font-family: var(--ui-font-family-compact);
        -webkit-font-smoothing: antialiased;
        font-size: 12px; 
        padding: 0 6px;
        -webkit-user-select: none;
        user-select: none;
        white-space:nowrap;

    }

    div.results {
        padding:0.3em 0.6em;
        margin-top: 0px;
        background-color: white;
    }
    
    .container {
        margin-bottom:1.5em;
        font-size: 0.8em;
        margin-top:0.75em;
    }

    .container-a {
      background-color: var(--grey-100);
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      box-sizing: border-box;
    }
    /* container-a avoids whitespace appearing in the slide transition */

    @media print {
    .container {
      display: none;
    }
  }
</style>