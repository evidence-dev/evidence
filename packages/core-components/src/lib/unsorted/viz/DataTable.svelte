<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { propKey, strictBuild } from './context';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import ErrorChart from './ErrorChart.svelte';
	import SearchBar from './SearchBar.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import DownloadData from '../ui/DownloadData.svelte';
	import SortIcon from '../ui/SortIcon.svelte';

	import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from '@steeze-ui/tabler-icons';
	import { Icon } from '@steeze-ui/svelte-icon';
	// Set up props store
	let props = writable({});
	setContext(propKey, props);

	// Data, pagination, and row index numbers
	export let data;
	export let rows = 10; // number of rows to show
	rows = Number.parseInt(rows);

	let paginated;
	$: data, rows, (paginated = data.length > rows);

	export let rowNumbers = false;
	rowNumbers = rowNumbers === 'true' || rowNumbers === true;

	let hovering = false;

	let marginTop = '1.5em';
	let marginBottom = '1em';
	let paddingBottom = '0em';

	// Table features
	export let search = false;
	search = search === 'true' || search === true;

	export let sortable = true;
	sortable = sortable === 'true' || sortable === true;

	export let downloadable = true;
	downloadable = downloadable === 'true' || downloadable === true;

	// Row Links:
	export let link = undefined;

	function handleRowClick(url) {
		if (link) {
			window.location = url;
		}
	}

	export let showLinkCol = false; // hides link column when columns have not been explicitly selected
	showLinkCol = showLinkCol === 'true' || showLinkCol === true;

	let error = undefined;

	// ---------------------------------------------------------------------------------------
	// Add props to store to let child components access them
	// ---------------------------------------------------------------------------------------
	props.update((d) => {
		return { ...d, data, columns: [] };
	});

	// ---------------------------------------------------------------------------------------
	// STYLING
	// ---------------------------------------------------------------------------------------
	export let rowShading = false;
	rowShading = rowShading === 'true' || rowShading === true;

	export let rowLines = true;
	rowLines = rowLines === 'true' || rowLines === true;

	export let headerColor;
	export let headerFontColor = 'var(--grey-900)';

	export let formatColumnTitles = true;
	formatColumnTitles = formatColumnTitles === 'true' || formatColumnTitles === true;

	// ---------------------------------------------------------------------------------------
	// DATA SETUP
	// ---------------------------------------------------------------------------------------

	let columnSummary;

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

		// Hide link column if columns have not been explicitly selected:
		for (let i = 0; i < columnSummary.length; i++) {
			columnSummary[i].show = showLinkCol === false && columnSummary[i].id === link ? false : true;
		}
	} catch (e) {
		error = e.message;
		if (strictBuild) {
			throw error;
		}
	}

	let index = 0;

	let inputPage = null;

	// ---------------------------------------------------------------------------------------
	// SEARCH
	// ---------------------------------------------------------------------------------------
	let searchValue = '';
	let filteredData;
	$: filteredData = data;
	let thisRow;
	let thisValue;
	let showNoResults = false;
	$: runSearch = (searchValue) => {
		if (searchValue !== '') {
			filteredData = [];

			// Reset pagination to first page:
			index = 0;
			inputPage = null;

			for (let i = 0; i < data.length; i++) {
				thisRow = data[i];
				for (let j = 0; j < columnSummary.length; j++) {
					if (columnSummary[j].type === 'date' && thisRow[columnSummary[j].id] != null) {
						thisValue = thisRow[columnSummary[j].id].toISOString();
					} else {
						thisValue = (thisRow[columnSummary[j].id] ?? '').toString().toLowerCase();
					}
					if (thisValue.indexOf(searchValue.toLowerCase()) != -1 && thisValue != null) {
						filteredData.push(thisRow);
						break;
					}
				}
			}
			showNoResults = filteredData.length === 0;
		} else {
			filteredData = data;
			showNoResults = false;

			// Reset pagination to first page:
			index = 0;
			inputPage = null;
		}
	};

	// ---------------------------------------------------------------------------------------
	// SORTING
	// ---------------------------------------------------------------------------------------

	let sortBy = { col: null, ascending: null };

	$: sort = (column) => {
		if (sortBy.col == column) {
			sortBy.ascending = !sortBy.ascending;
		} else {
			sortBy.col = column;
			sortBy.ascending = true;
		}

		// Modifier to sorting function for ascending or descending
		let sortModifier = sortBy.ascending ? 1 : -1;

		let sort = (a, b) =>
			a[column] < b[column] ? -1 * sortModifier : a[column] > b[column] ? 1 * sortModifier : 0;

		data.sort(sort);
		filteredData = filteredData.sort(sort);
	};

	// Reset sort condition when data object is changed
	$: data, (sortBy = { col: null, ascending: null });

	// ---------------------------------------------------------------------------------------
	// PAGINATION
	// ---------------------------------------------------------------------------------------

	let totalRows;
	$: totalRows = filteredData.length;

	let displayedData = filteredData;

	let pageCount;
	let currentPage = 1;

	$: currentPage = Math.ceil((index + rows) / rows);
	let max;

	$: goToPage = (pageNumber) => {
		index = pageNumber * rows;
		max = index + rows;
		currentPage = Math.ceil(max / rows);
		if (inputPage) {
			inputPage = Math.ceil(max / rows);
		}
		totalRows = filteredData.length;
		displayedData = filteredData.slice(index, index + rows);
	};

	let displayedPageLength = 0;

	$: if (paginated) {
		pageCount = Math.ceil(filteredData.length / rows);
		displayedData = filteredData.slice(index, index + rows);
		displayedPageLength = displayedData.length;
	} else {
		currentPage = 1;
		displayedData = filteredData;
	}

	// ---------------------------------------------------------------------------------------
	// DATA FOR EXPORT
	// ---------------------------------------------------------------------------------------

	function dataSubset(data, selectedCols) {
		return data.map((obj) => {
			var toReturn = {}; //object that would give each desired key for each part in arr
			selectedCols.forEach((key) => (toReturn[key] = obj[key])); //placing wanted keys in toReturn
			return toReturn;
		});
	}

	/**
	 * Will find the matching column in columnSummary or throw an error if not found
	 * @param column
	 */
	function safeExtractColumn(column) {
		const foundCols = columnSummary.filter((d) => d.id === column.id);
		if (foundCols === undefined || foundCols.length !== 1) {
			error =
				column.id === undefined
					? new Error(`please add an "id" property to all the <Column ... />`)
					: new Error(`column with id: "${column.id}" not found`);
			if (strictBuild) {
				throw error;
			}
			console.warn(error.message);
			return '';
		}

		return foundCols[0];
	}

	let tableData;
	$: tableData =
		$props.columns.length > 0
			? dataSubset(
					data,
					$props.columns.map((d) => d.id)
			  )
			: data;
