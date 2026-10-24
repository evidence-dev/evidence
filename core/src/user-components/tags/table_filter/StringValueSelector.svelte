<script lang="ts">
	import { Query } from '../../../Query.svelte';
	import { Skeleton } from '../../../shadcn/components/ui/skeleton';
	import { fade } from 'svelte/transition';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { Button } from '../../../shadcn/components/ui/button';
	import { CheckIcon } from 'lucide-svelte';
	import type { FilterState, ColumnFilter } from './types';
	import { generateFilterSQL, buildValueQueryOrder } from './filterUtils.svelte';
	import { Virtualizer, type VirtualizerHandle } from 'virtua/svelte';
	import { getRepeatContext } from '../repeat/repeat-context';
	import { processColumnExpression } from '../../common/sql-expression-utils';
	import type { SQLQueryConfig } from '../../common/sql-options';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { logger } from '../../../shims/logger';

	let {
		tableExpressionName,
		columnName,
		columnLabel,
		onClose,
		filterState,
		minimumRecords = null,
		multiple = true,
		requireSelection = false
	} = $props<{
		tableExpressionName: string;
		columnName: string;
		columnLabel: string;
		onClose: () => void;
		filterState: FilterState;
		minimumRecords?: number | null;
		multiple?: boolean;
		requireSelection?: boolean;
	}>();

	// Get the query service from context
	const connection = getDefaultConnection();
	const repeatFilters = getRepeatContext()?.filters;
	const pageFilters = getPageFiltersContext();
	const inlineQueries = getInlineQueriesContext();

	let selectedValues = $state<string[]>([]);
	// Derived set for efficient lookups and to ensure reactivity in virtualized list
	let selectedValuesSet = $derived(new Set(selectedValues));
	// Saved as `contains`, not a value list, so it isn't capped by VALUES_LIMIT and stays small in the URL
	let matchAllSearch = $state<string | null>(null);
	let searchInput = $state('');
	let searchLoading = $state(false);
	let inputRef = $state<HTMLInputElement | null>(null);
	let virtualizer: VirtualizerHandle | undefined = $state();

	// Scroll virtualized list to selected option
	$effect(() => {
		if (virtualizer && columnValuesQuery.result && selectedValues.length) {
			let valueToFocus = selectedValues[0]!;
			const index = columnValuesQuery.result?.rows.findIndex((row) => row.value === valueToFocus);
			virtualizer.scrollToIndex(index, { align: 'center' });
		}
	});

	// Track if we've initialized to prevent re-initialization on search/re-renders
	// This flag prevents the bug where clearing selections and then searching would restore them
	let initialized = $state(false);

	// Initialize values from existing filter if available
	$effect(() => {
		if (!columnName || initialized) return;

		// Find existing filter for this column
		const existingFilter = filterState.filters.find(
			(filter: ColumnFilter) => filter.columnId === columnName
		);

		if (!existingFilter || existingFilter.conditions.length === 0) {
			loadColumnValues();
			initialized = true;
			return;
		}

		const condition = existingFilter.conditions[0];
		if (condition.type !== 'string') {
			loadColumnValues();
			initialized = true;
			return;
		}

		// Set values based on the condition
		if (condition.operator === 'in' && Array.isArray(condition.value)) {
			selectedValues = condition.value;
		} else if (
			multiple &&
			condition.operator === 'contains' &&
			typeof condition.value === 'string'
		) {
			matchAllSearch = condition.value;
			searchInput = condition.value;
		}

		loadColumnValues();
		initialized = true;
	});

	$effect(() => {
		if (inputRef) {
			inputRef.focus();
		}
	});

	// Effect to reload data when search input changes
	$effect(() => {
		// This effect tracks searchInput and triggers reload
		// The searchInput dependency will cause this to run when user types
		const _ = searchInput; // Track searchInput changes

		// Immediately show loading state for search
		searchLoading = true;

		// Small delay to avoid too many requests while typing
		const timeoutId = setTimeout(() => {
			loadColumnValues();
		}, 300);

		return () => clearTimeout(timeoutId);
	});

	let columnValuesSql: SQLQueryConfig | undefined = $state();

	const VALUES_LIMIT = 10000;

	function loadColumnValues() {
		columnValuesSql = buildValuesQuery(searchInput);
	}

	function buildValuesQuery(search: string): SQLQueryConfig {
		let whereClause = `${columnName} IS NOT NULL`;

		// When minimumRecords is set, we need to filter based on other filters
		// Always consider other filters when loading values
		const otherFilters = {
			...filterState,
			filters: filterState.filters.filter((f: ColumnFilter) => f.columnId !== columnName)
		};

		const otherFilterSQL = generateFilterSQL(otherFilters, connection.dialect);

		if (otherFilterSQL) {
			whereClause = `${columnName} IS NOT NULL AND (${otherFilterSQL})`;
		}

		// Add search condition if it exists (like dropdown)
		if (search.trim()) {
			const escapedSearch = connection.dialect.escapeStringLiteral(search.trim());
			whereClause += ` AND ${connection.dialect.caseInsensitiveLike(connection.dialect.castToString(columnName), `%${escapedSearch}%`)}`;
		}

		// Process column expressions like the Dropdown component
		// Dedup via GROUP BY: inline DISTINCT emits `GROUP BY DISTINCT`, which Cube rejects.
		const valueProcessed = processColumnExpression(
			{
				value: `${columnName} as value`
			},
			connection.dialect
		);

		const countProcessed = processColumnExpression(
			{
				value: 'COUNT(*) as count'
			},
			connection.dialect
		);

		return {
			tableExpressionName,
			columns: [valueProcessed, countProcessed],
			where: whereClause,
			order: buildValueQueryOrder(columnName, minimumRecords),
			limit: VALUES_LIMIT
		};
	}

	const queryDeps = {
		connection,
		filterContexts: [repeatFilters, pageFilters],
		inlineQueries,
		projectSettings: getProjectSettingsContext(),
		defaultRefreshInterval: undefined
	};

	const columnValuesQuery = new Query<{ value: string; count: number }>(
		() => columnValuesSql,
		queryDeps
	);

	// Loaded separately so the selection can be expanded even after the search moves on
	const matchAllQuery = new Query<{ value: string; count: number }>(
		() => (matchAllSearch === null ? undefined : buildValuesQuery(matchAllSearch)),
		queryDeps
	);

	const loading = $derived(columnValuesQuery.loading || searchLoading);

	// Clear search loading when query finishes
	$effect(() => {
		if (!columnValuesQuery.loading && searchLoading) {
			searchLoading = false;
		}
	});

	// Function to check if a value meets the minimum records requirement
	function meetsMinimumRequirement(row: { count: number }) {
		return minimumRecords === null || row.count >= minimumRecords;
	}

	const loadedValues = () =>
		(columnValuesQuery.result?.rows ?? []).filter(meetsMinimumRequirement).map((row) => row.value);

	const matchesSearch = (value: string, search: string) =>
		String(value).toLowerCase().includes(search.toLowerCase());

	const matchAllRows = $derived(
		matchAllSearch !== null && !matchAllQuery.loading ? matchAllQuery.result?.rows : undefined
	);
	const matchAllTruncated = $derived((matchAllRows?.length ?? 0) >= VALUES_LIMIT);
	const matchAllSet = $derived(new Set(matchAllRows?.map((row) => row.value)));

	// SQL LIKE treats `_` and `%` as wildcards, so the loaded matches are the source of truth
	const isMatchAllSelected = (value: string) =>
		matchAllSet.has(value) || matchesSearch(value, matchAllSearch ?? '');

	// Converting to an explicit list is only safe once every match is loaded
	function expandMatchAll(): boolean {
		if (!matchAllRows || matchAllTruncated) return false;
		selectedValues = Array.from(
			new Set([...selectedValues, ...matchAllRows.map((row) => row.value)])
		);
		matchAllSearch = null;
		return true;
	}

	const canSelectAll = $derived(
		multiple &&
			matchAllSearch === null &&
			searchInput.trim() !== '' &&
			!loading &&
			(columnValuesQuery.result?.rows.length ?? 0) > 0
	);

	function selectAll() {
		const term = searchInput.trim();
		// `contains` would also match values disabled by minimumRecords, or drop earlier picks
		const keepsEarlierPicks = selectedValues.every((value) => matchesSearch(value, term));
		if (minimumRecords === null && keepsEarlierPicks) {
			matchAllSearch = term;
			selectedValues = [];
		} else {
			selectedValues = Array.from(new Set([...selectedValues, ...loadedValues()]));
		}
	}

	// Function to handle value selection
	function handleValueSelect(value: string, hasMinimum: boolean) {
		// If minimumRecords is set and this value doesn't meet the minimum,
		// we shouldn't do anything
		if (minimumRecords !== null && !hasMinimum) {
			return;
		}

		if (matchAllSearch !== null && !expandMatchAll()) return;

		if (multiple) {
			// Toggle selection in multi-select mode
			if (selectedValues.includes(value)) {
				if (requireSelection && selectedValues.length === 1) return;
				selectedValues = selectedValues.filter((v) => v !== value);
			} else {
				selectedValues = [...selectedValues, value];
			}
		} else {
			// In single-select mode, replace the current selection
			if (selectedValues.includes(value)) {
				if (requireSelection) return;
				// Clicking the same value again deselects it if requireSelection is false
				selectedValues = [];
			} else {
				selectedValues = [value];
			}
		}
	}

	// Function to clear all selections
	function clearSelections() {
		if (requireSelection) return;
		matchAllSearch = null;
		selectedValues = [];
	}

	// Function to apply the filter
	function applyFilter() {
		if (!filterState) {
			logger.warn('Filter state not found, cannot apply filter');
			onClose();
			return;
		}

		// Remove any existing filter for this column
		filterState.filters = filterState.filters.filter(
			(filter: ColumnFilter) => filter.columnId !== columnName
		);

		if (matchAllSearch !== null) {
			filterState.filters.push({
				columnId: columnName,
				conditions: [{ type: 'string', operator: 'contains', value: matchAllSearch }]
			});
			filterState.active = true;
		} else if (selectedValues.length > 0) {
			// Add a new filter with the selected values using a single IN condition
			filterState.filters.push({
				columnId: columnName,
				conditions: [
					{
						type: 'string',
						operator: 'in',
						value: selectedValues
					}
				]
			});
			filterState.active = true;
		}

		// Close the dropdown
		onClose();
	}

	function handleCancel() {
		onClose();
	}
