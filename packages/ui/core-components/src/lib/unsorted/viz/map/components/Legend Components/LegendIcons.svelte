<script>
	/** @type {boolean} */
	export let hideLegend = false;
	export let handleLegendClick;

	/** @type {string | undefined} */
	export let legendType = undefined;
	/** @type {'left' | 'right' | 'bottom' | 'top'} */
	export let direction = 'bottom';

	const chevronDirections = {
		top: { show: 'rotate-[270deg]', hide: 'rotate-90' },
		bottom: { show: 'rotate-90', hide: 'rotate-[270deg]' },
		left: { show: 'rotate-0', hide: 'rotate-180' },
		right: { show: 'rotate-180', hide: 'rotate-0' }
	};
</script>

<button
	class="items-center {legendType === 'scalar' ? 'h-10 px-[2.9px]' : `h-5 pl-2 pt-0.5 w-full`}"
	on:click={handleLegendClick}
	on:dblclick={(e) => e.stopPropagation()}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="transform transition-transform duration-300 ease-in-out text-left {hideLegend
			? chevronDirections[direction].hide
			: chevronDirections[direction].show}"
	>
		<polyline points="15 18 9 12 15 6" />
	</svg>
</button>
