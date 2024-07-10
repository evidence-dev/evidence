<script>
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import ValueError from './ValueError.svelte';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

	// Passing in value from dataset:
	export let data = null;
	export let row = 0;
	export let column = null;

	// alias for column
	export let value = null;
	$: if (value && column) {
		console.warn(
			'Both "value" and "column" were supplied as props to Value. "value" will be ignored.'
		);
	}
	$: column = column ?? value;

	// Placeholder text when data not supplied:
	export let placeholder = null;

	// Value Formatting:
	export let fmt = undefined;
	let format_object;

	let selected_value;
	let error;

	// Value Styling Props:
	export let color = undefined;
	let fontColor = '';
	// Negative value font color:
	export let redNegatives = false;
	$: redNegatives = redNegatives === 'true' || redNegatives === true;

	$: if (redNegatives || color) {
		if (redNegatives && selected_value < 0) {
			fontColor = 'rgb(220 38 38)';
		} else if (color) {
			fontColor = color;
		}
	}

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

					const dateCols = columnSummary
						.filter((d) => d.type === 'date' && !(data[0]?.[d.id] instanceof Date))
						.map((d) => d.id);

					for (let i = 0; i < dateCols.length; i++) {
						data = convertColumnToDate(data, dateCols[i]);
					}

					selected_value = data[row][column];
					columnSummary = columnSummary.filter((d) => d.id === column);
					if (fmt) {
						format_object = getFormatObjectFromString(fmt, columnSummary[0].format?.valueType);
					} else {
						format_object = columnSummary[0].format;
					}
				} else {
					throw Error(
						'No data provided. If you referenced a query result, check that the name is correct.'
					);
				}
			}
		} catch (e) {
			error = e.message;
			const setTextRed = '\x1b[31m%s\x1b[0m';
			console.error(setTextRed, `Error in Value: ${error}`);
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
	<span style="color: {fontColor}">
		{formatValue(selected_value, format_object)}
	</span>
{:else}
	<ValueError {error} />
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
