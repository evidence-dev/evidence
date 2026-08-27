<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { DataPoint } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { type SQLProps } from '../../common/sql-options';

	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { getPageFiltersContext } from '../../../page-filters-context';

	import {
		generatePivotData,
		sortPivotRows,
		prepareDataForDisplay,
		generateSimpleTable,
		generateSelectedColumnTable
	} from '../../common/pivot-utils';
	import ComponentTitle from '../../common/ComponentTitle.svelte';
	import PivotLimitWarning from '../../common/PivotLimitWarning.svelte';
	import { formatValue } from '../../formatValue';
	import TablePagination from './TablePagination.svelte';

	import { cn } from '../../../shadcn/utils';
	import type { SparklineColumnProps } from '../../common/build-sparklines';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import DeltaDisplay from '../delta/DeltaDisplay.svelte';
	import TableSearchInput from './TableSearchInput.svelte';
	import TableFullscreenButton from './TableFullscreenButton.svelte';
	import TableDownloadButton from './TableDownloadButton.svelte';
	import TableFullscreenModal from './TableFullscreenModal.svelte';
	import TableLoadingSkeleton from './TableLoadingSkeleton.svelte';
	import TableNoResults from './TableNoResults.svelte';
	import TableHeader from './TableHeader.svelte';
	import BarVisualization from './BarVisualization.svelte';
	import SparklineTableCell from './SparklineTableCell.svelte';
	import {
		calculateColorStyles,
		calculateColorStylesFromHex,
		calculateVizRanges,
		calculateFormatRanges
	} from './table-viz';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getLogoUrl } from '../../../shims/logo-url';
	import GlobalComparisonTooltip from '../../common/comparison-tooltips/GlobalComparisonTooltip.svelte';
	import {
		type CollapsibleRow,
		getSubtotalGroupKey,
		initializeCollapsedGroups,
		isRowVisible,
		isEmptyDimCell,
		getIndentAmount,
		computeRowMetadata
	} from './table-collapsible';
	import { getRowClasses } from './table-styles';
	import { useComparisonTooltip } from '../../common/comparison-tooltips/useComparisonTooltip';
	import {
		ComparisonTooltip,
		setComparisonTooltipContext
	} from '../../common/comparison-tooltips/ComparisonTooltip.svelte';
	import { createRenderTask, waitForFonts } from '../../../readiness';
	import { tick, onDestroy } from 'svelte';
	import { getPrintModeContext } from '../../../print-mode.context';
	import { TableModel } from './TableModel.svelte';
	import { getModelContext } from '../../model-context.svelte';
	import { buildTableExcelExportHandler } from './table-export';
	import { browser } from '../../../shims/env';
	import { logger } from '../../../shims/logger';
	import { getPageSettingsContext } from '../../../page-settings.context';
	import { getRendererContext } from '../../Renderer/renderer-context';
	import {
		transformInternalLink,
		mergeCurrentSearchParams
	} from '../../common/transform-internal-link';
	import { page } from '$app/state';

	// Define the props type
	type Props = UserComponentProps<typeof schema> & SQLProps;

	// Setup query infrastructure
	const { getComponentId, setError, setCustomExportHandler } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();
	const printing = getPrintModeContext();
	const rendererContext = getRendererContext();

	const model = getModelContext({ expected: TableModel });
	const query = model.query;
	const projectSettings = $derived(model.projectSettings);

	const props: Props = $props();

	// === VARIABLE INTERPOLATION ===
	// Use interpolated props from model (handles variables automatically)
	const title = $derived(model.resolvedTitle);
	const subtitle = $derived(model.resolvedSubtitle);
	const info = $derived(model.resolvedInfo);
	const info_link = $derived(model.resolvedInfo_link);
	const info_link_title = $derived(model.resolvedInfo_link_title);
	const total_label = $derived(model.resolvedTotalLabel ?? 'Total');

	const search = $derived(props.search);
	const page_size = $derived(model.pageSizeOverride ?? props.page_size);
	const measures_first = $derived(props.measures_first);
	const show_total_row = $derived(props.show_total_row);
	const show_subtotal_rows = $derived(props.show_subtotal_rows);
	const show_total_column = $derived(props.show_total_column);
	const show_subtotal_columns = $derived(props.show_subtotal_columns);
	const format_titles = $derived(props.format_titles);
	const wrap_titles = $derived(props.wrap_titles);
	const wrap = $derived(props.wrap);
	// Theme provides the default for these layout toggles when the table doesn't
	// set the attribute itself (mirrors how charts read chart.gridlines).
	const themeContext = getThemeContext();
	const row_shading = $derived(
		props.row_shading ?? themeContext.activeTheme.table?.rowShading ?? false
	);
	const row_lines = $derived(props.row_lines ?? themeContext.activeTheme.table?.rowLines ?? true);
	const link = $derived(props.link);
	const show_link_column = $derived(props.show_link_column);
	const freeze_columns = $derived(props.freeze_columns ?? 0);
	const repeat_values = $derived(props.repeat_values);

	// ==================== COLLAPSIBLE TABLE: Props ====================
	// See table-collapsible.ts for core logic (visibility, indentation, etc.)
	const collapsible = $derived(props.collapsible);
	// Default collapsed to true when collapsible is enabled
	const collapsed = $derived(props.collapsed ?? (collapsible ? true : false));
	// Force subtotal_position to 'top' when collapsible is enabled (required for collapse/expand to work)
	// Otherwise use user's setting or default to 'bottom'
	const subtotal_position = $derived(collapsible ? 'top' : props.subtotal_position ?? 'bottom');
	const total_position = $derived(props.total_position ?? 'bottom');
	const children = $derived(props.children);

	// ==================== COLLAPSIBLE TABLE: State ====================
	// Track which groups the user has TOGGLED from the default state
	// - When collapsed=true (default collapsed): toggled groups are EXPANDED
	// - When collapsed=false (default expanded): toggled groups are COLLAPSED
	// This set persists across data changes, preserving user interactions
	let userToggledGroups = $state<Set<string>>(new Set());

	// === FROZEN COLUMNS ===
	// Track column widths for calculating frozen column left offsets
	let columnWidths = $state<number[]>([]);
	let mainTableContainer = $state<HTMLDivElement | null>(null);
	let tableRef = $state<HTMLTableElement | null>(null);

	$effect(() => {
		tableRef = mainTableContainer?.querySelector('table') ?? null;
	});

	// Calculate cumulative left offsets for frozen columns
	const frozenColumnOffsets = $derived.by(() => {
		const offsets: number[] = [];
		let cumulative = 0;
		for (let i = 0; i < freeze_columns; i++) {
			offsets.push(cumulative);
			cumulative += columnWidths[i] ?? 0;
		}
		return offsets;
	});

	// Measure column widths from the first body row (which always has all columns)
	function measureColumnWidths() {
		if (!tableRef) return;
		// Find the first body row (skip header rows)
		const firstBodyRow = tableRef.querySelector('tbody tr');
		if (!firstBodyRow) return;

		const cells = firstBodyRow.querySelectorAll('td');
		const widths: number[] = [];
		cells.forEach((cell) => {
			widths.push(cell.getBoundingClientRect().width);
		});
		// Only update if we got valid widths
		if (widths.length > 0 && widths.some((w) => w > 0)) {
			columnWidths = widths;
		}
	}

	// Update column widths when table data changes
	$effect(() => {
		if (tableRef && freeze_columns > 0 && hasData) {
			// Initial measurement after DOM updates
			tick().then(measureColumnWidths);

			// Set up ResizeObserver for dynamic width changes
			const resizeObserver = new ResizeObserver(() => {
				measureColumnWidths();
			});
			resizeObserver.observe(tableRef);

			return () => resizeObserver.disconnect();
		}
	});

	// Set up comparison tooltip context
	const comparisonTooltip = new ComparisonTooltip();
	setComparisonTooltipContext(comparisonTooltip);

	// Combined validation check (table + children) - children errors come through validationErrors
	// TODO how to include this in TableModel?
	// const hasValidationErrors = $derived(hasBlockingErrors());

	// Reset page when count changes and current page is out of bounds
	$effect(() => {
		if (effectiveCount !== undefined && model.page > 0) {
			const maxPages = Math.ceil(effectiveCount / page_size);
			if (model.page >= maxPages) {
				model.page = Math.max(0, maxPages - 1);
			}
		}
	});

	// Reset page when search term changes - only run when search is enabled
	$effect(() => {
		if (search && model.searchTerm.trim()) {
			model.page = 0;
		}
	});

	$effect(() => {
		return queryInfoContext?.registerQuery(componentId, 'table', query, title);
	});

	type TableRow = DataPoint & { __hideCell?: Record<string, boolean> };
	const rows = $derived((query.result?.rows ?? []) as TableRow[]);
	const columns = $derived(query.result?.columns ?? []);
	// Read columnLimitExceeded as derived to stay in sync with rows during reactive cascades
	const columnLimitExceeded = $derived(query.columnLimitExceeded);

	// Track pivot limit state across paginations (debugInfo resets on page change)
	let pivotRowLimitExceeded = $state(false);
	let pivotEstimatedColumns = $state<number | undefined>();
	$effect(() => {
		if (query.debugInfo?.checkType === 'pivot') {
			pivotRowLimitExceeded = query.debugInfo.paginationDecision === 'server';
			pivotEstimatedColumns = query.debugInfo.estimatedColumns;
		}
	});

	const columnTypes = $derived.by(() => {
		const typeMap = new Map<string, string>();

		columns.forEach((col) => {
			typeMap.set(col.name, col.jsType);
		});

		return typeMap;
	});

	const pivotData = $derived.by(() => {
		const passThroughSet = new Set(model.passThroughMeasures);

		// Create pivotConfig inside the derivation so columnTypes is current
		const pivotConfig = {
			dimensions: model.dimensions,
			pivots: model.pivots,
			measures: model.measures.filter((m) => !passThroughSet.has(m)),
			passThroughMeasures: model.passThroughMeasures,
			measuresFirst: measures_first,
			subtotals: model.needsSubtotals,
			showTotalRow: show_total_row,
			showSubtotalRows: show_subtotal_rows,
			showTotalColumn: show_total_column,
			showSubtotalColumns: show_subtotal_columns,
			totalLabel: total_label,
			columnTypes, // This will now be the current columnTypes when pivot data is generated
			unifiedColumns: model.allUnifiedColumns, // Pass unified columns directly
			collapsible,
			firstDayOfWeek: projectSettings.first_day_of_week
		};

		let result;
		// Only generate pivot data if we have both rows and column types
		// This prevents the first call with empty columnTypes from creating incorrect metadata
		if (rows.length === 0 || columnTypes.size === 0) {
			// Return empty result while waiting for data and types
			result = {
				columns: [],
				rows: [],
				dimensions: model.dimensions,
				headerLevels: [],
				columnMeta: [],
				tableType: 'pivot' as const,
				config: {
					dimensions: model.dimensions,
					pivots: model.pivots,
					measures: model.measures,
					measuresFirst: measures_first,
					subtotals: model.needsSubtotals,
					showTotalRow: show_total_row,
					showSubtotalRows: show_subtotal_rows,
					showTotalColumn: show_total_column,
					showSubtotalColumns: show_subtotal_columns,
					totalLabel: total_label
				}
			};
		} else if (model.usePivotTableFunction) {
			// Check if column limit was exceeded server-side
			// If so, the SQL already treated pivots as dimensions
			// Use local derived to stay in sync with rows during reactive cascades

			if (columnLimitExceeded) {
				// Column limit exceeded - pivots were converted to dimensions in SQL
				// Adjust the pivot config to match: move pivots to dimensions
				const adjustedPivotConfig = {
					...pivotConfig,
					dimensions: [...pivotConfig.dimensions, ...pivotConfig.pivots],
					pivots: [] // No pivots - all converted to dimensions
				};
				result = generatePivotData(rows, adjustedPivotConfig);

				// Store the effective dimension count for rendering logic
				result.config.dimensions = adjustedPivotConfig.dimensions;
			} else if (query.paginationForced) {
				// Server-side pagination - can't pivot client-side
				result = generateSelectedColumnTable(rows, columnTypes, model.allUnifiedColumns, [
					...model.dimensions,
					...model.pivots,
					...model.measures
				]);
			} else {
				result = generatePivotData(rows, pivotConfig);
			}
		} else {
			result = generateSimpleTable(rows, columnTypes);
		}

		return result;
	});

	const customTableExportHandler = $derived.by(() => {
		if (!browser) return undefined;
		return buildTableExcelExportHandler({ sortedPivotData, title, subtitle });
	});

	$effect(() => {
		setCustomExportHandler?.(customTableExportHandler);
		return () => setCustomExportHandler?.(undefined);
	});

	// Add sort state without defaults
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'desc' | 'asc' | undefined>(undefined);

	// Track if sorting has been manually set by user
	let userHasSorted = $state(false);

	// Track the current prop-driven sort to detect changes
	let lastPropSort = $state<{ column: string; direction: 'asc' | 'desc' } | null>(null);

	// Initialize and react to sorting from column metadata
	$effect(() => {
		if (displayPivotData.columnMeta.length > 0) {
			// Find the best column with a sort prop in column metadata
			// Prefer total columns over regular columns for pivoted measures
			const sortableColumns = displayPivotData.columnMeta.filter((col) => col.sort);

			const sortableColumn =
				sortableColumns.length > 0
					? sortableColumns.find((col) => col.render_type === 'column_total') || sortableColumns[0]
					: undefined;

			const currentPropSort =
				sortableColumn && (sortableColumn.sort === 'asc' || sortableColumn.sort === 'desc')
					? { column: sortableColumn.key, direction: sortableColumn.sort }
					: null;

			// Check if the prop-driven sort has changed using a cleaner comparison
			const propSortChanged =
				!lastPropSort !== !currentPropSort ||
				(lastPropSort &&
					currentPropSort &&
					(lastPropSort.column !== currentPropSort.column ||
						lastPropSort.direction !== currentPropSort.direction));

			// Update last prop sort and reset user interaction if props changed
			if (propSortChanged) {
				lastPropSort = currentPropSort;
				userHasSorted = false;
			}

			// Apply prop-driven sort if user hasn't manually sorted
			if (!userHasSorted && currentPropSort) {
				if (model.serverSidePaginated) {
					// For paginated mode, set the order state
					model.order =
						currentPropSort.direction === 'desc'
							? `${currentPropSort.column} DESC`
							: currentPropSort.column;
				} else {
					// For pivot mode, set sort column and direction
					sortColumn = currentPropSort.column;
					sortDirection = currentPropSort.direction;
				}
			}
		}
	});

	// Create sorted data using the sort state
	const sortedPivotData = $derived.by(() => {
		try {
			const result = sortPivotRows(
				pivotData,
				sortColumn,
				sortDirection,
				model.needsSubtotals,
				subtotal_position,
				total_position
			);
			return result;
		} catch (error) {
			logger.error(error, 'Sort failed');
			return pivotData;
		}
	});

	// ==================== COLLAPSIBLE TABLE: Effective Collapsed State ====================
	// Split into two derivations for performance:
	// 1. allGroupKeys - O(n) scan, only recomputes when data changes
	// 2. effectiveCollapsedGroups - O(k) set operations, recomputes on toggle clicks
	// This avoids rescanning all rows on every expand/collapse interaction

	// Derive all group keys from the data (only recomputes when sortedPivotData changes)
	const allGroupKeys = $derived.by(() => {
		if (!collapsible || !sortedPivotData?.rows?.length) {
			return new Set<string>();
		}
		return initializeCollapsedGroups(sortedPivotData.rows as CollapsibleRow[]);
	});

	// Compute effective collapsed groups by applying user overrides to allGroupKeys
	// This is O(k) where k = size of userToggledGroups, not O(n) rows
	const effectiveCollapsedGroups = $derived.by(() => {
		if (allGroupKeys.size === 0) {
			return new Set<string>();
		}

		if (collapsed) {
			// Default is collapsed: effective collapsed = all keys - user toggled (expanded)
			const result = new Set(allGroupKeys);
			for (const key of userToggledGroups) {
				result.delete(key);
			}
			return result;
		} else {
			// Default is expanded: effective collapsed = user toggled (collapsed) ∩ current keys
			const result = new Set<string>();
			for (const key of userToggledGroups) {
				if (allGroupKeys.has(key)) {
					result.add(key);
				}
			}
			return result;
		}
	});

	// Simple helper to check if link column should be hidden
	const shouldHideLinkColumn = $derived.by(() => {
		const hasExplicitColumns =
			model.dimensions.length > 0 || model.measures.length > 0 || model.pivots.length > 0;
		return Boolean(link && !show_link_column && !hasExplicitColumns);
	});

	// Apply client-side pagination and finalize table data
	const displayPivotData = $derived.by(() => {
		const data = sortedPivotData;
		const rawRowCount = query.count ?? 0;

		// Determine if client-side pagination is needed
		// Skip pagination when collapsible is enabled - collapse/expand manages visibility instead
		const userWantsPagination = page_size !== undefined;
		const needsClientPagination =
			(userWantsPagination || rawRowCount > 200) &&
			!model.serverSidePaginated &&
			!query.paginationForced &&
			!collapsible;

		// Apply client-side pagination if required and calculate rowspans for merging cells
		const displayResult = prepareDataForDisplay(data, {
			serverSidePaginated: model.serverSidePaginated,
			needsSubtotals: model.needsSubtotals,
			page: model.page,
			pageSize: page_size,
			applyClientSidePagination: needsClientPagination,
			totalPosition: total_position
		});
		return displayResult;
	});

	// Compute unified sort state for header display
	const currentSort = $derived.by(() => {
		if (model.serverSidePaginated) {
			// Extract from SQL order string
			if (model.order) {
				const [column, direction] = model.order.split(' ');
				return {
					column: column,
					direction: (direction === 'DESC' ? 'desc' : 'asc') as 'asc' | 'desc'
				};
			}
		} else {
			// Use client-side sort state
			if (sortColumn) {
				return {
					column: sortColumn,
					direction: (sortDirection || 'desc') as 'asc' | 'desc'
				};
			}
		}
		return null;
	});

	// Modify handleHeaderClick to handle both modes
	// Implements 3-state toggle: DESC → ASC → clear
	function handleHeaderClick(columnId: string) {
		// Mark that user has manually sorted - prevents prop-based sorting from overriding
		userHasSorted = true;

		if (model.serverSidePaginated) {
			// In paginated mode, update SQL order and reset page
			if (model.order?.includes(columnId)) {
				// Toggle direction if already sorting by this column: DESC → ASC → clear
				if (model.order.includes(' DESC')) {
					// Currently DESC, switch to ASC
					model.order = columnId;
				} else {
					// Currently ASC, clear the sort
					model.order = undefined;
				}
			} else {
				// Start with descending sort
				model.order = `${columnId} DESC`;
			}
			model.page = 0;
		} else {
			// In pivoted mode, use existing client-side sorting
			// Implements 3-state toggle: DESC → ASC → clear
			if (sortColumn === columnId) {
				if (sortDirection === 'desc') {
					// Currently DESC, switch to ASC
					sortDirection = 'asc';
				} else {
					// Currently ASC, clear the sort
					sortColumn = undefined;
					sortDirection = undefined;
				}
			} else {
				sortColumn = columnId;
				sortDirection = 'desc';
			}
		}
	}

	const loading = $derived(query.loading);
	const error = $derived(query.error);

	// Track error state
	$effect(() => {
		setError(error ?? undefined);
	});

	// Minimal readiness integration for table: when query done and DOM updated
	const markRenderComplete = createRenderTask('table');
	$effect(() => {
		if (!loading && !error) {
			Promise.resolve()
				.then(() => tick())
				.then(() => (printing ? waitForFonts() : Promise.resolve()))
				.finally(() => markRenderComplete());
		}
	});
	onDestroy(() => markRenderComplete());

	// Determines whether a table cell should be rendered or skipped for rowspan merging
	// Example: "Apple" appears in multiple rows but renders once with rowspan=2, skipping duplicates
	const shouldRenderCell = $derived.by(() => (rowIndex: number, colIndex: number) => {
		// Simple tables: always render all cells
		if (model.serverSidePaginated || !model.needsSubtotals || model.measures.length === 0)
			return true;
		// When collapsible is enabled, disable cell merging for simpler interaction
		if (collapsible) return true;
		// Measure columns: always render (never merge)
		// Use effective dimension count from pivotData config (accounts for converted pivots)
		const effectiveDimensionCount = pivotData.config.dimensions?.length ?? model.dimensions.length;
		if (colIndex >= effectiveDimensionCount) return true;

		// Check repeat settings:
		// 1. Check dimension-level repeat_values (highest priority)
		// 2. Fall back to table-level repeat_values
		const dimensionKey = displayPivotData.columns[colIndex];
		const dimensionMeta = displayPivotData.columnMeta.find((c) => c.key === dimensionKey);
		const dimensionRepeatValues = dimensionMeta?.repeat_values;

		// If dimension has explicit repeat_values setting, use it; otherwise use table-level setting
		const shouldRepeat =
			dimensionRepeatValues !== undefined ? dimensionRepeatValues : repeat_values;
		if (shouldRepeat) return true;

		// Dimension columns: check __skipCell array for rowspan logic
		return !displayPivotData.rows[rowIndex].__skipCell?.[colIndex];
	});

	// Check if collapsible mode is active (requires subtotals and dimensions)
	const isCollapsibleActive = $derived(
		collapsible && model.needsSubtotals && model.dimensions.length > 0 && !model.serverSidePaginated
	);

	// ==================== COLLAPSIBLE TABLE: Toggle & Visibility ====================
	// Core functions (getSubtotalGroupKey, isRowVisible) imported from table-collapsible.ts

	// Toggle collapse state for a group
	// Toggles the group's presence in userToggledGroups:
	// - If in set: user toggled it before → now reverting to default → remove from set
	// - If not in set: group is at default → now toggling away from default → add to set
	function toggleGroupCollapse(groupKey: string) {
		const newSet = new Set(userToggledGroups);
		if (newSet.has(groupKey)) {
			newSet.delete(groupKey);
		} else {
			newSet.add(groupKey);
		}
		userToggledGroups = newSet;
	}

	// Filter rows based on collapse state
	const visibleRows = $derived.by(() => {
		if (!isCollapsibleActive) return displayPivotData.rows;
		return displayPivotData.rows.filter((row) =>
			isRowVisible(row as CollapsibleRow, effectiveCollapsedGroups)
		);
	});

	// ==================== COLLAPSIBLE TABLE: Pre-computed Metadata ====================
	// Compute row metadata once (O(n)) instead of per-row in render loop (O(n²))
	const rowMetadataMap = $derived.by(() => {
		if (!isCollapsibleActive) return null;
		const numDims = pivotData.config.dimensions?.length ?? 0;
		return computeRowMetadata(visibleRows as CollapsibleRow[], numDims, displayPivotData.columns);
	});

	// Add ready state derived from loading and data
	const hasData = $derived(rows.length > 0);
	const showNoResults = $derived(!hasData && !loading);

	// Check if we're using client-side pagination
	const clientSidePaginated = $derived('__clientPaginationCount' in displayPivotData);
	const effectiveCount = $derived(
		clientSidePaginated && '__clientPaginationCount' in displayPivotData
			? (displayPivotData.__clientPaginationCount as number)
			: query.count
	);

	const showPagination = $derived(
		hasData &&
			(model.serverSidePaginated || clientSidePaginated) &&
			(typeof effectiveCount === 'undefined' || effectiveCount > page_size)
	);

	const pageSettings = getPageSettingsContext();

	// Get background-adjusted color scale for the active mode
	// First color is replaced with appropriate background (card or base) for visual integration
	const defaultColorScale = $derived.by(() => {
		const isCardMode = pageSettings().cards;
		return themeContext.getBackgroundAdjustedColorScale(isCardMode);
	});

	// Pre-calculate visualization ranges for efficiency - calculate once per column instead of per cell
	// Handles both bar and color visualizations
	const vizRanges = $derived.by(() => {
		return calculateVizRanges({
			columnMeta: displayPivotData.columnMeta,
			sortedRows: sortedPivotData.rows,
			rawRows: rows
		});
	});

	// Pre-calculate format ranges for columns with auto-scalable formats (usd, num, eur, etc.)
	// This ensures consistent unit scaling (k, M, B) and decimal precision within a column
	const formatRanges = $derived.by(() => {
		return calculateFormatRanges({
			columnMeta: displayPivotData.columnMeta,
			sortedRows: sortedPivotData.rows
		});
	});

	// Handle row clicks when link is enabled
	function handleRowClick(row: Record<string, unknown>) {
		if (!link || !row[link]) return;

		const url = transformInternalLink(
			String(row[link]),
			rendererContext.context,
			page.params,
			{ hrefIncludesProjectSlug: false }
		);
		// Merge current page's filter params for cross-page persistence
		const mergedUrl = mergeCurrentSearchParams(url);
		if (mergedUrl.trim()) {
			window.open(mergedUrl, '_self');
		}
	}

	// Use the shared comparison tooltip composable
	const { createTooltipHandlers } = useComparisonTooltip();

	// === DOWNLOAD ===
	let downloading = $state(false);

	async function handleDownload() {
		if (!customTableExportHandler) return;
		downloading = true;
		try {
			await customTableExportHandler();
		} finally {
			downloading = false;
		}
	}

	// === FULLSCREEN MODAL ===
	let showFullscreenModal = $state(false);
	const ROW_HEIGHT_PX = 28;
	const MODAL_OVERHEAD_PX = 140;

	function openFullscreen() {
		if (browser) {
			model.pageSizeOverride = Math.max(
				1,
				Math.floor((window.innerHeight - MODAL_OVERHEAD_PX) / ROW_HEIGHT_PX)
			);
		}
		showFullscreenModal = true;
		model.page = 0;
	}

	function closeFullscreen() {
		showFullscreenModal = false;
		model.pageSizeOverride = undefined;
		model.page = 0;
	}

	// === CROSS-FILTERING ===
	const pageFilters = getPageFiltersContext();
	const cross_filter = $derived(props.cross_filter);
	const cross_filter_column = $derived(model.resolveColumn(props.cross_filter_column));
	const cross_filter_multiple = $derived(props.cross_filter_multiple ?? false);

	const isCrossFilterEnabled = $derived(cross_filter !== undefined && cross_filter !== false);
	const crossFilterTargetColumn = $derived.by(() => {
		if (cross_filter_column) return cross_filter_column;
		if (model.dimensions && model.dimensions.length > 0) return model.dimensions[0];
		if (displayPivotData.columns && displayPivotData.columns.length > 0) return displayPivotData.columns[0];
		return undefined;
	});

	const crossFilterId = $derived.by(() => {
		if (!isCrossFilterEnabled) return undefined;
		if (typeof cross_filter === 'string') return cross_filter;
		return crossFilterTargetColumn ?? props.id ?? 'table_filter';
	});

	const activeFilter = $derived.by(() => {
		if (!pageFilters || !crossFilterId) return undefined;
		return pageFilters.get(crossFilterId);
	});

	function isRowSelected(row: Record<string, any>): boolean {
		if (!isCrossFilterEnabled || !crossFilterTargetColumn || !activeFilter) return false;
		const val = row[crossFilterTargetColumn];
		if (val === undefined || val === null) return false;
		const filterVal = activeFilter.value;
		if (Array.isArray(filterVal)) {
			return filterVal.includes(val);
		}
		return filterVal === val;
	}

	function handleTableRowClick(row: Record<string, any>) {
		if (link && row && row[link]) {
			window.location.href = String(row[link]);
			return;
		}

		if (!isCrossFilterEnabled || !crossFilterTargetColumn || !pageFilters || !crossFilterId) return;
		const val = row[crossFilterTargetColumn];
		if (val === undefined || val === null) return;

		let filter = pageFilters.get(crossFilterId);
		if (!filter) {
			filter = pageFilters.createExternal(crossFilterId, undefined, crossFilterTargetColumn);
		}

		if (cross_filter_multiple) {
			const current = Array.isArray(filter.value)
				? [...filter.value]
				: filter.value !== undefined
					? [filter.value]
					: [];
			const idx = current.indexOf(val);
			if (idx >= 0) {
				current.splice(idx, 1);
			} else {
				current.push(val);
			}
			filter.value = current.length > 0 ? current : undefined;
		} else {
			if (filter.value === val) {
				filter.value = undefined;
			} else {
				filter.value = val;
			}
		}
	}
