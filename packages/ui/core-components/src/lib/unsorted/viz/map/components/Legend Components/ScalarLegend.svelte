<script>
	import { fmt } from '@evidence-dev/component-utilities/formatting';

	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'scalar' }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {boolean} */
	export let multiLegend = false;
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
		: showLegendStyle} min-w-52 transition-all duration-[350ms] ease-in-out w-full"
>
	<div class="flex flex-wrap flex-col">
		<p>{legendTitle}</p>
	</div>
	<div
		class="flex flex-col justify-center overflow-hidden h-8 {multiLegend ? 'w-full' : 'w-[250px]'}"
	>
		<span
			style="background: {legend.colorPalette
				? `linear-gradient(to right, ${legend.colorPalette.join(', ')})`
				: 'white'}"
			class="relative h-2"
		>
		</span>
		<div class="flex justify-between">
			<span class="text-[10px] inline-block"
				>{legend.legendFmt ? fmt(legend.minValue, legend.legendFmt) : legend.minValue}</span
			>
			<span class="text-[10px] inline-block"
				>{legend.legendFmt ? fmt(legend.maxValue, legend.legendFmt) : legend.maxValue}</span
			>
		</div>
	</div>
</div>
