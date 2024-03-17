<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { formatValue, getFormatObjectFromString} from '@evidence-dev/component-utilities/formatting';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import ValueError from '../core/ValueError.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

	export let data = undefined;
	export let row = 0;
	export let column = undefined;

	export let value = undefined;

	export let downIsGood = false; 
	$: downIsGood = downIsGood === 'true' || downIsGood === true;

	export let fmt = undefined;
	export let format_object = undefined;
	export let columnUnitSummary = undefined;
	export let showValue = true; 
	$: showValue = showValue === 'true' || showValue === true;

	export let deltaSymbol = true;
	$: deltaSymbol = deltaSymbol === 'true' || deltaSymbol === true;

	export let align = 'right'; 
	export let fontClass = 'text-base';

	export let neutralMin = 0
	export let neutralMax = 0

	let positiveColor = downIsGood ? 'var(--red-700)' : 'var(--green-700)';
	let negativeColor = downIsGood ? 'var(--green-700)' : 'var(--red-700)';
	let neutralColor = 'var(--grey-500)';

	$: valueStatus = value > neutralMax ? 'positive'
		: value < neutralMin ? 'negative'
		: 'neutral';

	$: value;

	let error;
	let selected_value;
	let columnSummary;
	let selected_format;

	$: {
		try {
			error = undefined;
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
			
				selected_value = data[row][column];
				columnSummary = columnSummary.filter((d) => d.id === column);
				if (fmt) {
					selected_format = getFormatObjectFromString(fmt, columnSummary[0].format.valueType);
				} else {
					selected_format = columnSummary[0].format;
				}
			} else if(value) {
				if(isNaN(value)){
					throw Error('value must be a number (value=' + value + ')');
				} else {
					selected_value = value;
					selected_format = fmt ? getFormatObjectFromString(fmt, 'number') : format_object ?? undefined;
				}
			} else {
				throw Error(
					'No data or value provided. If you referenced a query result, check that the name is correct.'
				);
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

{#if !error}
	<span
		class="m-0 {fontClass} font-ui inline-block"
		style="color: {valueStatus === 'positive' ? positiveColor : valueStatus === 'negative' ? negativeColor : neutralColor}"
	>
		<span style:text-align={align ?? 'right'}>
			{#if showValue}
				<span>
					{formatValue(selected_value, selected_format, columnUnitSummary)}
				</span>
				{#if deltaSymbol}
					<span class="font-[system-ui]">{@html valueStatus === 'positive' ? '&#9650;' : valueStatus === 'negative' ? '&#9660;' : '–&thinsp;'}</span>
				{/if}
			{/if}
		</span>
	</span>
{:else}
	<ValueError {error}/>
{/if}