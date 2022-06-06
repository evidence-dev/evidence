<script>
    import eChartsCopy from "$lib/modules/echartsCopy.js";
    
    export let downloadConfig = undefined;    
    export let height = '291px'
    export let width = '100%'

    downloadConfig.animation = false

    let copying = false 
</script>

<svelte:window on:copy={() => {copying = true; setTimeout(() => { copying = false }, 0);}}/>

{#if copying}
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
      use:eChartsCopy={downloadConfig}
    />
{/if}
