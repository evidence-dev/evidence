<script>
	import { getContext } from "svelte";
	import formatAxisLabel from "../modules/formatAxisLabel.js";
	const { width, padding, yScale, height, xDomain, xRange } = getContext("LayerCake");

	// Tick Variables:
	let yFormat = getContext('yFormat');
	let yName = getContext('yName');
	let yUnits = getContext('yUnits');

	// export let formatTick = (d) => formatAxisLabel(d, yFormat);
	export let ticks = 4;
	export let xTick = 0;
	export let yTick = 0;
	export let dxTick = 0;
	export let dyTick = 0;
	
	// Tick Marks:
	export let tickMarks = "false";
	export let tickMarkColor = null;

	// Axis Position:
	export let axisPosition = "left";

	// Axis Line:
	export let baseline = false;
	export let baselineColor = "#9c9c9c";

	// Gridlines:
	export let gridlines = "true";
	export let gridlineColor = "#e3e3e3";
	export let gridlineDashSize = 0;

	// Axis Title/Units:
	export let units = "";

	// Labels:
	export let labels = "true";
	export let labelColor = "rgb(141, 141, 141)";
	export let labelSize = "1em";
	let labelScale = labelSize.replace("em", "");

	// Ticks Setup:
	$: isBandwidth = typeof $yScale.bandwidth === "function";

	$: tickVals = Array.isArray(ticks)
		? ticks
		: isBandwidth
		? $yScale.domain()
		: $yScale.ticks(ticks);
</script>

<g class="axis y-axis {$height} {$padding.top} {$padding.bottom}" transform="translate({-$padding.left}, 0)">
	{#each tickVals as tick, i}
		<g
			class="tick tick-{tick}"
			transform="translate(0, {$yScale(tick)})"
		>
			{#if gridlines === "true" || (gridlines === "false" && tick === 0)}
				{#if units !== "" && labels === "true" && i + 1 === tickVals.length && axisPosition === "left-outer"}
					<line
						x1={7 * labelScale * units.length + 0.01 * $width}
						x2="100%"
						y1={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
						y2={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
						stroke={gridlineColor}
						stroke-dasharray={gridlineDashSize}
					/>
				{:else}
					<line
						x2="100%"
						y1={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
						y2={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
						stroke={gridlineColor}
						stroke-dasharray={gridlineDashSize}
					/>
				{/if}
			{/if}

			{#if tickMarks === 'true'}
			<line 
			  class="tick-mark" 
			  y1='{yTick || isBandwidth ? $yScale.bandwidth() / 2 : 0}' 
			  y2='{yTick || isBandwidth ? $yScale.bandwidth() / 2 : 0}' 
			  x1='{axisPosition === "right" ? -$xRange[0] : 0 + $padding.left}' 
			  x2='{axisPosition === "right" ? -$xRange[0]-4 : -4 + $padding.left}'
			  stroke='{tickMarkColor ? tickMarkColor 
				: Number.parseInt($xDomain[0]) === 0 || baseline === 'true' ? baselineColor 
				: gridlineColor}'
			  stroke-width='{1}'
			  ></line>
			{/if}

			{#if labels === "true"}
				{#if axisPosition === "right"}
					<text
						x={$width + $padding.right + $padding.left}
						y={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
						dx={isBandwidth ? dxTick : dxTick}
						dy={-4}
						fill={labelColor}
						font-size={labelSize}
						alignment-baseline="top"
						text-anchor="end"
						>
						{#if i + 1 === tickVals.length}
							{formatAxisLabel(tick, yFormat, yUnits, "firstTick") + " " + units}
						{:else}
							{formatAxisLabel(tick, yFormat, yUnits)}
						{/if}
					</text>
				{:else if axisPosition === "left"}
					<text
					x={xTick + isBandwidth ? $padding.left : 0}
					y={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
					dx={isBandwidth ? -8 : dxTick}
					dy={isBandwidth ? 0 : -4}
					fill={labelColor}
					font-size={labelSize}
					alignment-baseline={isBandwidth ? "middle" : "top"}
					text-anchor={isBandwidth ? "end" : "start"}
					>
					{#if i + 1 === tickVals.length}
						{formatAxisLabel(tick, yFormat, yUnits, "firstTick") + " " + units}
					{:else}
						{formatAxisLabel(tick, yFormat, yUnits)}
					{/if}
					</text>
				{:else}
					<text
					x={xTick - $padding.left}
					y={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
					dx={isBandwidth ? -5 : $padding.left - 8}
					dy={isBandwidth ? 1 : dyTick}
					fill={labelColor}
					font-size={labelSize}
					alignment-baseline="middle"
					text-anchor="end"
					>
					{#if i + 1 === tickVals.length}
						{formatAxisLabel(tick, yFormat, yUnits, "firstTick")}
					{:else}
						{formatAxisLabel(tick, yFormat, yUnits)}
					{/if}
					</text>
					{#if i + 1 === tickVals.length}
						<text
							class="units"
							x="1"
							y={yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}
							dx={isBandwidth ? -5 : dxTick}
							dy={isBandwidth ? 4 : dyTick}
							fill={labelColor}
							font-size={labelSize}
							alignment-baseline="middle"
							style="text-anchor:start;">{units}</text
						>
					{/if}
				{/if}
			{/if}
		</g>
	{/each}

	{#if baseline === "true"}
		<line
			class="baseline"
			y1={-6}
			y2={$height + 0.5}
			x1={0}
			x2={0}
			stroke={baselineColor}
			stroke-dasharray="0"
			stroke-width="1"
		/>
	{/if}
</g>

<style>
	.tick {
		font-size: 0.725em;
		font-weight: 200;
	}

	.tick text {
		font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: normal;
	}

	.tick.tick-0 line {
		stroke-dasharray: 0;
		stroke-width: 1;
		stroke: #858585;
	}

	.axis-title {
		fill: black;
		font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: 600;
	}
</style>


