<script>
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { propKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import ErrorChart from '../core/ErrorChart.svelte';
	import SearchBar from '../core/SearchBar.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import DownloadData from '../../ui/DownloadData.svelte';
	import SortIcon from '../../ui/SortIcon.svelte';
	import InvisibleLinks from '../../../atoms/InvisibleLinks.svelte';
	import Fuse from 'fuse.js';

	import { Icon } from '@steeze-ui/svelte-icon';
	import CodeBlock from '../../ui/CodeBlock.svelte';
	import { safeExtractColumn, weightedMean, median } from './datatable.js';
	import TableRow from './TableRow.svelte';
	import TotalsRow from './TotalsRow.svelte';
	import GroupRow from './GroupRow.svelte';
	import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from '@steeze-ui/tabler-icons';

	// Set up props store
	let props = writable({});
	setContext(propKey, props);

	// Data, pagination, and row index numbers
	export let data;
	export let queryID = undefined;
	export let rows = 10; // number of rows to show
	$: rows = Number.parseInt(rows);

	export let groupBy;
	export let summarizeGroups = true;
	$: summarizeGroups = summarizeGroups === 'true' || summarizeGroups === true;
	export let groupsOpen = false; // starting toggle for groups - open or closed
	$: groupsOpen = groupsOpen === 'true' || groupsOpen === true;
	export let groupBackgroundColor = undefined;

	let groupToggleStates = {};

	let paginated;
	$: data, rows, (paginated = data.length > rows && !groupBy);

	function handleToggle({ detail }) {
		const { groupName } = detail;
		groupToggleStates[groupName] = !groupToggleStates[groupName];
	}

	export let rowNumbers = false;
	$: rowNumbers = rowNumbers === 'true' || rowNumbers === true;

	let hovering = false;

	let marginTop = '1.5em';
	let marginBottom = '1em';
	let paddingBottom = '0em';

	export let generateMarkdown = false;
	$: generateMarkdown = generateMarkdown === 'true' || generateMarkdown === true;

	// Table features
	export let search = false;
	$: search = search === 'true' || search === true;

	export let sortable = true;
	$: sortable = sortable === 'true' || sortable === true;

	export let downloadable = true;
	$: downloadable = downloadable === 'true' || downloadable === true;

	export let totalRow = false;
	$: totalRow = totalRow === 'true' || totalRow === true;

	export let totalBackgroundColor = undefined;

	// Row Links:
	export let link = undefined;

	export let showLinkCol = false; // hides link column when columns have not been explicitly selected
	$: showLinkCol = showLinkCol === 'true' || showLinkCol === true;

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
	$: rowShading = rowShading === 'true' || rowShading === true;

	export let rowLines = true;
	$: rowLines = rowLines === 'true' || rowLines === true;

	export let headerColor = undefined;
	export let headerFontColor = 'var(--grey-900)';

	export let formatColumnTitles = true;
	$: formatColumnTitles = formatColumnTitles === 'true' || formatColumnTitles === true;

	export let backgroundColor = 'white';

	// ---------------------------------------------------------------------------------------
	// DATA SETUP
	// ---------------------------------------------------------------------------------------

	let columnSummary;

	let priorityColumns = [groupBy];

	// Function to get the final column order
	const getFinalColumnOrder = (obj, priorityColumns) => {
		const allColumns = Object.keys(obj);
		const restColumns = allColumns.filter((key) => !priorityColumns.includes(key));
		return [...priorityColumns, ...restColumns];
	};

	// Determine the final column order based on the first object and priority columns
	const finalColumnOrder = getFinalColumnOrder(data[0], priorityColumns);

	// Function to reorder the objects based on a given column order
	const reorderObjects = (array, columnOrder) => {
		return array.map((obj) => {
			const orderedObj = {};
			columnOrder.forEach((key) => {
				if (Object.hasOwn(obj, key)) {
					orderedObj[key] = obj[key];
				}
			});
			return orderedObj;
		});
	};

	// Assuming finalColumnOrder and originalArray have been defined previously
	// Reorder the original array based on the final column order
	const reorderedArray = reorderObjects(data, finalColumnOrder);

	// Update the original array reference if necessary
	data = reorderedArray;

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

		for (const column of $props.columns) {
			const summary = safeExtractColumn(column, columnSummary);
			if (summary.format === undefined && column.fmt !== undefined) {
				throw new Error(
					`Column "${column.id}" unable to be formatted. Please cast the results to dates or numbers.`
				);
			}
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
	let showNoResults = false;
	let fuse;

	// Function to initialize or update Fuse instance
	function updateFuse() {
		fuse = new Fuse(data, {
			getFn: (row, [path]) => {
				const summary = columnSummary?.find((d) => d.id === path) ?? {};
				return summary.type === 'date' &&
					row[summary.id] != null &&
					row[summary.id] instanceof Date &&
					!isNaN(row[summary.id].getTime())
					? row[summary.id].toISOString()
					: row[summary.id]?.toString() ?? '';
			},
			keys: columnSummary?.map((d) => d.id) ?? [],
			threshold: 0.4
		});
	}

	// Initially set up Fuse with the current data
	updateFuse();

	// Reactively update Fuse when `data` or `columnSummary` changes
	$: {
		updateFuse();
		// Optionally, you can run the search again here if `searchValue` is not empty
		if (searchValue !== '') {
			runSearch(searchValue);
		}
	}

	// $: fuse = new Fuse(data, {
	// 	getFn: (row, [path]) => {
	// 		const summary = columnSummary?.find((d) => d.id === path) ?? {};
	// 		return summary.type === 'date' &&
	// 			row[summary.id] != null &&
	// 			row[summary.id] instanceof Date &&
	// 			!isNaN(row[summary.id].getTime())
	// 			? row[summary.id].toISOString()
	// 			: row[summary.id]?.toString() ?? '';
	// 	},
	// 	keys: columnSummary?.map((d) => d.id) ?? [],
	// 	threshold: 0.4
	// });
	$: runSearch = (searchValue) => {
		if (searchValue !== '') {
			// Reset pagination to first page:
			index = 0;
			inputPage = null;

			filteredData = fuse.search(searchValue).map((x) => x.item);
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
		const sortModifier = sortBy.ascending ? 1 : -1;

		const forceTopOfAscending = (val) =>
			val === undefined || val === null || (typeof val === 'number' && isNaN(val));

		const sort = (a, b) =>
			(forceTopOfAscending(a[column]) && !forceTopOfAscending(b[column])) || a[column] < b[column]
				? -1 * sortModifier
				: (forceTopOfAscending(b[column]) && !forceTopOfAscending(a[column])) ||
				  a[column] > b[column]
				? 1 * sortModifier
				: 0;
		data.sort(sort);
		filteredData = filteredData.sort(sort);

		if (groupBy) {
			// sort within grouped data
			Object.keys(groupedData).forEach((groupName) => {
				groupedData[groupName] = groupedData[groupName].sort(sort);
			});
		}
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

	let tableData;
	$: tableData =
		$props.columns.length > 0
			? dataSubset(
					data,
					$props.columns.map((d) => d.id)
			  )
			: data;

	// ---------------------------------------------------------------------------------------
	// GROUPED DATA
	// ---------------------------------------------------------------------------------------

	let groupedData = {};
	let groupRowData = {};

	$: {
		groupedData = data.reduce((acc, row) => {
			const groupName = row[groupBy];
			if (!acc[groupName]) {
				acc[groupName] = [];
			}
			acc[groupName].push(row);
			return acc;
		}, {});

		// After groupedData is populated, calculate aggregations for groupRowData
		groupRowData = Object.keys(groupedData).reduce((acc, groupName) => {
			acc[groupName] = {}; // Initialize groupRow object for this group

			// Get a list of columns to aggregate from $props.columns
			const columnsToAggregate = $props.columns.length > 0 ? $props.columns : columnSummary;

			columnsToAggregate.forEach((columnDef) => {
				const column = columnDef.id;
				const colType = columnSummary.find((d) => d.id === column).type;
				const totalAgg = columnDef.totalAgg;
				const weightCol = columnDef.weightCol;
				const rows = groupedData[groupName];
				if (
					colType !== 'number' &&
					['sum', 'min', 'max', 'mean', 'weightedMean', 'median', undefined].includes(totalAgg)
				) {
					// If attempting to use a numeric agg on a non-numeric column, return dash
					acc[groupName][column] = '-';
				} else if (totalAgg === 'sum' || totalAgg === undefined) {
					// Calculate sum
					acc[groupName][column] = rows.reduce((sum, row) => sum + (row[column] || 0), 0);
				} else if (totalAgg === 'min') {
					// Calculate min
					acc[groupName][column] = Math.min(
						...rows.map((row) => row[column]).filter((val) => val !== undefined)
					);
				} else if (totalAgg === 'max') {
					// Calculate min
					acc[groupName][column] = Math.max(
						...rows.map((row) => row[column]).filter((val) => val !== undefined)
					);
				} else if (totalAgg === 'mean') {
					// Calculate min
					acc[groupName][column] =
						rows.reduce((sum, row) => sum + (row[column] || 0), 0) / rows.length;
				} else if (totalAgg === 'count') {
					// Calculate min
					acc[groupName][column] = rows.length;
				} else if (totalAgg === 'countDistinct') {
					// Calculate countDistinct
					acc[groupName][column] = new Set(rows.map((row) => row[column])).size;
				} else if (totalAgg === 'weightedMean') {
					// Calculate weightedMean
					acc[groupName][column] = weightedMean(rows, column, weightCol);
				} else if (totalAgg === 'median') {
					// Calculate median
					acc[groupName][column] = median(rows, column);
				} else {
					acc[groupName][column] = totalAgg;
				}
			});

			return acc;
		}, {});

		// Update groupToggleStates only for new groups
		const existingGroups = Object.keys(groupToggleStates);
		Object.keys(groupedData).forEach((groupName) => {
			if (!existingGroups.includes(groupName)) {
				groupToggleStates[groupName] = groupsOpen; // Only add new groups with the default state
			}
			// Existing states are untouched
		});
	}
</script>

{#if error === undefined}
	<slot />

	{#if link}
		<InvisibleLinks {data} {link} />
	{/if}
	{#each $props.columns.filter((column) => column.contentType === 'link') as column}
		<InvisibleLinks {data} link={column.id} />
	{/each}

	<div
		class="table-container"
		transition:slide|local
		style:margin-top={marginTop}
		style:margin-bottom={marginBottom}
		style:padding-bottom={paddingBottom}
		on:mouseenter={() => (hovering = true)}
		on:mouseleave={() => (hovering = false)}
	>
		{#if search}
			<SearchBar bind:value={searchValue} searchFunction={runSearch} />
		{/if}

		<div class="container" style:background-color={backgroundColor}>
			<table>
				<thead>
					<tr>
						{#if rowNumbers}
							<th class="index w-[2%]" style:background-color={headerColor} />
						{/if}
						{#if $props.columns.length > 0}
							{#each $props.columns as column}
								<th
									class={safeExtractColumn(column, columnSummary).type}
									style:text-align={column.align}
									style:color={headerFontColor}
									style:background-color={headerColor}
									style:cursor={sortable ? 'pointer' : 'auto'}
									on:click={sortable ? sort(column.id) : ''}
								>
									{column.title
										? column.title
										: formatColumnTitles
										? safeExtractColumn(column, columnSummary).title
										: safeExtractColumn(column, columnSummary).id}
									{#if sortBy.col === column.id}
										<SortIcon ascending={sortBy.ascending} />
									{/if}
								</th>
							{/each}
						{:else}
							{#each columnSummary.filter((d) => d.show === true) as column}
								<th
									class={column.type}
									style:color={headerFontColor}
									style:background-color={headerColor}
									style:cursor={sortable ? 'pointer' : 'auto'}
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

				{#if groupBy && groupedData && searchValue === ''}
					{#each Object.entries(groupedData) as [groupName, rows]}
						<GroupRow
							{groupName}
							currentGroup={groupRowData[groupName]}
							toggled={groupToggleStates[groupName]}
							on:toggle={handleToggle}
							{columnSummary}
							backgroundColor={groupBackgroundColor}
							{rowNumbers}
						/>
						{#if groupToggleStates[groupName]}
							<TableRow
								displayedData={rows}
								{rowShading}
								{link}
								{rowNumbers}
								{rowLines}
								{index}
								{columnSummary}
								grouped={true}
							/>
						{/if}
					{/each}
				{:else}
					<TableRow
						{displayedData}
						{rowShading}
						{link}
						{rowNumbers}
						{rowLines}
						{index}
						{columnSummary}
					/>
				{/if}

				{#if totalRow && searchValue === ''}
					<TotalsRow {data} {rowNumbers} {columnSummary} backgroundColor={totalBackgroundColor} />
				{/if}
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
						<span class="page-count ml-1">{pageCount.toLocaleString()}</span></span
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
					<DownloadData class="download-button" data={tableData} {queryID} display={hovering} />
				{/if}
			</div>
		{:else}
			<div class="table-footer">
				{#if downloadable}
					<DownloadData class="download-button" data={tableData} {queryID} display={hovering} />
				{/if}
			</div>
		{/if}

		<div class="noresults" class:shownoresults={showNoResults}>No Results</div>
	</div>

	{#if generateMarkdown}
		{#if queryID}
			<CodeBlock>
				{`<DataTable data={${queryID}}>`}
				<br />
				{#each Object.keys(data[0]) as column}
					{`	<Column id=${column}/>`}
					<br />
				{/each}
				{`</DataTable>`}
			</CodeBlock>
		{/if}
	{/if}
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
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	th {
		padding: 2px 8px;
		white-space: nowrap;
		overflow: hidden;
	}

	th:first-child {
		padding-left: 4px;
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
	.page-input[type='number'] {
		-moz-appearance: textfield;
		-webkit-appearance: textfield;
		appearance: textfield;
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

	button:enabled > .page-icon:hover {
		color: var(--blue-800);
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

	th.type-indicator {
		color: var(--grey-400);
		font-weight: normal;
		font-style: italic;
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