</script>

{#snippet tableContent()}
	<!-- Table scroll container -->
	<div class={cn("relative mb-1 w-full flex-1", printing ? 'overflow-visible' : 'h-full min-h-0 overflow-auto')}>
		<table class={cn("m-0 w-full rounded-md text-xs tabular-nums transition-opacity", hasData && query.loading && 'opacity-50')}>
			{#if !loading && !showNoResults}
			<TableHeader
				headerLevels={displayPivotData.headerLevels}
				columnMeta={displayPivotData.columnMeta}
				columns={displayPivotData.columns}
				config={displayPivotData.config}
				{measures_first}
				{wrap_titles}
				{format_titles}
				{link}
				{shouldHideLinkColumn}
				{currentSort}
				onHeaderClick={handleHeaderClick}
				{freeze_columns}
				{frozenColumnOffsets}
			/>
			<tbody>
					{#each visibleRows as row, rowIndex}
						{@const isDataRow = row.render_type === 'cell_data' || row.render_type === undefined}
						{@const hasRowLink = link && row && row[link]}
						{@const filteredColumnCount = displayPivotData.columns.filter((c, idx) => shouldRenderCell(rowIndex, idx)).length}
						<!-- ====== COLLAPSIBLE: Row-level metadata ====== -->
						{@const subtotalGroupKey = isCollapsibleActive ? getSubtotalGroupKey(row as CollapsibleRow) : null}
						{@const isCollapsibleSubtotal = isCollapsibleActive && subtotalGroupKey !== null}
						{@const isGroupCollapsed = isCollapsibleSubtotal && effectiveCollapsedGroups.has(subtotalGroupKey)}
						{@const collapsibleRow = row as CollapsibleRow}
						{@const numDimensions = pivotData.config.dimensions?.length ?? 0}
						<!-- Use pre-computed metadata (O(1) lookup) instead of O(n) calculation per row -->
						{@const rowMeta = rowMetadataMap?.[rowIndex]}
						{@const parentSubtotalLevel = rowMeta?.parentSubtotalLevel ?? 1}
						{@const _rowIndentLevel = rowMeta?.rowIndentLevel ?? 0}
						{@const _isLastRowBeforeTotal = rowMeta?.isLastRowBeforeTotal ?? false}
						{@const checkEmptyDimCell = (colIdx: number) => {
							if (!isCollapsibleActive) return false;
							return isEmptyDimCell(collapsibleRow, colIdx, numDimensions, parentSubtotalLevel, displayPivotData.columns);
						}}
						<!-- Row conditional colors -->
						{@const rowColorValue = isDataRow && row['__row_conditional_colors'] ? String(row['__row_conditional_colors']) : null}
						{@const rowColorStyles = rowColorValue ? calculateColorStylesFromHex(rowColorValue) : null}
						{@const isSelected = isRowSelected(row)}
						{@const isClickableRow = isCollapsibleSubtotal || Boolean(hasRowLink) || isCrossFilterEnabled}
						<tr 
							class={isCollapsibleActive ? getRowClasses({
								rowLines: row_lines,
								rowShading: row_shading && !rowColorStyles,
								isCollapsibleActive,
								isCollapsibleSubtotal,
								isDataRow,
								hasRowLink: Boolean(hasRowLink) || isCrossFilterEnabled,
								isTotal: row.render_type === 'row_total',
								totalPosition: total_position
							}) : cn(
								row_lines ? 'border-(--theme-table-row-border) border-b' : 'border-0',
								row_shading && isDataRow && !rowColorStyles ? 'even:bg-muted' : '',
								'transition-colors',
								isClickableRow ? 'hover:bg-(--theme-table-hover) cursor-pointer' : '',
								isSelected ? 'bg-primary/10 font-medium' : ''
							)}
							onclick={isCollapsibleSubtotal ? () => toggleGroupCollapse(subtotalGroupKey) : (hasRowLink || isCrossFilterEnabled) ? () => handleTableRowClick(row) : undefined}
						>
							{#each displayPivotData.columns.map((col, tableColumnIndex) => ({ 
								col, 
								tableColumnIndex, 
								cellColumnMeta: displayPivotData.columnMeta.find(c => c.key === col)
							})).filter(({ tableColumnIndex }) => 
								shouldRenderCell(rowIndex, tableColumnIndex)
							) as { col, tableColumnIndex, cellColumnMeta }, renderedCellIndex}
									{@const cellEffectiveAlign = cellColumnMeta?.align ?? 'left'}
						{@const hasColorViz =
							cellColumnMeta?.viz === 'color' &&
							row[col] !== null && row[col] !== undefined &&
							(cellColumnMeta?.color_options?.conditional_colors || !isNaN(Number(row[col]))) &&
							row.render_type !== 'row_total' &&
							(row.render_type !== 'row_subtotal' || (!cellColumnMeta?.color_options?.conditional_colors && cellColumnMeta?.viz_include_subtotals !== false))}
									{@const colorStyles = hasColorViz ? calculateColorStyles(
										cellColumnMeta,
										col,
										row,
										vizRanges.get(col) || { min: 0, max: 0 },
										defaultColorScale
									) : null}
								{@const isFrozenCell = freeze_columns > 0 && tableColumnIndex < freeze_columns}
								{@const frozenCellLeft = isFrozenCell ? (frozenColumnOffsets[tableColumnIndex] ?? 0) : 0}
								{@const isLastFrozenCell = isFrozenCell && tableColumnIndex === freeze_columns - 1}
								{@const dimensionRepeatSetting = cellColumnMeta?.repeat_values !== undefined ? cellColumnMeta.repeat_values : repeat_values}
								{@const hasRowspan = !collapsible && !dimensionRepeatSetting && (visibleRows[rowIndex].__rowspans?.[tableColumnIndex] ?? 1) > 1}
								{@const cellZIndex = isFrozenCell 
									? (hasRowspan ? 12 : 10) + (freeze_columns - tableColumnIndex) 
									: (freeze_columns > 0 ? 1 : undefined)}
								{@const isTotalOrSubtotal = row.render_type === "row_total" || row.render_type === "row_subtotal"}
								{@const isEvenRow = rowIndex % 2 === 1}
								{@const frozenCellBg = row_shading && isDataRow && isEvenRow && !hasRowspan && !rowColorStyles ? "bg-muted" : "bg-background"}
								{@const cellClasses = cn(
									// Base cell styles
									"relative align-middle",
									
									// Frozen column styling - use solid background for frozen cells
									isFrozenCell && "sticky",
									// Frozen cells need solid backgrounds to prevent content showing through
									// When row_shading is enabled, use shaded background on even rows to match the row shading
									isFrozenCell && !isTotalOrSubtotal && frozenCellBg,
										
										// Row type styling (totals, subtotals, etc.) — theme-driven via
										// --theme-table-* vars (defaults match the old solid colors).
										row.render_type === "row_total"
											? "border-t border-foreground/40 dark:border-foreground/40 bg-(--theme-table-total-bg) font-semibold"
											: row.render_type === "row_subtotal"
											? tableColumnIndex >= ((row.subtotal_level ?? 1) - 1)
												? "border-t border-foreground/40 dark:border-foreground/40 bg-(--theme-table-subtotal-bg) font-semibold"
												: ""
											: displayPivotData.columnMeta.find(c => c.key === col)?.render_type === "column_total"
											? "bg-(--theme-table-pivot-bg) font-semibold"
											: displayPivotData.columnMeta.find(c => c.key === col)?.render_type === "column_subtotal"
											? "bg-(--theme-table-pivot-bg) font-semibold dark:border-r-(--theme-table-row-border)"
											: "",
										
									// Dimension cell merging background (for rowspan cells) - only if not frozen (frozen cells handle this via frozenCellBg)
									// Use effective dimension count from pivotData config (accounts for converted pivots)
									// Disabled in collapsible mode or when repeat_values is enabled since we don't use rowspans there
									!collapsible && !isFrozenCell && !dimensionRepeatSetting && (tableColumnIndex < (pivotData.config.dimensions?.length ?? model.dimensions.length) && !model.serverSidePaginated && (visibleRows[rowIndex].__rowspans?.[tableColumnIndex] ?? 1) > 1) ? 'bg-background' : '',
										
										// Text wrapping behavior
										(cellColumnMeta?.wrap !== undefined ? cellColumnMeta.wrap : wrap) ? '' : 'whitespace-nowrap',
										
										// Vertical padding (reduced for sparkline columns)
										model.allUnifiedColumns.some(column => column.viz === 'sparkline' && col.includes(column.alias)) ? 'pb-0.5' : 'py-1',
										
										// Horizontal padding (varies by column position)
										tableColumnIndex === 0 ? 'pr-3 pl-1' : renderedCellIndex === filteredColumnCount - 1 ? 'pr-3 pl-1.5' : 'pl-1.5 pr-3',
										
										// Text alignment
										cellEffectiveAlign === 'right' ? 'text-right' : 
											cellEffectiveAlign === 'center' ? 'text-center' : 'text-left',
										
										// Visibility (hide link columns when configured)
										(col === link) && shouldHideLinkColumn ? 'hidden' : ''
									)}
									{@const zIndexStyle = cellZIndex !== undefined ? `z-index: ${cellZIndex};` : ''}
									{@const frozenCellStyle = isFrozenCell 
										? `left: ${frozenCellLeft}px; ${zIndexStyle}${isLastFrozenCell ? ' box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.15);' : ''}` 
										: zIndexStyle}
									{@const effectiveColorStyles = hasColorViz && colorStyles ? colorStyles : rowColorStyles}
									{@const colorVizStyle = effectiveColorStyles ? (() => {
										const nextRow = visibleRows[rowIndex + 1];
										const nextRowIsTotal = nextRow?.render_type === 'row_total' || nextRow?.render_type === 'row_subtotal';
										return `background-color: ${effectiveColorStyles.backgroundColor}; color: ${effectiveColorStyles.color};` +
											(!nextRowIsTotal ? ` border-bottom: 1px solid ${effectiveColorStyles.borderBottomColor};` : '') +
											(row.render_type === 'row_total' ? ` border-top: 1px solid ${effectiveColorStyles.topBorderColor};` : '') +
											(row.render_type === 'row_subtotal' && !collapsible && tableColumnIndex >= ((row.subtotal_level ?? 1) - 1) ? ` border-top: 1px solid ${effectiveColorStyles.topBorderColor};` : '');
									})() : (cellColumnMeta?.red_negatives && !isNaN(Number(row[col])) && Number(row[col]) < 0) ? 'color: var(--theme-negative, rgb(220 38 38));' : ''}
									{@const cellRepeat = cellColumnMeta?.repeat_values !== undefined ? cellColumnMeta.repeat_values : repeat_values}
								{@const effectiveRowspan = model.serverSidePaginated || !model.needsSubtotals || model.measures.length === 0 || collapsible || cellRepeat ? 1 : (visibleRows[rowIndex].__rowspans?.[tableColumnIndex] ?? 1)}
								<td
										class={cellClasses}
										rowspan={effectiveRowspan}
										style={frozenCellStyle + colorVizStyle}
									>
									{#if checkEmptyDimCell(tableColumnIndex)}
										<!-- Empty dimension cell in collapsible mode - keep cell but hide content -->
									{:else if tableColumnIndex < (pivotData.config.dimensions?.length ?? 0) && row[col] === null && row.__dimKey?.split("|~|")[tableColumnIndex] === '[[GROUPED]]'}
										<!-- Leave grouped-out dimension values blank -->
									{:else if (row.render_type !== 'cell_data' && (row.__hideCell as Record<string, boolean> | undefined)?.[col])}
										{#if !collapsible}<span class="text-muted-foreground opacity-70">–</span>{/if}
									{:else if row[col] === null}
											<!-- Regular null values show "null" -->
											<span class="text-muted-foreground opacity-70">–</span>
										{:else}
											{@const value = typeof row[col] === 'string' || typeof row[col] === 'number' || row[col] instanceof Date  || row[col] === undefined ? row[col] : String(row[col])}
											{@const columnMeta = displayPivotData.columnMeta.find(c => c.key === col)}
											{@const dynamicFmt = (() => {
												// Check if measure has fmt_column defined
												if (cellColumnMeta?.fmt_column && cellColumnMeta.fmt_column in row) {
													const fmtValue = row[cellColumnMeta.fmt_column];
													return fmtValue !== null && fmtValue !== undefined ? String(fmtValue) : undefined;
												}
												return undefined;
											})()}
											{@const cellDisplayFormat = (() => {
												// If there's dynamic formatting, use it
												if (dynamicFmt) return dynamicFmt;
												
												// If there's a comparison, use abs_fmt/pct_fmt based on display_type
												if (cellColumnMeta?.comparison?.compare_vs) {
													const displayType = cellColumnMeta.comparison.display_type ?? 'pct';
													if (displayType === 'pct') {
														return cellColumnMeta.comparison.pct_fmt || 'pct';
													} else if (displayType === 'compared_value') {
														return cellColumnMeta?.fmt;
													} else {
														return cellColumnMeta.comparison.abs_fmt || cellColumnMeta?.fmt || 'num0';
													}
												}
												
												// Otherwise use the column's format
												return cellColumnMeta?.fmt;
											})()}
											{@const sparklineVizConfig = model.allUnifiedColumns.find(column => 
												column.viz === 'sparkline' && 
												column.alias === (columnMeta?.alias || col)
											)?.sparklineVizConfig as SparklineColumnProps | undefined}

											{@const indentAmount = isCollapsibleActive 
												? getIndentAmount(collapsibleRow, tableColumnIndex, numDimensions)
												: 0}
											{#snippet cellContent()}
												{#if cellColumnMeta?.viz === 'bar'}
													<BarVisualization 
														value={Number(row[col])}
														columnMeta={cellColumnMeta}
														{row}
														range={vizRanges.get(col) || { min: 0, max: 0 }}
													/>
												{/if}

												<!-- Collapse/expand chevron for subtotal rows - appears in the subtotal's dimension column -->
												{#if isCollapsibleSubtotal && tableColumnIndex === (collapsibleRow.subtotal_level ?? 1) - 1}
													<ChevronRight 
														class="h-3.5 w-3.5 mr-0.5 -mt-px inline-block align-middle text-muted-foreground transition-transform duration-200 ease-in-out {isGroupCollapsed ? '' : 'rotate-90'}" 
													/>
												{/if}

												<span 
													class={cn(
													"relative inline align-middle",
													// Only apply z-10 when there are background visualizations that need to be layered beneath the text
													(cellColumnMeta?.viz === 'bar' || hasColorViz || rowColorStyles) && "z-10",
													cellEffectiveAlign === 'center' ? 'text-center' : 
													cellEffectiveAlign === 'right' ? 'text-right' : 
													'text-left',
													cellColumnMeta?.viz === 'bar' && cellColumnMeta?.bar_options?.hide_labels && 'opacity-0',
													// Cursor for comparison tooltips
													cellColumnMeta?.comparison?.compare_vs ? 'cursor-help' : ''
												)}
												style={indentAmount > 0 ? `padding-left: ${indentAmount}rem` : undefined}
												{...createTooltipHandlers(
													cellColumnMeta?.comparison,
													row,
													rows,
													model.dimensions,
													model.pivots,
													cellColumnMeta?.comparison?.id, // Pass comparison ID from metadata
													cellColumnMeta?.alias,
													col,
													measures_first,
													dynamicFmt || cellColumnMeta?.fmt // user's format for customFormat parameter
												)}
												>
													{#if sparklineVizConfig}
													    <SparklineTableCell {value} {sparklineVizConfig} />
													{:else if cellColumnMeta?.viz === 'delta'}
														{@const deltaOptions = cellColumnMeta?.delta_options}
														{@const neutralRange = deltaOptions?.neutral_range ?? [0, 0]}
														<DeltaDisplay 
															value={value}
															fmt={cellDisplayFormat}
															className="text-xs"
															downIsGood={cellColumnMeta?.delta_options?.down_is_good}
															showSymbol={cellColumnMeta?.delta_options?.show_symbol}
															symbolPosition={cellColumnMeta?.delta_options?.symbol_position}
															neutralRange={neutralRange}
														/>
													{:else if cellColumnMeta?.html && typeof value === 'string' && row.render_type === 'cell_data'}
														<!-- Note: @html renders raw HTML - ensure your data source is trusted -->
														{@html value}
													{:else}
														{@const imageUrl = cellColumnMeta?.image ? (row[`__image_${cellColumnMeta.alias}`] ?? row[cellColumnMeta.image]) : null}
														{@const logoDomain = cellColumnMeta?.logo ? (row[`__logo_${cellColumnMeta.alias}`] ?? row[cellColumnMeta.logo]) : null}
														{@const showImageLabel = !cellColumnMeta?.image_options?.hide_label}
														{@const showLogoLabel = !cellColumnMeta?.logo_options?.hide_label}
														{@const logoSize = cellColumnMeta?.logo_options?.size ?? 'base'}
														{@const logoGrayscale = cellColumnMeta?.logo_options?.grayscale ?? false}
														{@const logoSizeMap = { sm: '1em', base: '1.25em', lg: '1.75em', xl: '2.5em' }}
														{@const logoHeight = logoSizeMap[logoSize] ?? logoSizeMap.base}
														{@const logoLightUrl = logoDomain ? getLogoUrl(String(logoDomain), 'light', 'monogram', logoGrayscale) : null}
														{@const logoDarkUrl = logoDomain ? getLogoUrl(String(logoDomain), 'dark', 'monogram', logoGrayscale) : null}
														
														{#if logoDomain && row.render_type === 'cell_data' && logoLightUrl && logoDarkUrl}
															<img
																src={logoLightUrl}
																alt={String(logoDomain)}
																style="height: {logoHeight}; width: auto;"
																class="inline-block -translate-y-[0.1em] align-middle dark:hidden mr-1"
															/>
															<img
																src={logoDarkUrl}
																alt={String(logoDomain)}
																style="height: {logoHeight}; width: auto;"
																class="hidden -translate-y-[0.1em] align-middle dark:inline-block mr-1"
															/>
															{#if showLogoLabel}
																<span class="align-middle">
																	{cellColumnMeta?.link_label || formatValue(
																		value,
																		cellDisplayFormat,
																		row[col] === undefined ? "-" : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]),
																		formatRanges.get(col),
																		cellColumnMeta?.type,
																		projectSettings.first_day_of_week
																	) || ""}
																</span>
															{/if}
														{:else if imageUrl && row.render_type === 'cell_data'}
															<img
																src={String(imageUrl)}
																alt={cellColumnMeta?.image_options?.alt ?? ''}
																style="height: {cellColumnMeta?.image_options?.height ? `${cellColumnMeta?.image_options?.height}px` : 'auto'}; width: {cellColumnMeta?.image_options?.width ? `${cellColumnMeta?.image_options?.width}px` : 'auto'}; vertical-align: middle;"
																class="inline h-auto max-w-full rounded-none border-1 mr-1"
															/>
															{#if showImageLabel}
																<span class="align-middle">
																	{cellColumnMeta?.link_label || formatValue(
																		value,
																		cellDisplayFormat,
																		row[col] === undefined ? "-" : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]),
																		formatRanges.get(col),
																		cellColumnMeta?.type,
																		projectSettings.first_day_of_week
																	) || ""}
																</span>
															{/if}
														{:else}
															{cellColumnMeta?.link_label || formatValue(
																value,
																cellDisplayFormat,
																row[col] === undefined ? "-" : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]),
																formatRanges.get(col),
																cellColumnMeta?.type,
																projectSettings.first_day_of_week
															) || ""}
														{/if}
													{/if}
												</span>
											{/snippet}

											{@const href = cellColumnMeta?.link ? (row[`__link_${cellColumnMeta.alias}`] ?? row[cellColumnMeta.link]) : null}
											{@const transformedDimHref = href ? transformInternalLink(String(href), rendererContext.context, page.params, { hrefIncludesProjectSlug: false }) : null}
											{#if transformedDimHref && row.render_type === 'cell_data'}
												<a 
													href={transformedDimHref}
													target={cellColumnMeta?.link_new_tab ? '_blank' : undefined}
													rel={cellColumnMeta?.link_new_tab ? 'noopener noreferrer' : undefined}
													class="text-(--theme-table-link) hover:opacity-80 no-underline"
													onclick={(e) => {
														const merged = mergeCurrentSearchParams(transformedDimHref);
														if (merged !== transformedDimHref && e.currentTarget instanceof HTMLAnchorElement) {
															e.currentTarget.href = merged;
														}
													}}
												>
													{@render cellContent()}
												</a>
											{:else}
												{@render cellContent()}
											{/if}

										{/if}
									</td>
							{/each}
							<!-- Add chevron column for tables with row links - always render cell for alignment -->
							{#if link}
								{@const chevronRowClasses = cn(
									"whitespace-nowrap py-1 pr-1.5 pl-2 w-8 text-center align-middle",
									// Row type styling for chevron column - matches cell styling
									row.render_type === "row_total"
										? "border-t border-foreground/40 dark:border-foreground/40 bg-(--theme-table-total-bg)"
										: row.render_type === "row_subtotal"
										? "border-t border-foreground/40 dark:border-foreground/40 bg-(--theme-table-subtotal-bg)"
										: ""
								)}
								<td class={chevronRowClasses}>
									{#if hasRowLink}
										<ChevronRight class="h-4 w-4 text-muted-foreground inline-block" />
									{/if}
								</td>
							{/if}
						</tr>
					{/each}
			</tbody>
				{:else if loading}
					<!-- Placeholder rows during loading -->
					<TableLoadingSkeleton
						rowCount={page_size > 200 ? 10 : page_size}
						rowLines={row_lines}
						rowShading={row_shading}
						hasLink={!!link}
					/>
					{:else }
					<!-- No results state -->
					<TableNoResults />
				{/if}
		</table>

		{#if loading}
			<div class="absolute top-1 right-2">
				<LoaderCircle class="text-muted-foreground h-4 w-4 animate-spin [animation-duration:1s]" />
			</div>
		{/if}
	</div>
{/snippet}

<!-- prettier-ignore -->
<div class={cn("relative flex w-full flex-col", !printing && 'h-full', query.loading && 'pointer-events-none select-none')}>
	{#if title || subtitle}
		<ComponentTitle {title} {subtitle} {info} {info_link} {info_link_title} />
	{/if}

	<!-- Pivot Limit Warning - only shown in editor -->
	<PivotLimitWarning
		rowLimitExceeded={pivotRowLimitExceeded}
		columnLimitExceeded={query.columnLimitExceeded}
		estimatedColumns={pivotEstimatedColumns}
		hasPivots={model.pivots.length > 0}
		hasSubtotals={model.needsSubtotals}
	/>

	<!-- Debug Panel (commented out for production) -->
	<!-- {#if query.debugInfo}
		<details class="mb-4 rounded border border-gray-300 bg-gray-50 p-3 text-xs dark:border-gray-600 dark:bg-gray-800">
			<summary class="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
				🔍 Query Decision Debug
			</summary>
			<div class="mt-2 space-y-2 text-gray-600 dark:text-gray-400">
				<div class="flex items-center justify-between border-b pb-2">
					<div><strong>Check Type:</strong> {query.debugInfo.checkType}</div>
					<div class="rounded bg-blue-100 px-2 py-1 font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
						{query.queryCount} {query.queryCount === 1 ? 'query' : 'queries'}
					</div>
				</div>
				{#if query.debugInfo.checkType === 'pivot'}
					<div class="border-l-2 border-blue-400 pl-2">
						<div class="font-semibold text-blue-600 dark:text-blue-400">Step 1: Row Count Check</div>
						<div class="ml-2 space-y-1">
							<div><strong>User Limit:</strong> {query.debugInfo.userLimit ?? 'none'}</div>
							<div><strong>Raw Row Check (>100k):</strong> {query.debugInfo.pivotCheckExceedsLowerBound ? 'FAIL ❌' : 'PASS ✅'}</div>
							<div><strong>→ Pagination:</strong> 
								<span class="font-semibold {query.debugInfo.paginationDecision === 'client' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}">
									{query.debugInfo.paginationDecision === 'client' ? 'CLIENT-SIDE ✅' : 'SERVER-SIDE ❌'}
								</span>
							</div>
						</div>
					</div>
					{#if query.debugInfo.paginationDecision === 'client'}
						<div class="border-l-2 border-purple-400 pl-2">
							<div class="font-semibold text-purple-600 dark:text-purple-400">Step 2: Column Count Check</div>
							<div class="ml-2 space-y-1">
								<div><strong>Column Check (>100):</strong> {query.debugInfo.pivotCheckExceedsColumnLimit ? 'FAIL ❌' : 'PASS ✅'}</div>
								<div><strong>→ Rendering:</strong> 
									<span class="font-semibold">
										{query.debugInfo.renderingDecision === 'pivots_as_dimensions' ? 'Pivots as Dimensions' : 'Normal Pivoting'}
									</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="border-l-2 border-gray-400 pl-2 text-gray-500">
							<div class="font-semibold">Step 2: Skipped</div>
							<div class="ml-2 text-xs italic">Server-side pagination prevents pivoting/subtotals</div>
						</div>
					{/if}
				{:else if query.debugInfo.checkType === 'non-pivot'}
					<div><strong>Rows Returned:</strong> {query.debugInfo.rowsReturned}</div>
				{/if}
				<div class="border-t pt-2 text-base">
					<strong>Final Decision:</strong> 
					<span class="font-semibold {query.debugInfo.finalDecision === 'client' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}">
						{query.debugInfo.finalDecision === 'client' ? 'CLIENT-SIDE' : 'SERVER-SIDE'} pagination
					</span>
				</div>
			</div>
		</details>
	{/if} -->

	{@render searchInput()}

	<div bind:this={mainTableContainer}>
		{@render tableContent()}
	</div>

	{@render footer(false)}

</div>
<!-- Global comparison tooltip -->
<GlobalComparisonTooltip />

{#if showFullscreenModal}
	<TableFullscreenModal
		open={showFullscreenModal}
		onClose={closeFullscreen}
		{title}
		{subtitle}
		{info}
		{info_link}
		{info_link_title}
	>
		<PivotLimitWarning
			rowLimitExceeded={pivotRowLimitExceeded}
			columnLimitExceeded={query.columnLimitExceeded}
			estimatedColumns={pivotEstimatedColumns}
			hasPivots={model.pivots.length > 0}
			hasSubtotals={model.needsSubtotals}
		/>
		{@render searchInput()}
		{@render tableContent()}
		{@render footer(true)}
	</TableFullscreenModal>
{/if}

{#snippet searchInput()}
	{#if search}
		<TableSearchInput
			searchTerm={model.searchTerm}
			onSearchChange={(value) => (model.searchTerm = value)}
			onClear={() => {
				model.searchTerm = '';
				model.page = 0;
			}}
		/>
	{/if}
{/snippet}

{#snippet footer(inFullscreen: boolean)}
	<div class="flex items-center">
		<div class="flex-1">
			{#if showPagination}
				<TablePagination
					bind:page={model.page}
					pageSize={page_size}
					totalRows={effectiveCount}
					loading={query.loading}
				/>
			{/if}
		</div>
		{#if !printing && hasData}
			<div class="flex shrink-0 items-center">
				<TableDownloadButton onclick={handleDownload} loading={downloading} />
				<TableFullscreenButton
					onclick={inFullscreen ? closeFullscreen : openFullscreen}
					expanded={inFullscreen}
				/>
			</div>
		{/if}
	</div>
{/snippet}

<!-- {#if hasData}
	<div class="mt-4 space-y-4 rounded-lg border bg-gray-50 p-4 font-mono text-xs dark:bg-gray-900">
		<div class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
			🔍 Layer-by-Layer Debug Output
		</div>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 1A: Table Props ({dimensionsProp.length + measuresProp.length + pivotsProp.length} props)
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Raw user input - simple string arrays from table props<br />
				<strong>Input:</strong> Table component props<br />
				<strong>Output:</strong>
				{dimensionsProp.length} dimensions, {measuresProp.length} measures, {pivotsProp.length} pivots
				→ Raw prop arrays
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					{
						dimensionsProp: dimensionsProp,
						measuresProp: measuresProp,
						pivotsProp: pivotsProp
					},
					null,
					2
				)}</pre>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 1B: Child Components ({unifiedColumns.size} components)
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Declarative component configs with rich display options (formatting,
				comparisons, etc.)<br />
				<strong>Input:</strong> Measure, Dimension, Pivot child components<br />
				<strong>Output:</strong>
				{unifiedColumns.size} component definitions → Raw unifiedColumns Map contents
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					Object.fromEntries(unifiedColumns.entries()),
					null,
					2
				)}</pre>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 2: Column Unification - Initial ({allUnifiedColumns.length} columns)
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Merge props + children into consistent format for downstream
				processing<br />
				<strong>Input:</strong>
				{dimensionsProp.length + measuresProp.length + pivotsProp.length} props + {unifiedColumns.size}
				child components<br />
				<strong>Output:</strong>
				{allUnifiedColumns.length} unified columns → Raw allUnifiedColumns array
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					allUnifiedColumns,
					null,
					2
				)}</pre>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 3: Query Config Generation
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Translate unified columns into SQL configuration (base query +
				comparison fragments)<br />
				<strong>Input:</strong>
				{allUnifiedColumns.length} enhanced columns<br />
				<strong>Output:</strong> SQL config with {comparisonQueryConfigs.length} comparisons, {sparklineQueryConfigs.length}
				sparklines
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					{
						tableExpression: finalTableExpression,
						columns: {
							dimensions: dimensions,
							measures: measures,
							pivots: pivots
						},
						comparisonConfigs: comparisonQueryConfigs,
						sparklineConfigs: sparklineQueryConfigs,
						queryOptions: {
							subtotals: subtotals,
							where: where,
							having: having,
							order: order ?? orderProp,
							limit: limit,
							page_size: serverSidePaginated ? page_size : undefined
						}
					},
					null,
					2
				)}</pre>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 4: Query Execution ({rows.length} rows, {columns.length} columns)
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Execute SQL and return raw data - pure data retrieval, no business
				logic<br />
				<strong>Input:</strong> SQL query configuration<br />
				<strong>Output:</strong>
				{rows.length} rows × {columns.length} columns → Raw SQL results
			</div>
			<div class="space-y-2">
				<div>
					<strong>Query Result Structure:</strong>
					<pre
						class="max-h-48 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
							{
								rowCount: rows.length,
								columnCount: columns.length,
								columnNames: columns.map((col) => col.name),
								columnTypes: columns.map((col) => ({ name: col.name, type: col.jsType })),
								sampleRows: rows.slice(0, 5)
							},
							null,
							2
						)}</pre>
				</div>
			</div>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 5A: Pivot Processing
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Core pivoting logic - transform flat data into pivot structure with
				headers/subtotals<br />
				<strong>Input:</strong>
				{rows.length} raw data rows + column metadata<br />
				<strong>Output:</strong>
				{pivotData.rows.length} processed rows → Raw pivotData object
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					{
						...pivotData,
						rows: pivotData.rows.slice(0, 5),
						totalRowCount: pivotData.rows.length
					},
					null,
					2
				)}</pre>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 5B: Prepare Data for Display
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Apply display policies (hide temporal comparisons in totals), client
				pagination, sorting - post-processing<br />
				<strong>Input:</strong>
				{pivotData.rows.length} initial pivot rows<br />
				<strong>Output:</strong>
				{displayPivotData.rows.length} final rows with policies applied → Raw displayPivotData object
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					{
						...displayPivotData,
						rows: displayPivotData.rows,
						totalRowCount: displayPivotData.rows.length
					},
					null,
					2
				)}</pre>
		</details>

		<details>
			<summary class="mb-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
				Layer 6: Rendering Objects
			</summary>
			<div class="mb-2 text-xs text-gray-600 dark:text-gray-400">
				<strong>Why:</strong> Final objects used during HTML rendering (visualization ranges,
				sorting state, cell logic)<br />
				<strong>Input:</strong>
				{displayPivotData.rows.length} final pivot rows<br />
				<strong>Output:</strong> Rendering utilities → Raw rendering objects used by table template
			</div>
			<pre
				class="max-h-96 overflow-auto rounded bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">{JSON.stringify(
					{
						vizRanges: Object.fromEntries(vizRanges.entries()),
						currentSort: currentSort,
						shouldRenderCellFunction: 'Function that determines cell rendering (rowspan logic)',
						renderingContext: {
							totalRows: displayPivotData.rows.length,
							totalColumns: displayPivotData.columns.length,
							hasPivots: pivots.length > 0,
							hasSubtotals: subtotals,
							isPaginated: serverSidePaginated
						}
					},
					null,
					2
				)}</pre>
		</details>
	</div>
{/if} -->

<div class="hidden">
	{@render children?.()}
</div>
