<script>
	import { getContext } from 'svelte';

	const { padding, xRange, xScale, yScale } = getContext('LayerCake');

	export let ticks = 4;
	export let gridlines = true;
	export let formatTick = d => d.toLocaleString();
	export let xTick = 0;
	export let yTick = 0;
	export let dxTick = 0;
	export let dyTick = -4;
	export let textAnchor = 'start';
	export let units = ''

	$: isBandwidth = typeof $yScale.bandwidth === 'function';

	$: tickVals = Array.isArray(ticks) ? ticks :
		isBandwidth ?
			$yScale.domain() :
			$yScale.ticks(ticks);
</script>

<g class='axis y-axis' transform='translate({-$padding.left}, 0)'>
	{#each tickVals as tick, i}
		<g class='tick tick-{tick}' transform='translate({$xRange[0] + (isBandwidth ? $padding.left : 0)}, {$yScale(tick)})'>
			{#if gridlines !== false}
				<line
					x2='100%'
					y1={yTick + (isBandwidth ? ($yScale.bandwidth() / 2) : 0)}
					y2={yTick + (isBandwidth ? ($yScale.bandwidth() / 2) : 0)}
				></line>
			{/if}
			<text
				x='{xTick}'
				y='{yTick + (isBandwidth ? $yScale.bandwidth() / 2 : 0)}'
				dx='{isBandwidth ? -5 : dxTick}'
				dy='{isBandwidth ? 4 : dyTick}'
				style="text-anchor:{isBandwidth ? 'end' : textAnchor};"
			>
			{#if i+1 === tickVals.length }
			{formatTick(tick) +" "+ units }
			{:else}
			{formatTick(tick)}
			{/if }
		</text>
		</g>
	{/each}
</g>

<style>
	.tick {
		font-size: .725em;
		font-weight: 200;
	}

	.tick line {
		stroke: rgb(247, 249, 250);;
		/* stroke-dasharray: 3; */
		
	}

	.tick text {
		fill: rgb(141, 141, 141);
		font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: normal;
		font-size: 1em;
	}

	.tick.tick-0 line {
		stroke-dasharray: 0;
	}
</style>
