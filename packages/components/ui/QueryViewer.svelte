<script>
  import { slide } from 'svelte/transition';
  import DataTable from './QueryDataTable.svelte'
  import ChevronToggle from "./ChevronToggle.svelte"
  import Prism from "./Prismjs.svelte";
  import {showQueries} from './stores.js'

  export let queryID; 
  export let queryString; 
  export let queryResult;
  let title = queryID.replace(/_/g, ' ').replace(/(?: |\b)(\w)/g, function(queryID) { return queryID.toUpperCase()}) 
  let error = queryResult.error
  let nRecords = null
  let nProperties = null
  if(!error){
    nRecords = queryResult.length
    if(nRecords > 0){
      nProperties = Object.keys(queryResult[0]).length
    }
  }

  let showSQL = false
  const toggleSQL = function() {
    showSQL = !showSQL
  }

  let showResults = false

  const toggleResults = function() {
    if(!error && nRecords > 0){
      showResults = !showResults
    }
  }

 </script>

 <div> 
 {#if $showQueries}
    <div class="container" transition:slide|local>
        <div on:click={toggleSQL} class="title">
          <span><ChevronToggle toggled={showSQL}/> {queryID}</span>
        </div>
          {#if showSQL}
              <Prism language="sql" code="{queryString}"/>     
          {/if}
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
      </div>
        {#if queryResult.length > 0 && !error && showResults}
            <DataTable data={queryResult}/>
        {/if}
    </div>
 {/if}
  </div>

 
 
 <style>
 .status-bar{
  margin-top: 0px;
  margin-bottom: 0px;
  background-color: rgb(247, 249, 250);
  border-left: 1px solid rgb(235, 238, 240);
  border-right: 1px solid rgb(235, 238, 240);
  border-bottom: 1px solid rgb(235, 238, 240);
  overflow-x: scroll;

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
  color: #3488e9;
  cursor: pointer;
 }
 
 .status-bar.error {
  color: rgb(245, 78, 78);
 }

 div.title {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  background-color: rgb(247, 249, 250);
  border-top: 1px solid rgb(235, 238, 240);
  border-left: 1px solid rgb(235, 238, 240);
  border-right: 1px solid rgb(235, 238, 240);

  margin-bottom: 0px;
  cursor: pointer;
 }

 span{
  font-family: "SF Compact Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
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