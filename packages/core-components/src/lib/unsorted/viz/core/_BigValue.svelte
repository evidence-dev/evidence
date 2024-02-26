<script>
	import Value from './Value.svelte';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import BigValueError from './BigValueError.svelte';
	import Sparkline from './Sparkline.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	export let data;
	export let value = null;
	export let comparison = null;
	export let sparkline = null;
	export let sparklineType = 'line'; // line, area, or bar
	export let sparklineColor = undefined;
	export let sparklineValueFmt = undefined;
	export let sparklineDateFmt = undefined;
	export let sparklineYScale = false;
	$: sparklineYScale = sparklineYScale === 'true' || sparklineYScale === true;
	export let sparklineConnect = false;
	$: sparklineConnect = sparklineConnect === 'true' || sparklineConnect === true;

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

	let error = undefined;
	$: try {
		error = undefined;

		// check if dataset exists
		checkInputs(data);

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
	} catch (e) {
		error = e;
		const setTextRed = '\x1b[31m%s\x1b[0m';
		console.error(setTextRed, `Error in Big Value: ${error.message}`);
		if (strictBuild) {
			throw error;
		}
	}

</script>

<div
	class="inline-block font-sans pt-2 pb-3 pr-3 pl-0 mr-3 items-center align-top"
	style={`
        min-width: ${minWidth};
        max-width: ${maxWidth};
    `}
>
	{#if error}
		<BigValueError chartType="Big Value" error={error.message} />
	{:else}
		<p class="text-sm text-gray-700">{title}</p>
		<div class="relative text-xl font-medium text-gray-700 my-0.5">
			<Value {data} column={value} {fmt} />
			{#if sparkline}
				<Sparkline
					height=15
					data={data}
					dateCol={sparkline}
					valueCol={value}
					type={sparklineType}
					interactive=true
					color={sparklineColor}
					valueFmt={fmt ?? sparklineValueFmt}
					dateFmt={sparklineDateFmt}
					yScale={sparklineYScale}
					connect={sparklineConnect}
				/>
			{/if}
		</div>
		{#if comparison}
			<p class="text-xs font-sans" style={`color:${comparisonColor}`}>
				<span class="font-[system-ui]"> {@html positive ? '&#9650;' : '&#9660;'} </span>
				<Value {data} column={comparison} fmt={comparisonFmt} />
				<span>{comparisonTitle}</span>
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
	}</style>
