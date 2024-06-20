<script>
	import Value from './Value.svelte';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import BigValueError from './BigValueError.svelte';
	import Sparkline from './Sparkline.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import Delta from './Delta.svelte';
	export let data;
	export let value = null;
	export let comparison = null;
	export let comparisonDelta = true;
	$: comparisonDelta = comparisonDelta === 'true' || comparisonDelta === true;

	export let sparkline = null;
	export let sparklineType = 'line'; // line, area, or bar
	export let sparklineColor = undefined;
	export let sparklineValueFmt = undefined;
	export let sparklineDateFmt = undefined;
	export let sparklineYScale = false;
	$: sparklineYScale = sparklineYScale === 'true' || sparklineYScale === true;
	export let connectGroup = undefined;

	// Formatting:
	export let fmt = undefined;
	export let comparisonFmt = undefined;

	export let title = null;
	export let comparisonTitle = null;

	// Delta controls
	export let downIsGood = false;
	$: downIsGood = downIsGood === 'true' || downIsGood === true;
	export let neutralMin = 0;
	export let neutralMax = 0;

	export let maxWidth = 'none';
	export let minWidth = '18%';

	let positive = true;
	let comparisonColor = 'var(--grey-700)';

	/** @type {string}*/
	export let url = undefined;

	let chartType = 'Big Value';

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

		if (sparkline) {
			checkInputs(data, [sparkline]);
			if (columnSummary.find((d) => d.id === sparkline)?.type !== 'date') {
				throw Error('sparkline must be a date column');
			}
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
					height="15"
					{data}
					dateCol={sparkline}
					valueCol={value}
					type={sparklineType}
					interactive="true"
					color={sparklineColor}
					valueFmt={fmt ?? sparklineValueFmt}
					dateFmt={sparklineDateFmt}
					yScale={sparklineYScale}
					{connectGroup}
				/>
			{/if}
		</div>
		{#if comparison}
			{#if comparisonDelta}
				<p class="text-xs font-sans" style={`color:${comparisonColor}`}>
					<Delta
						{data}
						column={comparison}
						fmt={comparisonFmt}
						fontClass="text-xs"
						symbolPosition="left"
						{neutralMin}
						{neutralMax}
						text={comparisonTitle}
						{downIsGood}
					/>
				</p>
			{:else}
				<p class="text-xs font-sans text-gray-500 pt-[0.5px]">
					<Value {data} column={comparison} fmt={comparisonFmt} />
					<span>{comparisonTitle}</span>
				</p>
			{/if}
		{/if}
	{/if}
	{#if url}
		<a href={url}
			><div
				class="flex items-center w-fit m-1 ml-0 mr-0 pr-[1.25px] border-b border-transparent hover:border-gray-500"
			>
				<svg viewBox="1 4.5 14 14" fill="currentColor" width="10" height="10">
					<path d="M9 6l6 6-6 6V6z" transform="translate(-7, 0)" />
				</svg>
				<span style="font-size: 10px; margin:0px;">Details</span>
			</div>
		</a>
	{/if}
</div>
