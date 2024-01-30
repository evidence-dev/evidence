<script>
	import { getContext } from 'svelte';
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { fmt as format } from '@evidence-dev/component-utilities/formatting';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	import { flip } from 'svelte/animate';
	export let dimension;
	export let metric;
	export let limit;
	export let data;
	export let fmt;
	export let whereClause;

	export let others;
	export let grandTotal;

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

	let cut;
	let allOthers;
	let totalRow;

	$: cut = buildQuery(
		`select ${dimension.name} as dimension, ${metric} as metric, ${metric} filter(${whereClause}) as filteredMetric, metric/sum(metric) over() as percentOfMaxMetric from (${$data.originalText}) group by 1 order by 3 desc, 2 desc limit ${limit}`,
		'cut'
	);

	$: allOthers = buildQuery(
		`select count(distinct ${dimension.name}) as n_records, ${metric} as metric from (${$data.originalText}) where ${dimension.name} not in (select dimension from (${$cut.originalText}))`
	);

	$: totalRow = buildQuery(
		`select count(distinct ${dimension.name}) as n_records, ${metric} as metric from (${$data.originalText})`
	);

	$: cut?.fetch();
	$: allOthers?.fetch();
	$: totalRow?.fetch();
</script>

<!-- {$data.originalText} -->

<div class="w-full sm:w-64 text-sm sm:flex-1">
	<div class="capitalize pb-1 px-1 text-medium border-b">
		{formatTitle(dimension.name)}
	</div>
	{#each $cut as row, i (row.dimension)}
		<div
			class="flex justify-between relative px-1 hover:bg-gray-50 group cursor-pointer"
			on:click={() => {
				selectedValue === row.dimension
					? (selectedValue = undefined)
					: (selectedValue = row.dimension);
			}}
			animate:flip={{ duration: 200 }}
		>
			<span class="text-gray-900 z-10 truncate">
				{row.dimension}
			</span>
			<span class="text-gray-700 tabular-nums z-10">
				{format(row.filteredMetric, fmt)}
			</span>
			<div
				class="absolute inset-0 bg-blue-100/50 z-0 group-hover:bg-blue-200/50 transition duration-200"
				style={'width:' + Math.max(row.percentOfMaxMetric * 100, 0) + '%'}
			/>
		</div>
	{/each}
	{#if others}
		{#each $allOthers as row, i}
			{#if row.n_records > 0}
				<div class="flex justify-between relative px-1 hover:bg-gray-50 group">
					<span class="text-gray-900 z-10 lowercase">
						{row.n_records} others
					</span>
					<span class="text-gray-700 tabular-nums z-10">
						{format(row.metric, fmt)}
					</span>
					<div
						class="absolute inset-0 z-0 bg-blue-100/50 group-hover:bg-blue-200/50 transition duration-200"
						style={'width:' + Math.max(row.percentOfMaxMetric * 100, 0) + '%'}
					/>
				</div>
			{/if}
		{/each}
	{/if}
	{#if grandTotal}
		{#each $totalRow as row, i}
			<div class="flex justify-between relative px-1 font-medium hover:bg-gray-50 group">
				<span class="text-gray-900 z-10 capitalize"> Total </span>
				<span class="text-gray-700 tabular-nums z-10">
					{format(row.metric, fmt)}
				</span>
			</div>
		{/each}
	{/if}
</div>
