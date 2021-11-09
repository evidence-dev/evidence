<script>
  import { getContext } from "svelte";
  import getColorPalette from "../modules/getColorPalette.js";
  import getDistinctValues from "../modules/getDistinctValues.js";
  const { data, xGet, yGet, xScale, xRange } = getContext("LayerCake");

  // Data:
  export let series = null;
  export let filter = null;

  // Labels:
  export let lineLabel = null; // lineLabel is used to add a custom label to a single line

  // Styling:
  export let lineColor = "#d1d1d1";
  export let lineWidth = 1.5;
  export let lineDashSize = 0;
  export let lineTransparency = 0;
  let lineOpacity = 1 - lineTransparency;

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
  let seriesNames = [];
  if (series !== null) {
    seriesNames = getDistinctValues(finalData, series);
  }

  $: filteredData = (filter) => {
    return finalData.filter((d) => d[series] === filter);
  };

  $: lastRow = (group) => {
    if (filter === null) {
      var filtData = finalData.filter((d) => d[series] === group);
    } else {
      var filtData = finalData;
    }
    var arrayLength = filtData.length;
    var last = filtData[arrayLength - 1];
    return $yGet(last);
  };

  $: firstRow = (group) => {
    if (filter === null) {
      var filtData = finalData.filter((d) => d[series] === group);
    } else {
      var filtData = finalData;
    }
    var arrayLength = filtData.length;
    var last = filtData[0];
    return $yGet(last);
  };

  // Line drawing function - pass dataset into this function to draw a line.
  // Multiple lines use a loop which (1) filters the data using the filteredData() function above
  // and (2) draws a line based on that filtered data using the path() function below:
  $: path = (d) => {
    return (
      "M" +
      d
        .map((d) => {
          return (
            $xGet(d) +
            ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0) +
            "," +
            $yGet(d)
          );
        })
        .join("L")
    );
  };

</script>

{#if series === null || filter !== null}
  <path
    class="path-line"
    d={path(finalData)}
    stroke={lineColor}
    stroke-width={lineWidth}
    stroke-dasharray={lineDashSize}
    stroke-opacity={lineOpacity}
  />
  {#if lineLabel !== null}
    <text
      class="line-labels"
      x={$xRange[1] - ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0) + 5}
      y={lastRow()}
      alignment-baseline="middle"
      fill={lineColor}>{lineLabel}</text
    >
  {/if}
{:else}
  <g class="line-group">
    {#each seriesNames as group, i}
      <path
        class="path-line {group}"
        d={path(filteredData(group))}
        stroke="var({colorPalette[i]})"
        stroke-width={lineWidth}
        stroke-dasharray={lineDashSize}
        stroke-opacity={lineOpacity}
      />
    {/each}
  </g>
{/if}

<style>
  .path-line {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .line-labels {
    font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji",
      "Segoe UI Emoji", "Segoe UI Symbol";
    font-weight: normal;
    font-size: 0.8em;
  }
</style>
