<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext, onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { setTrackProxy } from '@evidence-dev/sdk/usql';
	import { MetricsInputKey, MetricsContextKey } from '@evidence-dev/sdk/metrics/browser';
	import { Dropdown, DropdownOption } from '@evidence-dev/core-components';

	export let metric;
	const metricsContext = getContext(MetricsContextKey);

	// Override inputs context to scope into metrics
	const inputs = getContext(INPUTS_CONTEXT_KEY);
	const metricInputs = writable(setTrackProxy({}));
	onMount(() => metricInputs.subscribe((v) => ($inputs[MetricsInputKey][metric] = v)));
	setContext(INPUTS_CONTEXT_KEY, metricInputs);

	$: console.log(JSON.parse(JSON.stringify($metricInputs)));
</script>

{#if metric in metricsContext}
	<Dropdown title="Dimensions" name="dimensions" multiple>
		{#each metricsContext[metric].dimensions as dimension}
			<DropdownOption value={dimension} />
		{/each}
	</Dropdown>

	{#if metricsContext[metric].timeGrains.length}
		<Dropdown title="Grain" name="time_grain">
			<DropdownOption value="" valueLabel="All-Time" />
			{#if metricsContext[metric].timeGrains.includes('day')}<DropdownOption
					value="day"
					valueLabel="Day"
				/>{/if}
			{#if metricsContext[metric].timeGrains.includes('week')}<DropdownOption
					value="week"
					valueLabel="Week"
				/>{/if}
			{#if metricsContext[metric].timeGrains.includes('month')}<DropdownOption
					value="month"
					valueLabel="Month"
				/>{/if}
			{#if metricsContext[metric].timeGrains.includes('quarter')}<DropdownOption
					value="quarter"
					valueLabel="Quarter"
				/>{/if}
			{#if metricsContext[metric].timeGrains.includes('year')}<DropdownOption
					value="year"
					valueLabel="Year"
				/>{/if}
		</Dropdown>
	{/if}
	<Dropdown title="Aggregations" name="aggs" multiple>
		<DropdownOption value="sum(sales) as sum_sales" valueLabel="Sum" />
		<DropdownOption value="count(sales) as count_sales" valueLabel="Count" />
		<DropdownOption value="avg(sales) as avg_sales" valueLabel="Average" />
		<DropdownOption value="min(sales) as min_sales" valueLabel="Minimum" />
		<DropdownOption value="max(sales) as max_sales" valueLabel="Maximum" />
	</Dropdown>
{:else if metric}
	Metric {metric} not found
{:else}
	metric attribute is required
{/if}
