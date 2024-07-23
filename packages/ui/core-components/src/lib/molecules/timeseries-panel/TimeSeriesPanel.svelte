<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { QueryLoad } from '../../atoms/query-load/index.js';
	import { RadioGroup } from 'bits-ui';

	export let data = undefined;
	export let metrics = undefined;

	let selectedMetric = metrics[0];
</script>

<QueryLoad {data} let:loaded>
	<div class="rounded-xl p-2 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-4 bg-gray-50 mb-4">
			<RadioGroup.Root bind:value={selectedMetric} type="single" asChild let:builder>
				<div
					class="text-xs py-2 px-2 text-gray-600 grid grid-cols-6 tabular-nums gap-y-3 gap-x-2"
					use:builder.action
					{...builder}
				>
					{#each metrics as metric}
						<RadioGroup.Item value={metric} asChild let:builder>
							<div class="contents cursor-pointer group" use:builder.action {...builder}>
								<div class="truncate capitalize col-span-3 text-left font-medium shrink">
									{metric}
								</div>
								<div class="text-right">
									{Math.floor(Math.random() * 5000).toLocaleString()}
								</div>
								<div class="text-green-600 text-right">
									+{Math.floor(Math.random() * 11).toLocaleString()}
								</div>
								<div class="text-right">
									<span class="px-3 bg-green-200/40 rounded-sm text-green-700">
										+{Math.floor(Math.random() * 10).toLocaleString()}%
									</span>
								</div>
							</div>
						</RadioGroup.Item>
					{/each}
				</div>
			</RadioGroup.Root>
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
