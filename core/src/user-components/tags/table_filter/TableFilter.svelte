<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { type Filter } from '../../../Filter.svelte';
	import { tick } from 'svelte';
	import * as Command from '../../../shadcn/components/ui/command';
	import * as Popover from '../../../shadcn/components/ui/popover';
	import { Button } from '../../../shadcn/components/ui/button';
	import { ListFilter, Calendar, Type, Hash, ToggleLeft } from 'lucide-svelte';
	import { getInlineQueryMetadataContext } from '../../../metadata/inline-query-metadata.svelte';
	import type { IColumnMetadata } from '../../../metadata/metadata';
	import StringValueSelector from './StringValueSelector.svelte';
	import DateRangeSelector from './DateRangeSelector.svelte';
	import NumericValueSelector from './NumericValueSelector.svelte';
	import FilterChips from './FilterChips.svelte';
	import formatTitle from '../../formatTitle';
	import type { FilterState } from './types';
	import {
		setFilterContext,
		clearAllFilters,
		toggleConjunction,
		addFilter,
		generateFilterSQL,
		constrainFilters
	} from './filterUtils.svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';
	import { getDefaultConnection } from '../../../QueryService.context';
	import { getInlineQueriesContext } from '../../common/inline-queries';
	import { resolveCatalogTable } from '../../../metadata/resolve-table';
	import { logger } from '../../../shims/logger';
	import { browser } from '../../../shims/env';

	let {
		id,
		className,
		data,
		columns,
		labels,
		title = 'Filter',
		showClearButton = true,
		minimumRecords = null,
		multiple = true,
		single_select = [],
		multi_select = [],
		require_selection
	} = $props<
		UserComponentProps<typeof schema> & { minimumRecords?: number | null; multiple?: boolean }
	>();

	const connection = getDefaultConnection();

	// Author-provided column lists are matched case-insensitively against catalog column names, since
	// Snowflake folds identifiers (`single_select=["category"]` must apply to catalog `CATEGORY`).
	const listHas = (list: string[] | undefined, name: string) =>
		!!list?.some((c) => c.toLowerCase() === name.toLowerCase());

	// A column in both lists resolves to single-select, matching the select-mode-overlap warning
	function columnAllowsMultiple(columnName: string): boolean {
		if (listHas(single_select, columnName)) return false;
		if (listHas(multi_select, columnName)) return true;
		return multiple;
	}

	function columnRequiresSelection(columnName: string): boolean {
		return listHas(require_selection, columnName);
	}

	// Create a mapping from column names to custom labels
	let columnLabels = $derived.by(() => {
		// Keyed lowercase so a custom label applies regardless of the catalog's column casing.
		const map = new Map<string, string>();
		if (columns && labels) {
			columns.forEach((col: string, index: number) => {
				if (labels[index]) {
					map.set(col.toLowerCase(), labels[index]);
				}
			});
		}
		return map;
	});

	// Helper function to get the display label for a column
	function getColumnLabel(columnName: string): string {
		return columnLabels.get(columnName.toLowerCase()) ?? formatTitle(columnName);
	}

	const metadata = connection.catalog!;
	const inlineQueryMetadata = getInlineQueryMetadataContext();
	const inlineQueries = getInlineQueriesContext();
	const pageFilters = getPageFiltersContext();

	// The table name to look up in the CATALOG: strip a `connection:` prefix (the catalog is that
	// connection's, keyed by bare/qualified table) so `snowflake:partners` resolves too.
	const catalogTableName = $derived(
		data ? (inlineQueries?.splitConnectionPrefix(data).table ?? data) : data
	);

	// All columns for `data`, resolved case-insensitively + schema-aware (Snowflake keys tables
	// `PUBLIC.PARTNERS`, so a bare lowercase `partners` must still resolve) — mirrors charts/validation.
	const catalogColumns = $derived([
		...(resolveCatalogTable(metadata, catalogTableName)?.columns ?? []),
		...(inlineQueryMetadata.getTable(catalogTableName)?.columns ?? [])
	]);

	// Case-insensitive membership for the author's `columns=` list against catalog column names
	// (Snowflake folds identifiers, so `["category"]` must match `CATEGORY`).
	const columnRequested = (name: string) =>
		!columns || columns.some((c: string) => c.toLowerCase() === name.toLowerCase());

	// Load inline query metadata when component initializes
	$effect(() => {
		inlineQueryMetadata.loadAllDebounced();
	});

	// Keep tableColumns for type checking functions
	let tableColumns = $derived(
		catalogColumns
			.filter(
				(column) =>
					column.jsType.toLowerCase().includes('string') ||
					column.jsType.toLowerCase().includes('date') ||
					column.jsType.toLowerCase().includes('number') ||
					column.jsType.toLowerCase().includes('boolean')
			)
			.filter((column) => columnRequested(column.name))
	);

	// When columns prop is provided, get columns in the exact order specified
	let orderedColumns = $derived.by(() => {
		if (!columns) return null;

		// Case-insensitive lookup so the author's `["category"]` matches the catalog's `CATEGORY`.
		const columnMap = new Map(catalogColumns.map((col) => [col.name.toLowerCase(), col]));

		// Return columns in the exact order specified, filtering out unsupported types
		return columns
			.map((colName: string) => columnMap.get(colName.toLowerCase()))
			.filter((col: IColumnMetadata | undefined): col is IColumnMetadata => {
				if (!col) return false;
				const type = col.jsType.toLowerCase();
				return (
					type.includes('string') ||
					type.includes('date') ||
					type.includes('number') ||
					type.includes('boolean')
				);
			});
	});

	// Helper to get the icon component for a column type
	function getColumnType(column: IColumnMetadata): 'date' | 'string' | 'number' | 'boolean' {
		const type = column.jsType.toLowerCase();
		if (type.includes('date')) return 'date';
		if (type.includes('number')) return 'number';
		if (type.includes('boolean')) return 'boolean';
		return 'string';
	}

	// Get table columns from metadata and organize them by type (used when no columns prop)
	let groupedColumns = $derived.by(() => {
		const allColumns = catalogColumns;

		const groups = {
			dates: [] as IColumnMetadata[],
			strings: [] as IColumnMetadata[],
			numbers: [] as IColumnMetadata[],
			booleans: [] as IColumnMetadata[]
		};

		allColumns.forEach((column) => {
			const type = column.jsType.toLowerCase();
			if (type.includes('date')) {
				groups.dates.push(column);
			} else if (type.includes('string')) {
				groups.strings.push(column);
			} else if (type.includes('number')) {
				groups.numbers.push(column);
			} else if (type.includes('boolean')) {
				groups.booleans.push(column);
			}
		});

		// Sort alphabetically by display label (custom label or formatted title)
		Object.values(groups).forEach((group) => {
			const withDisplayLabels = group.map((col) => ({
				column: col,
				displayLabel: columnLabels.get(col.name) ?? formatTitle(col.name)
			}));

			withDisplayLabels.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel));

			// Replace the original array with the sorted columns
			group.length = 0;
			group.push(...withDisplayLabels.map((item) => item.column));
		});

		return groups;
	});

	// Initialize the filter state with data to create a specific context
	const filterState = setFilterContext(data);

	// Track count of sample filters added
	let sampleFilterCount = $state(0);

	// State for selected column
	let selectedColumn = $state<{ name: string; type: string } | null>(null);

	// State for popover open/close
	let popoverOpen = $state(false);

	// State for trigger button ref
	let triggerRef = $state<HTMLButtonElement>(null!);

	function handlePopoverOpenChange(open: boolean) {
		popoverOpen = open;
		if (open) {
			selectedColumn = null;
		}
	}

	// Reference the already-created filter (created by registerTableFilters)
	let filter: Filter<FilterState> | undefined = $derived(
		id ? (pageFilters?.get(id) as Filter<FilterState> | undefined) : undefined
	);

	// Adopt each filter instance's starting value once. Latching per instance
	// rather than per component matters because registration replaces the filter
	// when a partial resolves late — a component-wide latch would skip the new
	// instance's initial_values, and the sync effect below would then clear them.
	let adopted: Filter<FilterState> | undefined;
	$effect(() => {
		if (!filter || filter === adopted) return;

		const urlValue = filter.value;

		if (urlValue && urlValue.filters && urlValue.filters.length > 0) {
			try {
				// Load filters into local state (dates are already deserialized by Filters.svelte.ts)
				filterState.filters = constrainFilters(urlValue.filters, {
					allowsMultiple: columnAllowsMultiple,
					requiresSelection: columnRequiresSelection
				});
				filterState.conjunction = urlValue.conjunction;
				filterState.active = urlValue.active;

				// Manually trigger sync to global filter since bulk assignment might not trigger reactivity
				filter.value = {
					active: filterState.active,
					filters: filterState.filters,
					conjunction: filterState.conjunction
				};
			} catch (error) {
				logger.error(error, 'Error during URL initialization');
			}
		}

		adopted = filter;
	});

	// Update filter value when filterState changes
	$effect(() => {
		if (!filter) return;

		// Track all relevant properties to ensure reactivity
		const hasFilters = filterState.filters.length > 0;
		const conjunction = filterState.conjunction;

		if (hasFilters) {
			const newValue = {
				active: true,
				filters: filterState.filters,
				conjunction: conjunction
			};
			filter.value = newValue;
		} else {
			filter.value = undefined;
		}
	});

	// Add an effect to ensure conjunction is always AND when minimumRecords is set
	$effect(() => {
		if (minimumRecords !== null && filterState.conjunction !== 'AND') {
			filterState.conjunction = 'AND';
		}
	});

	// Function to check if a column is a boolean column
	function isBooleanColumn(column: { jsType: string }) {
		return column.jsType === 'boolean';
	}

	// Function to handle column selection
	function handleColumnSelect(column: { name: string; jsType: string }) {
		const type = column.jsType.toLowerCase();
		if (isBooleanColumn(column)) {
			// For boolean columns, add a filter immediately
			addFilter(filterState, {
				columnId: column.name,
				conditions: [
					{
						type: 'boolean',
						operator: 'is',
						value: true
					}
				]
			});
			closePopover();
		} else {
			// Set the selected column with the correct type
			selectedColumn = {
				name: column.name,
				type: type.includes('date') ? 'date' : type.includes('number') ? 'number' : 'string'
			};

			// Ensure the popover stays open
			popoverOpen = true;
		}
	}

	// Function to close the popover
	function closePopover() {
		popoverOpen = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	// Function to add a new sample filter with a unique ID
	function addSampleFilter() {
		// Increment counter to create a unique ID
		sampleFilterCount++;

		// Create a unique columnId for this filter
		const columnId = `sample_${sampleFilterCount}`;

		// Add a new filter with the unique columnId
		addFilter(filterState, {
			columnId,
			conditions: [
				{
					type: 'string',
					operator: 'contains',
					value: `example ${sampleFilterCount}`
				}
			]
		});
	}

	// Create a derived state for the SQL fragment
	let sqlFragment = $derived(generateFilterSQL(filterState, connection.dialect));

	// Debug mode state
	let debugMode = $state(false);
</script>

{#if browser}
	<div class="mb-6 flex items-start justify-between">
		<div class="flex flex-wrap items-start gap-2">
			<div class="flex">
				<Popover.Root open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
					<Popover.Trigger bind:ref={triggerRef}>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="sm">
								<ListFilter />
								{title}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="evidence-page-theme p-0">
						<Command.Root>
							{#if selectedColumn?.type === 'date'}
								<DateRangeSelector
									columnName={selectedColumn.name}
									columnLabel={getColumnLabel(selectedColumn.name)}
									onClose={closePopover}
									{filterState}
								/>
							{:else if selectedColumn?.type === 'number'}
								<NumericValueSelector
									columnName={selectedColumn.name}
									columnLabel={getColumnLabel(selectedColumn.name)}
									{filterState}
									onClose={closePopover}
									{data}
								/>
							{:else if selectedColumn?.type === 'string'}
								<StringValueSelector
									tableExpressionName={data}
									columnName={selectedColumn.name}
									columnLabel={getColumnLabel(selectedColumn.name)}
									onClose={closePopover}
									{filterState}
									{minimumRecords}
									multiple={columnAllowsMultiple(selectedColumn.name)}
									requireSelection={columnRequiresSelection(selectedColumn.name)}
								/>
							{:else}
								<Command.Input placeholder="Filter by..." class="h-9" />
								<Command.List class="p-1">
									<Command.Empty>No columns found.</Command.Empty>
									{#if orderedColumns}
										<!-- When columns prop is provided, render in exact order specified -->
										{#each orderedColumns as column (column.name)}
											{@const colType = getColumnType(column)}
											<Command.Item
												value={column.name}
												onSelect={() => handleColumnSelect(column)}
												onclick={() => handleColumnSelect(column)}
												class="flex items-center justify-between"
											>
												<span class="text-sm">{getColumnLabel(column.name)}</span>
												{#if colType === 'date'}
													<Calendar class="text-muted-foreground/30 size-4" />
												{:else if colType === 'number'}
													<Hash class="text-muted-foreground/30 size-4" />
												{:else if colType === 'boolean'}
													<ToggleLeft class="text-muted-foreground/30 size-4" />
												{:else}
													<Type class="text-muted-foreground/30 size-4" />
												{/if}
											</Command.Item>
										{/each}
									{:else}
										<!-- When no columns prop, group by type -->
										{#each groupedColumns.dates as column (column.name)}
											<Command.Item
												value={column.name}
												onSelect={() => handleColumnSelect(column)}
												onclick={() => handleColumnSelect(column)}
												class="flex items-center justify-between"
											>
												<span class="text-sm">{getColumnLabel(column.name)}</span>
												<Calendar class="text-muted-foreground/30 size-4" />
											</Command.Item>
										{/each}
										{#each groupedColumns.strings as column (column.name)}
											<Command.Item
												value={column.name}
												onSelect={() => handleColumnSelect(column)}
												onclick={() => handleColumnSelect(column)}
												class="flex items-center justify-between"
											>
												<span class="text-sm">{getColumnLabel(column.name)}</span>
												<Type class="text-muted-foreground/30 size-4" />
											</Command.Item>
										{/each}
										{#each groupedColumns.booleans as column (column.name)}
											<Command.Item
												value={column.name}
												onSelect={() => handleColumnSelect(column)}
												onclick={() => handleColumnSelect(column)}
												class="flex items-center justify-between"
											>
												<span class="text-sm">{getColumnLabel(column.name)}</span>
												<ToggleLeft class="text-muted-foreground/30 size-4" />
											</Command.Item>
										{/each}

										{#each groupedColumns.numbers as column (column.name)}
											<Command.Item
												value={column.name}
												onSelect={() => handleColumnSelect(column)}
												onclick={() => handleColumnSelect(column)}
												class="flex items-center justify-between gap-2"
											>
												<span class="text-sm">{getColumnLabel(column.name)}</span>
												<Hash class="text-muted-foreground/30 size-4" />
											</Command.Item>
										{/each}
									{/if}
								</Command.List>
							{/if}
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
			<FilterChips
				{data}
				{minimumRecords}
				{columnLabels}
				{columnAllowsMultiple}
				{require_selection}
			/>
		</div>

		{#if filterState.filters.length > 1 && minimumRecords === null}
			<Button
				variant="ghost"
				size="sm"
				class="ml-2 flex-none text-xs"
				onclick={() => {
					filterState.conjunction = filterState.conjunction === 'AND' ? 'OR' : 'AND';
				}}
			>
				{filterState.conjunction === 'AND' ? 'Match all filters' : 'Match any filters'}
			</Button>
		{/if}
	</div>

	{#if debugMode}
		<div class="rounded-md bg-blue-100 p-4 dark:bg-blue-900 {className}">
			<!-- Debug Panel Header -->
			<div class="mb-2 border-t border-gray-300 pt-4 dark:border-gray-600">
				<h3 class="text-lg font-medium">Debug Panel</h3>
			</div>

			<!-- Debug Tools & Information -->
			<h3 class="mb-2 text-lg font-medium">Table Filter: {data}</h3>

			<div class="mb-4 flex gap-2">
				<button
					class="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
					onclick={addSampleFilter}
				>
					Add Sample Filter
				</button>

				<button
					class="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
					onclick={() => toggleConjunction(filterState)}
				>
					Toggle Conjunction ({filterState.conjunction})
				</button>

				{#if showClearButton}
					<button
						class="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
						onclick={() => clearAllFilters(filterState)}
					>
						Clear All
					</button>
				{/if}
			</div>

			{#if tableColumns.length > 0}
				<div class="mb-4">
					<h4 class="mb-1 font-medium">Available Columns:</h4>
					<div class="flex flex-wrap gap-2">
						{#each tableColumns as column}
							<span class="rounded bg-blue-200 px-2 py-1 text-sm dark:bg-blue-800">
								{column.name} ({column.jsType})
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<div class="mt-4 overflow-x-auto">
				<h4 class="mb-2 font-medium">Filter State:</h4>
				<div class="rounded bg-white p-2 dark:bg-gray-800">
					<p>Active: {filterState.active ? 'Yes' : 'No'}</p>
					<p>Conjunction: {filterState.conjunction}</p>
					<p>Filter Count: {filterState.filters.length}</p>
					<p>Sample Filters Added: {sampleFilterCount}</p>
				</div>

				{#if filterState.filters.length > 0}
					<div class="mt-2 rounded bg-white p-2 dark:bg-gray-800">
						<pre class="text-xs">{JSON.stringify(filterState, null, 2)}</pre>
					</div>
				{/if}
			</div>

			<!-- SQL Fragment Section -->
			<div class="mt-4 overflow-x-auto">
				<h4 class="mb-2 font-medium">Generated SQL Fragment:</h4>
				{#if sqlFragment}
					<div class="rounded bg-gray-900 p-3 text-emerald-400">
						<code class="font-mono text-sm break-all whitespace-pre-wrap text-white"
							>{sqlFragment}</code
						>
					</div>
					<p class="mt-2 text-xs">
						This SQL fragment can be used in the WHERE clause of a SELECT statement.
					</p>
				{:else}
					<div class="rounded bg-gray-700 p-3 text-white">
						<p class="text-sm italic">No filters applied yet. Add filters to generate SQL.</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}
