<script>
    import echarts from "$lib/modules/echarts";
    import echartsCanvasDownload from "$lib/modules/echartsCanvasDownload";

    export let config = undefined;    
    let downloadConfig = config;
    downloadConfig.animation = false;

    export let height = '291px'
    export let width = '100%'

    let downloadChart = false;

</script>

<div class=other>
<div 
    class="chart" 
    style="
        height: {height};
        width: {width};
        margin-left: 0;
        margin-top: 15px;
        margin-bottom: 10px;
        overflow: visible;
    "
    use:echarts={config}
/>

<span class=download-icon on:click={() => {downloadChart = true; setTimeout(() => { downloadChart = false }, 1000);}}>
  <span>Download</span>
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"></path></svg>
</span>


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
    use:echartsCanvasDownload={downloadConfig}
/>
{/if}

<style>
  @media print {
    .chart {
      break-inside: avoid;
    }
  }
  .chart {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .other {
    padding-bottom: 30px;
  }

  .other:hover .download-icon {
    visibility: visible;
  }


  svg {
      stroke: var(--grey-400);
      margin-top: auto;
      margin-bottom: auto;
  }

  .download-icon {
      visibility: hidden;
      display: grid;
      grid-row: auto;
      grid-template-columns: auto auto;
      gap: 3px;
      float: right;
      /* margin-left: 5px; */
      margin-top: -10px;
      margin-right: 16px;
      cursor: pointer;
      font-family: sans-serif;
      font-size: 0.7rem;
      color: var(--grey-400);
      vertical-align: text-top;
      justify-items: center;
      position:relative;
  }

  .download-icon:hover {
      color: var(--grey-500);
  }
  .download-icon:hover svg {
      stroke: var(--grey-500);
  }

</style>