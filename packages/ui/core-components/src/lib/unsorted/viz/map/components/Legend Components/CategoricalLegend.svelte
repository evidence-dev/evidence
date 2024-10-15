<script>
	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'categorical', value: string }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {boolean} */
	export let multiLegend = false;
	/** @type {'down' | 'up'} */
	export let direction = 'down';
	/** @type {number}*/
	export let height = 300;
	/**
	 * @type {function(string): string}
	 */
	export let capitalize;

	let legendTitle = capitalize(legend.value) || 'No value';
	$: overflowAuto = true;
	$: console.log(overflowAuto);

	const handleOverflow = (event) => {
		// Check which transition ended to avoid duplicate logs
		if (event.propertyName === 'max-height') {
			overflowAuto = !overflowAuto; // Set overflow auto when max-height transition ends
		}
	};
</script>

<div class="flex {!multiLegend && direction === 'up' ? 'flex-col-reverse' : 'flex-col'}">
	<div
		style={`max-height: ${hideLegend ? '0px' : `${height - 50}px`};`}
		class="flex flex-col{hideLegend
			? ' opacity-0'
			: ``}  transition-[opacity, max-height] duration-[350ms] ease-in-out w-full min-w-[86.5px] {overflowAuto
			? 'overflow-y-auto'
			: 'overflow-y-hidden'}"
		on:transitionend={handleOverflow}
	>
		<div class="flex flex-wrap flex-col">
			<p>{legendTitle}</p>
		</div>
		<div class="text-xs pr-1 w-full">
			{#each legend.values as value, i}
				<div class="flex items-center">
					<span
						class="inline-block h-[8px] {legend.chartType === 'Area Map'
							? ''
							: 'rounded-full'} w-[8px]"
						style="background-color: {legend.colorPalette[i]};"
					/>
					<span class="inline-block ml-2">{value || 'No value'} </span>
				</div>
			{/each}
		</div>
	</div>
</div>
