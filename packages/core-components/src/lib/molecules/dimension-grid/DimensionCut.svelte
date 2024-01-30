<script>
	import DimensionRow from './DimensionRow.svelte';

	import { getContext } from 'svelte';
	import { fmt as format } from '@evidence-dev/component-utilities/formatting';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import { flip } from 'svelte/animate';
	import { cn } from '$lib/utils';
	import { Check } from 'radix-icons-svelte';

	export let dimension;
	export let data;
	export let fmt;

	// Selected Value
	let selectedDimensions = getContext('selected-dimensions');
	let selectedValue;

	$: if (selectedValue) {
		selectedDimensions.update((v) => {
			let newV = v.filter((d) => d.dimension !== dimension.name);
			newV.push({ dimension: dimension.name, value: selectedValue });
			return newV;
		});
	} else {
		selectedDimensions.update((v) => {
			return v.filter((d) => d.dimension !== dimension.name);
		});
	}
	const updateSelected = (row) => {
		selectedValue === row.dimensionValue
			? (selectedValue = undefined)
			: (selectedValue = row.dimensionValue);
	};

	$: filteredData = data.filter((d) => d.dimensionName === dimension.name);
</script>

<div class="w-full sm:w-60 text-sm antialiased">
	<div class="capitalize ml-4 text-medium border-b flex justify-between items-baseline">
		<span>
			{formatTitle(dimension.name)}
		</span>
		<span class="text-xs"> Avg. Sales </span>
	</div>
	{#each filteredData as row (row.dimensionValue)}
		<div
			class={cn('flex transition duration-100 group cursor-pointer')}
			on:click={updateSelected(row)}
			on:keydown={updateSelected(row)}
			animate:flip={{ duration: 100 }}
		>
			<div
				class={cn('w-4 text-transparent transition duration-100 flex items-center', {
					'text-gray-600': selectedValue === row.dimensionValue
				})}
			>
				<Check class="h-4 w-4 z-10 " />
			</div>
			<DimensionRow {row} />
		</div>
	{/each}
</div>
