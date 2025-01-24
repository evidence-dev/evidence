<script>
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { propKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import ErrorChart from '../core/ErrorChart.svelte';
	import ComponentTitle from '../core/ComponentTitle.svelte';
	import SearchBar from '../core/SearchBar.svelte';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import DownloadData from '../../ui/DownloadData.svelte';
	import InvisibleLinks from '../../../atoms/InvisibleLinks.svelte';

	import { Icon } from '@steeze-ui/svelte-icon';
	import CodeBlock from '../../ui/CodeBlock.svelte';
	import { aggregateColumn, getFinalColumnOrder } from './datatable.js';
	import TableRow from './TableRow.svelte';
	import TotalRow from './TotalRow.svelte';
	import SubtotalRow from './SubtotalRow.svelte';
	import TableHeader from './TableHeader.svelte';
	import GroupRow from './GroupRow.svelte';
	import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from '@steeze-ui/tabler-icons';
	import EnterFullScreen from './EnterFullScreen.svelte';
	import Fullscreen from '../../../atoms/fullscreen/Fullscreen.svelte';
	import Column from './Column.svelte';
	import { Query } from '@evidence-dev/sdk/usql';
	import QueryLoad from '../../../atoms/query-load/QueryLoad.svelte';
	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Skeleton from '../../../atoms/skeletons/Skeleton.svelte';
	import { browserDebounce } from '@evidence-dev/sdk/utils';
	import { getThemeStores } from '../../../themes/themes.js';

	const { resolveColor } = getThemeStores();

	// Set up props store
	let props = writable({});
	setContext(propKey, props);

	// Data, pagination, and row index numbers
	export let data;
	export let queryID = undefined;
	export let rows = 10; // number of rows to show
	$: rows = Number.parseInt(rows);

	/** @type {string | undefined}*/
	export let title = undefined;

	/** @type {string | undefined}*/
	export let subtitle = undefined;

	export let rowNumbers = false;
	$: rowNumbers = rowNumbers === 'true' || rowNumbers === true;

	// Sort props
	export let sort = undefined;
	let sortBy = undefined;
	let sortAsc = undefined;
	let sortDirection = undefined;
	let sortObj = {};
	$: if (sort) {
		const [column, direction] = sort.split(' ');
		sortBy = column;
		sortDirection = direction;
		sortAsc = direction === 'desc' ? false : true; // Default to ascending if no direction is provided
		sortObj = sortBy ? { col: sortBy, ascending: sortAsc } : { col: null, ascending: null };
	}

	export let groupBy = undefined;
	export let groupsOpen = true; // starting toggle for groups - open or closed
	$: groupsOpen = groupsOpen === 'true' || groupsOpen === true;
	export let groupType = 'accordion'; // accordion | section

	export let accordionRowColor = undefined;
	$: accordionRowColorStore = resolveColor(accordionRowColor);

	export let groupNamePosition = 'middle'; // middle (default) | top | bottom

	if (groupType === 'section') {
		rowNumbers = false; // turn off row numbers
	}

	export let subtotals = false;
	$: subtotals = subtotals === 'true' || subtotals === true;

	export let subtotalRowColor = undefined;
	$: subtotalRowColorStore = resolveColor(subtotalRowColor);

	export let subtotalFontColor = undefined;
	$: subtotalFontColorStore = resolveColor(subtotalFontColor);

	let groupToggleStates = {};

	function handleToggle({ detail }) {
		const { groupName } = detail;
		groupToggleStates[groupName] = !groupToggleStates[groupName];
	}

	let paginated;
	$: paginated = data.length > rows && !groupBy;

	let hovering = false;

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

	export let totalRowColor = undefined;
	$: totalRowColorStore = resolveColor(totalRowColor);

	export let totalFontColor = undefined;
	$: totalFontColorStore = resolveColor(totalFontColor);

	export let isFullPage = false;

	// Row Links:
	export let link = undefined;

	export let showLinkCol = false; // hides link column when columns have not been explicitly selected
	$: showLinkCol = showLinkCol === 'true' || showLinkCol === true;

	let error = undefined;
	let groupDataPopulated = false;

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

	export let wrapTitles = false;
	$: wrapTitles = wrapTitles === 'true' || wrapTitles === true;

	export let headerColor = undefined;
	$: headerColorStore = resolveColor(headerColor);

	export let headerFontColor = undefined;
	$: headerFontColorStore = resolveColor(headerFontColor);

	export let formatColumnTitles = true;
	$: formatColumnTitles = formatColumnTitles === 'true' || formatColumnTitles === true;

	export let backgroundColor = undefined;
	$: backgroundColorStore = resolveColor(backgroundColor);

	export let compact = undefined;

	// ---------------------------------------------------------------------------------------
	// DATA SETUP
	// ---------------------------------------------------------------------------------------

	let columnSummary;

	let priorityColumns = [groupBy];

	props.update((d) => {
		return { ...d, priorityColumns };
	});

	$: finalColumnOrder = getFinalColumnOrder(
		$props.columns.map((d) => d.id),
		$props.priorityColumns
	);
	$: orderedColumns = [...$props.columns].sort(
		(a, b) => finalColumnOrder.indexOf(a.id) - finalColumnOrder.indexOf(b.id)
	);

	$: try {
		error = undefined;

		// CHECK INPUTS
		checkInputs(data);

		// GET COLUMN SUMMARY
		columnSummary = getColumnSummary(data, 'array');

		// Check if sort column is in table
		if (sortBy) {
			if (!columnSummary.map((d) => d.id).includes(sortBy)) {
				throw Error(
					`${sortBy} is not a column in the dataset. sort should contain one column name and optionally a direction (asc or desc). E.g., sort=my_column or sort="my_column desc"`
				);
			}
			if (sortDirection && !['asc', 'desc'].includes(sortDirection)) {
				throw Error(`${sortDirection} is not a valid sort direction. Please use asc or desc`);
			}
		}

		// PROCESS DATES
		// Filter for columns with type of "date"
		const dateCols = columnSummary
			.filter((d) => d.type === 'date' && !(data[0]?.[d.id] instanceof Date))
			.map((d) => d.id);

		for (let i = 0; i < dateCols.length; i++) {
			data = convertColumnToDate(data, dateCols[i]);
		}

		// Hide link column if columns have not been explicitly selected:
		if (link) {
			const linkColIndex = columnSummary.findIndex((d) => d.id === link);
			if (linkColIndex !== -1 && !showLinkCol) {
				columnSummary.splice(linkColIndex, 1);
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
	$: inputPageElWidth = `${(inputPage ?? 1).toString().length}ch`;

	// ---------------------------------------------------------------------------------------
	// SEARCH
	// ---------------------------------------------------------------------------------------
	let searchValue = '';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	let filteredData;
	$: filteredData = data;
	let showNoResults = false;

	/** @type {ReturnValue<typeof Query["createReactive"]>}*/
	let searchFactory;
	$: if (Query.isQuery(data) && search) {
		searchFactory = browserDebounce(
			Query.createReactive(
				{
					loadGracePeriod: 1000,
					callback: (v) => {
						filteredData = v;
					},
					execFn: query
				},
				data.opts,
				data
			),
			200
		);
	}

	$: if (searchFactory) {
		if (searchValue) {
			searchFactory(
				data.search(
					searchValue,
					$props.columns.map((c) => c.id),
					searchValue.length === 1 ? 0.5 : searchValue.length >= 6 ? 0.9 : 0.8
				),
				data.opts
			);
		} else {
			searchFactory(data, data.opts);
		}
	}

	$: if (search && !Query.isQuery(data)) {
		toasts.add(
			{
				status: 'warning',
				title: 'Search Failed',
				message: 'Please use a query instead.'
			},
			5000
		);
	}

	// ---------------------------------------------------------------------------------------
	// GROUPED DATA
	// ---------------------------------------------------------------------------------------

	let groupedData = {};
	let groupRowData = [];

	$: if (data) {
		groupDataPopulated = false;
	}

	$: if (!error) {
		if (groupBy && !groupDataPopulated) {
			groupedData = data.reduce((acc, row) => {
				const groupName = row[groupBy];
				if (!acc[groupName]) {
					acc[groupName] = [];
				}
				acc[groupName].push(row);
				return acc;
			}, {});
			groupDataPopulated = true;
		}

		// After groupedData is populated, calculate aggregations for groupRowData
		groupRowData = Object.keys(groupedData).reduce((acc, groupName) => {
			acc[groupName] = {}; // Initialize groupRow object for this group

			for (const col of $props.columns) {
				const id = col.id;
				const colType = columnSummary.find((d) => d.id === id)?.type;
				const totalAgg = col.totalAgg;
				const weightCol = col.weightCol;
				const rows = groupedData[groupName];
				acc[groupName][id] = aggregateColumn(rows, id, totalAgg, colType, weightCol);
			}

			return acc;
		}, {});

		// Update groupToggleStates only for new groups
		const existingGroups = Object.keys(groupToggleStates);
		for (const groupName of Object.keys(groupedData)) {
			if (!existingGroups.includes(groupName)) {
				groupToggleStates[groupName] = groupsOpen; // Only add new groups with the default state
			}
			// Existing states are untouched
		}
	}

	// ---------------------------------------------------------------------------------------
	// SORTING
	// ---------------------------------------------------------------------------------------

	$: sortClick = (column) => {
		if (sortObj.col === column) {
			// If the clicked column is the same as inital sort column, switch the sort direction
			sortObj.ascending = !sortObj.ascending;
		} else {
			// If the clicked column is different from initial sort column, change the sort column and sort ascending
			sortObj.col = column;
			sortObj.ascending = true;
		}

		sortFunc(sortObj);
	};

	$: sortFunc = (sortObj) => {
		const column = sortObj.col;

		// Modifier to sorting function for ascending or descending
		const sortModifier = sortObj.ascending ? 1 : -1;

		const forceTopOfAscending = (val) =>
			val === undefined || val === null || (typeof val === 'number' && isNaN(val));

		const comparator = (a, b) => {
			const valA = a[column];
			const valB = b[column];

			if (forceTopOfAscending(valA) && !forceTopOfAscending(valB)) return -1 * sortModifier;
			if (forceTopOfAscending(valB) && !forceTopOfAscending(valA)) return 1 * sortModifier;

			// Ensure values are strings for case-insensitive comparison
			const normalizedA = typeof valA === 'string' ? valA.toLowerCase() : valA;
			const normalizedB = typeof valB === 'string' ? valB.toLowerCase() : valB;

			if (normalizedA < normalizedB) return -1 * sortModifier;
			if (normalizedA > normalizedB) return 1 * sortModifier;
			return 0;
		};

		if (groupBy) {
			const sortedGroupedData = {};

			for (const groupName of Object.keys(groupedData)) {
				sortedGroupedData[groupName] = [...groupedData[groupName]].sort(comparator);
			}

			groupedData = sortedGroupedData;
		} else {
			const sortedFilteredData = [...filteredData].sort(comparator);
			filteredData = sortedFilteredData;
		}
	};

	let sortedGroupNames;
	$: if (groupBy && sortObj.col) {
		// Sorting groups based on aggregated values or group names
		sortedGroupNames = Object.entries(groupRowData)
			.sort((a, b) => {
				const valA = a[1][sortObj.col],
					valB = b[1][sortObj.col];
				// Use the existing sort logic but apply it to groupRowData's values
				// Special case for groupby column
				if (sortObj.col === groupBy && isNaN(groupBy)) {
					return sortObj.ascending ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
				}
				if (
					(valA === undefined || valA === null || isNaN(valA)) &&
					valB !== undefined &&
					!isNaN(valB)
				) {
					return -1 * (sortObj.ascending ? 1 : -1);
				}
				if (
					(valB === undefined || valB === null || isNaN(valB)) &&
					valA !== undefined &&
					!isNaN(valA)
				) {
					return 1 * (sortObj.ascending ? 1 : -1);
				}
				if (valA < valB) {
					return -1 * (sortObj.ascending ? 1 : -1);
				} else if (valA > valB) {
					return 1 * (sortObj.ascending ? 1 : -1);
				}
				return 0;
			})
			.map((entry) => entry[0]); // Extract sorted group names
	} else {
		// Default to alphabetical order of group names or another criterion when not sorting by a specific column
		sortedGroupNames = Object.keys(groupedData).sort();
	}

	// Re-run sort on data change (useful for input changes)
	$: if (data && sort) {
		sortFunc(sortObj);
	}

	// ---------------------------------------------------------------------------------------
	// PAGINATION
	// ---------------------------------------------------------------------------------------

	let totalRows;
	$: totalRows = filteredData.length;

	let displayedData = filteredData;

	let pageCount;
	let currentPage = 1;

	$: currentPage = Math.ceil((index + rows) / rows);
	$: currentPageElWidth = `${(currentPage ?? 1).toString().length}ch`;
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
		if (pageCount < currentPage) {
			goToPage(pageCount - 1);
		} else if (currentPage < 1) {
			goToPage(0);
		}
	} else {
		currentPage = 1;
		displayedData = filteredData;
	}

	// ---------------------------------------------------------------------------------------
	// DATA FOR EXPORT
	// ---------------------------------------------------------------------------------------

	function dataSubset(data, selectedCols) {
		return data.map((obj) => {
			const ret = {};
			for (const key of selectedCols) {
				ret[key] = obj[key];
			}
			return ret;
		});
	}

	$: tableData = dataSubset(
		data,
		$props.columns.map((d) => d.id)
	);

	let fullscreen = false;
	/** @type {number} */
	let innerHeight;
</script>

<svelte:window bind:innerHeight />

{#if !isFullPage && innerHeight !== undefined}
	<Fullscreen bind:open={fullscreen} {search}>
		<!-- when compact middle rows are 17.5, middle rows are 23 -->
		{@const ROW_HEIGHT = compact ? 17.5 : 23}
		<!-- header and last row are 22.5+22.5 = 45px -->
		{@const HEADER_LAST_ROW_HEIGHT = 45}
		<!-- Add additional padding for search bar + 24px-->
		{@const SEARCHBAR_HEIGHT = 24}
		<!-- Calculation of total padding -->
		{@const Y_AXIS_PADDING = search
			? SEARCHBAR_HEIGHT + HEADER_LAST_ROW_HEIGHT + 234
			: HEADER_LAST_ROW_HEIGHT + 234}
		<div class="pt-4">
			<svelte:self
				{...$$props}
				rows={1 + Math.round((innerHeight - Y_AXIS_PADDING) / ROW_HEIGHT)}
				isFullPage
			>
				{#each $props.columns as column}
					<Column {...column} />
				{/each}
			</svelte:self>
		</div>
	</Fullscreen>
{/if}

{#if error === undefined}
	<slot>
		<!-- default to every column with no customization -->
		{#each columnSummary as column}
			<Column id={column.id} />
		{/each}
	</slot>

	{#if link}
		<InvisibleLinks {data} {link} />
	{/if}
	{#each $props.columns.filter((column) => column.contentType === 'link') as column}
		<InvisibleLinks {data} link={column.id} />
	{/each}

	<div
		data-testid={isFullPage ? undefined : `DataTable-${data?.id ?? 'no-id'}`}
		role="none"
		class="table-container mt-2 {paginated ? 'mb-5' : 'mb-2'}"
		transition:slide|local
		on:mouseenter={() => (hovering = true)}
		on:mouseleave={() => (hovering = false)}
	>
		{#if title || subtitle}
			<ComponentTitle {title} {subtitle} />
		{/if}

		{#if search}
			<SearchBar bind:value={searchValue} searchFunction={() => {}} />
		{/if}

		<div class="scrollbox pretty-scrollbar" style:background-color={$backgroundColorStore}>
			<table>
				<TableHeader
					{rowNumbers}
					headerColor={$headerColorStore}
					headerFontColor={$headerFontColorStore}
					{orderedColumns}
					{columnSummary}
					{compact}
					{sortable}
					{sortClick}
					{formatColumnTitles}
					{sortObj}
					{wrapTitles}
					{link}
				/>

				<QueryLoad data={filteredData}>
					<svelte:fragment slot="skeleton">
						<tr>
							<td colspan={filteredData.columns.length} class="h-32">
								<Skeleton />
							</td>
						</tr>
					</svelte:fragment>
					{#if groupBy && groupedData && searchValue === ''}
						{#each sortedGroupNames as groupName}
							{#if groupType === 'accordion'}
								<GroupRow
									{groupName}
									currentGroupData={groupedData[groupName]}
									toggled={groupToggleStates[groupName]}
									on:toggle={handleToggle}
									{columnSummary}
									rowColor={$accordionRowColorStore}
									{rowNumbers}
									{subtotals}
									{compact}
									{orderedColumns}
								/>
								{#if groupToggleStates[groupName]}
									<TableRow
										displayedData={groupedData[groupName]}
										{groupType}
										{rowShading}
										{link}
										{rowNumbers}
										{rowLines}
										{compact}
										{index}
										{columnSummary}
										grouped={true}
										groupColumn={groupBy}
										{orderedColumns}
									/>
								{/if}
							{:else if groupType === 'section'}
								<TableRow
									groupColumn={groupBy}
									{groupType}
									rowSpan={groupedData[groupName].length}
									displayedData={groupedData[groupName]}
									{rowShading}
									{link}
									{rowNumbers}
									{rowLines}
									{compact}
									{index}
									{columnSummary}
									grouped={true}
									{groupNamePosition}
									{orderedColumns}
								/>
								{#if subtotals}
									<SubtotalRow
										{groupName}
										currentGroupData={groupedData[groupName]}
										{columnSummary}
										rowColor={$subtotalRowColorStore}
										fontColor={$subtotalFontColorStore}
										{groupType}
										{groupBy}
										{compact}
										{orderedColumns}
									/>
								{/if}
							{/if}
						{/each}
					{:else}
						<TableRow
							{displayedData}
							{rowShading}
							{link}
							{rowNumbers}
							{rowLines}
							{compact}
							{index}
							{columnSummary}
							{orderedColumns}
						/>
					{/if}

					{#if totalRow && searchValue === ''}
						<TotalRow
							{data}
							{rowNumbers}
							{columnSummary}
							rowColor={$totalRowColorStore}
							fontColor={$totalFontColorStore}
							{groupType}
							{compact}
							{orderedColumns}
						/>
					{/if}
				</QueryLoad>
			</table>
		</div>

		<div class="noresults" class:shownoresults={showNoResults}>No Results</div>

		{#if paginated && pageCount > 1}
			<div class="pagination text-base-content-muted">
				<div class="page-labels mr-auto">
					<button
						aria-label="first-page"
						class="page-changer disabled:text-base-content-muted/25"
						class:hovering
						disabled={currentPage === 1}
						on:click={() => goToPage(0)}
					>
						<div class="page-icon flex items-center">
							<Icon src={ChevronsLeft} />
						</div>
					</button>
					<button
						aria-label="previous-page"
						class="page-changer disabled:text-base-content-muted/25"
						class:hovering
						disabled={currentPage === 1}
						on:click={() => goToPage(currentPage - 2)}
					>
						<div class="page-icon h-[0.83em] flex items-center">
							<Icon src={ChevronLeft} class="h-[0.83em]" />
						</div>
					</button>
					<span class="page-count">
						Page
						<input
							class="page-input bg-base-200 text-base-content-muted"
							class:hovering
							class:error={inputPage > pageCount}
							style="width: {inputPage ? inputPageElWidth : currentPageElWidth};"
							type="number"
							bind:value={inputPage}
							on:keyup={() => goToPage((inputPage ?? 1) - 1)}
							on:change={() => goToPage((inputPage ?? 1) - 1)}
							placeholder={currentPage}
						/>
						/
						<span class="page-count ml-1">{pageCount.toLocaleString()}</span>
					</span>
					<span class="print-page-count">
						{displayedPageLength.toLocaleString()} of {totalRows.toLocaleString()} records
					</span>
					<button
						aria-label="next-page"
						class="page-changer disabled:text-base-content-muted/25"
						class:hovering
						disabled={currentPage === pageCount}
						on:click={() => goToPage(currentPage)}
					>
						<div class="page-icon h-[0.83em] flex items-center">
							<Icon src={ChevronRight} class="h-[0.83em]" />
						</div>
					</button>
					<button
						aria-label="last-page"
						class="page-changer disabled:text-base-content-muted/25"
						class:hovering
						disabled={currentPage === pageCount}
						on:click={() => goToPage(pageCount - 1)}
					>
						<div class="page-icon flex items-center">
							<Icon src={ChevronsRight} />
						</div>
					</button>
				</div>
				{#if downloadable}
					<DownloadData class="download-button" data={tableData} {queryID} display={hovering} />
				{/if}
				{#if !isFullPage}
					<EnterFullScreen on:click={() => (fullscreen = true)} display={hovering} />
				{/if}
			</div>
		{:else}
			<div class="table-footer mt-3">
				{#if downloadable}
					<DownloadData class="download-button" data={tableData} {queryID} display={hovering} />
				{/if}
				{#if !isFullPage}
					<EnterFullScreen on:click={() => (fullscreen = true)} display={hovering} />
				{/if}
			</div>
		{/if}
	</div>

	{#if generateMarkdown}
		{#if queryID}
			<CodeBlock>
				{`<DataTable data={${queryID}}>`}
				<br />
				{#each Object.keys(data[0]) as column}
					{`   <Column id=${column.includes(' ') ? `'${column}'` : column}/>`}
					<br />
				{/each}
				{`</DataTable>`}
			</CodeBlock>
		{/if}
	{/if}
{:else}
	<ErrorChart {error} title="Data Table" />
{/if}

<style>
	.table-container {
		font-size: 9.5pt;
	}

	.scrollbox {
		width: 100%;
		overflow-x: auto;
		scrollbar-width: thin;
	}

	table {
		display: table;
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	.page-changer {
		padding: 0;
		height: 1.1em;
		width: 1.1em;
	}

	.pagination {
		font-size: 12px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		height: 2em;
		font-family: var(--ui-font-family);
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
		text-align: right;
		margin-top: 0.5em;
		margin-bottom: 0;
		font-variant-numeric: tabular-nums;
	}

	.page-labels {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 3px;
	}

	.page-changer {
		font-size: 20px;
		background: none;
		border: none;
		cursor: pointer;
		transition: color 200ms;
	}

	.page-changer.hovering {
		color: var(--color-primary);
		transition: color 200ms;
	}

	.page-changer:disabled {
		cursor: auto;
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
		box-sizing: content-box;
		text-align: center;
		padding: 0.25em 0.5em;
		margin: 0;
		border: 1px solid transparent;
		border-radius: 4px;
		font-size: 12px;
	}

	.table-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
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
		border: 1px solid var(--base-300);
	}

	.page-input.error {
		border: 1px solid var(--negative);
	}

	.page-input::-moz-placeholder {
		color: var(--base-content-muted);
	}

	.page-input::placeholder {
		color: var(--base-content-muted);
	}

	button:enabled > .page-icon:hover {
		filter: brightness(0.8);
	}

	*:focus {
		outline: none;
	}

	::-moz-placeholder {
		/* Chrome, Firefox, Opera, Safari 10.1+ */
		color: var(--base-content-muted);
		opacity: 1; /* Firefox */
	}

	::placeholder {
		/* Chrome, Firefox, Opera, Safari 10.1+ */
		color: var(--base-content-muted);
		opacity: 1; /* Firefox */
	}

	:-ms-input-placeholder {
		/* Internet Explorer 10-11 */
		color: var(--base-content-muted);
	}

	::-ms-input-placeholder {
		/* Microsoft Edge */
		color: var(--base-content-muted);
	}

	.noresults {
		display: none;
		color: var(--base-content-muted);
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
