<script>
	// @ts-check
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
	import { resolveMaybePromise } from '@evidence-dev/sdk/usql';

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
	/** @type {import("svelte/store").Writable<{dimension: string, value: string | string[] | undefined}[]>}*/
	let selectedDimensions = getContext('selected-dimensions');
	//multiple
	export let multiple = false;
	/** @type {string | string[] | undefined}*/
	let selectedValue = multiple ? [] : undefined;

	$: {
		if (
			selectedValue === undefined ||
			(Array.isArray(selectedValue) && selectedValue.length === 0)
		) {
			selectedDimensions.update((v) => {
				return v.filter((d) => d.dimension !== dimension.column_name);
			});
		} else {
			selectedDimensions.update((v) => {
				let newV = v.filter((d) => d.dimension !== dimension.column_name);
				newV.push({ dimension: dimension.column_name, value: selectedValue });
				return newV;
			});
		}
	}

	const updateSelected = (row) => {
		if (Array.isArray(selectedValue)) {
			if (selectedValue.includes(row.dimensionValue)) {
				selectedValue = selectedValue.filter((v) => v !== row.dimensionValue);
			} else {
				selectedValue = [...selectedValue, row.dimensionValue];
			}
		} else {
			selectedValue === row.dimensionValue
				? (selectedValue = undefined)
				: (selectedValue = row.dimensionValue);
		}
	};

	$: dimensionCutQuery = getDimensionCutQuery(
		data,
		dimension,
		metric,
		limit,
		$selectedDimensions,
		selectedValue
	);

	let results;
	/** @type {boolean} */
	let queryRun = false;

	$: if (!queryRun && dimensionCutQuery) {
		results = buildQuery(dimensionCutQuery, `dimension-cut-${dimension.column_name}`);
		queryRun = true;
	}

	$: {
		const updatedResults = buildQuery(dimensionCutQuery);
		if (!updatedResults.loaded) {
			resolveMaybePromise(() => {
				results = updatedResults;
			}, updatedResults.fetch());
		} else {
			results = updatedResults;
		}
	}

	// container minheight
	$: minRem = 1.2 * Math.max(limit);

	//find missing values
	/** @type {string[]} */
	let missingValues = [];
	$: if (Array.isArray(selectedValue)) {
		missingValues = selectedValue.filter(
			(v) => ![...results].map((d) => d.dimensionValue).includes(v)
		);
	}
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
		{#if loaded?.length > 0 || (Array.isArray(selectedValue) && selectedValue.length > 0)}
			{@const columnSummary = getColumnSummary(loaded, 'array')?.filter((d) => d.id === 'metric')}
			<div class="transition-all" style={`min-height:${minRem}rem;`}>
				{#each loaded as row (row.dimensionValue)}
					<div
						class={cn('flex transition duration-100 group cursor-pointer')}
						animate:flip={{ duration: 300 }}
						on:click={updateSelected(row)}
						on:keydown={updateSelected(row)}
						role="button"
						tabindex="-1"
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
				<!-- if selectedValues is an array, and if a value in selected values is not in loaded, render a <p>Missing Value</p> -->
				{#if missingValues.length > 0}
					{#each missingValues as missingValue (missingValue)}
						<div
							class={cn('flex transition duration-100 group cursor-pointer')}
							on:click={updateSelected({ dimensionValue: missingValue })}
							on:keydown={updateSelected({ dimensionValue: missingValue })}
							animate:flip={{ duration: 200 }}
							role="button"
							tabindex="-1"
						>
							<DimensionRow
								row={{ dimensionValue: missingValue }}
								{selectedValue}
								value={formatValue(
									missingValue,
									columnSummary[0].format,
									columnSummary[0].columnUnitSummary
								)}
							/>
						</div>
					{/each}
				{/if}
			</div>
		{:else}
			<p class="text-xs text-gray-500 p-2 my-2 w-full border border-dashed rounded">No Records</p>
		{/if}
	</QueryLoad>
</div>
