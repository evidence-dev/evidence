<script>
	import { safeExtractColumn, weightedMean } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	const props = getContext(propKey);

	export let data;
	export let rowNumbers;
	export let columnSummary;
	export let backgroundColor = undefined;
	export let fontColor = undefined;
	export let groupType;
</script>

<!-- Totals row -->
<tr class="font-semibold border-t border-gray-600" style:background-color={backgroundColor} style:color={fontColor}>
	{#if rowNumbers && groupType !== 'side'}
		<td class="index w-[2%]" />
	{/if}

	{#each $props.columns.length > 0 ? $props.columns.sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) : columnSummary.filter((d) => d.show === true).sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) as column}
		{@const colColumnSummary = safeExtractColumn(column, columnSummary)}
		{@const format = column.totalFmt
			? getFormatObjectFromString(column.totalFmt)
			: column.fmt
			? getFormatObjectFromString(column.fmt)
			: colColumnSummary.format}
		<td
			class="{colColumnSummary.type} font-semibold border-t border-gray-600"
			style:text-align={column.align}
			style:height={column.height}
			style:width={column.width}
			style:white-space={column.wrap ? 'normal' : 'nowrap'}
		>
			{#if typeof column.totalAgg === 'undefined'}
				<!-- if totalAgg not specified -->
				{formatValue(
					colColumnSummary.columnUnitSummary.sum,
					format,
					colColumnSummary.columnUnitSummary
				)}
			{:else if ['sum', 'mean', 'median', 'min', 'max'].includes(column.totalAgg)}
				<!-- using a predefined aggregation -->
				{formatValue(
					colColumnSummary.columnUnitSummary[column.totalAgg],
					format,
					colColumnSummary.columnUnitSummary
				)}
			{:else if ['count', 'countDistinct'].includes(column.totalAgg)}
				<!-- using a predefined aggregation -->
				{column.totalFmt
					? formatValue(
							colColumnSummary.columnUnitSummary[column.totalAgg],
							format,
							colColumnSummary.columnUnitSummary
					  )
					: colColumnSummary.columnUnitSummary[column.totalAgg]}
			{:else if column.totalAgg === 'weightedMean'}
				{formatValue(
					weightedMean(data, column.id, column.weightCol),
					format,
					colColumnSummary.columnUnitSummary
				)}
			{:else}
				<!-- passing in anything else -->
				{column.totalFmt
					? formatValue(column.totalAgg, format, colColumnSummary.columnUnitSummary)
					: column.totalAgg}
			{/if}
		</td>
	{/each}
</tr>

<style>
	td {
		padding: 2px 8px;
		white-space: nowrap;
		overflow: hidden;
	}

	td:first-child {
		padding-left: 4px;
	}

	.string {
		text-align: left;
	}

	.date {
		text-align: left;
	}

	.number {
		text-align: right;
	}

	.boolean {
		text-align: left;
	}

	.index {
		color: var(--grey-300);
		text-align: left;
		max-width: -moz-min-content;
		max-width: min-content;
	}

	*:focus {
		outline: none;
	}</style>
