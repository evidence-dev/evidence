<script>
	import { fmt } from '@evidence-dev/component-utilities/formatting';
	import LegendToggle from './LegendToggle.svelte';

	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'scalar' }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {boolean} */
	export let multiLegend = false;
	/** @type {'left' | 'right'} */
	export let direction = 'right';

	let hideLegendStyle = multiLegend ? `max-h-[0px] opacity-0 w-full py-0` : 'w-[0px] opacity-0';

	/** @type {() => void} */
	export let handleLegendToggle;
</script>

{#if !multiLegend}
	<LegendToggle legendType="scalar" {handleLegendToggle} {hideLegend} {direction} />
{/if}
<div
	class="flex {hideLegend
		? hideLegendStyle
		: `w-full max-h-[300px] py-1`} px-1 transition-[width, opacity, max-height, padding] duration-[350ms] ease-in-out min-w-56"
>
	<div class="flex flex-col justify-center w-full overflow-hidden h-8 mx-[3px] w-full">
		<span
			style="background: {legend.colorPalette
				? `linear-gradient(to right, ${legend.colorPalette.join(', ')})`
				: 'white'}"
			class="relative w-full h-2"
		>
		</span>
		<div class="flex w-full justify-between">
			<span class="text-[10px] inline-block"
				>{legend.legendFmt ? fmt(legend.minValue, legend.legendFmt) : legend.minValue}</span
			>
			<span class="text-[10px] inline-block"
				>{legend.legendFmt ? fmt(legend.maxValue, legend.legendFmt) : legend.maxValue}</span
			>
		</div>
	</div>
</div>
