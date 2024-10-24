<script>
	// @ts-check
	import { writable, derived, readable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { propKey, strictBuild } from '@evidence-dev/component-utilities/chartContext';
	import getColumnSummary from '@evidence-dev/component-utilities/getColumnSummary';
	import { convertColumnToDate } from '@evidence-dev/component-utilities/dateParsing';
	import ErrorChart from '../core/ErrorChart.svelte';
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
	import { query } from '@evidence-dev/universal-sql/client-duckdb';
	import Skeleton from '../../../atoms/skeletons/Skeleton.svelte';
	import { browserDebounce } from '@evidence-dev/sdk/utils';
	import { aggregateStores } from './datatable.store.js';

	// Data, pagination, and row index numbers
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let data;
	export let queryID = undefined;
	export let rows = 10; // number of rows to show
	$: rows = Number.parseInt(rows);

	export let rowNumbers = false;
	$: rowNumbers = rowNumbers === 'true' || rowNumbers === true;

	export let groupBy = undefined;
	export let groupsOpen = true; // starting toggle for groups - open or closed
	$: groupsOpen = groupsOpen === 'true' || groupsOpen === true;
	export let groupType = 'accordion'; // accordion | section
	export let accordionRowColor = undefined;
	export let groupNamePosition = 'middle'; // middle (default) | top | bottom

	if (groupType === 'section') {
		rowNumbers = false; // turn off row numbers
	}

	export let subtotals = false;
	$: subtotals = subtotals === 'true' || subtotals === true;

	export let subtotalRowColor = undefined;
	export let subtotalFontColor = undefined;

	function handleToggle({ detail }) {
		const { groupName } = detail;
		$groupToggleStates[groupName] = !$groupToggleStates[groupName];
	}

	$: paginated = data.length > rows && !groupBy;

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

	export let totalRowColor = undefined;
	export let totalFontColor = undefined;

	export let isFullPage = false;

	// Row Links:
	export let link = undefined;

	export let showLinkCol = false; // hides link column when columns have not been explicitly selected
	$: showLinkCol = showLinkCol === 'true' || showLinkCol === true;

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
	export let headerFontColor = 'var(--grey-900)';

	export let formatColumnTitles = true;
	$: formatColumnTitles = formatColumnTitles === 'true' || formatColumnTitles === true;

	export let backgroundColor = 'white';

	export let compact = undefined;

	// Set up props store
	/** @type {import("svelte/store").Writable<import("./datatable.store.js").DataTableProps>} */
	const props = writable({ data, columns: [], priorityColumns: groupBy ? [groupBy] : [] });
	setContext(propKey, props);

	// ---------------------------------------------------------------------------------------
	// Add props to store to let child components access them
	// ---------------------------------------------------------------------------------------
	$props = { ...$props, data, columns: [], priorityColumns: groupBy ? [groupBy] : [] };

	// ---------------------------------------------------------------------------------------
	// DATA SETUP
	// ---------------------------------------------------------------------------------------

	const finalColumnOrder = derived([props], ([$props]) =>
		getFinalColumnOrder(
			$props.columns.map((d) => d.id),
			$props.priorityColumns
		)
	);

	const orderedColumns = derived([props, finalColumnOrder], ([$props, $finalColumnOrder]) =>
		[...$props.columns].sort(
			(a, b) => $finalColumnOrder.indexOf(a.id) - $finalColumnOrder.indexOf(b.id)
		)
	);

	$: console.log({ $props });
	$: console.log({ $orderedColumns });

	function getErrorStore() {
		/** @type {import("svelte/store").Writable<string | undefined>} */
		const error = writable(undefined);

		/** @template T
		 * @param {() => T} fn
		 * @returns {T | undefined} */
		function wrapError(fn) {
			try {
				return fn();
			} catch (e) {
				error.set(e.message);
				if (strictBuild) {
					throw error;
				}
			}
		}

		return { error, wrapError };
	}

	const { error, wrapError } = getErrorStore();

	$: if (search && !Query.isQuery(data)) {
		$error = 'Search is only available for queries';
	}

	$: wrapError(() => checkInputs(data));

	const columnSummary = derived([data], ([$data]) => {
		const summary = wrapError(() => getColumnSummary($data, 'array'));
		if (!summary) return [];

		for (let i = 0; i < summary.length; i++) {
			summary[i].show = showLinkCol === false && summary[i].id === link ? false : true;
		}
		if (link) {
			const linkColIndex = summary.findIndex((d) => d.id === link);
			if (linkColIndex !== -1 && !showLinkCol) {
				summary.splice(linkColIndex, 1);
			}
		}

		const dateCols = summary.filter(
			(d) => d.type === 'date' && !($data[0]?.[d.id] instanceof Date)
		);
		for (const col of dateCols) {
			data = convertColumnToDate(data, col.id);
		}

		return summary;
	});

	const index = writable(0);
	/** @type {import("svelte/store").Writable<number | null>} */
	const inputPage = writable(null);
	$: inputPageElWidth = `${($inputPage ?? 1).toString().length}ch`;

	// ---------------------------------------------------------------------------------------
	// SEARCH
	// ---------------------------------------------------------------------------------------
	let searchValue = '';
	const filteredData = writable(data);
	$: $filteredData = data;
	let showNoResults = false;

	/** @type {ReturnType<typeof Query["createReactive"]> | undefined}*/
	const searchFactory =
		Query.isQuery(data) && search
			? browserDebounce(
					Query.createReactive(
						{
							loadGracePeriod: 1000,
							callback: (v) => ($filteredData = v),
							execFn: query
						},
						data.opts,
						data
					),
					200
				)
			: undefined;

	// ---------------------------------------------------------------------------------------
	// SORTING
	// ---------------------------------------------------------------------------------------

	/** @type {import("svelte/store").Writable<{ col: string | null; ascending: boolean | null; }>} */
	const sortBy = writable({ col: null, ascending: null });

	/** @param {string} column */
	function sort(column) {
		if ($sortBy.col == column) {
			$sortBy.ascending = !$sortBy.ascending;
		} else {
			$sortBy.col = column;
			$sortBy.ascending = true;
		}

		// Modifier to sorting function for ascending or descending
		const sortModifier = $sortBy.ascending ? 1 : -1;

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
		$filteredData = $filteredData.sort(sort);

		if (groupBy) {
			// sort within grouped data
			for (const groupName of Object.keys($groupedData)) {
				$groupedData[groupName] = $groupedData[groupName].sort(sort);
			}
		}
	}

	// ---------------------------------------------------------------------------------------
	// GROUPED DATA
	// ---------------------------------------------------------------------------------------

	const { groupedData, groupToggleStates, sortedGroupNames, update } = groupBy
		? aggregateStores({
				data,
				groupBy,
				groupsOpen,
				columnSummary,
				props,
				sortBy
			})
		: { update() {} };

	// todo: should you be able to add a groupBy if you didn't have one initially?
	$: if (groupBy) update({ data, groupBy, groupsOpen });

	// Reset sort condition when data object is changed
	$: data, ($sortBy = { col: null, ascending: null });

	// ---------------------------------------------------------------------------------------
	// PAGINATION
	// ---------------------------------------------------------------------------------------

	const totalRows = derived([filteredData], ([$filteredData]) => $filteredData.length);

	const currentPage = writable(1);

	$: $currentPage = Math.ceil(($index + rows) / rows);
	$: currentPageElWidth = `${($currentPage ?? 1).toString().length}ch`;

	/** @param {number} pageNumber */
	function goToPage(pageNumber) {
		$index = pageNumber * rows;
		const max = $index + rows;
		$currentPage = Math.ceil(max / rows);
		if ($inputPage) {
			$inputPage = Math.ceil(max / rows);
		}
	}

	$: displayedData = derived([filteredData, index], ([$filteredData, $index]) =>
		$filteredData.slice($index, $index + rows)
	);
	$: pageCount = derived([filteredData], ([$filteredData]) =>
		Math.ceil($filteredData.length / rows)
	);

	$: if (paginated) {
		if ($pageCount < $currentPage) {
			goToPage($pageCount - 1);
		} else if ($currentPage < 1) {
			goToPage(0);
		}
	} else {
		$currentPage = 1;
		$displayedData = $filteredData;
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

	$: tableData = derived([props], ([$props]) =>
		dataSubset(
			data,
			$props.columns.map((d) => d.id)
		)
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

{#if $error === undefined}
	<slot>
		<!-- default to every column with no customization -->
		{#each $columnSummary as column}
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
		class="table-container"
		transition:slide|local
		style:margin-top={marginTop}
		style:margin-bottom={marginBottom}
		style:padding-bottom={paddingBottom}
		on:mouseenter={() => (hovering = true)}
		on:mouseleave={() => (hovering = false)}
	>
		{#if search}
			<SearchBar
				searchFunction={(value) => {
					searchValue = value;
					if (searchFactory) {
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
				}}
			/>
		{/if}

		<div class="scrollbox" style:background-color={backgroundColor}>
			<table>
				<TableHeader
					{rowNumbers}
					{headerColor}
					{headerFontColor}
					orderedColumns={$orderedColumns}
					columnSummary={$columnSummary}
					{compact}
					{sortable}
					{sort}
					{formatColumnTitles}
					sortBy={$sortBy}
					{wrapTitles}
					{link}
				/>

				<QueryLoad data={$filteredData}>
					<svelte:fragment slot="skeleton">
						<tr>
							<td colspan={$filteredData.columns.length} class="h-32">
								<Skeleton />
							</td>
						</tr>
					</svelte:fragment>
					{#if groupBy && $groupedData && searchValue === ''}
						{#each $sortedGroupNames as groupName}
							{#if groupType === 'accordion'}
								<GroupRow
									{groupName}
									currentGroupData={$groupedData[groupName]}
									toggled={$groupToggleStates[groupName]}
									on:toggle={handleToggle}
									columnSummary={$columnSummary}
									rowColor={accordionRowColor}
									{rowNumbers}
									{subtotals}
									{compact}
									orderedColumns={$orderedColumns}
								/>
								{#if $groupToggleStates[groupName]}
									<TableRow
										displayedData={$groupedData[groupName]}
										{groupType}
										{rowShading}
										{link}
										{rowNumbers}
										{rowLines}
										{compact}
										{index}
										columnSummary={$columnSummary}
										grouped={true}
										groupColumn={groupBy}
										orderedColumns={$orderedColumns}
									/>
								{/if}
							{:else if groupType === 'section'}
								<TableRow
									groupColumn={groupBy}
									{groupType}
									rowSpan={$groupedData[groupName].length}
									displayedData={$groupedData[groupName]}
									{rowShading}
									{link}
									{rowNumbers}
									{rowLines}
									{compact}
									{index}
									columnSummary={$columnSummary}
									grouped={true}
									{groupNamePosition}
									orderedColumns={$orderedColumns}
								/>
								{#if subtotals}
									<SubtotalRow
										{groupName}
										currentGroupData={$groupedData[groupName]}
										columnSummary={$columnSummary}
										rowColor={subtotalRowColor}
										fontColor={subtotalFontColor}
										{groupType}
										{groupBy}
										{compact}
										orderedColumns={$orderedColumns}
									/>
								{/if}
							{/if}
						{/each}
					{:else}
						<TableRow
							displayedData={$displayedData}
							{rowShading}
							{link}
							{rowNumbers}
							{rowLines}
							{compact}
							{index}
							columnSummary={$columnSummary}
							orderedColumns={$orderedColumns}
						/>
					{/if}

					{#if totalRow && searchValue === ''}
						<TotalRow
							{data}
							{rowNumbers}
							columnSummary={$columnSummary}
							rowColor={totalRowColor}
							fontColor={totalFontColor}
							{groupType}
							{compact}
							orderedColumns={$orderedColumns}
						/>
					{/if}
				</QueryLoad>
			</table>
		</div>

		<div class="noresults" class:shownoresults={showNoResults}>No Results</div>

		{#if paginated && $pageCount > 1}
			<div class="pagination">
				<div class="page-labels mr-auto">
					<button
						aria-label="first-page"
						class="page-changer"
						class:hovering
						disabled={$currentPage === 1}
						on:click={() => goToPage(0)}
					>
						<div class="page-icon flex items-center">
							<Icon src={ChevronsLeft} />
						</div>
					</button>
					<button
						aria-label="previous-page"
						class="page-changer"
						class:hovering
						disabled={$currentPage === 1}
						on:click={() => goToPage($currentPage - 2)}
					>
						<div class="page-icon h-[0.83em] flex items-center">
							<Icon src={ChevronLeft} class="h-[0.83em]" />
						</div>
					</button>
					<span class="page-count">
						Page
						<input
							class="page-input"
							class:hovering
							class:error={($inputPage ?? -1) > $pageCount}
							style="width: {$inputPage ? inputPageElWidth : currentPageElWidth};"
							type="number"
							bind:value={$inputPage}
							on:keyup={() => goToPage(($inputPage ?? 1) - 1)}
							on:change={() => goToPage(($inputPage ?? 1) - 1)}
							placeholder={$currentPage}
						/>
						/
						<span class="page-count ml-1">{$pageCount.toLocaleString()}</span>
					</span>
					<span class="print-page-count">
						{$displayedData.length.toLocaleString()} of {$totalRows.toLocaleString()} records
					</span>
					<button
						aria-label="next-page"
						class="page-changer"
						class:hovering
						disabled={$currentPage === $pageCount}
						on:click={() => goToPage($currentPage)}
					>
						<div class="page-icon h-[0.83em] flex items-center">
							<Icon src={ChevronRight} class="h-[0.83em]" />
						</div>
					</button>
					<button
						aria-label="last-page"
						class="page-changer"
						class:hovering
						disabled={$currentPage === $pageCount}
						on:click={() => goToPage($pageCount - 1)}
					>
						<div class="page-icon flex items-center">
							<Icon src={ChevronsRight} />
						</div>
					</button>
				</div>
				{#if downloadable}
					<DownloadData class="download-button" data={$tableData} {queryID} display={hovering} />
				{/if}
				{#if !isFullPage}
					<EnterFullScreen on:click={() => (fullscreen = true)} display={hovering} />
				{/if}
			</div>
		{:else}
			<div class="table-footer">
				{#if downloadable}
					<DownloadData class="download-button" data={$tableData} {queryID} display={hovering} />
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
	<ErrorChart error={$error} chartType="Data Table" />
{/if}

<style>
	.table-container {
		font-size: 9.5pt;
	}

	.scrollbox {
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

	.scrollbox::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}

	.scrollbox::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}

	.scrollbox::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}

	.scrollbox::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}

	.scrollbox::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	.scrollbox::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}

	table {
		display: table;
		width: 100%;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}

	.page-changer {
		padding: 0;
		color: var(--grey-400);
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
		box-sizing: content-box;
		text-align: center;
		padding: 0.25em 0.5em;
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
