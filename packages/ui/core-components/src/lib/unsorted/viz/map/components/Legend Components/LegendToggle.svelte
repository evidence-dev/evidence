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
	class="{legendType === 'scalar'
		? 'h-10 px-[2.9px]'
		: ` w-full flex justify-center items-center`} z-[1]"
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
</button>
