<script>
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	import LegendToggle from './Legend Components/LegendToggle.svelte';
	import LegendContent from './Legend Components/LegendContent.svelte';

	/** @type {'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'} */
	export let legendPosition = 'bottomLeft';
	/** @type {'categorical' | 'scalar' | undefined} */
	export let legendType = undefined;
	const positions = {
		topLeft: 'top-[-10px] left-[-9px]',
		topRight: 'top-[-10px] right-[-9px]',
		bottomLeft: 'bottom-[-9px] left-[-9px]',
		bottomRight: 'bottom-[-9px] right-[-9px]'
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
	export let legendFmt = undefined;
	/** @type {'left' | 'right' | 'up' | 'down'} */
	let direction = 'up';

	/** @type {number} */
	export let legendId;

	const map = getContext(mapContextKey);

	$: legendData = map.legendData;
	$: {
		if ($legendData) {
			let data = $legendData.find((d) => d.legendId === legendId);
			values = data.values;
			colorPalette = data.colorPalette;
			minValue = data.minValue;
			maxValue = data.maxValue;
		}
	}

	const handleLegendClick = () => {
		hideLegend = !hideLegend;
	};

	if (legendType === 'scalar') {
		direction = legendPosition.includes('Left') ? 'left' : 'right';
	} else if (legendType === 'categorical') {
		direction = legendPosition.includes('bottom') ? 'up' : 'down';
	}
</script>

{#if legendType && values}
	<!-- component container -->
	<div
		class="absolute {positions[legendPosition] ?? 'top-3 left-[-9px]'} z-[500]"
		on:wheel={(e) => e.stopPropagation()}
		on:dblclick={(e) => e.stopPropagation()}
		role="group"
	>
		<div
			class="m-6 border border-gray-300 bg-gray-100 overflow-hidden legend-font w-fit max-w-96 items-center {legendType ===
			'scalar'
				? 'flex'
				: ''}"
		>
			<!-- button container -->
			{#if direction === 'down' || direction === 'left'}
				<LegendToggle {hideLegend} {handleLegendClick} {legendType} {direction} />
				<!-- legend container -->
			{/if}
			<LegendContent
				{direction}
				{legendType}
				{values}
				{colorPalette}
				{minValue}
				{maxValue}
				{legendFmt}
				{hideLegend}
				{legendData}
			/>
			{#if direction === 'up' || direction === 'right'}
				<LegendToggle {hideLegend} {handleLegendClick} {legendType} {direction} />
			{/if}
		</div>
	</div>
{/if}
