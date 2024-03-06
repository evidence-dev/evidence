<script>
	import { safeExtractColumn } from './datatable.js';
	import Delta from './Delta.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	$: props = getContext(propKey);

	export let displayedData;
	export let rowShading;
	export let link;
	export let rowNumbers;
	export let rowLines;
	export let index;
	export let columnSummary;
	export let grouped = false; // if part of a group - styling will be adjusted

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
	>
		{#if rowNumbers}
			<td class="index w-[2%]" class:row-lines={rowLines && i !== displayedData.length - 1}>
				{#if i === 0}
					{(index + i + 1).toLocaleString()}
				{:else}
					{(index + i + 1).toLocaleString()}
				{/if}
			</td>
		{/if}

		{#if $props.columns.length > 0}
			{#each $props.columns as column, k}
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
					style:padding-left={k === 0 && grouped && !rowNumbers ? '24px' : undefined}
					class:row-lines={rowLines && i !== displayedData.length - 1}
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
			{#each columnSummary.filter((d) => d.show === true) as column, j}
				<!-- Check if last row in table-->
				<td
					class={column.type}
					style:padding-left={j === 0 && grouped && !rowNumbers ? '24px' : undefined}
					class:row-lines={rowLines && i !== displayedData.length - 1}
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

	.sort-icon {
		width: 12px;
		height: 12px;
		vertical-align: middle;
	}

	.icon-container {
		display: inline-flex;
		align-items: center;
	}

	.page-changer {
		padding: 0;
		color: var(--grey-400);
		height: 1.1em;
		width: 1.1em;
	}

	.index {
		color: var(--grey-300);
		text-align: left;
		max-width: -moz-min-content;
		max-width: min-content;
	}

	.pagination {
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 2em;
		font-family: var(--ui-font-family);
		color: var(--grey-500);
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
		text-align: right;
		margin-top: 0.5em;
		margin-bottom: 1.8em;
		font-variant-numeric: tabular-nums;
	}

	.page-labels {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 3px;
	}

	.selected {
		background: var(--grey-200);
		border-radius: 4px;
	}

	.page-changer {
		font-size: 20px;
		background: none;
		border: none;
		cursor: pointer;
		transition: color 200ms;
	}

	.page-changer.hovering {
		color: var(--blue-600);
		transition: color 200ms;
	}

	.page-changer:disabled {
		cursor: auto;
		color: var(--grey-300);
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
		transition: color 200ms;
	}

	.page-icon {
		height: 1em;
		width: 1em;
	}

	.page-input {
		width: 23px;
		text-align: center;
		padding: 0;
		margin: 0;
		border: 1px solid transparent;
		border-radius: 4px;
		font-size: 12px;
		color: var(--grey-500);
	}

	.table-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin: 10px 0px;
		font-size: 12px;
		height: 9px;
	}

	/* Remove number buttons in input box*/
	.page-input::-webkit-outer-spin-button,
	.page-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */

	.page-input.hovering {
		border: 1px solid var(--grey-200);
	}

	.page-input.error {
		border: 1px solid var(--red-600);
	}

	.page-input::-moz-placeholder {
		color: var(--grey-500);
	}

	.page-input::placeholder {
		color: var(--grey-500);
	}

	*:focus {
		outline: none;
	}

	::-moz-placeholder {
		/* Chrome, Firefox, Opera, Safari 10.1+ */
		color: var(--grey-400);
		opacity: 1; /* Firefox */
	}

	::placeholder {
		/* Chrome, Firefox, Opera, Safari 10.1+ */
		color: var(--grey-400);
		opacity: 1; /* Firefox */
	}

	:-ms-input-placeholder {
		/* Internet Explorer 10-11 */
		color: var(--grey-400);
	}

	::-ms-input-placeholder {
		/* Microsoft Edge */
		color: var(--grey-400);
	}

	.row-link {
		cursor: pointer;
	}

	.row-link:hover {
		--tw-bg-opacity: 1;
		background-color: rgb(239 246 255 / var(--tw-bg-opacity));
	}

	.noresults {
		display: none;
		color: var(--grey-400);
		text-align: center;
		margin-top: 5px;
	}

	.shownoresults {
		display: block;
	}

	.print-page-count {
		display: none;
	}

	@media (max-width: 600px) {
		.page-changer {
			height: 1.2em;
			width: 1.2em;
		}
		.page-icon {
			height: 1.2em;
			width: 1.2em;
		}

		.page-count {
			font-size: 1.1em;
		}

		.page-input {
			font-size: 1.1em;
		}
	}

	@media print {
		.avoidbreaks {
			-moz-column-break-inside: avoid;
			break-inside: avoid;
		}

		.pagination {
			-moz-column-break-inside: avoid;
			break-inside: avoid;
		}

		.page-changer {
			display: none;
		}

		.page-count {
			display: none;
		}

		.print-page-count {
			display: inline;
		}
	}
</style>
