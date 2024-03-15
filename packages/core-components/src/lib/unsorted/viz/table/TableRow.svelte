<script>
	import { safeExtractColumn } from './datatable.js';
	import Delta from './Delta.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
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
	export let groupNamePosition='middle'; // middle (default) | top | bottom

	function handleRowClick(url) {
		if (link) {
			window.location = url;
		}
	}
</script>

{#each displayedData as row, i}
	<tr
		class:shaded-row={rowShading && i % 2 === 0}
		class:row-link={link != undefined}
		on:click={() => handleRowClick(row[link])}
		class:row-lines={rowLines && ((i !== displayedData.length - 1) || groupType === 'side')}
	>
		{#if rowNumbers && groupType !== 'side'}
			<td class="index w-[2%]" class:row-lines={rowLines && i !== displayedData.length - 1}>
				{#if i === 0}
					{(index + i + 1).toLocaleString()}
				{:else}
					{(index + i + 1).toLocaleString()}
				{/if}
			</td>
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
				<td
					class={useCol.type}
					style:vertical-align={groupType === 'side' ? groupNamePosition : undefined}
					rowspan={(groupType === 'side' && groupColumn === useCol.id && i === 0) ? rowSpan : 1}
					style:display={(groupType === 'side' && groupColumn === useCol.id && i !== 0) || (groupType === 'top' && groupColumn === useCol.id) ? 'none' : '' }
					style:padding-left={(k === 0 && grouped && groupType === 'accordion' && !rowNumbers) ? '24px' : undefined}
					style:text-align={column.align}
					style:height={column.height}
					style:width={column.width}
					style:white-space={column.wrap ? 'normal' : 'nowrap'}
					style:background-color={column.contentType === 'colorscale' && is_nonzero
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
							data={row}
							value={row[column.id]}
							downIsGood={column.downIsGood}
							format={column_format}
							columnUnitSummary={useCol.columnUnitSummary}
							showValue={column.showValue}
							deltaSymbol={column.deltaSymbol}
							align={column.align}
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
				</td>
			{/each}
		{:else}
			{#each columnSummary.filter((d) => d.show === true).sort((a, b) => $props.finalColumnOrder.indexOf(a.id) - $props.finalColumnOrder.indexOf(b.id)) as column, j}
				<!-- Check if last row in table-->
				<td
					class={column.type}
					rowspan={(groupType === 'side' && groupColumn === column.id && i === 0) ? rowSpan : 1}
					style:display={(groupType === 'side' && groupColumn === column.id && i !== 0) || (groupType === 'top' && groupColumn === column.id) ? 'none' : '' }
					style:padding-left={(j === 0 && grouped && groupType === 'accordion' && !rowNumbers) ? '24px' : undefined}
				>
					{formatValue(row[column.id], column.format, column.columnUnitSummary)}
				</td>
			{/each}
		{/if}
	</tr>
{/each}

<style>
	td {
		padding: 2px 8px;
		white-space: nowrap;
		overflow: hidden;
	}

	td:first-child {
		padding-left: 4px;
	}

	.row-lines {
		border-bottom: thin solid var(--grey-200);
	}

	.shaded-row {
		background-color: var(--grey-100);
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
	}

	.row-link {
		cursor: pointer;
	}

	.row-link:hover {
		--tw-bg-opacity: 1;
		background-color: rgb(239 246 255 / var(--tw-bg-opacity));
	}</style>