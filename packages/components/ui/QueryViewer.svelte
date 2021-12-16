<script>
  import { slide } from 'svelte/transition';
  import DataTable from './QueryViewerSupport/QueryDataTable.svelte'
  import ChevronToggle from "./ChevronToggle.svelte"
  import Prism from "./QueryViewerSupport/Prismjs.svelte";
  import {showQueries} from './stores.js'
  import CompilerToggle from './QueryViewerSupport/CompilerToggle.svelte';

  export let queryID; 
  export let pageQueries
  export let queryResult;

  // Title & Query Toggle 
  let showSQL = false
  const toggleSQL = function() {
    showSQL = !showSQL
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
  let error = queryResult.error
  let nRecords = null
  let nProperties = null
  let showResults = false

  if(!error){
    nRecords = queryResult.length
    if(nRecords > 0){
      nProperties = Object.keys(queryResult[0]).length
    }
  }
  
  const toggleResults = function() {
    if(!error && nRecords > 0){
      showResults = !showResults
    }
  }

  
 </script>

 <div> 
 {#if $showQueries}
    <!-- Title -->
    <div class="container" transition:slide|local>
        <div on:click={toggleSQL} class="title">
          <span><ChevronToggle toggled={showSQL}/> {queryID}</span>
        </div>
        <!-- Compile Toggle  -->
          {#if showSQL && showCompilerToggle}
            <CompilerToggle bind:showCompiled = {showCompiled}/>
          {/if }
          <!-- Query Display -->
          {#if showSQL}
            <div class=code-container transition:slide|local style={`height: ${codeContainerHeight}em;`}>
              {#if showCompiled}
                <Prism language="sql" code={compiledQuery}/>
              {:else}
                <Prism language="sql" code={inputQuery}/>
              {/if}
            </div>  
          {/if}
      <!-- Status -->
      <div class = {"status-bar" + (error ? " error": " success") + (showResults ? " open": " closed")} on:click={toggleResults}>  
        <span> 
          {#if error}
            {error.message} 
          {:else if nRecords > 0}
            <ChevronToggle toggled={showResults} color="#3488e9"/> {nRecords.toLocaleString()} {nRecords > 1 ? "records" : "record"} with {nProperties.toLocaleString()} {nProperties > 1 ? "properties" : "property"} 
          {:else}
              ran successfully but no data was returned
          {/if}
        </span>  
      <!-- Results -->
      </div>
        {#if queryResult.length > 0 && !error && showResults}
            <DataTable data={queryResult}/>
        {/if}
    </div>
 {/if}
</div>
 
<style>
    .code-container {
        background-color: var(--grey-100);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        overflow: auto;
        padding: 0 12px 6px 12px; 
    }

    :root {
      --scrollbar-track-color: transparent;
      --scrollbar-color: rgba(0,0,0,.2);
      --scrollbar-active-color: rgba(0,0,0,.4);
      --scrollbar-size: .375rem;
      --scrollbar-active-size: .6rem;
      --scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
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
      border-radius: 3px;
    }
    .code-container::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-active-color);
    }
    .code-container::-webkit-scrollbar-thumb:vertical {
      min-height: var(--scrollbar-minlength);
    }
    .code-container::-webkit-scrollbar-thumb:horizontal {
      min-width: var(--scrollbar-minlength);
    }

    .status-bar{
        margin-top: 0px;
        margin-bottom: 0px;
        background-color: var(--grey-100);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        border-bottom: 1px solid var(--grey-200);
        overflow-x: auto;
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
      border-radius: 3px;
    }
    .status-bar::-webkit-scrollbar-thumb:hover {
      background-color: var(--scrollbar-active-color);
    }
    .status-bar::-webkit-scrollbar-thumb:vertical {
      min-height: var(--scrollbar-minlength);
    }
    .status-bar::-webkit-scrollbar-thumb:horizontal {
      min-width: var(--scrollbar-minlength);
    }
    
    .closed {
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
        transition:400ms;
        transition-delay: 400ms 
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
</style>