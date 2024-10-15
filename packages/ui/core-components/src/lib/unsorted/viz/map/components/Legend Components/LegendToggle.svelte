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
	class="flex z-[1] items-center p-1 {legendType === 'scalar' && direction === 'left'
		? 'flex-row-reverse'
		: 'flex-row'}"
	on:click={handleLegendToggle}
	on:dblclick={(e) => e.stopPropagation()}
	aria-label="Toggle Legend"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="12"
		height="12"
		viewBox="6 6 12 12"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="transform transition-transform duration-300 ease-in-out text-left {hideLegend
			? chevronDirections[direction].hide
			: chevronDirections[direction].show}"
	>
		<polyline points="14 17 10 12 14 7" />
	</svg>
	<span class="sr-only">
		{hideLegend ? 'Show Legend' : 'Hide Legend'}
	</span>
</button>
