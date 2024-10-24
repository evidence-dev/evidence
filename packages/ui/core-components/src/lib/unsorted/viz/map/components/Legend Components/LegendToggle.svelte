<script>
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {() => void} */
	export let handleLegendToggle;

	export let legendPosition = 'bottomLeft';

	let direction = 'down';

	if (legendPosition.includes('top')) {
		direction = 'up';
	} else if (legendPosition.includes('bottom')) {
		direction = 'down';
	}

	const chevronDirections = {
		down: { show: 'rotate-[270deg]', hide: 'rotate-90' },
		up: { show: 'rotate-90', hide: 'rotate-[270deg]' }
	};
</script>

<button
	class="flex z-[1] items-center px-[8px] py-[1.5px]"
	on:click={handleLegendToggle}
	on:dblclick={(e) => e.stopPropagation()}
	aria-label="Toggle Legend"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="8
		"
		height="8"
		viewBox="6 6 12 12"
		fill="none"
		stroke="#374151"
		stroke-width="1"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="transform transition-transform duration-300 ease-in-out text-left gray-500 {hideLegend
			? chevronDirections[direction].hide
			: chevronDirections[direction].show}"
	>
		<polyline points="14 17 10 12 14 7" />
	</svg>
	<span class="sr-only">
		{hideLegend ? 'Show Legend' : 'Hide Legend'}
	</span>
</button>
