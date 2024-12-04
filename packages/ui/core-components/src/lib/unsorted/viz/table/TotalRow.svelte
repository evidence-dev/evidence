<script>
	import { safeExtractColumn, weightedMean } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import TableCell from './TableCell.svelte';
	import Delta from '../core/Delta.svelte';

	export let data = undefined;
	export let rowNumbers = undefined;
	export let columnSummary = undefined;
	export let rowColor = undefined;
	export let fontColor = undefined;
	export let groupType = undefined;
	export let orderedColumns = undefined;
	export let compact = undefined;
</script>

<tr class="font-semibold" style:background-color={rowColor} style:color={fontColor}>
	{#if rowNumbers && groupType !== 'section'}
		<TableCell class={'index w-[2%]'} {compact} topBorder="border-t border-base-300" />
	{/if}

	{#each orderedColumns as column}
		{@const colColumnSummary = safeExtractColumn(column, columnSummary)}
		{@const format = column.totalFmt
			? getFormatObjectFromString(column.totalFmt)
			: column.fmt
				? getFormatObjectFromString(column.fmt)
				: colColumnSummary.format}
		{@const totalAgg = column.totalAgg ?? 'sum'}
		<TableCell
			{compact}
			dataType={colColumnSummary.type}
			align={column.align}
			height={column.height}
			width={column.width}
			wrap={column.wrap}
			topBorder="border-t border-base-content-muted"
		>
			{#if ['sum', 'mean', 'weightedMean', 'median', 'min', 'max', 'count', 'countDistinct'].includes(totalAgg)}
				{#if column.contentType === 'delta'}
					<Delta
						value={totalAgg === 'weightedMean'
							? weightedMean(data, column.id, column.weightCol)
							: colColumnSummary.columnUnitSummary[totalAgg]}
						downIsGood={column.downIsGood}
						format_object={format}
						columnUnitSummary={colColumnSummary.columnUnitSummary}
						showValue={column.showValue}
						showSymbol={column.deltaSymbol}
						align={column.align}
						fontClass="font-semibold text-[9.25pt]"
						neutralMin={column.neutralMin}
						neutralMax={column.neutralMax}
						chip={column.chip}
					/>
				{:else}
					{formatValue(
						totalAgg === 'weightedMean'
							? weightedMean(data, column.id, column.weightCol)
							: colColumnSummary.columnUnitSummary[totalAgg],
						format,
						colColumnSummary.columnUnitSummary
					)}
				{/if}
			{:else}
				<!-- passing in anything else -->
				{column.totalFmt
					? formatValue(totalAgg, format, colColumnSummary.columnUnitSummary)
					: totalAgg}
			{/if}
		</TableCell>
	{/each}
</tr>
