<script>
	import { createEventDispatcher } from 'svelte';
	import TableGroupIcon from './TableGroupIcon.svelte';
	import Delta from '../core/Delta.svelte';
	import { safeExtractColumn, aggregateColumn } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import TableCell from './TableCell.svelte';

	export let groupName;
	export let currentGroupData;
	export let toggled;
	export let columnSummary;
	export let rowNumbers;
	export let rowColor = undefined;
	export let subtotals = true;
	export let orderedColumns = undefined;
	export let compact = undefined;

	const dispatch = createEventDispatcher();

	function toggleGroup() {
		dispatch('toggle', { groupName });
	}
</script>

<tr
	on:click={toggleGroup}
	class="cursor-pointer hover:bg-gray-100 w-full border-t-[1px] border-gray-200"
	role="button"
	tabindex="0"
	on:keypress={(e) => e.key === 'Enter' && toggleGroup()}
	style:background-color={rowColor}
>
	{#each orderedColumns as column, j}
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
		{#if j === 0}
			<TableCell
				class="font-medium py-[3px]"
				{compact}
				colSpan={rowNumbers ? 2 : 1}
				paddingLeft="1px"
			>
				<div class="items-center gap-2 align-top">
					<span class="inline-flex print-hidden chevron"><TableGroupIcon {toggled} /></span>
					{groupName}
				</div>
			</TableCell>
		{:else if subtotals}
			<TableCell class="{useCol.type} font-medium" {compact} align={column.align}>
				{#if [undefined, 'sum', 'mean', 'median', 'min', 'max', 'weightedMean', 'count', 'countDistinct'].includes(column.totalAgg) || column.subtotalFmt}
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
							format_object={useFormat}
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
				{:else}
					{column.totalAgg}
				{/if}
			</TableCell>
		{:else}
			<TableCell />
		{/if}
	{/each}
</tr>

<style>
	@media print {
		.chevron {
			display: none;
		}
	}
</style>