</script>

<div class="flex flex-col">
	<input
		placeholder={`Search ${columnLabel}`}
		class="bg-background placeholder:text-muted-foreground flex h-9 w-full rounded-t-md border border-b border-none px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		bind:this={inputRef}
		bind:value={searchInput}
	/>

	<div class="flex items-center justify-between border-y px-2 py-1">
		<div class="text-muted-foreground min-w-0 truncate text-xs">
			{#if matchAllSearch !== null}
				All matching "{matchAllSearch}"
			{:else}
				{selectedValues.length} selected
			{/if}
		</div>
		<div class="flex shrink-0 gap-1">
			{#if canSelectAll}
				<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={selectAll}>
					Select All
				</Button>
			{/if}
			{#if !requireSelection}
				<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={clearSelections}>
					Clear All
				</Button>
			{/if}
		</div>
	</div>

	{#if matchAllTruncated}
		<div class="bg-muted/40 text-muted-foreground px-2 py-1 text-xs">
			Too many matches to change individually. Clear All and use a narrower search.
		</div>
	{/if}

	{#if minimumRecords !== null}
		<div class="bg-muted/40 text-muted-foreground px-2 py-1 text-xs">
			Values with fewer than {minimumRecords} records are disabled
		</div>
	{/if}

	{#if loading}
		<div in:fade>
			<Skeleton class="m-2 h-6 w-1/3 " />
			<Skeleton class="m-2 h-6 w-1/2" />
			<Skeleton class="m-2 h-6 w-1/4" />
			<Skeleton class="m-2 h-6 w-1/5" />
			<Skeleton class="m-2 h-6 w-1/2" />
			<Skeleton class="m-2 h-6 w-1/4" />
		</div>
	{:else}
		<div class="max-h-[300px] overflow-auto p-1">
			{#if !columnValuesQuery.result?.rows || columnValuesQuery.result.rows.length === 0}
				<div class="text-muted-foreground flex h-12 items-center justify-center text-sm">
					No matching values
				</div>
			{:else}
				{#key selectedValues}
					<Virtualizer
						bind:this={virtualizer}
						data={columnValuesQuery.result?.rows ?? []}
						getKey={(row) => row.value}
					>
						{#snippet children(value)}
							{@const hasMinimum = meetsMinimumRequirement(value)}
							{@const isSelected =
								matchAllSearch !== null
									? isMatchAllSelected(value.value)
									: selectedValuesSet.has(value.value)}
							{#if hasMinimum}
								<button
									type="button"
									onclick={() => handleValueSelect(value.value, hasMinimum)}
									class="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
									class:bg-muted={isSelected && !multiple}
								>
									<span class="min-w-0 flex-1 text-sm break-words">
										{value.value}
									</span>
									{#if minimumRecords !== null}
										<span class="text-muted-foreground flex-shrink-0 text-xs">({value.count})</span>
									{/if}
									{#if isSelected}
										<CheckIcon class="size-4 flex-shrink-0" />
									{/if}
								</button>
							{:else}
								<div
									class="flex cursor-not-allowed items-center gap-2 rounded-sm px-2 py-1.5 text-sm opacity-50 select-none"
								>
									<span class="min-w-0 flex-1 text-sm break-words">
										{value.value}
									</span>
									{#if minimumRecords !== null}
										<span class="text-muted-foreground flex-shrink-0 text-xs">({value.count})</span>
									{/if}
								</div>
							{/if}
						{/snippet}
					</Virtualizer>
				{/key}
			{/if}
		</div>
	{/if}
	<div class="flex justify-end gap-2 border-t p-2 pt-1">
		<Button variant="outline" size="sm" onclick={handleCancel}>Cancel</Button>
		<Button variant="default" size="sm" onclick={applyFilter}>Apply</Button>
	</div>
</div>
