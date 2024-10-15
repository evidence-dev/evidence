<script>
	/** @type {boolean} */
	export let hideLegend = false;
	/** @type {() => void} */
	export let handleLegendToggle;

	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
	/** @type {'left' | 'right' | 'down' | 'up'} */
	export let direction = 'down';
</script>

<button
	class="flex z-[1] items-center {legendType === 'scalar' && direction === 'left'
		? 'flex-row-reverse'
		: 'flex-row'}"
	on:click={handleLegendToggle}
	on:dblclick={(e) => e.stopPropagation()}
	aria-label="Toggle Legend"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={`transition-transform duration-300 ease-in-out ${hideLegend ? 'rotate-180' : ''}`}
	>
		{#if hideLegend}
			<!-- Diagonal line 1 -->
			<line x1="6" y1="6" x2="18" y2="18" />
			<!-- Diagonal line 2 -->
			<line x1="6" y1="18" x2="18" y2="6" />
		{:else}
			<!-- Row 1: Circle and Bar -->
			<circle cx="5.5" cy="7" r="1" fill="currentColor" />
			<rect x="8" y="6.5" width="11" height="1" rx="0.5" ry="0.5" fill="currentColor" />

			<!-- Row 2: Circle and Bar -->
			<circle cx="5.5" cy="12" r="1" fill="currentColor" />
			<rect
				x="8"
				y="11.5"
				width="11"
				height="1"
				rx="0.5"
				ry="0.5"
				fill="currentColor"
				class={`transition-opacity duration-200 ease-in-out ${hideLegend ? 'opacity-0' : 'opacity-100'}`}
			/>

			<!-- Row 3: Circle and Bar -->
			<circle cx="5.5" cy="17" r="1" fill="currentColor" />
			<rect x="8" y="16.5" width="11" height="1" rx="0.5" ry="0.5" fill="currentColor" />
		{/if}
	</svg>
</button>
