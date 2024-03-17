<script>
	import { safeExtractColumn } from './datatable.js';
	import Delta from './Delta.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	import TableCell from './TableCell.svelte';
	const props = getContext(propKey);

	export let displayedData;
	export let rowShading;
	export let link;
	export let rowNumbers;
	export let rowLines;
	export let index;
	export let columnSummary;
	export let grouped = false; // if part of a group - styling will be adjusted
	export let groupType;
	export let groupColumn;
	export let rowSpan;
	export let groupNamePosition = 'middle'; // middle (default) | top | bottom

	function handleRowClick(url) {
		if (link) {
			window.location = url;
		}
	}
</script>

{#each displayedData as row, i}
	<tr
		class:shaded-row={rowShading && i % 2 === 1}
		class:row-link={link != undefined}
		on:click={() => handleRowClick(row[link])}
		class:row-lines={rowLines}
	>
		{#if rowNumbers && groupType !== 'side'}
			<TableCell class="index w-[2%]">
				{#if i === 0}
					{(index + i + 1).toLocaleString()}
				{:else}
					{(index + i + 1).toLocaleString()}
				{/if}
			</TableCell>
		{/if}

		{#if $props.columns.length > 0}
			{#each $props.columns.sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) as column, k}
				{@const useCol = safeExtractColumn(column, columnSummary)}
				{@const column_min = column.colorMin ?? useCol.columnUnitSummary.min}
				{@const column_max = column.colorMax ?? useCol.columnUnitSummary.max}
				{@const is_nonzero =
					column_max - column_min !== 0 && !isNaN(column_max) && !isNaN(column_min)}
				{@const percentage = (row[column.id] - column_min) / (column_max - column_min)}
				{@const column_format = column.fmt
					? getFormatObjectFromString(column.fmt, useCol.format?.valueType)
					: useCol.format}
				<TableCell
					class={useCol.type}
					verticalAlign={groupType === 'side' ? groupNamePosition : undefined}
					rowSpan={groupType === 'side' && groupColumn === useCol.id && i === 0 ? rowSpan : 1}
					show={!(
						(groupType === 'side' && groupColumn === useCol.id && i !== 0) ||
						(groupType === 'top' && groupColumn === useCol.id)
					)}
					align={column.align}
					paddingLeft={k === 0 && grouped && groupType === 'accordion' && !rowNumbers
						? '24px'
						: undefined}
					height={column.height}
					width={column.width}
					wrap={column.wrap}
					cellColor={column.contentType === 'colorscale' && is_nonzero
						? column.customColor
							? `color-mix(in srgb, ${column.customColor} ${
									Math.max(0, Math.min(1, percentage)) * 100
							  }%, transparent)`
							: `${column.useColor} ${Math.max(0, Math.min(1, percentage))})`
						: // closing bracket needed to close unclosed color string from Column component
						  ''}
				>
					{#if column.contentType === 'image' && row[column.id] !== undefined}
						<img
							src={row[column.id]}
							alt={column.alt
								? row[column.alt]
								: row[column.id].replace(/^(.*[/])/g, '').replace(/[.][^.]+$/g, '')}
							class="mx-auto my-2 max-w-[unset] rounded-[unset]"
							style:height={column.height}
							style:width={column.width}
						/>
					{:else if column.contentType === 'link' && row[column.id] !== undefined}
						<!-- if `column.linkLabel` is a column in `row`, but undefined, display - -->
						{#if column.linkLabel != undefined && row[column.linkLabel] == undefined && column.linkLabel in row}
							-
						{:else}
							<a
								href={row[column.id]}
								target={column.openInNewTab ? '_blank' : ''}
								class="text-blue-600 hover:text-blue-700 transition-colors duration-200"
							>
								{#if column.linkLabel != undefined}
									<!-- if the linklabel is a column name, display that column -->
									{#if row[column.linkLabel] != undefined}
										{@const labelSummary = safeExtractColumn(
											{ id: column.linkLabel },
											columnSummary
										)}
										{formatValue(
											row[column.linkLabel],
											column.fmt
												? getFormatObjectFromString(column.fmt, labelSummary.format?.valueType)
												: labelSummary.format,
											labelSummary.columnUnitSummary
										)}
										<!-- otherwise, consider it a label (like Details ->) and display it -->
									{:else}
										{column.linkLabel}
									{/if}
								{:else}
									<!-- if no linkLabel is specified, display the link itself -->
									{@const columnSummary = useCol}
									{formatValue(
										row[column.id],
										column.fmt
											? getFormatObjectFromString(column.fmt, columnSummary.format?.valueType)
											: columnSummary.format,
										columnSummary.columnUnitSummary
									)}
								{/if}
							</a>
						{/if}
					{:else if column.contentType === 'delta' && row[column.id] !== undefined}
						<Delta
							value={row[column.id]}
							downIsGood={column.downIsGood}
							format_object={column_format}
							columnUnitSummary={useCol.columnUnitSummary}
							showValue={column.showValue}
							deltaSymbol={column.deltaSymbol}
							align={column.align}
							fontClass="text-[9.25pt]"
							neutralMin={column.neutralMin}
							neutralMax={column.neutralMax}
							chip={column.chip}
						/>
					{:else}
						{formatValue(
							row[column.id],
							column.fmt
								? getFormatObjectFromString(column.fmt, useCol.format?.valueType)
								: useCol.format,
							useCol.columnUnitSummary
						)}
					{/if}
				</TableCell>
			{/each}
		{:else}
			{#each columnSummary
				.filter((d) => d.show === true)
				.sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) as column, j}
				<!-- Check if last row in table-->
				<TableCell
					class={column.type}
					rowspan={groupType === 'side' && groupColumn === column.id && i === 0 ? rowSpan : 1}
					show={!(
						(groupType === 'side' && groupColumn === column.id && i !== 0) ||
						(groupType === 'top' && groupColumn === column.id)
					)}
					paddingLeft={j === 0 && grouped && groupType === 'accordion' && !rowNumbers
						? '24px'
						: undefined}
				>
					{formatValue(row[column.id], column.format, column.columnUnitSummary)}
				</TableCell>
			{/each}
		{/if}
	</tr>
{/each}

<style>
	.row-lines {
		border-bottom: thin solid var(--grey-200);
	}

	.shaded-row {
		background-color: var(--grey-50);
	}

	*:focus {
		outline: none;
	}

	.row-link {
		cursor: pointer;
	}

	.row-link:hover {
		--tw-bg-opacity: 1;
		background-color: rgb(239 246 255 / var(--tw-bg-opacity));
	}
</style>
