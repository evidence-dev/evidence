<script>
	import { RadioGroup } from 'bits-ui';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	export let metricStore = undefined;
	// export let timeSeriesStore = undefined;
	export let selectedMetric;

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<RadioGroup.Root bind:value={selectedMetric} type="single" asChild let:builder>
	<div
		class="text-xs text-gray-500 grid grid-cols-4 gap-x-2 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-2 rounded-md"
		use:builder.action
		{...builder}
	>
		{#each $metricStore as metric}
			<RadioGroup.Item value={metric.label} asChild let:builder>
				<div
					class="cursor-pointer grid-cols-subgrid grid col-span-6 relative items-center p-2 rounded-md group focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:ring-offset-2"
					use:builder.action
					{...builder}
				>
					<div
						class="truncate text-left shrink col-span-3 font-medium relative z-10 group-data-[state=checked]:text-gray-900 transition duration-200"
					>
						{metric.label}
					</div>
					<div
						class="text-right relative z-10 group-data-[state=checked]:text-gray-900 transition duration-200"
					>
						{Math.floor(Math.random() * 5000).toLocaleString()}
					</div>
					<div class="text-green-600 text-right relative z-10">
						+{Math.floor(Math.random() * 11).toLocaleString()}
					</div>
					<div class="text-righ relative z-10">
						<span class="px-2 bg-green-200/40 border-green-200 border rounded text-green-600">
							+{Math.floor(Math.random() * 10, 1).toLocaleString()}%
						</span>
					</div>
					{#if selectedMetric == metric.label}
						<div
							in:send={{ key: 'trigger' }}
							out:receive={{ key: 'trigger' }}
							class="absolute top-0 h-full w-full rounded-md bg-white border z-0"
						/>
					{/if}
				</div>
			</RadioGroup.Item>
		{/each}
	</div>
</RadioGroup.Root>
