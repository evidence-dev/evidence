<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { HelpCircle } from '@steeze-ui/tabler-icons';

	import PulseNumber from './PulseNumber.svelte';
	import { strictBuild } from './context';

	// Passing in value from dataset:
	export let data = null;
	export let row = 0;
	export let column = null;

	// Placeholder text when data not supplied:
	export let placeholder = null;

	// Value Formatting:
	export let fmt = undefined;

	let value;
	let error;

	let columnSummary;
	$: {
		try {
			error = undefined;
			if (!placeholder) {
				if (data) {
					if (typeof data == 'string') {
						throw Error(`Received: data=${data}, expected: data={${data}}`);
					}

					if (!Array.isArray(data)) {
						// Accept bare objects
						data = [data];
					}

					if (isNaN(row)) {
						throw Error('row must be a number (row=' + row + ')');
					}

					try {
						Object.keys(data[row])[0];
					} catch (e) {
						throw Error('Row ' + row + ' does not exist in the dataset');
					}

					column = column ?? Object.keys(data[row])[0];

					checkInputs(data, [column]);

					columnSummary = getColumnSummary(data, 'array');
					let dateCols = columnSummary.filter((d) => d.type === 'date');
					dateCols = dateCols.map((d) => d.id);
					if (dateCols.length > 0) {
						for (let i = 0; i < dateCols.length; i++) {
							data = convertColumnToDate(data, dateCols[i]);
						}
					}

					value = data[row][column];
					columnSummary = columnSummary.filter((d) => d.id === column);
					if (fmt) {
						fmt = getFormatObjectFromString(fmt, columnSummary[0].format.valueType);
					} else {
						fmt = columnSummary[0].format;
					}
				} else {
					throw Error(
						'No data provided. If you referenced a query result, check that the name is correct.'
					);
				}
			}
		} catch (e) {
			error = e.message;
			if (strictBuild) {
				throw error;
			}
		}
	}
</script>

{#if placeholder}
	<span class="placeholder"
		>[{placeholder}]<span class="error-msg">Placeholder: no data currently referenced.</span></span
	>
{:else if !error}
	<PulseNumber value={formatValue(value, fmt)} />
{:else}
	<span
		class="group inline-flex gap-1 items-center relative cursor-help text-white font-sans text-sm bg-red-700 rounded-2xl pl-2 pr-[1px] mx-0.5"
	>
		<span class="inline pl-1">Error</span>
		<Icon src={HelpCircle} class="w-6 h-6 text-gray-100 pb-0.5 pt-[1px]" />
		<span
			class="hidden group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-gray-800/80 leading-relaxed min-w-[150px] max-w-[400px] rounded-md"
			>{error}</span
		>
	</span>
{/if}

<style>
	.placeholder {
		display: inline;
		position: relative;
		cursor: help;
		color: blue;
	}

	.placeholder .error-msg {
		display: none;
		position: absolute;
		top: -5px;
		left: 105%;
		max-width: 400px;
		min-width: 150px;
		padding-left: 5px;
		padding-right: 5px;
		padding-top: 2px;
		padding-bottom: 1px;
		color: white;
		font-family: sans-serif;
		font-size: 0.8em;
		background-color: var(--grey-900);
		opacity: 0.85;
		border-radius: 6px;
		z-index: 1;
		word-wrap: break-word;
	}

	.placeholder:hover .error-msg {
		display: inline;
	}
</style>
