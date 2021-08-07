<script>
  import { getContext, setContext } from "svelte";
  import * as d3 from "d3";
  import getColorPalette from "../modules/getColorPalette.js";
  import getDistinctValues from "../modules/getDistinctValues.js";
  import formatValue from "../modules/formatValue.js"
  const { data, xGet, yGet, xScale, xDomain, yScale, yDomain, y, xRange, width, padding } = getContext("LayerCake");

  // INTRO
  // Columns are created using SVG rectangle elements (<rect>)
  // Rectangles are drawn starting from a single point with coordinates (x,y)
  // and then across to the width of the column and down to the height.
  // Because the coordinates are based on pixels on the page, lower values
  // of y coordinates are actually higher on the page.


  // Data:
  export let series = null;
  export let filter = null;
  let xName = getContext("xName");
  let yName = getContext("yName");
  let xFormat = getContext("xFormat");
  let yFormat = getContext("yFormat");
  let xUnits = getContext("xUnits");
  let yUnits = getContext("yUnits");
  let xExtents = getContext("xExtents");
  let xIntegerRange = getContext("xIntegerRange");
  
  // Histogram-specific:
  export let binMax = null;

  // Sorting:
  export let stackOrder = "true";

  // Styling:
  export let fillColor = "#d1d1d1";
  export let fillTransparency = 0;
  let fillOpacity = 1 - fillTransparency;
  export let outlineColor = "#545454";
  export let outlineWidth = 0;

  // let xDistinctCount = getContext("xDistinctCount");
  if(xIntegerRange == null){
    xIntegerRange = $xDomain[1] - $xDomain[0];
  }

    // 3 TYPES OF COLUMN CHARTS:
      // (1) CATEGORICAL - scaledBand from d3 is used here. Can check through isBandwidth
      // (2) HISTOGRAM - binMin and binMax are used here. Can check through binMax ?
      // (3) NUMBER / DATE / CONTINUOUS - xIntegerRange is used here

    $: isBandwidth = typeof $xScale.bandwidth === 'function';
    $: isHist = binMax != null;

// ---------------------------------------------------------------------------------------
// Column Width
// ---------------------------------------------------------------------------------------
  // Calculated Column Width: use bandwidth if available, 
  // otherwise if binMax is provided (meaning it's a histogram), take the distance between the binMin and binMax,
  // otherwise use the width of the chart area divided by the number of bars (integer range or # of rows in dataset) 
  const maxColumnWidth = 50;

  $: calcColumnWidth = (d) => {
    let chartWidth = $width - $padding.left - $padding.right;
    let columnWidth = $xScale.bandwidth ? $xScale.bandwidth() 
          : isHist ? $xScale(d.binMax) - $xScale(d[xName])
          : chartWidth / (xIntegerRange ? xIntegerRange : $data.length)
    return columnWidth;
  };

  // Chart Column Width is the actual width to be used - it doesn't allow the calculated
  // column width to go above the max column width
  $: chartColumnWidth = (d) => {
    // subtract min column padding of 1px.
    // maxColumnWidth does not apply to histograms
    if(!isHist){
      return Math.min(calcColumnWidth(d), maxColumnWidth);
    } else {
      return Math.max(calcColumnWidth(d) - 1, 0);
    }
  }

// ---------------------------------------------------------------------------------------
// Column Height
// ---------------------------------------------------------------------------------------
  // == Positive Columns ==
  // The height should start at the first coordinate ($yGet(d)) and
  // extend to the bottom of the chart. There are 3 scenarios for the
  // bottom of the chart and each has a preferred behaviour for the column:
  // (1) bottom of chart = 0 | column should extend to 0
  // (2) bottom of chart > 0 | column should extend to the min Y domain value
  // (3) bottom of chart < 0 | column should extend to 0
  // The logic in the function below ensures that positive bars will stop at
  // 0 if the chart extends into negative values.

  // == Negative Columns ==
  // Height should start at 0 and extend to (1) the negative value of the column
  // or (2) the bottom of the chart as defined by the yDomain (whichever value is
  // higher should be where it stops so as not to overflow the chart area)
  $: columnHeight = (d) => {
    if ($y(d) >= 0) {
      return Math.abs($yScale(Math.max(0, $yDomain[0])) - $yGet(d));
    } else {
      return Math.abs($yScale(Math.max($yDomain[0], $y(d))) - $yScale(0));
    }
  };

