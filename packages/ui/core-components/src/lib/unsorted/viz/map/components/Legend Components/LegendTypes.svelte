<script>
	import { fmt } from '@evidence-dev/component-utilities/formatting';
	/** @type {string | undefined} */
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
</script>

{#if legendType === 'scalar'}
	<div class="{hideLegend ? 'w-0' : 'w-48'} transition-all duration-300 ease-in-out">
		<div class="flex w-48 mr-2 pr-2">
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
	</div>
{:else if legendType === 'category'}
	<div
		class="overflow-y-auto max-h-60 ml-2 pr-2 max-w-40 min-w-24 {hideLegend
			? 'max-h-0'
			: 'max-h-60'} transition-[max-height] duration-300 ease-in-out"
	>
		{#each colorPalette as color, i}
			<div class="flex items-center">
				<span
					class="inline-block h-2 rounded-full min-w-2 ml-[3px]"
					style="background-color: {color}"
				/>
				<span class="inline-block ml-2 truncate">{values[i] || 'No value'} </span>
			</div>
		{/each}
	</div>
{/if}
