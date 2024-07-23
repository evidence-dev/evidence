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
	import QueryLoad from '../../atoms/query-load/QueryLoad.svelte';

	/** @type {import("@evidence-dev/sdk/usql").DescribeResultRow} */
	export let dimension;
	export let data;
	export let metric;
	export let metricLabel;
	export let limit;

	if (dimension.column_name.includes(' ')) {
		dimension.column_name = `"${dimension.column_name}"`;
	}

	// Selected Value
	let selectedDimensions = getContext('selected-dimensions');
	let selectedValue;

	//multiple prop
	let multiple = true;
	let multipleSelectedValues = [];
	
	
	$: if (selectedValue !== undefined) {
		console.log('running')
		selectedDimensions.update((v) => {
			let newV = v.filter((d) => d.dimension !== dimension.column_name);
			newV.push({ dimension: dimension.column_name, value: selectedValue });
			return newV;
		});
	} else {
		selectedDimensions.update((v) => {
			return v.filter((d) => d.dimension !== dimension.column_name);
		});
	}
	const updateSelected = (row) => {
		if (multiple) {
			if (!multipleSelectedValues.includes(row.dimensionValue)) {
				multipleSelectedValues = [...multipleSelectedValues, row.dimensionValue];
			} else {
				multipleSelectedValues = multipleSelectedValues.filter((v) => v !== row.dimensionValue);
			}
		} else {
			selectedValue === row.dimensionValue
			? (selectedValue = undefined)
			: (selectedValue = row.dimensionValue);
		}
	};

	// $:console.log(selectedValue)
	
	// Dimension Cut Query
	let dimensionCutQuery = getDimensionCutQuery(
		data,
		dimension,
		metric,
		limit,
		$selectedDimensions,
		selectedValue
	);

	$: dimensionCutQuery = getDimensionCutQuery(
		data,
		dimension,
		metric,
		limit,
		$selectedDimensions,
		selectedValue
	);

	let results = buildQuery(dimensionCutQuery, `dimension-cut-${dimension.column_name}`);

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

	// container height
	// there can never be more than limit + 1 records.
	// We don't want height to move down when we filter to fewer records
	let heightRem = 1.2 * (Number(limit) + 1);
</script>

<!-- {dimensionCutQuery} -->

<div class="w-60 flex-shrink-0 sm:w-1/4 text-sm antialiased text-gray-700 pr-4 pb-4 overflow-clip">
	<div class="capitalize border-b flex justify-between items-baseline">
		<span class="truncate w-2/3">
			{formatTitle(dimension.column_name)}
		</span>
		<span class="truncate w-1/3 text-right">
			{metricLabel ?? ''}
		</span>
	</div>
	<QueryLoad data={results} let:loaded>
		<p
			slot="error"
			class="my-2 font-mono text-red-600 text-xs bg-red-50 border-red-200 p-4 overflow-auto rounded border"
		>
			{$results.error}
		</p>
		{#if loaded?.length > 0}
			{@const columnSummary = getColumnSummary(loaded, 'array')?.filter((d) => d.id === 'metric')}
			<div style={`height:${heightRem}rem`}>
				{#each loaded as row (row.dimensionValue)}
					<div
						class={cn('flex transition duration-100 group cursor-pointer')}
						on:click={updateSelected(row)}
						on:keydown={updateSelected(row)}
						animate:flip={{ duration: 100 }}
						role="button"
						tabindex="-1"
					>
						<DimensionRow
							{row}
							{selectedValue}
							{multipleSelectedValues}
							value={formatValue(
								row.metric,
								columnSummary[0].format,
								columnSummary[0].columnUnitSummary
							)}
						/>
					</div>
				{/each}
				<p></p>
			</div>
		{:else}
			<p class="text-xs text-gray-500 p-2 my-2 w-full border border-dashed rounded">No Records</p>
		{/if}
	</QueryLoad>
</div>