// ---------------------------------------------------------------------------------------
// Stacked Column Logic
// ---------------------------------------------------------------------------------------

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
  let seriesNames = [];
  if (series !== null) {
    seriesNames = getDistinctValues(finalData, series);
  }

  var keys = Array.from(d3.group(finalData, (d) => d[series]).keys());
  var values = Array.from(
    d3.rollup(
      finalData,
      ([d]) => d[yName],
      (d) => d[xName],
      (d) => d[series]
    )
  );

  // Stack order:
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

    // Stacked data splits the dataset by group and generates a list of coordinates for each rectangle to be drawn:
    // Example:
    // key: A, values: [[0,10],[0,40],[0,50]]
    // key: B, values: [[10, 30], [40, 50], [50, 80]]
    // The first group starts at 0, the second group starts where the first one ended, and so on.
    // The chart draws bars from the top down and from left to right, but this stacked dataset calculates everything
    // from 0 up.

    let flatData = [];
    for(var i = 0; i < seriesData.length; i++){
      for(var j = 0; j < seriesData[i].length; j++){
        flatData.push({
          "series": seriesData[i].key,
          "y0": seriesData[i][j][0],
          "y1": seriesData[i][j][1],
          "x": seriesData[i][j].data[0]
        })
      }
    }
    $: filteredData = (filter) => {
      return flatData.filter((d) => d.series === filter); 
    };

  // In the graphics logic for the stacked column below, there is a 1 pixel adjustment to
  // both the initial y coordinate and the column height. This is to avoid a rendering issue
  // where a miniscule gap can appear between the stacks of the column (especially when
  // scrolling)

</script>

{#if series === null}
  <g class="column-group">
    {#each finalData as d, i}
      <rect
        class="group-rect {calcColumnWidth(d)}"
        data-id={i}
        x={isBandwidth ? $xGet(d) + calcColumnWidth(d)/2 - chartColumnWidth(d)/2 : isHist ? $xGet(d) : ($xGet(d) - chartColumnWidth(d)/2)}
        y={$yScale(Math.max(0, $y(d)))}
        height={columnHeight(d)}
        width={chartColumnWidth(d)}
        fill='{fillColor}'
        fill-opacity='{fillOpacity}'
        stroke='{outlineColor}'
        stroke-width={outlineWidth}
        ><title
          >{binMax
            ? "(" +
              d[xName].toFixed(1) +
              " to " +
              d.binMax.toFixed(1) +
              "): " +
              formatValue(d[yName],yFormat,yUnits)
            : formatValue(d[xName],xFormat,xUnits) + ": " + formatValue(d[yName],yFormat,yUnits)}</title
        ></rect
      >
    {/each}
  </g>
{:else}
  <g class="column-group">
    {#each seriesNames as group, i}
      {#each filteredData(group) as d, j}
        <rect
          class="group-rect {group} {i}"
          data-id={j}
          x={isBandwidth ? $xScale(seriesData[i][j].data[0]) + calcColumnWidth(d)/2 - chartColumnWidth(d)/2 : isHist ? $xScale(seriesData[i][j].data[0]) : ($xScale(seriesData[i][j].data[0]) - chartColumnWidth(d)/2)}
          y={$yScale(seriesData[i][j][1]) + (seriesData[i][j][1] === 0 ? 0 : -1)}
          height={Math.abs($yScale(seriesData[i][j][0]) - $yScale(seriesData[i][j][1])) + (seriesData[i][j][1] > 0 ? 1 : 1)}
          width={chartColumnWidth(d)}
          fill="var({colorPalette[i]})"
          fill-opacity='{fillOpacity}'
          stroke={outlineColor}
          stroke-width={outlineWidth}
          ><title>{group + ": " + formatValue(d.y0 >= 0 ? (d.y1 - d.y0) : (d.y0 - d.y1),yFormat,yUnits)}</title></rect
        >
      {/each}
    {/each}
  </g>
{/if}

<style>
  .line-labels {
    font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol";
    font-weight: normal;
    font-size: 0.725em;
  }
</style>


