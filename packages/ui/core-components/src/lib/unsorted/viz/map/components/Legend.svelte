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

	const handleChevronDirection = (legendType) => {
		if (legendType === 'scalar') {
			return legendPosition.includes('Left') ? 'left' : 'right';
		} else if (legendType === 'categorical') {
			return legendPosition.includes('bottom') ? 'up' : 'down';
		}
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
</script>

{#if $legendData.length > 0}
	<div
		class="absolute z-[401] m-6 flex max-w-96 flex {constHandleLegendButtonPosition()} 
    {positions[legendPosition] ?? 'top-3 left-[-9px]'}"
		on:wheel={(e) => e.stopPropagation()}
		on:dblclick={(e) => e.stopPropagation()}
		role="group"
	>
		{#if $categoricalLegendData.length > 0}
			<div class="flex">
				{#each $categoricalLegendData as legend}
					<div
						class="border-x-[1px] border-gray-300 bg-gray-100 overflow-hidden legend-font w-fit flex transition-[border] ease-in-out ease-in-out duration-[350ms] {hideLegend
							? 'border-y-0'
							: 'border-y-[1px]'}"
					>
						<CategoricalLegend
							{height}
							{legend}
							{handleLegendToggle}
							{hideLegend}
							{multiLegend}
							direction={handleChevronDirection(legend.legendType)}
						/>
					</div>
				{/each}
			</div>
		{/if}
		{#if $scalarLegendData.length > 0}
			{#each $scalarLegendData as legend}
				<div
					class="border-x-[1px] border-gray-300 bg-gray-100 overflow-hidden legend-font w-full items-center flex transition-[border] duration-[350ms] ease-in-out {handleChevronDirection(
						legend.legendType
					) === 'right'
						? 'flex-row-reverse'
						: 'flex-row'} {hideLegend ? 'border-y-0' : 'border-y-[1px]'}"
				>
					<ScalarLegend
						{legend}
						{handleLegendToggle}
						{hideLegend}
						{multiLegend}
						direction={handleChevronDirection(legend.legendType)}
					/>
				</div>
			{/each}
		{/if}

		{#if true}
			<div
				class="border border-gray-300 bg-gray-100 margin-auto justify-center items-center pl-[2px] pr-[3.5px] w-[88.5px]"
			>
				<LegendToggle legendType="categorical" {handleLegendToggle} {hideLegend} {multiLegend} />
			</div>
		{/if}
	</div>
{/if}