</script>

{#if error === undefined}
	<slot />
	<div
		class="table-container"
		transition:slide|local
		style="margin-top:{marginTop}; margin-bottom:{marginBottom}; padding-bottom: {paddingBottom}"
		on:mouseenter={() => (hovering = true)}
		on:mouseleave={() => (hovering = false)}
	>
		{#if search}
			<SearchBar bind:value={searchValue} searchFunction={runSearch} />
		{/if}
		<div class="container">
			<table>
				<thead>
					<tr>
						{#if rowNumbers}
							<th
								class="index"
								style="
                      width:2%;
                      background-color: {headerColor};
                      "
							/>
						{/if}
						{#if $props.columns.length > 0}
							{#each $props.columns as column}
								<th
									class={safeExtractColumn(column).type}
									style="
                      text-align: {column.align};
                      color: {headerFontColor};
                      background-color: {headerColor};
                      cursor: {sortable ? 'pointer' : 'auto'};
                      "
									on:click={sortable ? sort(column.id) : ''}
								>
									{column.title
										? column.title
										: formatColumnTitles
										? safeExtractColumn(column).title
										: safeExtractColumn(column).id}
									{#if sortBy.col === column.id}
										<SortIcon ascending={sortBy.ascending} />
									{/if}
								</th>
							{/each}
						{:else}
							{#each columnSummary.filter((d) => d.show === true) as column}
								<th
									class={column.type}
									style="
                  color: {headerFontColor};
                  background-color: {headerColor};
                  cursor: {sortable ? 'pointer' : 'auto'};
                  "
									on:click={sortable ? sort(column.id) : ''}
								>
									<span class="col-header">
										{formatColumnTitles ? column.title : column.id}
									</span>
									{#if sortBy.col === column.id}
										<SortIcon ascending={sortBy.ascending} />
									{/if}
								</th>
							{/each}
						{/if}
					</tr>
				</thead>

				{#each displayedData as row, i}
					<tr
						class:shaded-row={rowShading && i % 2 === 0}
						class:row-link={link != undefined}
						on:click={() => handleRowClick(row[link])}
					>
						{#if link}
							<a style="display:none;" href={row[link]}>{row[link]}</a>
						{/if}
						{#if rowNumbers}
							<td
								class="index"
								class:row-lines={rowLines}
								style="
                  width:2%;
              "
							>
								{#if i === 0}
									{(index + i + 1).toLocaleString()}
								{:else}
									{(index + i + 1).toLocaleString()}
								{/if}
							</td>
						{/if}

						{#if $props.columns.length > 0}
							{#each $props.columns as column}
								<td
									class={safeExtractColumn(column).type}
									class:row-lines={rowLines}
									style="
                    						text-align: {column.align};
                      						height: {column.height};
                      						width: {column.width};
											white-space: {column.wrap ? 'normal' : 'nowrap'};
                  "
								>
									{#if column.contentType === 'image' && row[column.id] !== undefined}
										<img
											src={row[column.id]}
											alt={column.alt
												? row[column.alt]
												: row[column.id].replace(/^(.*[/])/g, '').replace(/[.][^.]+$/g, '')}
											style="
                        margin: 0.5em auto 0.5em auto;
                        height: {column.height};
                        width: {column.width};
                        "
										/>
									{:else if column.contentType === 'link' && row[column.id] !== undefined}
										<a href={row[column.id]} target={column.openInNewTab ? '_blank' : ''}>
											{#if column.linkLabel != undefined}
												{#if row[column.linkLabel] != undefined}
													{formatValue(
														row[column.linkLabel],
														column.fmt
															? getFormatObjectFromString(
																	column.fmt,
																	safeExtractColumn(column).format.valueType
															  )
															: safeExtractColumn(column).format,
														safeExtractColumn(column).columnUnitSummary
													)}
												{:else}
													{column.linkLabel}
												{/if}
											{:else}
												{formatValue(
													row[column.id],
													column.fmt
														? getFormatObjectFromString(
																column.fmt,
																safeExtractColumn(column).format.valueType
														  )
														: safeExtractColumn(column).format,
													safeExtractColumn(column).columnUnitSummary
												)}
											{/if}
										</a>
									{:else}
										{formatValue(
											row[column.id],
											column.fmt
												? getFormatObjectFromString(
														column.fmt,
														safeExtractColumn(column).format.valueType
												  )
												: safeExtractColumn(column).format,
											safeExtractColumn(column).columnUnitSummary
										)}
									{/if}
								</td>
							{/each}
						{:else}
							{#each columnSummary.filter((d) => d.show === true) as column}
								<td class={column.type} class:row-lines={rowLines}
									>{formatValue(row[column.id], column.format, column.columnUnitSummary)}</td
								>
							{/each}
						{/if}
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
						on:click={() => goToPage(0)}
						><div class="page-icon flex items-center">
							<Icon src={ChevronsLeft} />
						</div></button
					>
					<button
						aria-label="previous-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === 1}
						on:click={() => goToPage(currentPage - 2)}
						><div class="page-icon h-[0.83em] flex items-center">
							<Icon src={ChevronLeft} class="h-[0.83em]" />
						</div></button
					>
					<span class="page-count"
						>Page <input
							class="page-input"
							class:hovering
							class:error={inputPage > pageCount}
							type="number"
							bind:value={inputPage}
							on:keyup={() => goToPage((inputPage ?? 1) - 1)}
							on:change={() => goToPage((inputPage ?? 1) - 1)}
							placeholder={currentPage}
						/>
						/
						<span class="page-count" style="margin-left: 4px;">{pageCount.toLocaleString()}</span
						></span
					>
					<span class="print-page-count">
						{displayedPageLength.toLocaleString()} of {totalRows.toLocaleString()} records</span
					>
					<button
						aria-label="next-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === pageCount}
						on:click={() => goToPage(currentPage)}
						><div class="page-icon h-[0.83em] flex items-center">
							<Icon src={ChevronRight} class="h-[0.83em]" />
						</div></button
					>
					<button
						aria-label="last-page"
						class="page-changer"
						class:hovering
						disabled={currentPage === pageCount}
						on:click={() => goToPage(pageCount - 1)}
						><div class="page-icon flex items-center">
							<Icon src={ChevronsRight} />
						</div></button
					>
				</div>
				{#if downloadable}
					<DownloadData class="download-button" data={tableData} display={hovering} />
				{/if}
			</div>
		{:else}
			<div class="table-footer">
				{#if downloadable}
					<DownloadData class="download-button" data={tableData} display={hovering} />
				{/if}
			</div>
		{/if}

		<div class="noresults" class:shownoresults={showNoResults}>No Results</div>
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

	/* Firefox */
	.page-input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
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
