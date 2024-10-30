<script>
	import { fmt } from '@evidence-dev/component-utilities/formatting';

	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'scalar', value: string }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;
	/**
	 * @type {function(string): string}
	 */
	export let capitalize;

	let hideLegendStyle = `max-h-[0px] opacity-0`;

	let showLegendStyle = `max-h-[300px]`;

	let legendTitle = capitalize(legend.value);
</script>

<div
	class="flex flex-col {hideLegend
		? hideLegendStyle
		: showLegendStyle} transition-[opacity, max-height, overflow-y] duration-[350ms] ease-in-out w-full"
>
	<div class="flex flex-wrap flex-col font-semibold">
		<span class="text-[12px]">{legendTitle}</span>
	</div>
	<div class="flex flex-col justify-center overflow-hidden h-8 w-full">
		<span
			style="background: {legend.colorPalette
				? `linear-gradient(to right, ${legend.colorPalette.join(', ')})`
				: 'white'}"
			class="relative h-2 min-w-56"
		>
		</span>
		<div class="flex justify-between">
			<span class="text-[10px] inline-block"
				>{legend.valueFmt ? fmt(legend.minValue, legend.valueFmt) : legend.minValue}</span
			>
			<span class="text-[10px] inline-block"
				>{legend.valueFmt ? fmt(legend.maxValue, legend.valueFmt) : legend.maxValue}</span
			>
		</div>
	</div>
</div>
