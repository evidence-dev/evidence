<script>
	/** @type {{ colorPalette: string[]; values: string[]; legendType: 'categorical', value: string }} */
	export let legend;
	/** @type {boolean} */
	export let hideLegend = false;

	/** @type {number}*/
	export let height = 300;
	/**
	 * @type {function(string): string}
	 */
	export let capitalize;

	let legendTitle = capitalize(legend.value) || 'No value';

	//total height of category value content
	let overflowHeight = legend.values.length * 16;

	let overflowOn = overflowHeight > height - 50;
</script>

<div class="flex w-full">
	<div
		style={`max-height: ${hideLegend ? '0px' : `${height - 50}px`};`}
		class="scrollbox flex flex-col transition-[opacity, max-height, overflow-y] duration-[350ms] ease-in-out w-full min-w-24 {overflowOn
			? 'overflow-y-auto'
			: 'overflow-hidden'} {hideLegend ? 'opacity-0' : ``}"
	>
		<div class="flex flex-wrap flex-col font-semibold">
			<p>{legendTitle}</p>
		</div>
		<div class="text-xs pr-1 w-full">
			{#each legend.values as value, i}
				<div class="flex items-center">
					<span
						class="inline-block h-[8px] {legend.chartType === 'Area Map'
							? ''
							: 'rounded-full'} w-[8px]"
						style="background-color: {legend.colorPalette[i]};"
					/>
					<span class="inline-block ml-2 truncate max-w-[calc(100%-16px)]" title={value}
						>{value || 'No value'}
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	/* pulled css design from datatables should we move this into a global style component? */
	.scrollbox {
		width: 100%;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
	}

	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}

	.scrollbox::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}

	.scrollbox::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}

	.scrollbox::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}

	.scrollbox::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}

	.scrollbox::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	.scrollbox::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
</style>
