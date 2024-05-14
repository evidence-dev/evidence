<script>
	import Delta from '../core/Delta.svelte';
	import { safeExtractColumn, aggregateColumn } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import TableCell from './TableCell.svelte';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	const props = getContext(propKey);

	export let groupName = undefined;
	export let currentGroupData = undefined;
	export let columnSummary = undefined;
	export let rowColor = 'var(--grey-100)';
	export let groupBy = undefined;
	export let groupType = undefined;
	export let fontColor = undefined;
	export let finalColumnOrder = undefined;
	export let compact = undefined;
</script>

<tr
	class=" w-full border-b-gray-400 border-b-[1px]"
	style:background-color={rowColor}
	style:color={fontColor}
>
	{#each $props.columns.length > 0 ? $props.columns.sort((a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)) : columnSummary
				.filter((d) => d.show === true)
				.sort((a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)) as column}
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
		<TableCell
			class="{useCol.type} font-medium border-t-[1px] border-t-gray-300"
			{compact}
			align={column.align}
		>
			{#if column.id !== groupBy}
				{#if column.contentType === 'delta'}
					<Delta
						value={aggregateColumn(
							currentGroupData,
							column.id,
							column.totalAgg,
							useCol.type,
							column.weightCol
						)}
						downIsGood={column.downIsGood}
						format_object={column_format}
						columnUnitSummary={useCol.columnUnitSummary}
						showValue={column.showValue}
						showSymbol={column.deltaSymbol}
						align={column.align}
						fontClass="font-medium text-[9.25pt]"
						neutralMin={column.neutralMin}
						neutralMax={column.neutralMax}
						chip={column.chip}
					/>
				{:else}
					{formatValue(
						aggregateColumn(
							currentGroupData,
							column.id,
							column.totalAgg,
							useCol.type,
							column.weightCol
						),
						useFormat,
						useCol.columnUnitSummary
					)}
				{/if}
			{:else if groupType === 'section'}
				{groupName}
			{/if}
		</TableCell>
	{/each}
</tr>
