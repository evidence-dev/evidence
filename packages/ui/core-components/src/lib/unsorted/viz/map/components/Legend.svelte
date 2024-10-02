<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { mapContextKey } from '../constants.js';
	import { getContext } from 'svelte';
	import LegendIcons from './Legend Components/LegendIcons.svelte';
	import LegendTypes from './Legend Components/LegendTypes.svelte';
	export let legendType = undefined;
	export let legendPosition = 'bottomLeft';
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
	/** @type {'left' | 'right' | 'bottom' | 'top'} */
	let direction = 'bottom';

	const map = getContext(mapContextKey);
	let legendData;

	$: legendData = map.getLegendData;

	$: {
		if ($legendData) {
			values = $legendData.values;
			colorPalette = $legendData.colorPalette;
			minValue = $legendData.minValue;
			maxValue = $legendData.maxValue;
		}
	}

	const handleLegendClick = () => {
		hideLegend = !hideLegend;
	};

	if (legendType === 'scalar') {
		direction = legendPosition.includes('Left') ? 'left' : 'right';
	} else if (legendType === 'category') {
		direction = legendPosition.includes('bottom') ? 'bottom' : 'top';
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
			{#if direction === 'top' || direction === 'left'}
				<LegendIcons {hideLegend} {handleLegendClick} {legendType} {direction} />
				<!-- legend container -->
			{/if}
			<LegendTypes
				{direction}
				{legendType}
				{values}
				{colorPalette}
				{minValue}
				{maxValue}
				{legendFmt}
				{hideLegend}
			/>
			{#if direction === 'bottom' || direction === 'right'}
				<LegendIcons {hideLegend} {handleLegendClick} {legendType} {direction} />
			{/if}
		</div>
	</div>
{/if}
