<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import TimeSeriesPanelChart from './TimeSeriesPanelChart.svelte';
	import { QueryLoad } from '../../atoms/query-load/index.js';
	import { RadioGroup } from 'bits-ui';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	export let data = undefined;
	export let metrics = undefined;

	let selectedMetric = metrics[0];

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<QueryLoad {data} let:loaded>
	<div class="rounded-xl p-3 grid grid-rows-2 sm:grid-cols-2 sm:grid-rows-1 gap-6 bg-gray-50 mb-4">
		<RadioGroup.Root bind:value={selectedMetric} type="single" asChild let:builder>
			<div
				class="text-xs text-gray-500 font-medium grid grid-cols-4 gap-x-2 tabular-nums"
				use:builder.action
				{...builder}
			>
				{#each metrics as metric}
					<RadioGroup.Item value={metric} asChild let:builder>
						<div
							class="cursor-pointer grid-cols-subgrid grid col-span-6 relative items-center p-2"
							use:builder.action
							{...builder}
						>
							<div
								class="truncate text-left shrink uppercase col-span-3 relative z-10 data-[state=checked]:font-bold"
							>
								{metric}
							</div>
							<div class="text-right relative z-10">
								{Math.floor(Math.random() * 5000).toLocaleString()}
							</div>
							<div class="text-green-600 text-right relative z-10">
								+{Math.floor(Math.random() * 11).toLocaleString()}
							</div>
							<div class="text-righ relative z-10">
								<span class="px-3 bg-green-100 border-green-200 border rounded text-green-600">
									+{Math.floor(Math.random() * 10).toLocaleString()}%
								</span>
							</div>
							{#if selectedMetric === metric}
								<div
									in:send={{ key: 'trigger' }}
									out:receive={{ key: 'trigger' }}
									class="absolute top-0 h-full w-full rounded-lg bg-gray-100 border z-0"
								/>
							{/if}
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
