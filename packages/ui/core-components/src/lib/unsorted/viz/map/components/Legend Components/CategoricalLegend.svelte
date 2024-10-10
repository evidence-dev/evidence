<script>
	import LegendToggle from './LegendToggle.svelte';

	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'categorical' }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {boolean} */
	export let multiLegend = false;
	/** @type {'down' | 'up'} */
	export let direction = 'down';

	/** @type {() => void} */
	export let handleLegendToggle;
</script>

<div class="flex {direction === 'down' ? '' : ''} flex-wrap">
	{#if !multiLegend}
		<LegendToggle legendType={legend.legendType} {handleLegendToggle} {hideLegend} {direction} />
	{/if}
	<div
		class="flex {hideLegend
			? 'max-h-[0px] opacity-0 py-0 '
			: 'max-h-[300px] py-1'} px-1 transition-[max-height, opacity, padding] duration-[350ms] ease-in-out max-w-32"
	>
		<div class="text-xs pr-1 w-full">
			{#each legend.values as value, i}
				<div class="flex items-center">
					<span
						class="inline-block h-[8px] rounded-full w-[8px] ml-[3px]"
						style="background-color: {legend.colorPalette[i]};"
					/>
					<span class="inline-block ml-2 truncate">{value || 'No value'} </span>
				</div>
			{/each}
		</div>
	</div>
</div>
