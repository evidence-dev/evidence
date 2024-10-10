<script>
	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'categorical' }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {boolean} */
	export let multiLegend = false;
	/** @type {'down' | 'up'} */
	export let direction = 'down';
	/** @type {number}*/
	export let height = 300;

	let categoryLegendHeight = `max-h-[${height - 50}px]`;
</script>

<div
	class="flex flex-wrap flex-start {!multiLegend && direction === 'up'
		? 'flex-col-reverse'
		: 'flex-col'}"
>
	<div
		class="flex {hideLegend
			? 'max-h-[0px] opacity-0 py-0'
			: `${categoryLegendHeight} py-1 overflow-y-auto`} px-1 transition-[max-height, opacity, padding] duration-[350ms] ease-in-out w-full min-w-[86.5px]"
	>
		<div class="text-xs pr-1 w-full">
			{#each legend.values as value, i}
				<div class="flex items-center">
					<span
						class="inline-block h-[8px] {legend.chartType === 'Area Map'
							? ''
							: 'rounded-full'} w-[10px] ml-[3px] mr-3"
						style="background-color: {legend.colorPalette[i]};"
					/>
					<span class="inline-block w-full">{value || 'No value'} </span>
				</div>
			{/each}
		</div>
	</div>
</div>
