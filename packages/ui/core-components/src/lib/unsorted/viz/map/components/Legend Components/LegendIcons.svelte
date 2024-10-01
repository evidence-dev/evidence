<script>
	/** @type {boolean} */
	export let hideLegend = false;
	export let handleLegendClick;

	/** @type {string | undefined} */
	export let legendType = undefined;
	/** @type {number} */
	export let setWidth = 0;
</script>

<div class="h-full">
	<button
		style={legendType === 'category' ? `width: ${setWidth}px;` : ''}
		class="flex items-center {legendType === 'scalar' ? 'h-10 px-[2.9px]' : `h-5 ml-2`}"
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
				? 'rotate-0'
				: 'rotate-90'}"
		>
			<polyline points="15 18 9 12 15 6" />
		</svg>
	</button>
</div>
