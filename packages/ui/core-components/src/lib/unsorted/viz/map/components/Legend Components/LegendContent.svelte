<script>
	import { fmt } from '@evidence-dev/component-utilities/formatting';
	/** @type {"categorical" | "scalar" | undefined} */
	export let legendType = undefined;
	/** @type {[any] | undefined} */
	export let values;
	/** @type {[string] | undefined} */
	export let colorPalette;
	/** @type {number | undefined} */
	export let minValue;
	/** @type {number | undefined} */
	export let maxValue;
	/** @type {string | undefined} */
	export let legendFmt = undefined;
	export let hideLegend = false;
	/** @type {'left' | 'right' | 'up' | 'down'} */
	export let direction = 'up';
	let isOverflowAuto = true;

	// handles growing width effect for hide/show categorical transitions
	function handleTransitionEnd() {
		if (legendType === 'categorical' && !hideLegend) {
			isOverflowAuto = true;
		}
	}
	$: if (legendType !== 'categorical' || hideLegend) {
		isOverflowAuto = false;
	}
</script>

{#if legendType === 'scalar'}
	<div
		class="flex w-48 {hideLegend
			? 'max-w-0'
			: 'max-w-48'} transition-[max-width] duration-300 ease-in-out overflow-hidden {hideLegend
			? ''
			: direction === 'left'
				? 'mr-2'
				: 'ml-2'}"
	>
		<span
			style="background: {colorPalette
				? `linear-gradient(to right, ${colorPalette.join(', ')})`
				: 'white'}"
			class="relative h-2 w-full mb-3"
		>
			<span class="absolute text-[10px] left-0 top-2 block"
				>{legendFmt ? fmt(minValue, legendFmt) : minValue}</span
			>
			<span class="absolute text-[10px] right-0 top-2 block"
				>{legendFmt ? fmt(maxValue, legendFmt) : maxValue}</span
			>
		</span>
	</div>
{:else if legendType === 'categorical'}
	<div
		class="ml-2 pr-2 max-w-40 min-w-24 transition-[max-height] duration-300 ease-in-out
	{hideLegend ? 'max-h-0 overflow-y-hidden' : 'max-h-60'} 
	{hideLegend ? '' : direction === 'down' ? 'pb-2' : 'pt-2'}"
		class:overflow-y-auto={isOverflowAuto}
		on:transitionend={handleTransitionEnd}
	>
		{#each values as value, i}
			<div class="flex items-center">
				<span
					class="inline-block h-2 rounded-full min-w-2 ml-[3px]"
					style="background-color: {colorPalette[i]};"
				/>
				<span class="inline-block ml-2 truncate">{value || 'No value'} </span>
			</div>
		{/each}
	</div>
{/if}
