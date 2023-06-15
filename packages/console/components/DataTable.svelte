<script>
	import { slide } from 'svelte/transition';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import { formatValue } from '@evidence-dev/component-utilities/formatting';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { DownloadData, ErrorChart } from '@evidence-dev/core-components';
	const strictBuild = false;

	import MdFirstPage from 'svelte-icons/md/MdFirstPage.svelte';
	import MdNavigateBefore from 'svelte-icons/md/MdNavigateBefore.svelte';
	import MdNavigateNext from 'svelte-icons/md/MdNavigateNext.svelte';
	import MdLastPage from 'svelte-icons/md/MdLastPage.svelte';

	// Data, pagination, and row index numbers
	export let data;

	// ---------------------------------------------------------------------------------------
	// DATA SETUP
	// ---------------------------------------------------------------------------------------

	let columnSummary;
	let error;

	$: try {
		error = undefined;
		// CHECK INPUTS
		checkInputs(data);

		// GET COLUMN SUMMARY
		columnSummary = getColumnSummary(data, 'array');

		// PROCESS DATES
		// Filter for columns with type of "date"
		let dateCols = columnSummary.filter((d) => d.type === 'date');
		dateCols = dateCols.map((d) => d.id);

		if (dateCols.length > 0) {
			for (let i = 0; i < dateCols.length; i++) {
				data = convertColumnToDate(data, dateCols[i]);
			}
		}

		for (let i = 0; i < columnSummary.length; i++) {
			columnSummary[i].show = true;
		}
	} catch (e) {
		error = e.message;
		if (strictBuild) {
			throw error;
		}
	}

	// ---------------------------------------------------------------------------------------
	// PAGINATION
	// ---------------------------------------------------------------------------------------

	export let rows = 10; // number of rows to show
	export let totalRows;

	let inputPage = null;
	let pageCount;
	export let currentPage;

	const goToPage = (pageNumber) => {
		if (pageNumber < 1 || pageNumber > pageCount) return;
		currentPage = pageNumber;
		if (inputPage) {
			inputPage = currentPage;
		}
	};

	$: paginated = totalRows > rows;

	$: if (paginated) {
		pageCount = Math.ceil(totalRows / rows);
	} else {
		currentPage = 1;
	}

	let hovering = false;
</script>

{#if error === undefined}
	<slot />
	<div
		class="table-container"
		transition:slide|local
		style="margin-top: 1.5em; margin-bottom: 1em; padding-bottom: 0em;"
		on:mouseenter={() => (hovering = true)}
		on:mouseleave={() => (hovering = false)}
	>
		<div class="container">
			<table>
				<thead>
					<tr>
						{#each columnSummary.filter((d) => d.show === true) as column}
							<th
								class={column.type}
								style="
                                    color: var(--grey-900);
                                    cursor: auto;
                                "
							>
								<span class="col-header">
									{column.title}
								</span>
							</th>
						{/each}
					</tr>
				</thead>

				{#each data as row}
					<tr>
						{#each columnSummary as column}
							<td class="{column.type} row-lines">
								{formatValue(row[column.id], column.format, column.columnUnitSummary)}
							</td>
						{/each}
					</tr>
				{/each}
			</table>
		</div>

		{#if paginated && pageCount > 1}
			<div class="pagination">
				<div class="page-labels">
					<button
						aria-label="first-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === 1}
						on:click={() => goToPage(1)}
					>
						<div class="page-icon">
							<MdFirstPage />
						</div>
					</button>
					<button
						aria-label="previous-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === 1}
						on:click={() => goToPage(currentPage - 1)}
					>
						<div class="page-icon">
							<MdNavigateBefore />
						</div>
					</button>
					<span class="page-count">
						Page {currentPage.toLocaleString()} / {pageCount.toLocaleString()}
					</span>
					<span class="print-page-count">
						{data.length.toLocaleString()} of {totalRows.toLocaleString()} records
					</span>
					<button
						aria-label="next-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === pageCount}
						on:click={() => goToPage(currentPage + 1)}
					>
						<div class="page-icon">
							<MdNavigateNext />
						</div>
					</button>
					<button
						aria-label="last-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === pageCount}
						on:click={() => goToPage(pageCount - 1)}
					>
						<div class="page-icon">
							<MdLastPage />
						</div>
					</button>
				</div>
				<DownloadData class="download-button" {data} display={hovering} />
			</div>
		{:else}
			<div class="table-footer">
				<DownloadData class="download-button" {data} display={hovering} />
			</div>
		{/if}

		<div class="noresults">No Results</div>
	</div>
{:else}
	<ErrorChart {error} chartType="Data Table" />
{/if}

<style>
	.table-container {
		font-size: 9.5pt;
		width: 97%;
	}

	.container {
		width: 100%;
		overflow-x: auto;
		/* border-bottom: 1px solid var(--grey-200);    */
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
		background-color: white;
	}

	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}

	.container::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	.container::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}
	.container::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	.container::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	.container::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	.container::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	table {
		display: table;
		font-family: sans-serif;
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		padding: 2px 8px;
		white-space: nowrap;
		overflow: hidden;
	}

	th {
		border-bottom: 1px solid var(--grey-600);
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
		font-family: sans-serif;
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

	.page-input::placeholder {
		color: var(--grey-500);
	}

	button:enabled > .page-icon:hover {
		color: var(--blue-800);
	}

	*:focus {
		outline: none;
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

	th {
		user-select: none;
	}

	th.type-indicator {
		color: var(--grey-400);
		font-weight: normal;
		font-style: italic;
	}

	.row-link {
		cursor: pointer;
	}

	.row-link:hover {
		background-color: #f0f5fc;
	}

	.noresults {
		display: none;
		color: var(--grey-400);
		font-family: sans-serif;
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
			break-inside: avoid;
		}

		.pagination {
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
