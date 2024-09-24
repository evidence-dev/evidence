<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	export let legendType = undefined;
	export let legendPosition = 'bottomLeft';
	export let legendTitle = 'Legend';
	const positions = {
		topLeft: 'top-3 left-[-9px]',
		topRight: 'top-3 right-[-9px]',
		bottomLeft: 'bottom-[-9px] left-[-9px]',
		bottomRight: 'bottom-[-9px] right-[-9px]'
	};
	/** @type {boolean} */
	let hideLegend = false;
	/** @type {[any] | undefined]} */
	let values;
	/** @type {[string] | undefined} */
	let colorPalette;
	/** @type {number | undefined} */
	let minValue;
	/** @type {number | undefined} */
	let maxValue;
	/** @type {string | undefined} */
	let flyDirection = legendPosition === 'topLeft' || legendPosition === 'bottomLeft' ? -150 : 150;

	// assuming map is initialized here
	const map = getContext(mapContextKey);
	map.legendData.subscribe((data) => {
		values = data.arrayOfStringValues;
		colorPalette = data.colorPalette;
		minValue = data.minValue;
		maxValue = data.maxValue;
	});
</script>

{#if legendType && values}
	<button
		class="absolute z-[501] border border-gray-300 bg-gray-100 top-2 left-4 p-0.5 rounded-sm text-[10px] font-bold w-20 text-center"
		on:click={() => (hideLegend = !hideLegend)}
		on:dblclick={(e) => e.stopPropagation()}>{hideLegend ? 'Show' : 'Hide'} Legend</button
	>
	{#if !hideLegend}
		<div
			class="absolute {positions[legendPosition] ?? 'top-3 left-[-9px]'} z-[500]"
			on:wheel={(e) => e.stopPropagation()}
		>
			<div
				class="m-6 text-xs border border-gray-300 bg-gray-100 min-w-32 pt-2 pb-2"
				transition:fly={{
					duration: 400,
					x: flyDirection,
					y: 0,
					opacity: 0.1,
					easing: cubicInOut
				}}
			>
				<button
					on:click={() => (hideLegend = !hideLegend)}
					class="block font-bold text-center w-full">{legendTitle}</button
				>
				<div class="overflow-y-auto max-h-52">
					{#if legendType === 'scalar'}
						<div class="flex flex-wrap w-full mt-2 pr-2 pl-2">
							<span
								style="background: {colorPalette
									? `linear-gradient(to right, ${colorPalette.join(', ')})`
									: 'white'}"
								class="relative h-2 w-full mb-3"
							>
								<span class="absolute text-[10px] left-0 top-2 block">{minValue}</span>
								<span class="absolute text-[10px] right-0 top-2 block">{maxValue}</span>
							</span>
						</div>
					{:else if legendType === 'category'}
						{#each colorPalette as color, i}
							<div class="w-full pr-2 pl-2">
								<span class="inline-block h-2 w-2 rounded-full" style="background-color: {color}" />
								- {values[i] ? values[i] : `No value`}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}
