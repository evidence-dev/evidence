<script>
	import { getContext } from 'svelte';
  import formatAxisLabel from '../modules/formatAxisLabel.js'
	const { width, height, xScale, xDomain, yRange, padding, yDomain} = getContext('LayerCake');
  
  // "ticks" is the number of ticks to add to the x axis
  // by default, d3 uses 10 ticks unless overridden
  // number of ticks inputted does not perfectly equate to the number that appear on the chart
  // d3 uses rounding to determine the right level of ticks to display, so
  // you need to pass a threshold to see more or less, and that threshold depends on 
  // the number of x observations in your data

  // Data:
  let xDistinctCount = getContext('xDistinctCount');
  let xIntegerRange = $xDomain[1] - $xDomain[0] + 1;
  let xFormat = getContext("xFormat");
  let xUnits = getContext("xUnits");

  // Tick Variables:
  // export let formatTick = d => formatAxisLabel(d, xFormat);
  export let snapTicks = false;
	export let ticks = Math.min(8, Math.max(xIntegerRange,xDistinctCount));
	export let xTick = undefined;
	export let yTick = 16;
	export let dxTick = 0;
	export let dyTick = 0;

  // Reverse Axes:
  let reverseAxes = getContext("reverseAxes");

  // Gridlines:
	export let gridlines = "false";
	export let gridlineColor = '#ededed';
  export let gridlineDashSize = 0;

  // Axis Line:
	export let baseline = false;
  export let baselineColor = '#9c9c9c';

  // Axis Title:
  export let axisTitle = '';

  // Tickmarks:
  export let tickMarks = undefined;
  export let tickMarkColor = null;

  // Axis Tick Labels:
  export let labels = 'true';
  export let labelColor = 'rgb(141, 141, 141)';
  export let labelSize = '0.725em';
  export let labelPosition = 'default';
  export let axisPosition = "bottom";

  // Ticks Setup:
	$: isBandwidth = typeof $xScale.bandwidth === 'function';
  
	$: tickVals = Array.isArray(ticks) ? ticks 
    : isBandwidth ? $xScale.domain() 
    : typeof ticks === 'function' ? ticks($xScale.ticks()) 
    : $xScale.ticks(ticks);

    // xScale.ticks() uses this d3 code: https://github.com/d3/d3-scale/blob/main/src/time.js
  
	function textAnchor(i) {
	  if (snapTicks === true) {
		if (i === 0) {
		  return 'start';
		}
		if (i === tickVals.length - 1) {
		  return 'end';
		}
	  }
	  return 'middle';
	}

</script>

<g class='axis x-axis {$xDomain}'>
	{#each tickVals as tick, i}
	  <g class='tick tick-{ tick }' transform='translate({$xScale(tick)},{$yRange[0]})'>

      {#if gridlines === "true" || (reverseAxes && gridlines === "false" && tick === 0)}
		  <line 
            y1='{($height * -1) - 4}' 
            y2='0' 
            x1='0' 
            x2='0'
            stroke='{gridlineColor}'
            stroke-dasharray='{gridlineDashSize}'
          ></line>
		{/if}

    {#if tickMarks === 'true'}
    <line 
      class="tick-mark" 
      y1='{axisPosition === "top" ? -$yRange[0] : 0}' 
      y2='{axisPosition === "top" ? -$yRange[0]-4 : 4}' 
      x1='{xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0}' 
      x2='{xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0}'
      stroke='{tickMarkColor ? tickMarkColor 
        : Number.parseInt($yDomain[0]) === 0 || baseline === 'true' ? baselineColor 
        : gridlineColor}'
      stroke-width='{1}'
      ></line>
    {/if}

    {#if labels === 'true'}
     {#if labelPosition === 'rotated'}
        <text
        x="{xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0 }"
        y='{yTick}'
        dx='-0.5em'
        dy='0'
        text-anchor='end'
        fill='{labelColor}'
        font-size='{labelSize}'
        transform='rotate(-45)'
        >
        {#if i + 1 === tickVals.length}
          {formatAxisLabel(tick, xFormat, xUnits, "firstTick") + (reverseAxes ? " " + axisTitle : "")}
        {:else}
          {formatAxisLabel(tick, xFormat, xUnits)}
        {/if}
        </text>

      {:else}
        <text
          x="{xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0 }"
          y='{axisPosition === "top" ? -$yRange[0] - 8 : yTick}'
          dx='{dxTick}'
          dy='{dyTick}'
          text-anchor='{textAnchor(i)}'
          fill='{labelColor}'
          font-size='{labelSize}'
          >
          {#if i + 1 === tickVals.length}
          {formatAxisLabel(tick, xFormat, xUnits, "firstTick") + (reverseAxes ? " " + axisTitle : "")}
          {:else}
          {formatAxisLabel(tick, xFormat, xUnits)}
          {/if}
        </text>
      {/if}
    {/if}

	  </g>
	{/each}

	{#if baseline === 'true'}
	  <line 
        class="baseline" 
        y1='{axisPosition === "top" ? -1: $height + 0.5}' 
        y2='{axisPosition === "top" ? -1 : $height + 0.5}' 
        x1='{-$padding.left}' 
        x2='{$width + $padding.right}'
        stroke='{baselineColor}'
        stroke-dasharray='0'
        stroke-width='1'
      ></line>
	{/if}

  {#if axisTitle !== '' && !reverseAxes}
    <text 
      class="axis-title"
      x='{$width + $padding.right}' 
      y='{axisPosition === "top" ? -30 : $height + 40}'
      style="text-anchor: end"
    >{axisTitle}</text>
  {/if}

</g>
  
<style>
    .tick text {
		font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: normal;
	}

    .axis-title {
        font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		    font-weight: normal;
        font-size: 0.725em;
        fill: #9c9c9c;
    }

    .tick.tick-0 line {
		stroke-dasharray: 0;
		stroke-width: 1;
		stroke: #9c9c9c;
	}
</style>


