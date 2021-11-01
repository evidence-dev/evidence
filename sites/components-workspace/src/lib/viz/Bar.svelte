<script>
  // Bandwidth means width of bars/columns (bar height in this case, column width in column chart)
  import { getContext } from "svelte";
  import * as d3 from "d3";
  import getColorPalette from "../modules/getColorPalette.js";
  import getDistinctValues from "../modules/getDistinctValues.js";
  import formatValue from "../modules/formatValue.js"
  const { data, xGet, yGet, xScale, yScale, x, height, yDomain } = getContext("LayerCake");

  // Get Data:
  let xName = getContext("xName");
  let yName = getContext("yName");
  let xFormat = getContext("xFormat");
  let xUnits = getContext("xUnits");
  let yIntegerRange = getContext("yIntegerRange");
  export let series = null;
  export let filter = null;

  // Styling:
  export let fillColor = "#d1d1d1";
  export let fillTransparency = 0;
  let fillOpacity = 1 - fillTransparency;
  export let outlineColor = "#d1d1d1";
  export let outlineWidth = 0;

  // Sorting:
  export let stackOrder = "true";

  // Bar Height:
  const maxBarHeight = 50;

  $: calcBarHeight = (d) => {
    let chartHeight = $height;
    let barHeight = $yScale.bandwidth ? $yScale.bandwidth() 
        : chartHeight / (yIntegerRange ? yIntegerRange : $data.length);
    return barHeight;
  };

  $: chartBarHeight = (d) => {
    return Math.min(calcBarHeight(d), maxBarHeight);
  }

  if(yIntegerRange == null){
    yIntegerRange = $yDomain[1] - $yDomain[0];
  }

  // MULTI-SERIES LOGIC:

  //Filter dataset if filter value supplied in chart call:
  let finalData = [];
  if (series !== null && filter !== null) {
    finalData = $data.filter((d) => d[series] === filter);
  } else {
    finalData = $data;
  }

  // Get array of global color variables (set in app.css):
  let colorPalette = getColorPalette();

  // Get distinct series names if series column supplied in chart call:
  export let seriesNames = [];

  var keys = Array.from(d3.group(finalData, (d) => d[series]).keys());
  var values = Array.from(
    d3.rollup(
      finalData,
      ([d]) => d[xName],
      (d) => d[yName],
      (d) => d[series]
    )
  );

  // Stack Order:
  
    // D3 stack order options:
      // d3.stackOrderNone
      // d3.stackOrderAscending
      // d3.stackOrderDescending
      // d3.stackOrderAppearance
      // d3.stackOrderInsideOut
      // d3.stackOrderReverse
    
  var order = d3.stackOrderDescending;
  if(stackOrder==="false"){ 
    order = d3.stackOrderNone; 
  }

  var seriesData = d3
    .stack()
    .keys(keys)
    .value(([, values], key) => values.get(key))
    .order(order)
    .offset(d3.stackOffsetDiverging)(values);

  // In the graphics logic for the stacked column below, there is a 1 pixel adjustment to
  // both the initial y coordinate and the column height. This is to avoid a rendering issue
  // where a miniscule gap can appear between the stacks of the column (especially when
  // scrolling)

  $: isBandwidth = typeof $yScale.bandwidth === 'function';

  let flatData = [];
  for(let i = 0; i < seriesData.length; i++){
    for(let j = 0; j < seriesData[i].length; j++){
        flatData.push({
          "series": seriesData[i].key,
          "x0": seriesData[i][j][0],
          "x1": seriesData[i][j][1],
          "y": seriesData[i][j].data[0]
        })
    }
  }
  
  $: filteredData = (filter) => {
      return flatData.filter((d) => d.series === filter);
  };

</script>

{#if series === null}
  <g class="bar-group">
    {#each finalData as d, i}    
      <rect
        class="group-rect"
        data-id={i}
        x={Math.max($xScale.range()[0], $xScale(Math.min(0, $x(d)))) + ($x(d) > 0 ? 0.4 : 0)}
        y={isBandwidth ? $yGet(d) + calcBarHeight(d)/2 - chartBarHeight(d)/2 : $yGet(d) - chartBarHeight(d)/2}
        height={chartBarHeight(d)}
        width={Math.abs(
          Math.max($xGet(d), 0) - Math.max($xScale.range()[0], $xScale(0))
        )+($x(d) > 0 ? 0 : -0.6)}
        fill='{fillColor}'
        fill-opacity='{fillOpacity}'
        stroke='{outlineColor}'
        stroke-width={outlineWidth}
        ><title>{formatValue(d[xName],xFormat, xUnits)}</title></rect
      >
    {/each}
  </g>
{:else}
  <g class="bar-group">
    {#each seriesNames as group, i}
      {#each filteredData(group) as d, j}
        <rect
          class="group-rect {group} {i}"
          data-id={j}
          x={$xScale(seriesData[i][j][0]) + (seriesData[i][j][0] < 0 ? -1 : 0) + (seriesData[i][j][0] === 0 ? 0.4 : 0)}
          y={$yScale(seriesData[i][j].data[0]) + calcBarHeight(d)/2 - chartBarHeight(d)/2}
          height={chartBarHeight(d)}
          width={$xScale(seriesData[i][j][1]) - $xScale(seriesData[i][j][0]) + 1 + (seriesData[i][j][1] === 0 ? -0.5 : 0)}
          fill="var({colorPalette[i]})"
          fill-opacity='{fillOpacity}'
          stroke='{outlineColor}'
          stroke-width={outlineWidth}
          ><title>{group + ": " + formatValue(seriesData[i][j][0] >= 0 ? (seriesData[i][j][1] - seriesData[i][j][0]) : (seriesData[i][j][0] - seriesData[i][j][1]), xFormat, xUnits)}</title></rect
        >
      {/each}
    {/each}
  </g>
{/if}
