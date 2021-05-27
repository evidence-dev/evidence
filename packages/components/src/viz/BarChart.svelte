<script>
    import { LayerCake, Svg, Html } from 'layercake';
    import { scaleBand } from 'd3-scale';
  
    import Column from './Column.svelte';
    import AxisX from './AxisX.svelte';
    import AxisY from './AxisY.svelte';

    export let data 

    export let x = 'artist';
    export let y = 'n_objects';
    export let units = ''

    let xDomainVals = []
    for(let value of data){
        xDomainVals.push(value[x])
    }

  </script>
  
  <style>
    /*
      The wrapper div needs to have an explicit width and height in CSS.
      It can also be a flexbox child or CSS grid element.
      The point being it needs dimensions since the <LayerCake> element will
      expand to fill it.
    */
    .chart-container {
      width: 100%;
      height: 175px;
      margin-top:25px;
      font-family: "SF Compact Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    	-webkit-font-smoothing: antialiased;
      font-weight: normal;
    }
  </style>
  
  <div class="chart-container">
    <LayerCake
      padding={{ top: 0, right: 0, bottom: 20, left: 60 }}
      x={x}
      y={y}
      xScale={scaleBand().paddingInner([0.02]).round(true)}
      yDomain={[0, null]}
      xDomain={xDomainVals}
      data={data}
    >
      <Svg>
        <AxisX gridlines={false}/>
        <AxisY
          gridlines={true}
          units = {units}
        />
        <Column/>
      </Svg>

  
    </LayerCake>
  </div>