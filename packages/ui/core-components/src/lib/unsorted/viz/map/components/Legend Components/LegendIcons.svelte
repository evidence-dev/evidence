<script>
	/** @type {boolean} */
	export let hideLegend = false;
	export let handleLegendClick;
</script>

<div class="pl-2 pr-2 pb-2">
	<button
		class="flex items-center"
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
		<span class="text-xs">{hideLegend ? 'Show Legend' : 'Hide Legend'}</span>
	</button>
</div>
