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

	let categoricalLegendData = derived(legendData, ($legendData) =>
		$legendData.filter((legend) => legend.legendType === 'categorical')
	);

	let scalarLegendData = derived(legendData, ($legendData) =>
		$legendData.filter((legend) => legend.legendType === 'scalar')
	);

	$: multiLegend =
		$categoricalLegendData.length > 1 ||
		$scalarLegendData.length > 1 ||
		($scalarLegendData.length > 0 && $categoricalLegendData.length > 0);

	console.log(multiLegend, legendPosition);

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

	const constHandleMultiLegendChevronPosition = () => {
		let cssStyle = '';

		if (multiLegend) {
			if (legendPosition.includes('bottom')) {
				cssStyle += 'flex-col';
			} else {
				cssStyle += 'flex-col-reverse';
			}

			if (legendPosition.includes('Right')) {
				cssStyle += ' ' + 'items-end';
			}
			console.log(cssStyle, legendPosition);
			return cssStyle;
		}
	};
</script>

{#if $legendData.length > 0}
	<div
		class="absolute z-[401] m-6 flex {constHandleMultiLegendChevronPosition()} 
    {positions[legendPosition] ?? 'top-3 left-[-9px]'}"
		on:wheel={(e) => e.stopPropagation()}
		on:dblclick={(e) => e.stopPropagation()}
		role="group"
	>
		{#if $categoricalLegendData.length > 0}
			<div class="flex">
				{#each $categoricalLegendData as legend}
					<div
						class="border-x-[1px] border-gray-300 bg-gray-100 overflow-hidden legend-font w-fit max-w-96 items-center flex {multiLegend &&
						hideLegend
							? 'border-y-0'
							: 'border-y-[1px]'}"
					>
						<CategoricalLegend
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
					class="border-x-[1px] border-gray-300 bg-gray-100 overflow-hidden legend-font w-full max-w-96 items-center flex transition-[border] duration-[350ms] ease-in-out {multiLegend &&
					hideLegend
						? 'border-y-0'
						: 'border-y-[1px]'}"
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

		{#if multiLegend}
			<div class="w-[25px] border border-gray-300 bg-gray-100 margin-auto h-5 flex items-center">
				<LegendToggle legendType="categorical" {handleLegendToggle} {hideLegend} {multiLegend} />
			</div>
		{/if}
	</div>
{/if}
