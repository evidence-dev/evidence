<script>
    import echarts from "$lib/modules/echarts";
    import echartsCanvasDownload from "$lib/modules/echartsCanvasDownload";
    import EchartsCopyTarget from "./EchartsCopyTarget.svelte";
    import DownloadData from "../ui/DownloadData.svelte";

    export let config = undefined;    

    export let height = '291px'
    export let width = '100%'

    export let data;

    let downloadChart = false;
    let copying = false

</script>

<svelte:window on:copy={() => {copying = true; setTimeout(() => { copying = false }, 0);}}/>

<div class=chart-container>

<div 
    class="chart" 
    style="
        height: {height};
        width: {width};
        margin-left: 0;
        margin-top: 15px;
        margin-bottom: 10px;
        overflow: visible;
        display: {copying ? 'none' : 'inherit'}
    "
    use:echarts={config}
/>

<EchartsCopyTarget {config} {height} {width} {copying}/> 

{#if data}
<DownloadData text="Download data" {data} class=download-button />
{/if}
<DownloadData text="Save image" class=download-button downloadData={() => {downloadChart = true; setTimeout(() => { downloadChart = false}, 0);}}>
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M20.4 14.5L16 10 4 20"></path></svg>
</DownloadData>

</div>

{#if downloadChart}
<div 
    class="chart" 
    style="
        display: none;
        visibility: visible;
        height: {height};
        width: 666px;
        margin-left: 0;
        margin-top: 15px;
        margin-bottom: 15px;
        overflow: visible;
    "
    use:echartsCanvasDownload={config}
/>
{/if}

<style>
  @media print {
    .chart {
      break-inside: avoid;
    }

    .chart-container {
      padding: 0;
    }
  }
  .chart {
    -moz-user-select: none;  
    -webkit-user-select: none;  
    -ms-user-select: none;  
    -o-user-select: none;  
    user-select: none;
  }

  .chart-container {
    padding-bottom: 15px;
  }

  .chart-container :global(.download-button) {
    visibility: hidden;
  }

  .chart-container:hover :global(.download-button) {
    visibility: visible;
    margin-top: -10px;
    margin-right: 16px;
  }
</style>