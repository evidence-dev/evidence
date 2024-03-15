<script>
	import Delta from './Delta.svelte';
	import { safeExtractColumn, aggregateColumn } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	const props = getContext(propKey);

	export let groupName;
	export let currentGroupData;
	export let columnSummary;
	export let backgroundColor = undefined;
	export let groupBy
	export let groupType
	export let fontColor
</script>

<tr
	class=" w-full border-b-gray-500 border-b-[1px]"
	style:background-color={backgroundColor}
	style:color={fontColor}
>

	{#each $props.columns.length > 0 ? $props.columns.sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) : columnSummary.filter((d) => d.show === true).sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) as column, j}
	{@const useCol = safeExtractColumn(column, columnSummary)}
		{@const column_format = column.fmt
			? getFormatObjectFromString(column.fmt, useCol.format?.valueType)
			: useCol.format}
		{@const format = column.subtotalFmt 
			? getFormatObjectFromString(column.subtotalFmt)
			: column.totalFmt
			? getFormatObjectFromString(column.totalFmt)
			: column_format}
		{@const useFormat = format?.valueType === 'date' ? '' : format}
		<td 
		class="{useCol.type} font-medium border-t-[1px] border-t-gray-400"
		style:text-align={column.align}
		>
			{#if column.id !== groupBy}				
				{#if column.contentType === 'delta'}
					<Delta
						value={aggregateColumn(currentGroupData,column.id,column.totalAgg,useCol.type, column.weightCol)}
						downIsGood={column.downIsGood}
						format={column_format}
						columnUnitSummary={useCol.columnUnitSummary}
						showValue={column.showValue}
						deltaSymbol={column.deltaSymbol}
						align={column.align}
					/>
				{:else}
					{formatValue(aggregateColumn(currentGroupData,column.id,column.totalAgg,useCol.type, column.weightCol), useFormat, useCol.columnUnitSummary)}
				{/if}
			{:else if groupType === 'side'}
					{groupName}
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

	*:focus {
		outline: none;
	}</style>
