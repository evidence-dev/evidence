<script>
	import { getContext } from 'svelte';
	import * as d3 from 'd3'
  
	const { width, height, xScale, yScale, yRange } = getContext('LayerCake');

	var formatMillisecond = d3.timeFormat(".%L"),
    formatSecond = d3.timeFormat(":%S"),
    formatMinute = d3.timeFormat("%I:%M"),
    formatHour = d3.timeFormat("%I %p"),
    formatDay = d3.timeFormat("%a %d"),
    formatWeek = d3.timeFormat("%b %e"),
    formatMonth = d3.timeFormat("%b"),
    formatYear = d3.timeFormat("%Y");

	function multiFormat(date) {
		return (d3.timeSecond(date) < date ? formatMillisecond
			: d3.timeMinute(date) < date ? formatSecond
			: d3.timeHour(date) < date ? formatMinute
			: d3.timeDay(date) < date ? formatHour
			: d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
			: d3.timeYear(date) < date ? formatMonth
			: formatYear)(date);
	}
 
	export let gridlines = true;
	export let formatTick = d => multiFormat(d);
	export let baseline = false;
	export let snapTicks = false;
	export let ticks = undefined;
	export let xTick = undefined;
	export let yTick = 16;
	export let dxTick = 0;
	export let dyTick = 0;
  
	$: isBandwidth = typeof $xScale.bandwidth === 'function';
  
	$: tickVals = Array.isArray(ticks) ? ticks 
	: isBandwidth ? $xScale.domain() 
	: typeof ticks === 'function' ? ticks($xScale.ticks()) 
	: $xScale.ticks(ticks);
  
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
  <g class='axis x-axis'>
	{#each tickVals as tick, i}
	  <g class='tick tick-{ tick }' transform='translate({$xScale(tick)},{$yRange[0]})'>
		{#if gridlines !== false}
		  <line y1='{$height * -1}' y2='0' x1='0' x2='0'></line>
		{/if}
		<text
		  x="{xTick || isBandwidth ? $xScale.bandwidth() / 2 : 0 }"
		  y='{yTick}'
		  dx='{dxTick}'
		  dy='{dyTick}'
		  text-anchor='{textAnchor(i)}'>{formatTick(tick)}</text>
	  </g>
	{/each}
	{#if baseline === true}
	  <line class="baseline" y1='{$height + 0.5}' y2='{$height + 0.5}' x1='0' x2='{$width}'></line>
	{/if}
  </g>
  


  <style>
	.tick {
	  font-size: .725em;
	  font-weight: 200;
	}
  
	line,
	.tick line {
	  stroke: rgb(62, 62, 62);
	  stroke-dasharray: 2;
	}
  
	.tick text {
		fill: rgb(141, 141, 141);
		font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: normal;
		font-size: .725em;
	}
  
  
	.baseline {
	  stroke-dasharray: 0;
	}
  </style>