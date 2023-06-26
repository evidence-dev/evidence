<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import Value from './Value.svelte';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { LinkedChart } from 'svelte-tiny-linked-charts';
	import getSortedData from '@evidence-dev/component-utilities/getSortedData';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ErrorChart from './ErrorChart.svelte';
	import { strictBuild } from './context';
	export let data;
	export let value = null;
	export let comparison = null;
	export let sparkline = null;

	// Formatting:
	export let fmt = undefined;
	export let comparisonFmt = undefined;

	export let title = null;
	export let comparisonTitle = null;

	// Delta controls
	export let downIsGood = false;

	export let maxWidth = 'none';
	export let minWidth = '18%';

	let positive = true;
	let comparisonColor = 'var(--grey-700)';

	let sparklineData = {};

	let error = undefined;
	$: try {
		error = undefined;

		if (!value) {
			throw new Error('value is required');
		}

		if (!Array.isArray(data)) {
			data = [data];
		}

		checkInputs(data, [value]);

		let columnSummary = getColumnSummary(data, 'array');

		// Fall back titles
		let valueColumnSummary = columnSummary.find((d) => d.id === value);
		title = title ?? (valueColumnSummary ? valueColumnSummary.title : null);

		if (comparison) {
			checkInputs(data, [comparison]);
			let comparisonColumnSummary = columnSummary.find((d) => d.id === comparison);
			comparisonTitle =
				comparisonTitle ?? (comparisonColumnSummary ? comparisonColumnSummary.title : null);
		}

		if (data && comparison) {
			positive = data[0][comparison] >= 0;
			comparisonColor =
				(positive && !downIsGood) || (!positive && downIsGood)
					? 'var(--green-700)'
					: 'var(--red-700)';
		}
		// populate sparklineData from data where timeseries is the key and value is the value
		if (data && sparkline && value) {
			// allow to load the LinkedChart
			let sortedData = getSortedData(data, sparkline, true);
			for (let i = 0; i < sortedData.length; i++) {
				sparklineData[sortedData[i][sparkline]] = sortedData[i][value];
			}
		}
	} catch (e) {
		error = e;
		if (strictBuild) {
			throw error;
		}
	}

	/**
	 * Hack to let time to LinkedChart to be loaded
	 */
	function isLinkedChartReady() {
		try {
			if (LinkedChart) {
				return true;
			}
		} catch (e) {
			return false;
		}
		return false;
	}
</script>

<div
	data-viz="BigValue"
	class="inline-block font-ui py-3 pr-3 pl-0 mr-3 items-center align-top"
	style={`
        min-width: ${minWidth};
        max-width: ${maxWidth};
    `}
>
	{#if error}
		<ErrorChart chartType="Big Value" error={error.message} />
	{:else}
		<p class="text-sm font-medium text-grey-700 text-shadow shadow-white m-0">{title}</p>
		<div class="relative">
			<Value {data} column={value} {fmt} />
			{#if sparkline}
				{#if isLinkedChartReady()}
					<div class="inline-block">
						<svelte:component
							this={LinkedChart}
							data={sparklineData}
							type="line"
							grow={true}
							barMinWidth="1"
							gap="0"
							fill="var(--grey-400)"
							align="left"
							hover={false}
							linked="id"
							width="75"
							tabindex={-1}
						/>
					</div>
				{/if}
			{/if}
		</div>
		{#if comparison}
			<p class="m-0 text-xs font-medium font-ui" style={`color:${comparisonColor}`}>
				{@html positive ? '&#9650;' : '&#9660;'}
				<Value {data} column={comparison} fmt={comparisonFmt} />
				<span class="text-grey-700 font-normal">{comparisonTitle}</span>
			</p>
		{/if}
	{/if}
</div>

<style>
	/* 
        TODO: Identify if this can be moved to app.css, or scoped to this component.
        Leaky global styles are problematic
     */
	div[data-viz='BigValue'] :global(svg) {
		height: 16px;
	}
</style>
