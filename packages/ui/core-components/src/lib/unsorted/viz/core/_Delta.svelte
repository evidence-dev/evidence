<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import ValueError from '../core/ValueError.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

	export let data = undefined;
	export let row = 0;
	export let column = undefined;

	export let value = undefined;

	export let text = undefined; // text appearing after the delta (e.g., vs. prev month)

	export let chip = false;
	$: chip = chip === 'true' || chip === true;

	export let downIsGood = false;
	$: downIsGood = downIsGood === 'true' || downIsGood === true;

	export let fmt = undefined;
	export let format_object = undefined;
	export let columnUnitSummary = undefined;
	export let showValue = true;
	$: showValue = showValue === 'true' || showValue === true;

	export let showSymbol = true;
	$: showSymbol = showSymbol === 'true' || showSymbol === true;

	export let symbolPosition = 'right';

	export let align = 'right';
	export let fontClass = chip ? 'text-sm' : 'text-base';

	export let neutralMin = 0;
	export let neutralMax = 0;

	let colorOptions = {
		positive: {
			color: downIsGood ? 'var(--red-700)' : 'var(--green-700)',
			chipColor: downIsGood ? 'var(--red-100)' : 'var(--green-100)',
			chipBorder: downIsGood ? 'var(--red-300)' : 'var(--green-300)'
		},
		negative: {
			color: downIsGood ? 'var(--green-700)' : 'var(--red-700)',
			chipColor: downIsGood ? 'var(--green-100)' : 'var(--red-100)',
			chipBorder: downIsGood ? 'var(--green-300)' : 'var(--red-300)'
		},
		neutral: {
			color: 'var(--grey-500)',
			chipColor: 'var(--grey-100)',
			chipBorder: 'var(--grey-300)'
		}
	};

	let error;
	let selected_value;
	let columnSummary;
	let selected_format;
	let valueStatus;

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
					selected_format = getFormatObjectFromString(fmt, columnSummary[0].format?.valueType);
				} else {
					selected_format = columnSummary[0].format;
				}
			} else if (value !== undefined) {
				if (isNaN(value)) {
					throw Error('value must be a number (value=' + value + ')');
				} else {
					selected_value = value;
					selected_format = fmt
						? getFormatObjectFromString(fmt, 'number')
						: (format_object ?? undefined);
				}
			} else {
				throw Error(
					'No data or value provided. If you referenced a query result, check that the name is correct.'
				);
			}
			valueStatus =
				selected_value > neutralMax
					? 'positive'
					: selected_value < neutralMin
						? 'negative'
						: 'neutral';
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
		class="m-0 {fontClass} font-ui inline-block rounded-md"
		style:background-color={chip ? colorOptions[valueStatus].chipColor : undefined}
		style:border={chip ? `1px solid ${colorOptions[valueStatus].chipBorder}` : undefined}
		style:color={colorOptions[valueStatus].color}
		class:px-1={chip}
	>
		<span style:text-align={align ?? 'right'}>
			{#if symbolPosition === 'right'}
				{#if showValue}
					{#if selected_value === null}
						<span class="font-[system-ui]"> – </span>
					{:else}
						<span>
							{formatValue(selected_value, selected_format, columnUnitSummary)}
						</span>
					{/if}
				{/if}
				{#if showSymbol}
					<span class="font-[system-ui]"
						>{@html valueStatus === 'positive'
							? '&#9650;'
							: valueStatus === 'negative'
								? '&#9660;'
								: '–&thinsp;'}</span
					>
				{/if}
			{:else}
				{#if showSymbol}
					<span class="font-[system-ui]"
						>{@html valueStatus === 'positive'
							? '&#9650;'
							: valueStatus === 'negative'
								? '&#9660;'
								: '—'}</span
					>
				{/if}
				{#if showValue}
					{#if selected_value === null}
						<span class="font-[system-ui]"> – </span>
					{:else}
						<span>
							{formatValue(selected_value, selected_format, columnUnitSummary)}
						</span>
					{/if}
				{/if}
			{/if}
			{#if text}
				<span>
					{text}
				</span>
			{/if}
		</span>
	</span>
{:else}
	<ValueError {error} />
{/if}
