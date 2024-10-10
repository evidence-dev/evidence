<script>
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {() => void} */
	export let handleLegendToggle;

	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
	/** @type {'left' | 'right' | 'down' | 'up'} */
	export let direction = 'down';

	const chevronDirections = {
		up: { show: 'rotate-[270deg]', hide: 'rotate-90' },
		down: { show: 'rotate-90', hide: 'rotate-[270deg]' },
		left: { show: 'rotate-0', hide: 'rotate-180' },
		right: { show: 'rotate-180', hide: 'rotate-0' }
	};
</script>

<button
	class="flex z-[1] py-[5px] items-center {legendType === 'scalar' && direction === 'left'
		? 'flex-row-reverse'
		: 'flex-row'}"
	on:click={handleLegendToggle}
	on:dblclick={(e) => e.stopPropagation()}
	aria-label="Toggle Legend"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="15"
		height="15"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="transform transition-all duration-[350ms] ease-in-out text-left {hideLegend
			? chevronDirections[direction].hide
			: chevronDirections[direction].show}"
	>
		<polyline points="15 18 9 12 15 6" />
	</svg>
	<div class="flex {legendType === 'scalar' ? 'flex-col' : 'flex-row'}">
		<span class=" text-[10px] w-[30px]">{hideLegend ? 'Show' : 'Hide'}</span>
		<span class=" text-[10px]">Legend</span>
	</div>
</button>
