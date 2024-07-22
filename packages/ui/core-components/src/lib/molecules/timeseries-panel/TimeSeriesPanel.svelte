<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	export let data;
	import { QueryLoad } from '../../atoms/query-load/index.js';

	let selectedMetric = 'growing_value';
</script>

<QueryLoad {data} let:loaded>
	<div class="rounded-xl p-2 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-4 bg-gray-50 mb-4">
		<div>
			{#each ['ARR', 'WAU', 'Cloud WAU', 'Week 4 Retention', 'GH Stars'] as metric}
				{#if metric === 'ARR'}
					<div
						class="flex justify-between text-xs rounded py-2 px-2 hover:text-gray-950 last:border-none cursor-pointer select-none"
						on:click={() => (selectedMetric = 'growing_value')}
					>
						<div class="whitespace-nowrap truncate font-semibold">{metric}</div>
						<div class="flex gap-3 tabular-nums">
							<span class="font-semibold">{Math.floor(Math.random() * 5000).toLocaleString()}</span>
							<span class="text-green-600">+{Math.floor(Math.random() * 11).toLocaleString()}</span>
							<span class="px-3 bg-green-200/40 rounded-sm text-green-700"
								>+{Math.floor(Math.random() * 10).toLocaleString()}%</span
							>
						</div>
					</div>
				{:else}
					<div
						class="flex justify-between text-xs rounded py-2 px-2 hover:text-gray-950 text-gray-700 last:border-none cursor-pointer"
						on:click={() => (selectedMetric = 'declining_value')}
					>
						<div class="whitespace-nowrap truncate">{metric}</div>
						<div class="flex gap-3 tabular-nums">
							<span class="">{Math.floor(Math.random() * 5000).toLocaleString()}</span>
							<span class="text-green-600">+{Math.floor(Math.random() * 11).toLocaleString()}</span>
							<span class="px-3 bg-green-200/40 rounded-sm text-green-700"
								>+{Math.floor(Math.random() * 10).toLocaleString()}%</span
							>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		<div class="">
			<TimeSeriesPanelChart {data} {selectedMetric} />
		</div>
	</div>
	<svelte:fragment let:loaded slot="error">
		<div class="big-red-100">{data.error}</div>
	</svelte:fragment>
	<svelte:fragment slot="skeleton">
		<!-- No loading state -->
	</svelte:fragment>
</QueryLoad>

{selectedMetric}