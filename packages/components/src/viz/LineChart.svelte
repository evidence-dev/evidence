<script>
    import { LayerCake, Svg, Html, Canvas } from 'layercake';
    import {scaleTime, scaleBand, scaleLog, scaleLinear} from 'd3-scale'
    import {tidy, arrange, desc, asc, mutate} from '@tidyjs/tidy'
  
  
  
    import DateAxisX from './DateAxisX.svelte';
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';
    import Line from './Line.svelte';
  
    export let data  
    export let units = ""
    export let x = null
    export let y = null
    
    let xAxisType = typeof data[0][x]

    let xAccessor = d => (d[x])
  
    if (xAxisType === "object") {
      data = tidy(
          data,
          mutate({dateVal: d => d.date.value}),
          arrange(asc('dateVal'))
        )
      xAccessor = d => Date.parse(d.dateVal)
    } 
</script>
  
  
  
  <div class="chart-container" >
    <LayerCake
      padding={{ right: 10, bottom: 20, left: 25 }}
      x={xAccessor}
      y={y}
      yDomain={[0,null]}
      data={data}
      xScale={xAxisType === "object" ? scaleTime(): scaleLinear()}
    >
      <Svg>
        {#if xAxisType === "object"}
        <DateAxisX gridlines={false}/>
        {:else}
        <AxisX gridlines={false}/>
        {/if}
        
        <AxisY ticks={5} units={units}/>
        <Line/>
      </Svg>
    </LayerCake>
  </div>
    
    <style>
      /*
        The wrapper div needs to have an explicit width and height in CSS.
        It can also be a flexbox child or CSS grid element.
        The point being it needs dimensions since the <LayerCake> element will
        expand to fill it.
      */
      .chart-container {
        width: 100%;
        height: 250px;
        margin-bottom: 1.5em;
        margin-top: 1em;
      }
    </style>
    