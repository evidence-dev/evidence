<script>
	import CategoricalLegend from './Legend Components/CategoricalLegend.svelte';
	import ScalarLegend from './Legend Components/ScalarLegend.svelte';
	import LegendToggle from './Legend Components/LegendToggle.svelte';

	import { derived } from 'svelte/store';

	const positions = {
		topLeft: 'top-[-9px] left-[-9px]',
		topRight: 'top-[-9px] right-[-9px]',
		bottomLeft: 'bottom-[-9px] left-[-9px]',
		bottomRight: 'bottom-[-9px] right-[-9px]'
	};

	export let legendData;
	export let legendPosition = 'bottomLeft';
	/** @type {number}*/
	export let height = 300;
	export let categoricalLegendData = derived(legendData, ($legendData) =>
		$legendData.filter((legend) => legend.legendType === 'categorical')
	);

	let scalarLegendData = derived(legendData, ($legendData) =>
		$legendData.filter((legend) => legend.legendType === 'scalar')
	);

	$: multiLegend =
		$categoricalLegendData.length > 1 ||
		$scalarLegendData.length > 1 ||
		($scalarLegendData.length > 0 && $categoricalLegendData.length > 0);

	let hideLegend = false;

	const handleLegendToggle = () => {
		hideLegend = !hideLegend;
	};

	const constHandleLegendButtonPosition = () => {
		let cssStyle = '';

		if (legendPosition.includes('bottom')) {
			cssStyle += 'flex-col';
		} else {
			cssStyle += 'flex-col-reverse';
		}

		if (legendPosition.includes('Right')) {
			cssStyle += ' ' + 'items-end';
		}
		return cssStyle;
	};

	function capitalize(str) {
		if (!str) return str;
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}
</script>

{#if $legendData.length > 0}
	<div
		class="absolute z-[401] m-4 flex max-w-60 flex legend-font {constHandleLegendButtonPosition()} 
    {positions[legendPosition] ?? 'top-3 left-[-9px]'}"
		on:wheel={(e) => e.stopPropagation()}
		on:dblclick={(e) => e.stopPropagation()}
		role="group"
	>
		{#if $categoricalLegendData.length > 0}
			<div class="flex flex-wrap hover:cursor-default">
				{#each $categoricalLegendData as legend}
					<div
						class="border-x-[1px] border-gray-300 bg-gray-100 flex transition-[border, padding] ease-in-out ease-in-out duration-[350ms] px-2 truncate {multiLegend
							? 'w-1/2'
							: 'max-w-48'} {hideLegend ? 'border-y-0 py-0' : 'border-y-[1px] py-1'}"
					>
						<CategoricalLegend
							{height}
							{legend}
							{handleLegendToggle}
							{hideLegend}
							{multiLegend}
							{capitalize}
						/>
					</div>
				{/each}
			</div>
		{/if}
		{#if $scalarLegendData.length > 0}
			{#each $scalarLegendData as legend}
				<div
					class="border-x-[1px] border-gray-300 bg-gray-100 overflow-hidden transition-[border, padding] duration-[350ms] ease-in-out px-2 {hideLegend
						? 'border-y-0 py-0'
						: 'border-y-[1px] py-1'}"
				>
					<ScalarLegend {legend} {handleLegendToggle} {hideLegend} {multiLegend} {capitalize} />
				</div>
			{/each}
		{/if}
		<div class="border border-gray-300 bg-gray-100 flex justify-center w-fit">
			<LegendToggle {handleLegendToggle} {hideLegend} {multiLegend} {legendPosition} />
		</div>
	</div>
{/if}
