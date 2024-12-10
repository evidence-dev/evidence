<script>
	import Value from './Value.svelte';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import BigValueError from './BigValueError.svelte';
	import Sparkline from './Sparkline.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	import Delta from './Delta.svelte';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	export let data;
	export let value = null;
	export let comparison = null;
	export let comparisonDelta = true;
	$: comparisonDelta = comparisonDelta === 'true' || comparisonDelta === true;

	export let sparkline = null;
	export let sparklineType = 'line'; // line, area, or bar

	export let sparklineColor = undefined;
	$: sparklineColorStore = resolveColor(sparklineColor);

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

	/** @type {string | null}*/
	export let link = null;

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
		<p class="text-sm">{title}</p>
		<div class="relative text-xl font-medium my-0.5">
			{#if link}
				<a class="hover:bg-base-200" href={addBasePath(link)}>
					<Value {data} column={value} {fmt} />
				</a>
			{:else}
				<Value {data} column={value} {fmt} />
			{/if}
			{#if sparkline}
				<Sparkline
					height="15"
					{data}
					dateCol={sparkline}
					valueCol={value}
					type={sparklineType}
					interactive="true"
					color={sparklineColorStore}
					valueFmt={fmt ?? sparklineValueFmt}
					dateFmt={sparklineDateFmt}
					yScale={sparklineYScale}
					{connectGroup}
				/>
			{/if}
		</div>
		{#if comparison}
			{#if comparisonDelta}
				<p class="text-xs font-sans">
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
				<p class="text-xs font-sans /60 pt-[0.5px]">
					{#if link}
						<a class="hover:bg-base-200" href={addBasePath(link)}>
							<Value {data} column={comparison} fmt={comparisonFmt} />
						</a>
					{:else}
						<Value {data} column={comparison} fmt={comparisonFmt} />
					{/if}
					<span>{comparisonTitle}</span>
				</p>
			{/if}
		{/if}
	{/if}
</div>
