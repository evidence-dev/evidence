<script>
	import DimensionRow from './DimensionRow.svelte';

	import { getContext } from 'svelte';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import { flip } from 'svelte/animate';
	import { cn } from '$lib/utils';
	import { getDimensionCutQuery } from './dimensionGridQuery.js';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';

	export let dimension;
	export let data;
	export let metric;
	export let metricLabel;
	export let limit;

	// Selected Value
	let selectedDimensions = getContext('selected-dimensions');
	let selectedValue;

	$: if (selectedValue !== undefined) {
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

	// Dimension Cut Query
	$: dimensionCutQuery = getDimensionCutQuery(
		data,
		dimension,
		metric,
		limit,
		$selectedDimensions,
		selectedValue
	);

	let results = buildQuery(dimensionCutQuery, `dimension-cut-${dimension.name}`);

	results.fetch();

	$: {
		const updatedResults = buildQuery(dimensionCutQuery);
		if (!updatedResults.loaded) {
			updatedResults.fetch().then(() => {
				results = updatedResults;
			});
		} else {
			results = updatedResults;
		}
	}

	// Format
	$: columnSummary = getColumnSummary($results, 'array')?.filter((d) => d.id === 'metric');
</script>

<pre>
<!-- {$results.originalText} -->
<!-- {selectedValue} -->
<!-- {JSON.stringify($selectedDimensions)} -->
</pre>
{#if $results.error && $results.loaded}
	<div class="text-red-500">
		{$results.error}
	</div>
{:else}
	<div class="w-full sm:w-1/3 text-sm antialiased text-gray-700 pr-4 pb-4">
		<div class="capitalize border-b flex justify-between items-baseline">
			<span class="truncate">
				{formatTitle(dimension.name)}
			</span>
			<span class="truncate">
				{metricLabel ?? ''}
			</span>
		</div>
		{#each $results as row (row.dimensionValue)}
			<div
				class={cn('flex transition duration-100 group cursor-pointer')}
				on:click={updateSelected(row)}
				on:keydown={updateSelected(row)}
				animate:flip={{ duration: 100 }}
			>
				<DimensionRow
					{row}
					{selectedValue}
					value={formatValue(
						row.metric,
						columnSummary[0].format,
						columnSummary[0].columnUnitSummary
					)}
				/>
			</div>
		{/each}
	</div>
{/if}
