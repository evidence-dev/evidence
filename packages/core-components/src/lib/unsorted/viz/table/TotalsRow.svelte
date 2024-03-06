<script>
	import { safeExtractColumn, weightedMean } from './datatable.js';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { getContext } from 'svelte';
	import { propKey } from '@evidence-dev/component-utilities/chartContext';
	$: props = getContext(propKey);

	export let data;
	export let rowNumbers;
	export let columnSummary;
	export let backgroundColor = undefined;
</script>

<!-- Totals row -->
<tr class="font-semibold border-t border-gray-600" style:background-color={backgroundColor}>
	{#if rowNumbers}
		<td class="index w-[2%]" />
	{/if}

	{#each $props.columns.length > 0 ? $props.columns : columnSummary.filter((d) => d.show === true) as column}
		{@const colColumnSummary = safeExtractColumn(column, columnSummary)}
		{@const format = column.totalFmt
			? getFormatObjectFromString(column.totalFmt)
			: column.fmt
			? getFormatObjectFromString(column.fmt)
			: colColumnSummary.format}
		<td
			class={colColumnSummary.type}
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
