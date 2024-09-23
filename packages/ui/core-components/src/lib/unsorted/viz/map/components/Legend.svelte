<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	export let showLegend = false;
	export let legendPosition = 'topLeft';
	export let legendTitle = 'Legend';
	export let legendType = 'scalarr';
	const positions = {
		topLeft: 'top-2 left-[-9px]',
		topRight: 'top-2 right-[-9px]',
		bottomLeft: 'bottom-0 left-[-9px]',
		bottomRight: 'bottom-0 right-[-9px]'
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

{#if showLegend && values}
	<button
		class="absolute z-[501] border border-gray-300 bg-gray-100 top-1 left-4 p-0.5 rounded-sm text-[10px] font-bold"
		on:click={() => (hideLegend = !hideLegend)}
		on:dblclick={(e) => e.stopPropagation()}>{hideLegend ? 'Hide' : 'Show'} Legend</button
	>
	{#if !hideLegend}
		<div class="absolute {positions[legendPosition] ?? 'top-2 left-[-9px]'} z-[500]">
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
				{#if legendType === 'scalar'}
					<div class="flex flex-wrap w-full mt-2">
						<span
							style="background: {colorPalette
								? `linear-gradient(to right, ${colorPalette.join(', ')})`
								: 'white'}"
							class="relative h-2 w-full mb-3"
						>
							<span class="absolute text-[10px] left-0 top-2 inline-block">{minValue}</span>
							<span class="absolute text-[10px] right-0 top-2 inline-block">{maxValue}</span>
						</span>
					</div>
				{:else}
					{#each colorPalette as color, i}
						<div class="w-full pr-2 pl-2">
							<span class="inline-block h-2 w-2 rounded-full" style="background-color: {color}" />
							- {values[i] ? values[i] : `Error, No value for index ${i}`}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
{/if}
