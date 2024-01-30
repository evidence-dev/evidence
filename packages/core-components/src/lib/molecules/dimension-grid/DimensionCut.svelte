<script>
	import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';
	import { fmt as format } from '@evidence-dev/component-utilities/formatting';
	import formatTitle from '@evidence-dev/component-utilities/formatTitle';
	export let dimension;
	export let metric;
	export let limit;
	export let data;
	export let fmt = 'usd';

	export let others;
	export let grandTotal;

	let cut = buildQuery(
		`select ${dimension.name} as dimension, ${metric} as metric, metric/sum(metric) over() as percentOfMaxMetric from (${$data.originalText}) group by 1 order by 2 desc limit ${limit}`
	);

	let allOthers = buildQuery(
		`select count(distinct ${dimension.name}) as n_records, ${metric} as metric from (${$data.originalText}) where ${dimension.name} not in (select dimension from (${$cut.originalText}))`
	);

	let totalRow = buildQuery(
		`select count(distinct ${dimension.name}) as n_records, ${metric} as metric from (${$data.originalText})`
	);

	cut.fetch();
	allOthers.fetch();
	totalRow.fetch();
</script>

{#if $cut.loaded && $allOthers.loaded && totalRow.loaded}
	<div class="w-full sm:w-64 text-sm">
		<div class="capitalize mb-1 text-base">
			{formatTitle(dimension.name)}
		</div>
		{#each $cut as row, i}
			<div class="flex justify-between relative px-1 hover:bg-gray-50 group">
				<span class="text-gray-900 z-10 truncate">
					{row.dimension}
				</span>
				<span class="text-gray-700 tabular-nums z-10">
					{format(row.metric, fmt)}
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
							{row.n_records} other {formatTitle(dimension.name)}s
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
{/if}
