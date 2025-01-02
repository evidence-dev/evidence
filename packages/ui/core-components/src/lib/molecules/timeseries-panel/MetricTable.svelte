<script>
	import { RadioGroup } from 'bits-ui';
	import MetricTableRow from './MetricTableRow.svelte';
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	export let selectedMetric;
	export let metricStore;
	export let data;
	export let fmt = 'num0';

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

{#if data && data.length > 0}
	<RadioGroup.Root bind:value={selectedMetric} type="single" asChild let:builder>
		<div
			class="text-xs grid grid-cols-3 gap-x-2 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-base-300 focus-visible:ring-offset-2 rounded-md"
			use:builder.action
			{...builder}
		>
			{#each metricStore as metric}
				<RadioGroup.Item value={metric.label} asChild let:builder>
					<div
						class="cursor-pointer grid-cols-subgrid grid col-span-6 relative items-center p-2 rounded-md group focus:outline-none focus-visible:ring-2 focus-visible:ring-base-300 focus-visible:ring-offset-2"
						use:builder.action
						{...builder}
					>
						<MetricTableRow {data} {metric} {selectedMetric} {fmt} />
						{#if selectedMetric == metric.label}
							<div
								in:send={{ key: 'trigger' }}
								out:receive={{ key: 'trigger' }}
								class="absolute top-0 h-full w-full rounded-md bg-base-100 border z-0"
							/>
						{/if}
					</div>
				</RadioGroup.Item>
			{/each}
		</div>
	</RadioGroup.Root>
{/if}
