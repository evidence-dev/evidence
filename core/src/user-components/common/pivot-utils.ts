import type { DataPoint } from '../types';
import { formatValue } from '../formatValue';
import { getEffectiveDays } from './date-options';
import type { Comparison } from './build-comparisons';
import type { UnifiedColumnDefinition } from '../tags/table/unified-column-definition.types';
import { logger } from '../../shims/logger';

// Remove schema imports and custom props types - we'll use UnifiedColumnDefinition directly

type EvidenceDataPoint = DataPoint & {
	__ev_render_type?: string;
	__ev_subtotal_level?: number;
};

export interface PivotRow
	extends Record<
		string,
		string | number | boolean | null | undefined | Date | number[] | boolean[]
	> {
	render_type: 'cell_data' | 'row_total' | 'row_subtotal';
	subtotal_level: number | null;
	__dimKey?: string; // Make dimKey optional since it's only needed for pivot tables
	__rowspans?: number[];
	__skipCell?: boolean[];
}

export interface ColumnMetaItem {
	key: string;
	parts: (string | null)[];
	render_type: 'cell_data' | 'column_total' | 'column_subtotal';
	columnType: 'dimension' | 'measure';
	alias: string; // The result column name this column is based on
	type: string; // The JavaScript type of the column (e.g., 'string', 'number', etc.)
	align: 'left' | 'right' | 'center'; // The alignment of the column
	fmt: string | undefined; // Format code for value formatting
	title?: string; // Custom title for the column
	info?: string; // Additional information displayed as tooltip
	info_link?: string; // URL to link the info text to
	info_link_title?: string; // Custom link title for the info link
	wrap?: boolean; // Whether content in this column can wrap across multiple lines (for dimensions)
	fmt_column?: string; // Column name containing format strings for dynamic formatting (for measures)
	hide?: boolean;
	red_negatives?: boolean;

	// Visualization configuration
	viz?: 'bar' | 'color' | 'delta' | 'sparkline';

	// Visualization properties - copied directly from UnifiedColumnDefinition
	delta_options?: UnifiedColumnDefinition['delta_options'];
	sparkline_options?: UnifiedColumnDefinition['sparkline_options'];
	bar_options?: UnifiedColumnDefinition['bar_options'];
	color_options?: UnifiedColumnDefinition['color_options'];
	viz_include_subtotals?: UnifiedColumnDefinition['viz_include_subtotals'];

	// Sorting properties
	sort?: 'asc' | 'desc';

	// Subtotal control properties
	hide_column_totals?: boolean;
	hide_row_totals?: boolean;

	// Content and link properties (flat structure) - copied directly from UnifiedColumnDefinition
	html?: UnifiedColumnDefinition['html'];
	image_options?: UnifiedColumnDefinition['image_options'];
	image?: UnifiedColumnDefinition['image'];
	logo?: UnifiedColumnDefinition['logo'];
	logo_options?: UnifiedColumnDefinition['logo_options'];
	link?: UnifiedColumnDefinition['link'];
	link_label?: UnifiedColumnDefinition['link_label'];
	link_new_tab?: UnifiedColumnDefinition['link_new_tab'];

	// Comparison metadata for tooltips
	comparison?: Comparison;

	// Column grouping
	column_group?: string;

	// Repeat control
	repeat_values?: boolean; // Whether to repeat dimension value on every row (overrides table-level repeat_values)
}

export interface HeaderCell {
	label: string;
	isDimension: boolean;
	render_type?: 'cell_data' | 'column_total' | 'column_subtotal';
	subtotal_level?: number | null;
	colspan?: number;
	startIndex: number; // The starting column index this header cell applies to
	align: 'left' | 'right' | 'center'; // The alignment for this header cell
	title?: string; // Custom title (overrides label if present)
	info?: string; // Tooltip info text
	info_link?: string; // URL to link the info text to
	info_link_title?: string; // Custom link title for the info link
	headerType?: 'dimension' | 'measure' | 'pivot_value' | 'column_group'; // Type of header for easier identification
}

export interface PivotConfig {
	dimensions: string[];
	pivots: string[];
	measures: string[];
	measuresFirst: boolean;
	subtotals: boolean;
	showTotalRow?: boolean; // Whether to display total row (default true if subtotals enabled)
	showSubtotalRows?: boolean; // Whether to display intermediate subtotal rows (default true if subtotals enabled)
	showTotalColumn?: boolean; // Whether to display total column in pivoted tables (default true if subtotals enabled)
	showSubtotalColumns?: boolean; // Whether to display intermediate subtotal columns in pivoted tables (default true if subtotals enabled)
	totalLabel?: string; // Custom label for total/subtotal rows and columns (default "Total")
	columnTypes: Map<string, string>; // Required map of column names to their JavaScript types
	// Direct unified columns instead of extracted custom props
	unifiedColumns: UnifiedColumnDefinition[];
	// Measures that should pass through the pivot without being duplicated per pivot value.
	// Used for dimension fragment columns (image, logo, link, conditional_colors)
	// and row-level columns (__row_conditional_colors).
	// First non-null value wins when multiple raw rows map to the same pivoted row.
	passThroughMeasures?: string[];
	collapsible?: boolean; // When true, keep subtotal rows even if all measure cells are hidden
	firstDayOfWeek?: 'sunday' | 'monday';
}

export interface PivotResult {
	columns: string[];
	rows: PivotRow[];
	dimensions: string[];
	headerLevels: HeaderCell[][];
	columnMeta: ColumnMetaItem[];
	tableType: 'simple' | 'selected_columns' | 'pivot'; // Add this field
	config: {
		dimensions: string[];
		pivots: string[];
		measures: string[];
		measuresFirst: boolean;
		subtotals: boolean;
		showTotalRow?: boolean;
		showSubtotalRows?: boolean;
		showTotalColumn?: boolean;
		showSubtotalColumns?: boolean;
		totalLabel?: string;
	};
}

// Direct conversion from UnifiedColumnDefinition to ColumnMetaItem
function createColumnMetaFromUnified(
	unifiedCol: UnifiedColumnDefinition,
	key: string,
	renderType: ColumnMetaItem['render_type'],
	columnType: ColumnMetaItem['columnType'],
	jsType: string,
	parts: (string | null)[] = [key] // Default to simple case
): ColumnMetaItem {
	// Destructure to avoid property conflicts, specifically 'type' which means different things
	const { type: _unusedType, ...unifiedProps } = unifiedCol;

	return {
		// Pivot-specific properties
		key,
		parts,
		render_type: renderType,
		columnType,
		type: jsType, // JavaScript type from query result
		// Copy everything else from unified column (except conflicting properties)
		...unifiedProps
	} as ColumnMetaItem;
}

// Memoization cache for generateSimpleTable
let simpleTableCache: {
	dataRef: WeakRef<DataPoint[]>;
	columnTypesSize: number;
	result: PivotResult;
} | null = null;

// Simple table function - just shows all columns as-is, no dimension/measure classification
export function generateSimpleTable(
	data: DataPoint[],
	columnTypes: Map<string, string>
): PivotResult {
	const columnTypesSize = columnTypes.size;

	// Use reference identity for the data array — each fetch returns a new array object
	if (
		simpleTableCache &&
		simpleTableCache.dataRef.deref() === data &&
		simpleTableCache.columnTypesSize === columnTypesSize
	) {
		return simpleTableCache.result;
	}

	if (!data.length) {
		return {
			columns: [],
			rows: [],
			dimensions: [],
			headerLevels: [],
			columnMeta: [],
			tableType: 'simple',
			config: {
				dimensions: [],
				pivots: [],
				measures: [],
				measuresFirst: false,
				subtotals: false,
				showTotalRow: true,
				showSubtotalRows: true,
				showTotalColumn: true,
				showSubtotalColumns: true
			}
		};
	}

	// Detect broken AST state: stale pivoted data being processed as simple table
	const availableColumns = Array.from(columnTypes.keys());

	// Look for the specific evidence columns generated by subtotal/grouping sets queries
	const hasSubtotalEvidenceColumns = availableColumns.some(
		(col) =>
			col === '__ev_subtotal_level' ||
			col === '__ev_render_type' ||
			col.startsWith('__ev_grouping_')
	);

	if (hasSubtotalEvidenceColumns && data.length > 500) {
		logger.warn(
			'Detected broken AST state: stale pivoted data with subtotal evidence columns but no unified columns. Returning empty table to prevent performance issues.'
		);
		return {
			columns: [],
			rows: [],
			dimensions: [],
			headerLevels: [],
			columnMeta: [],
			tableType: 'simple',
			config: {
				dimensions: [],
				pivots: [],
				measures: [],
				measuresFirst: true,
				subtotals: true,
				showTotalRow: true,
				showSubtotalRows: true,
				showTotalColumn: true,
				showSubtotalColumns: true
			}
		};
	}

	// Check if data contains pivot metadata columns and filter if needed
	let filteredData = data;
	if (data.length > 0 && (data[0] as EvidenceDataPoint).__ev_render_type !== undefined) {
		filteredData = data.filter(
			(row) => (row as EvidenceDataPoint).__ev_render_type === 'cell_data'
		);
	}

	// Get all columns, filter out internal helper columns and the row color column
	const ROW_COLOR_COLUMN = '__row_conditional_colors';
	const columns = Array.from(columnTypes.keys()).filter(
		(col) => !col.startsWith('__ev_') && col !== ROW_COLOR_COLUMN
	);

	// Create basic column metadata - all columns treated the same
	const columnMeta: ColumnMetaItem[] = columns.map((col) => {
		const type = columnTypes.get(col) || 'string';
		return {
			key: col,
			parts: [col],
			render_type: 'cell_data' as const,
			columnType: 'dimension', // Just treat everything as dimension for simplicity
			alias: col,
			type,
			align: type === 'number' ? 'right' : 'left', // Only alignment based on type
			fmt: undefined
		};
	});

	// Create simple header level
	const headerLevel: HeaderCell[] = columns.map((col, index) => ({
		label: col,
		isDimension: true,
		startIndex: index,
		colspan: 1,
		render_type: 'cell_data',
		align: columnTypes.get(col) === 'number' ? 'right' : 'left',
		headerType: 'dimension'
	}));

	// Check if the data has a row color column to preserve
	const hasRowColorColumn =
		filteredData.length > 0 && ROW_COLOR_COLUMN in filteredData[0];

	// Filter out subtotal/total rows and clean row data
	const rows = filteredData
		.filter(
			(row) =>
				!(row as EvidenceDataPoint).__ev_render_type ||
				(row as EvidenceDataPoint).__ev_render_type === 'cell_data'
		)
		.map((row) => {
			const cleanRow: Record<string, unknown> = {};
			columns.forEach((col) => {
				cleanRow[col] = row[col];
			});
			// Preserve the row color column in row data (hidden from display columns)
			if (hasRowColorColumn) {
				cleanRow[ROW_COLOR_COLUMN] = row[ROW_COLOR_COLUMN];
			}
			return {
				...cleanRow,
				render_type: 'cell_data' as const,
				subtotal_level: null,
				__rowspans: [],
				__skipCell: []
			};
		});

	const result = {
		columns,
		rows,
		dimensions: columns, // All columns are treated as dimensions
		headerLevels: [headerLevel],
		columnMeta,
		tableType: 'simple' as const,
		config: {
			dimensions: columns,
			pivots: [],
			measures: [],
			measuresFirst: false,
			subtotals: false,
			showTotalRow: true,
			showSubtotalRows: true,
			showTotalColumn: true,
			showSubtotalColumns: true
		}
	};

	// Cache the result
	simpleTableCache = { dataRef: new WeakRef(data), columnTypesSize, result };

	return result;
}

// Memoization cache for generateSelectedColumnTable
let selectedColumnTableCache: {
	dataRef: WeakRef<DataPoint[]>;
	selectedColumnsHash: string;
	result: PivotResult;
} | null = null;

// Selected column table function - picks specific columns with unified column formatting
export function generateSelectedColumnTable(
	data: DataPoint[],
	columnTypes: Map<string, string>,
	unifiedColumns: UnifiedColumnDefinition[],
	selectedColumns: string[]
): PivotResult {
	// Create cache key from inputs
	// Include ALL column metadata to be future-proof
	const selectedColumnsHash = JSON.stringify({
		selectedColumns,
		// Exclude only internal properties (processedColumnExpression, sparklineVizConfig)
		unifiedColumnsMetadata: unifiedColumns.map((col) => {
			const {
				processedColumnExpression: _processedColumnExpression,
				sparklineVizConfig: _sparklineVizConfig,
				...displayProps
			} = col;
			return displayProps;
		})
	});

	// Use reference identity for the data array — each fetch returns a new array object
	if (
		selectedColumnTableCache &&
		selectedColumnTableCache.dataRef.deref() === data &&
		selectedColumnTableCache.selectedColumnsHash === selectedColumnsHash
	) {
		return selectedColumnTableCache.result;
	}
	if (!data.length) {
		return {
			columns: [],
			rows: [],
			dimensions: [],
			headerLevels: [],
			columnMeta: [],
			tableType: 'selected_columns',
			config: {
				dimensions: [],
				pivots: [],
				measures: [],
				measuresFirst: false,
				subtotals: false,
				showTotalRow: true,
				showSubtotalRows: true,
				showTotalColumn: true,
				showSubtotalColumns: true
			}
		};
	}

	// Filter out Evidence internal columns from selected columns
	const allColumns = selectedColumns.filter((col) => !col.startsWith('__ev_'));

	// Separate visible columns (for display) from hidden columns (for data like link URLs)
	// Hidden columns need to be in row data but not displayed as table columns
	const visibleColumns: string[] = [];
	const hiddenColumns: string[] = [];

	for (const col of allColumns) {
		const unifiedCol = unifiedColumns.find(
			(uc) => uc.columnIdForRendering === col || uc.alias === col
		);
		if (unifiedCol?.hide) {
			hiddenColumns.push(col);
		} else {
			visibleColumns.push(col);
		}
	}

	// Use visible columns for display
	const columns = visibleColumns;

	// Create column metadata using unified columns for formatting info
	const columnMeta: ColumnMetaItem[] = columns.map((col) => {
		const type = columnTypes.get(col) || 'string';
		const unifiedCol = unifiedColumns.find((uc) => uc.columnIdForRendering === col);

		if (unifiedCol) {
			// Use unified column for rich formatting
			return createColumnMetaFromUnified(
				unifiedCol,
				col,
				'cell_data',
				'dimension', // Treat all as dimensions for simplicity
				type
			);
		} else {
			// Basic fallback
			return {
				key: col,
				parts: [col],
				render_type: 'cell_data' as const,
				columnType: 'dimension',
				alias: col,
				type,
				align: type === 'number' ? 'right' : 'left',
				fmt: undefined
			};
		}
	});

	// Create simple header level
	const headerLevel: HeaderCell[] = columns.map((col, index) => {
		const colMeta = columnMeta.find((meta) => meta.key === col);
		return {
			label: col,
			isDimension: true,
			startIndex: index,
			colspan: 1,
			render_type: 'cell_data',
			align: colMeta?.align || 'left',
			title: colMeta?.title,
			info: colMeta?.info,
			info_link: colMeta?.info_link,
			info_link_title: colMeta?.info_link_title,
			headerType: 'dimension'
		};
	});

	// Build header levels array, potentially with column group header
	const headerLevels: HeaderCell[][] = [];

	// Generate column group header level if any columns have column_group defined
	const columnGroupHeader = generateColumnGroupHeaderLevel(columns, columnMeta, 0);
	if (columnGroupHeader) {
		headerLevels.push(columnGroupHeader);
	}
	headerLevels.push(headerLevel);

	// Filter out subtotal/total rows and clean row data
	// Include both visible columns (for display) and hidden columns (for link URLs, image URLs, etc.)
	const rows = data
		.filter((row) => !row.__ev_render_type || row.__ev_render_type === 'cell_data')
		.map((row) => {
			const cleanRow: Record<string, unknown> = {};
			// Copy visible columns for display
			columns.forEach((col) => {
				cleanRow[col] = row[col];
			});
			// Also copy hidden columns so link/image URLs are available in row data
			hiddenColumns.forEach((col) => {
				cleanRow[col] = row[col];
			});
			return {
				...cleanRow,
				render_type: 'cell_data' as const,
				subtotal_level: null,
				__rowspans: [],
				__skipCell: []
			};
		});

	const result = {
		columns,
		rows,
		dimensions: columns, // All columns treated as dimensions
		headerLevels,
		columnMeta,
		tableType: 'selected_columns' as const,
		config: {
			dimensions: columns,
			pivots: [],
			measures: [],
			measuresFirst: false,
			subtotals: false,
			showTotalRow: true,
			showSubtotalRows: true,
			showTotalColumn: true,
			showSubtotalColumns: true
		}
	};

	// Cache the result
	selectedColumnTableCache = { dataRef: new WeakRef(data), selectedColumnsHash, result };

	return result;
}

// Memoization cache for generatePivotData
let pivotDataCache: {
	dataRef: WeakRef<DataPoint[]>;
	configHash: string;
	result: PivotResult;
} | null = null;

/**
 * Helper function to replace a specific part in the key parts array at a given position
 * This is safer than replacing all occurrences, as pivot values might coincidentally match the measure alias
 * @param keyParts - The pivot key parts array
 * @param position - The index position to replace (measure position)
 * @param newPart - The replacement part (typically the fragment alias)
 * @returns New array with the part replaced at the specific position
 */
function replaceKeyPartAtPosition(
	keyParts: (string | number | Date | null | undefined)[],
	position: number,
	newPart: string
): (string | number | Date | null | undefined)[] {
	return keyParts.map((part, index) => (index === position ? newPart : part));
}

/**
 * Helper function to update a fragment column reference to its pivoted version
 * @param fragmentAlias - The original fragment column alias
 * @param measure - The parent measure alias
 * @param keyParts - The pivot key parts for the parent measure
 * @param measurePosition - The index position of the measure in keyParts
 * @param fragmentColumnAliases - List of fragment columns that should be pivoted
 * @returns The pivoted fragment column name (e.g., "2023::conditional_colors_alias")
 */
function getPivotedFragmentColumnName(
	fragmentAlias: string,
	measure: string,
	keyParts: (string | number | Date | null | undefined)[],
	measurePosition: number,
	fragmentColumnAliases: string[]
): string | null {
	// Only pivot if this is actually a fragment column (not an existing column reference)
	if (!fragmentColumnAliases.includes(fragmentAlias)) {
		return null;
	}

	const fragmentKeyParts = replaceKeyPartAtPosition(keyParts, measurePosition, fragmentAlias);
	return fragmentKeyParts.join('::');
}

const GROUPED_DIM_MARKER = '[[GROUPED]]';

/**
 * A subtotal row that aggregates a single detail row just duplicates that row,
 * so it adds noise without adding information. This finds the subtotal levels
 * (i.e. dimensions) where *every* group collapses to a single detail row — only
 * then is it safe to drop that level's subtotals wholesale. A level with even one
 * multi-row group keeps all of its subtotals so the table stays consistent.
 *
 * Operates per level rather than over the whole table: with dimensions [a, b, c],
 * the (a, b) subtotals can be redundant (one c each) while the (a) subtotals still
 * aggregate several rows and must stay.
 */
function getRedundantSubtotalLevels(rows: PivotRow[]): Set<number> {
	const levelsToHide = new Set<number>();

	const subtotalRows = rows.filter(
		(row): row is PivotRow & { __dimKey: string } =>
			row.render_type === 'row_subtotal' && typeof row.__dimKey === 'string'
	);
	if (subtotalRows.length === 0) return levelsToHide;

	const detailRows = rows.filter(
		(row): row is PivotRow & { __dimKey: string } =>
			row.render_type === 'cell_data' && typeof row.__dimKey === 'string'
	);
	if (detailRows.length === 0) return levelsToHide;

	// Count detail rows under every hierarchical prefix so group lookups are O(1).
	const detailCountByPrefix = new Map<string, number>();
	for (const detailRow of detailRows) {
		const parts = detailRow.__dimKey.split('|~|');
		for (let i = 1; i <= parts.length; i++) {
			const prefix = parts.slice(0, i).join('|~|');
			detailCountByPrefix.set(prefix, (detailCountByPrefix.get(prefix) ?? 0) + 1);
		}
	}

	// A subtotal's level is the count of leading dimensions that still carry a value
	// (everything from the first grouped-out marker onward is aggregated away).
	const subtotalsByLevel = new Map<number, Array<PivotRow & { __dimKey: string }>>();
	for (const subtotalRow of subtotalRows) {
		const parts = subtotalRow.__dimKey.split('|~|');
		const level = parts.indexOf(GROUPED_DIM_MARKER);
		if (level <= 0) continue;
		const group = subtotalsByLevel.get(level);
		if (group) group.push(subtotalRow);
		else subtotalsByLevel.set(level, [subtotalRow]);
	}

	for (const [level, subtotals] of subtotalsByLevel) {
		const everyGroupIsSingleton = subtotals.every((subtotalRow) => {
			const prefix = subtotalRow.__dimKey.split('|~|').slice(0, level).join('|~|');
			return (detailCountByPrefix.get(prefix) ?? 0) === 1;
		});
		if (everyGroupIsSingleton) levelsToHide.add(level);
	}

	return levelsToHide;
}

export function generatePivotData(data: DataPoint[], config: PivotConfig): PivotResult {
	// Include unifiedColumns to detect changes in ALL display properties
	// We exclude only internal/derived properties that don't affect display
	const configHash = JSON.stringify({
		dimensions: config.dimensions,
		pivots: config.pivots,
		measures: config.measures,
		passThroughMeasures: config.passThroughMeasures,
		measuresFirst: config.measuresFirst,
		subtotals: config.subtotals,
		showTotalRow: config.showTotalRow,
		showSubtotalRows: config.showSubtotalRows,
		showTotalColumn: config.showTotalColumn,
		showSubtotalColumns: config.showSubtotalColumns,
		totalLabel: config.totalLabel,
		// Include ALL column metadata to be future-proof
		// Exclude only internal properties (processedColumnExpression, sparklineVizConfig)
		unifiedColumnsMetadata: config.unifiedColumns.map((col) => {
			const {
				processedColumnExpression: _processedColumnExpression,
				sparklineVizConfig: _sparklineVizConfig,
				...displayProps
			} = col;
			return displayProps;
		})
	});

	// Use reference identity for the data array — each fetch returns a new array object,
	// so === is a reliable and cheap check that avoids hashing only the first row
	// (which missed changes in subsequent rows).
	if (
		pivotDataCache &&
		pivotDataCache.dataRef.deref() === data &&
		pivotDataCache.configHash === configHash
	) {
		return pivotDataCache.result;
	}

	const columnMeta: ColumnMetaItem[] = [];
	const columnSet = new Set<string>();
	const groupMap = new Map<string, PivotRow>();

	// Pre-index unifiedColumns for O(1) lookups instead of O(n) find() calls.
	// This is critical for performance with large datasets (23k+ rows).
	const unifiedByRendering = new Map(
		config.unifiedColumns.map((uc) => [uc.columnIdForRendering, uc])
	);
	const unifiedByAlias = new Map(config.unifiedColumns.map((uc) => [uc.alias, uc]));

	// Add dimension columns to columnMeta using unified columns directly
	config.dimensions.forEach((dim) => {
		const type = config.columnTypes.get(dim);
		const unifiedCol = unifiedByRendering.get(dim);

		if (!unifiedCol) return;

		columnMeta.push(
			createColumnMetaFromUnified(
				unifiedCol,
				dim,
				'cell_data',
				'dimension',
				type || 'string'
				// parts auto-generated as [dim]
			)
		);
	});

	// Process the raw data to convert values to nulls for subtotals/totals
	// ClickHouse doesn't give us nulls for grouped-out values in GROUPING SETS,
	// so we need to use the __ev_grouping_* columns to identify which values
	// should be null. A GROUPING value of 1 means the column was grouped out,
	// while 0 means the column has a value.
	const processedData = data.map((row) => {
		const evidenceRow = row as EvidenceDataPoint;

		// For non-total/subtotal rows, return as-is
		if (!config.subtotals || evidenceRow.__ev_render_type === 'cell_data') {
			return evidenceRow;
		}

		// Create processed row with all values copied
		const processed = { ...evidenceRow };

		// Convert values to null based on grouping indicators
		config.dimensions.forEach((dim) => {
			// For dimensions, if it's grouped out (1), set to null
			if (processed[`__ev_grouping_${dim}`] === 1) {
				processed[dim] = null;
			}
		});

		// For pivots, we need to be more careful
		// If a pivot is grouped out (1), its value should be preserved for the total/subtotal
		// If a pivot is not grouped out (0), but we're in a total/subtotal row,
		// we should keep its value for proper pivoting
		config.pivots.forEach((pivot) => {
			const isGroupedOut = processed[`__ev_grouping_${pivot}`] === 1;
			// Only set to null if explicitly grouped out
			if (isGroupedOut) {
				processed[pivot] = null;
			}
		});

		return processed;
	});

	for (const row of processedData) {
		const evidenceRow = row as EvidenceDataPoint;
		const dimKey = config.dimensions
			.map((d: string) => {
				const value = evidenceRow[d];
				const isGroupedOut = evidenceRow[`__ev_grouping_${d}`] === 1;
				return isGroupedOut ? GROUPED_DIM_MARKER : value;
			})
			.join('|~|');

		if (!groupMap.has(dimKey)) {
			const base: PivotRow = {
				render_type: 'cell_data',
				subtotal_level: null,
				__dimKey: dimKey
			};

			// Copy grouping indicator columns so later logic can inspect them
			config.dimensions.forEach((d: string) => {
				const groupingVal = evidenceRow[`__ev_grouping_${d}`];
				if (groupingVal !== undefined) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(base as any)[`__ev_grouping_${d}`] = groupingVal;
				}
			});

			// Process dimension values based on row type
			const isTotal = evidenceRow.__ev_render_type === 'row_total';
			const isSubtotal = evidenceRow.__ev_render_type === 'row_subtotal';

			// Copy dimension values as-is, they're already processed
			config.dimensions.forEach((d: string, index: number) => {
				// For row_total, set first dimension to the configured total label
				if (isTotal && index === 0) {
					base[d] = config.totalLabel ?? 'Total';
				} else {
					base[d] = evidenceRow[d];
				}
			});

			// Only use row-level render types
			base.render_type = isTotal ? 'row_total' : isSubtotal ? 'row_subtotal' : 'cell_data';
			base.subtotal_level = evidenceRow.__ev_subtotal_level ?? null;
			groupMap.set(dimKey, base);
		}

		const entry = groupMap.get(dimKey);
		if (!entry) continue;

		// Copy pass-through measures (not pivoted, first non-null value wins)
		if (config.passThroughMeasures) {
			for (const col of config.passThroughMeasures) {
				const value = evidenceRow[col];
				if (!(col in entry)) {
					entry[col] = value;
				} else if (entry[col] == null && value != null) {
					entry[col] = value;
				}
			}
		}

		// Process measures (now includes fragment columns from Table component)
		for (const measure of config.measures) {
			if (evidenceRow[measure] !== undefined) {
				const pivotParts = config.pivots.map((p: string) => {
					const value = evidenceRow[p];
					// Convert legitimate nulls to "null" string for pivot headers, but keep grouped-out nulls as null
					const isGroupedOut = evidenceRow[`__ev_grouping_${p}`] === 1;
					return isGroupedOut ? null : value === null ? 'null' : value;
				});
				const keyParts =
					config.measuresFirst && config.pivots.length > 0
						? [measure, ...pivotParts]
						: [...pivotParts, measure];
				const hasRealPivotValue = pivotParts.some((part) => part !== null);
				const flatKey = hasRealPivotValue ? keyParts.join('::') : measure;

				// Keep measure values as real nulls
				entry[flatKey] = evidenceRow[measure];

				// Compute render type for this column (needed for both column meta and fragment columns)
				const totalCount = keyParts.filter((p) => p === null).length;
				const renderType: ColumnMetaItem['render_type'] =
					config.pivots.length > 0
						? totalCount === config.pivots.length
							? 'column_total'
							: totalCount > 0
								? 'column_subtotal'
								: 'cell_data'
						: 'cell_data';

				// Lookup unified column once for use in both column metadata and fragment pivoting
				const unifiedCol = unifiedByRendering.get(measure);

				if (!columnSet.has(flatKey)) {
					columnSet.add(flatKey);

					const type = config.columnTypes.get(measure);
					if (!type) {
						throw new Error(`No type found for measure column: ${measure}`);
					}

					// Create measure column using unified column
					if (!unifiedCol) continue;

					const columnWithProps = createColumnMetaFromUnified(
						unifiedCol,
						flatKey,
						renderType,
						'measure',
						type,
						keyParts.map((part) => (part === undefined || part === null ? null : String(part))) // Complex parts for pivot hierarchy
					);

					// Update references to fragment columns to point to their pivoted versions
					// Only update if the referenced column is actually a fragment (not an existing column reference)
					if (hasRealPivotValue && unifiedCol?.fragmentColumnAliases) {
						// Calculate the position of the measure in keyParts
						// measuresFirst: [measure, ...pivotParts] -> position 0
						// Otherwise: [...pivotParts, measure] -> position = pivotParts.length
						const measurePosition =
							config.measuresFirst && config.pivots.length > 0 ? 0 : config.pivots.length;

						// Update conditional_colors reference if it's a fragment
						if (columnWithProps.color_options?.conditional_colors) {
							const pivoted = getPivotedFragmentColumnName(
								columnWithProps.color_options.conditional_colors,
								measure,
								keyParts,
								measurePosition,
								unifiedCol.fragmentColumnAliases
							);
							if (pivoted) {
								columnWithProps.color_options = {
									...columnWithProps.color_options,
									conditional_colors: pivoted
								};
							}
						}

						// Update scale_column reference if it's a fragment
						if (columnWithProps.color_options?.scale_column) {
							const pivoted = getPivotedFragmentColumnName(
								columnWithProps.color_options.scale_column,
								measure,
								keyParts,
								measurePosition,
								unifiedCol.fragmentColumnAliases
							);
							if (pivoted) {
								columnWithProps.color_options = {
									...columnWithProps.color_options,
									scale_column: pivoted
								};
							}
						}
					}

					// Apply hide logic for column totals/subtotals
					// Priority: table-level flags > measure-level flags > temporal comparison logic
					if (renderType === 'column_total' || renderType === 'column_subtotal') {
						let hideColumn = false;

						// Table-level flags (highest priority)
						const showTotalColumn = config.showTotalColumn ?? true;
						const showSubtotalColumns = config.showSubtotalColumns ?? true;

						if (renderType === 'column_total' && !showTotalColumn) {
							hideColumn = true;
						} else if (renderType === 'column_subtotal' && !showSubtotalColumns) {
							hideColumn = true;
						} else if (columnWithProps.hide_column_totals === true) {
							// Measure-level flag
							hideColumn = true;
						} else {
							// Temporal comparison logic (lowest priority)
							if (shouldHideColumnTotal(keyParts, unifiedCol, config)) {
								hideColumn = true;
							}
						}

						if (hideColumn) {
							columnWithProps.hide = true;
						}
					}

					columnMeta.push(columnWithProps);
				}

				// ALSO pivot any fragment columns associated with this measure
				// Fragment columns are hidden SQL columns that provide visualization data (colors, scale values, etc.)
				// They need to be pivoted alongside the parent measure so each pivoted cell has its own fragment data
				// The parent measure tracks these via fragmentColumnAliases (set in MeasureModel.svelte.ts)
				// Note: unifiedCol is already looked up above, so we reuse it here
				if (unifiedCol?.fragmentColumnAliases) {
					// Calculate the position of the measure in keyParts (same as above)
					const measurePosition =
						config.measuresFirst && config.pivots.length > 0 ? 0 : config.pivots.length;

					for (const fragmentAlias of unifiedCol.fragmentColumnAliases) {
						// Only pivot if this fragment column exists in the data
						if (evidenceRow[fragmentAlias] !== undefined) {
							// Construct the fragment key by replacing the measure part with the fragment column name at the specific position
							const fragmentKeyParts = replaceKeyPartAtPosition(
								keyParts,
								measurePosition,
								fragmentAlias
							);
							const fragmentFlatKey = hasRealPivotValue
								? fragmentKeyParts.join('::')
								: fragmentAlias;

							// Store the fragment value with the same pivot structure
							entry[fragmentFlatKey] = evidenceRow[fragmentAlias];

							// Add column meta for the pivoted fragment column if not already present
							if (!columnSet.has(fragmentFlatKey)) {
								columnSet.add(fragmentFlatKey);
								const fragmentUnifiedCol = unifiedByAlias.get(fragmentAlias);
								if (fragmentUnifiedCol) {
									const fragmentColMeta = createColumnMetaFromUnified(
										fragmentUnifiedCol,
										fragmentFlatKey,
										renderType,
										'measure',
										config.columnTypes.get(fragmentAlias) || 'string',
										fragmentKeyParts.map((part) =>
											part === undefined || part === null ? null : String(part)
										)
									);
									columnMeta.push(fragmentColMeta);
								}
							}
						}
					}
				}
			}
		}
	}

	// Build initial rows array with granular control over total/subtotal display
	// Default to true if subtotals are enabled and flags are undefined
	const showTotalRow = config.showTotalRow ?? true;
	const showSubtotalRows = config.showSubtotalRows ?? true;

	let rows = Array.from(groupMap.values()).filter((row) => {
		// Always include data rows
		if (row.render_type === 'cell_data') return true;

		// If subtotals are disabled, exclude all total/subtotal rows
		if (!config.subtotals) return false;

		// Apply granular filtering based on render type
		if (row.render_type === 'row_total') {
			return showTotalRow;
		} else if (row.render_type === 'row_subtotal') {
			return showSubtotalRows;
		}

		return true;
	});

	// Drop subtotal rows for dimension levels where every group has a single detail row,
	// since such a subtotal merely duplicates the row beneath it. The grand total row is
	// never affected. Collapsible tables keep their subtotal rows (they anchor the
	// expand/collapse controls).
	if (config.subtotals && !config.collapsible) {
		const redundantLevels = getRedundantSubtotalLevels(rows);
		if (redundantLevels.size > 0) {
			rows = rows.filter((row) => {
				if (row.render_type !== 'row_subtotal' || typeof row.__dimKey !== 'string') return true;
				const level = row.__dimKey.split('|~|').indexOf(GROUPED_DIM_MARKER);
				return !redundantLevels.has(level);
			});
		}
	}

	if (config.subtotals) {
		// Pre-compute mapping from measure alias -> all column keys belonging to that measure
		const measureColumnKeysByAlias: Record<string, string[]> = {};
		// Build mapping based on unifiedColumns (source of truth)
		config.unifiedColumns
			.filter((u) => u.type === 'measure')
			.forEach((u) => {
				const renderKey = u.columnIdForRendering;
				const keysForMeasure = columnMeta
					.filter(
						(cm) =>
							cm.columnType === 'measure' &&
							(cm as { columnIdForRendering?: string }).columnIdForRendering === renderKey
					)
					.map((cm) => cm.key);
				if (keysForMeasure.length > 0) {
					measureColumnKeysByAlias[renderKey] = keysForMeasure;
				}
			});

		const filteredRows: PivotRow[] = [];

		for (const row of rows) {
			if (row.render_type !== 'row_total' && row.render_type !== 'row_subtotal') {
				filteredRows.push(row);
				continue;
			}

			// Build hide map per column key
			const hideMap: Record<string, boolean> = {};

			for (const measureAlias of config.measures) {
				const measureDef = unifiedByRendering.get(measureAlias);
				if (!measureDef) continue;
				const hideForMeasure = shouldHideRowTotal(row, measureDef, config);
				const keys = measureColumnKeysByAlias[measureAlias] || [];
				for (const k of keys) {
					hideMap[k] = hideForMeasure;
				}
			}

			// Attach to row – use cast to any for helper property
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(row as any).__hideCell = hideMap;

			// Decide if row should be removed
			const everyHidden =
				Object.values(hideMap).length > 0 && Object.values(hideMap).every(Boolean);

			// Keep subtotal rows when collapsible is active (they host the collapse/expand arrows)
			if (!everyHidden || (config.collapsible && row.render_type === 'row_subtotal')) {
				filteredRows.push(row);
			}
			// if everyHidden, row is skipped (removed)
		}

		rows = filteredRows;
	}

	// Sort columnMeta to match the final column order
	// This ensures columnMeta entries align with the actual columns
	const sortedColumnMeta = [
		...columnMeta.filter((c) => c.columnType === 'dimension'),
		...columnMeta
			.filter((c) => c.columnType === 'measure')
			.sort((a, b) => {
				// For measuresFirst=true, we need to sort by measure first, then by pivots
				if (config.measuresFirst && config.pivots.length > 0) {
					// First compare by measure name (first part)
					const aMeasure = a.parts[0];
					const bMeasure = b.parts[0];
					if (aMeasure !== bMeasure) {
						// Sort by original order in config.measures instead of alphabetically
						const aIndex = config.measures.indexOf(String(aMeasure));
						const bIndex = config.measures.indexOf(String(bMeasure));
						return aIndex - bIndex;
					}

					// Then compare by pivot values (remaining parts)
					// For same measure, sort pivot values with nulls (totals) at the end
					for (let i = 1; i < Math.max(a.parts.length, b.parts.length); i++) {
						const aPivot = i < a.parts.length ? a.parts[i] : null;
						const bPivot = i < b.parts.length ? b.parts[i] : null;

						if (aPivot !== bPivot) {
							// Within the same measure group, put totals (nulls) at the end
							if (aPivot === null) return 1;
							if (bPivot === null) return -1;

							// Get the pivot column name and its type
							const pivotField = config.pivots[i - 1]; // Adjust index for measuresFirst
							if (pivotField) {
								const pivotType = config.columnTypes.get(pivotField);
								const pivotCol = unifiedByRendering.get(pivotField);
								const sortDirection = pivotCol?.sort || 'asc'; // Default to ascending
								const sortMultiplier = sortDirection === 'desc' ? -1 : 1;

								if (pivotType === 'number') {
									const aNum = Number(aPivot);
									const bNum = Number(bPivot);
									return (aNum - bNum) * sortMultiplier;
								} else {
									// String comparison for all other types
									return String(aPivot).localeCompare(String(bPivot)) * sortMultiplier;
								}
							}

							// Fallback to string comparison if no pivot field found
							return String(aPivot).localeCompare(String(bPivot));
						}
					}
				} else {
					// Keep existing measure sorting logic for measuresFirst=false
					if (a.render_type === 'column_total' && b.render_type !== 'column_total') return 1;
					if (a.render_type !== 'column_total' && b.render_type === 'column_total') return -1;

					// Original logic for measuresFirst=false
					const maxPivotDepth = Math.max(a.parts.length - 1, b.parts.length - 1);

					for (let i = 0; i < maxPivotDepth; i++) {
						const aPivot = a.parts[i];
						const bPivot = b.parts[i];

						if (aPivot !== bPivot) {
							if (aPivot === null) return 1;
							if (bPivot === null) return -1;

							// Get the pivot column name and its type
							const pivotField = config.pivots[i];
							const pivotType = config.columnTypes.get(pivotField);
							const pivotCol = unifiedByRendering.get(pivotField);
							const sortDirection = pivotCol?.sort || 'asc'; // Default to ascending
							const sortMultiplier = sortDirection === 'desc' ? -1 : 1;

							if (pivotType === 'number') {
								const aNum = Number(aPivot);
								const bNum = Number(bPivot);
								return (aNum - bNum) * sortMultiplier;
							}

							// Default to string comparison for all other types
							return String(aPivot).localeCompare(String(bPivot)) * sortMultiplier;
						}
					}
				}

				return 0;
			})
	];

	// Include fragment columns (like sparklines) that exist in data but aren't configured measures
	const configuredColumns = new Set([...config.dimensions, ...config.measures, ...config.pivots]);
	// Find additional columns from columnTypes that aren't configured as dimensions/measures/pivots
	const fragmentColumns = Array.from(config.columnTypes.keys()).filter(
		(col) => !configuredColumns.has(col) && !col.startsWith('__ev_') // Exclude internal helper columns
	);

	// Add fragment columns to columnMeta
	fragmentColumns.forEach((col) => {
		const type = config.columnTypes.get(col) || 'string';
		const unifiedCol = unifiedByRendering.get(col);

		if (!unifiedCol) return;

		sortedColumnMeta.push(
			createColumnMetaFromUnified(
				unifiedCol,
				col,
				'cell_data',
				'measure', // Treat fragment columns as measures for display purposes
				type
				// parts auto-generated as [col]
			)
		);
	});

	// Use sortedColumnMeta to construct columns array to ensure consistent order
	const columns = [
		...sortedColumnMeta.filter((c) => c.columnType === 'dimension').map((c) => c.key),
		...sortedColumnMeta.filter((c) => c.columnType === 'measure').map((c) => c.key)
	];

	// Reconstruct headerLevels with the new column order and colspan information
	const headerLevels = [];
	const measureColumns = sortedColumnMeta.filter((c) => c.columnType === 'measure');

	// Early validation of basic structure - MODIFY THIS SECTION
	if (measureColumns.length === 0 && config.measures.length > 0) {
		logger.warn('No measure columns found');
		return {
			columns,
			rows,
			dimensions: config.dimensions,
			headerLevels: [],
			columnMeta: sortedColumnMeta,
			tableType: 'pivot',
			config: {
				dimensions: config.dimensions,
				pivots: config.pivots,
				measures: config.measures,
				measuresFirst: config.measuresFirst,
				subtotals: config.subtotals,
				showTotalRow: config.showTotalRow,
				showSubtotalRows: config.showSubtotalRows,
				showTotalColumn: config.showTotalColumn,
				showSubtotalColumns: config.showSubtotalColumns,
				totalLabel: config.totalLabel
			}
		};
	}

	// For dimension-only case, create a simple header level
	if (measureColumns.length === 0) {
		const dimensionHeaders = sortedColumnMeta
			.filter((c) => c.columnType === 'dimension')
			.map((dimMeta) => ({
				label: dimMeta.key,
				isDimension: true,
				startIndex: columns.indexOf(dimMeta.key),
				colspan: 1,
				render_type: dimMeta.render_type,
				align: dimMeta.align,
				title: dimMeta.title,
				info: dimMeta.info,
				headerType: 'dimension' as const
			}));

		// Generate column group header level if any dimensions have column_group defined
		const columnGroupHeader = generateColumnGroupHeaderLevel(columns, sortedColumnMeta, 0);
		if (columnGroupHeader) {
			headerLevels.push(columnGroupHeader);
		}

		if (dimensionHeaders.length > 0) {
			headerLevels.push(dimensionHeaders);
		}

		return {
			columns,
			rows,
			dimensions: config.dimensions,
			headerLevels,
			columnMeta: sortedColumnMeta,
			tableType: 'pivot',
			config: {
				dimensions: config.dimensions,
				pivots: [],
				measures: [],
				measuresFirst: true,
				subtotals: true,
				showTotalRow: config.showTotalRow,
				showSubtotalRows: config.showSubtotalRows,
				showTotalColumn: config.showTotalColumn,
				showSubtotalColumns: config.showSubtotalColumns,
				totalLabel: config.totalLabel
			}
		};
	}

	// Count only visible measures for header logic (exclude hidden link measures)
	const visibleMeasures = config.measures.filter((measureAlias) => {
		const measureDef = unifiedByRendering.get(measureAlias);
		return !measureDef?.hide;
	});
	const hasSingleMeasure = visibleMeasures.length === 1;
	const hasPivots = config.pivots.length > 0;
	const skipMeasureLevel = hasSingleMeasure && hasPivots;
	const needsExtraMeasureHeader = hasSingleMeasure && hasPivots && config.measuresFirst;

	// Validate column structure for both pivoted and non-pivoted data
	// Exclude fragment columns from validation since they don't follow pivot structure
	const regularMeasureColumns = measureColumns.filter((col) => {
		// Find the unified column for this measure
		const uc = unifiedByRendering.get(col.alias);
		return uc && config.measures.includes(uc.columnIdForRendering);
	});

	const invalidStructure = regularMeasureColumns.some((col) => {
		const parts = col.parts;
		if (hasPivots) {
			// For pivoted data:
			// 1. Must have at least 2 parts (pivot + measure)
			// 2. When measuresFirst=false: Last part must match the measure name
			// 3. When measuresFirst=true: First part must match the measure name
			// 4. Number of parts must match pivot count + 1 (for measure)
			const expectedMeasurePosition = config.measuresFirst ? 0 : parts.length - 1;
			// For comparison measures, we need to check against columnIdForRendering, not alias
			const uc = unifiedByRendering.get(col.alias);
			const expectedMeasureName = uc ? uc.columnIdForRendering : col.alias;
			return (
				parts.length < 2 ||
				parts[expectedMeasurePosition] !== expectedMeasureName ||
				parts.length !== config.pivots.length + 1
			);
		} else {
			// For non-pivoted data:
			// 1. Must have exactly 1 part
			// 2. Part must match the measure name
			const uc = unifiedByRendering.get(col.alias);
			const expectedMeasureName = uc ? uc.columnIdForRendering : col.alias;
			return parts.length !== 1 || parts[0] !== expectedMeasureName;
		}
	});

	if (invalidStructure) {
		logger.warn('Invalid column structure detected');
		return {
			columns,
			rows,
			dimensions: config.dimensions,
			headerLevels: [],
			columnMeta: sortedColumnMeta,
			tableType: 'pivot',
			config: {
				dimensions: config.dimensions,
				pivots: [],
				measures: [],
				measuresFirst: true,
				subtotals: true,
				showTotalRow: config.showTotalRow,
				showSubtotalRows: config.showSubtotalRows,
				showTotalColumn: config.showTotalColumn,
				showSubtotalColumns: config.showSubtotalColumns,
				totalLabel: config.totalLabel
			}
		};
	}

	// Calculate depth with validation - use regular measure columns for depth, but include fragment columns
	const rawDepth =
		regularMeasureColumns.length > 0
			? Math.max(0, ...regularMeasureColumns.map((c) => c.parts.length))
			: 1; // Default depth of 1 if no regular measures (for fragment columns only)
	if (rawDepth === 0 && regularMeasureColumns.length > 0) {
		logger.warn('Invalid depth calculation');
		return {
			columns,
			rows,
			dimensions: config.dimensions,
			headerLevels: [],
			columnMeta: sortedColumnMeta,
			tableType: 'pivot',
			config: {
				dimensions: config.dimensions,
				pivots: [],
				measures: [],
				measuresFirst: true,
				subtotals: true,
				showTotalRow: config.showTotalRow,
				showSubtotalRows: config.showSubtotalRows,
				showTotalColumn: config.showTotalColumn,
				showSubtotalColumns: config.showSubtotalColumns,
				totalLabel: config.totalLabel
			}
		};
	}

	const effectiveDepth = skipMeasureLevel ? Math.max(1, rawDepth - 1) : rawDepth;

	// Add extra header level for single measure when measuresFirst=true
	if (needsExtraMeasureHeader) {
		const measureHeaderRow: HeaderCell[] = [];

		// Add empty cells for dimensions
		const dimensionCount = sortedColumnMeta.filter((c) => c.columnType === 'dimension').length;
		for (let d = 0; d < dimensionCount; d++) {
			measureHeaderRow.push({
				label: '',
				isDimension: true,
				startIndex: d,
				colspan: 1,
				render_type: 'cell_data',
				align: 'left'
			});
		}

		// Add single measure header spanning all measure columns
		const measureName = config.measures[0];
		// Find title and info from any column with this measure as alias
		const measureMeta = sortedColumnMeta.find((meta) => meta.alias === measureName);
		measureHeaderRow.push({
			label: measureName,
			isDimension: false,
			startIndex: dimensionCount,
			colspan: measureColumns.length,
			render_type: 'cell_data',
			align: 'right',
			title: measureMeta?.title,
			info: measureMeta?.info,
			headerType: 'measure'
		});

		headerLevels.push(measureHeaderRow);
	}

	for (let i = 0; i < effectiveDepth; i++) {
		const row: HeaderCell[] = [];
		const isLastLevel = i === effectiveDepth - 1;

		// Handle dimension headers
		if (!isLastLevel) {
			const dimensionCount = sortedColumnMeta.filter((c) => c.columnType === 'dimension').length;
			for (let d = 0; d < dimensionCount; d++) {
				row.push({
					label: '',
					isDimension: true,
					startIndex: d,
					colspan: 1,
					render_type: 'cell_data',
					align: 'left',
					headerType: 'dimension'
					// Note: empty dimension headers are never hidden
				});
			}
		} else {
			for (const dimMeta of sortedColumnMeta.filter((c) => c.columnType === 'dimension')) {
				row.push({
					label: dimMeta.key,
					isDimension: true,
					startIndex: row.length,
					colspan: 1,
					render_type: dimMeta.render_type,
					align: dimMeta.align,
					title: dimMeta.title,
					info: dimMeta.info,
					headerType: 'dimension'
				});
			}
		}

		// Process measure columns
		const currentIndex = row.length;
		const groups: Array<{
			label: string;
			startIndex: number;
			columns: typeof measureColumns;
			render_type: ColumnMetaItem['render_type'];
		}> = [];

		let currentGroup: (typeof groups)[0] | null = null;

		for (let colIndex = 0; colIndex < measureColumns.length; colIndex++) {
			const col = measureColumns[colIndex];
			const parts = col.parts;

			// Calculate part index with bounds checking
			let partIndex: number;
			let label: string;

			if (skipMeasureLevel) {
				// When skipping measure level, use pivot values
				if (config.measuresFirst) {
					// For measuresFirst=true: parts are [measure, pivot1, pivot2, ...]
					// When needsExtraMeasureHeader=true, we've already added the measure header,
					// so the main loop starts at pivot field 0, not -1
					const pivotFieldIndex = needsExtraMeasureHeader ? i : i - 1;
					// For measuresFirst=true, part index should be pivotFieldIndex + 1 (to skip the measure at index 0)
					partIndex = pivotFieldIndex + 1;
					const part = partIndex < parts.length ? parts[partIndex] : null;

					// Apply pivot formatting if available
					if (part !== null && pivotFieldIndex >= 0 && pivotFieldIndex < config.pivots.length) {
						const pivotField = config.pivots[pivotFieldIndex];
						const pivotCol = unifiedByRendering.get(pivotField);

						// Only apply formatting if a format code is explicitly provided
						if (pivotCol?.fmt) {
							const pivotColumnType = config.columnTypes.get(pivotField);
							const formattedValue = formatValue(
								part,
								pivotCol.fmt,
								String(part),
								undefined,
								pivotColumnType,
								config.firstDayOfWeek
							);
							label = formattedValue !== null ? formattedValue : String(part);
						} else {
							label = String(part);
						}
					} else {
						label = config.totalLabel ?? 'Total';
					}
				} else {
					// For measuresFirst=false: parts are [pivot1, pivot2, ..., measure]
					// Header level 0 = pivot field 0, level 1 = pivot field 1, etc.
					// So pivot field index is simply i
					const pivotFieldIndex = i;
					const pivotIndex = isLastLevel ? parts.length - 2 : i;
					partIndex = Math.min(pivotIndex, parts.length - 2);
					const part = partIndex >= 0 ? parts[partIndex] : null;

					// Apply pivot formatting if available
					if (
						part !== null &&
						partIndex >= 0 &&
						pivotFieldIndex >= 0 &&
						pivotFieldIndex < config.pivots.length
					) {
						const pivotField = config.pivots[pivotFieldIndex];
						const pivotCol = unifiedByRendering.get(pivotField);

						// Only apply formatting if a format code is explicitly provided
						if (pivotCol?.fmt) {
							const pivotColumnType = config.columnTypes.get(pivotField);
							const formattedValue = formatValue(
								part,
								pivotCol.fmt,
								String(part),
								undefined,
								pivotColumnType,
								config.firstDayOfWeek
							);
							label = formattedValue !== null ? formattedValue : String(part);
						} else {
							label = String(part);
						}
					} else {
						label = config.totalLabel ?? 'Total';
					}
				}
			} else {
				// Normal processing - use all parts
				partIndex = Math.min(i, parts.length - 1); // Ensure we don't go past array bounds
				const part = parts[partIndex];

				// Apply pivot formatting for pivot values
				// For measuresFirst=true, we need to adjust the pivot field index
				// When measuresFirst=true: parts are [measure, pivot1, pivot2, ...]
				// When measuresFirst=false: parts are [pivot1, pivot2, ..., measure]
				let pivotFieldIndex: number;
				if (config.measuresFirst) {
					// For measuresFirst=true, pivot field index is (partIndex - 1) since measure is at index 0
					pivotFieldIndex = partIndex - 1;
				} else {
					// For measuresFirst=false, pivot field index matches part index
					pivotFieldIndex = partIndex;
				}

				if (part !== null && pivotFieldIndex >= 0 && pivotFieldIndex < config.pivots.length) {
					// Get the correct pivot field based on the adjusted index
					const pivotField = config.pivots[pivotFieldIndex];
					const pivotCol = unifiedByRendering.get(pivotField);

					// Only apply formatting if a format code is explicitly provided
					if (pivotCol?.fmt) {
						const pivotColumnType = config.columnTypes.get(pivotField);
						const formattedValue = formatValue(
							part,
							pivotCol.fmt,
							String(part),
							undefined,
							pivotColumnType,
							config.firstDayOfWeek
						);
						label = formattedValue !== null ? formattedValue : String(part);
					} else {
						label = String(part);
					}
				} else {
					label = part === null ? config.totalLabel ?? 'Total' : String(part ?? '');
				}
			}

			// If this is the last level, each column is its own group
			if (isLastLevel) {
				groups.push({
					label,
					startIndex: currentIndex + colIndex,
					columns: [col],
					render_type: col.render_type
				});
				continue;
			}

			// For other levels, group by parts up to current level
			const currentParts = parts.slice(0, partIndex + 1);

			if (!currentGroup) {
				currentGroup = {
					label,
					startIndex: currentIndex + colIndex,
					columns: [col],
					render_type: col.render_type
				};
			} else {
				const previousCol = currentGroup.columns[0];
				const previousParts = previousCol.parts.slice(0, partIndex + 1);

				// Safe comparison of parts
				const sameGroup =
					currentParts.length === previousParts.length &&
					currentParts.every((part, idx) => part === previousParts[idx]);

				if (sameGroup) {
					currentGroup.columns.push(col);
				} else {
					groups.push(currentGroup);
					currentGroup = {
						label,
						startIndex: currentIndex + colIndex,
						columns: [col],
						render_type: col.render_type
					};
				}
			}
		}

		if (currentGroup) {
			groups.push(currentGroup);
		}

		// Create header cells from groups
		for (const group of groups) {
			let render_type = group.render_type;
			if (!isLastLevel) {
				const isTotal = group.columns.every((col) => col.render_type === 'column_total');
				const isSubtotal =
					!isTotal && group.columns.every((col) => col.render_type === 'column_subtotal');
				render_type = isTotal ? 'column_total' : isSubtotal ? 'column_subtotal' : 'cell_data';
			}

			// Determine alignment for measure headers
			let headerAlign: 'left' | 'right' | 'center';
			if (isLastLevel) {
				// For last level, use the alignment from the first column in the group
				headerAlign = group.columns[0]?.align || 'right';
			} else {
				// For non-last level (pivot headers), use center alignment
				headerAlign = 'center';
			}

			// Determine if this is a measure header or pivot value header
			// Check if the label matches any of our measure names
			const isMeasureHeader = config.measures.includes(group.label);
			const headerType = isMeasureHeader ? 'measure' : 'pivot_value';

			// Only apply measure titles for actual measure headers
			const firstColumn = group.columns[0];
			const headerTitle = headerType === 'measure' ? firstColumn?.title : undefined;
			const headerInfo = headerType === 'measure' ? firstColumn?.info : undefined;
			const headerInfoLink = headerType === 'measure' ? firstColumn?.info_link : undefined;
			const headerInfoLinkTitle =
				headerType === 'measure' ? firstColumn?.info_link_title : undefined;

			row.push({
				label: group.label,
				isDimension: false,
				render_type,
				subtotal_level: null,
				colspan: group.columns.length,
				startIndex: group.startIndex,
				align: headerAlign,
				title: headerTitle,
				info: headerInfo,
				info_link: headerInfoLink,
				info_link_title: headerInfoLinkTitle,
				headerType: headerType
			});
		}

		headerLevels.push(row);
	}

	// Generate column group header level if any columns have column_group defined
	const dimensionCount = sortedColumnMeta.filter((c) => c.columnType === 'dimension').length;
	const columnGroupHeader = generateColumnGroupHeaderLevel(
		columns,
		sortedColumnMeta,
		dimensionCount
	);
	if (columnGroupHeader) {
		// Determine where to insert the column group header based on pivot configuration:
		// - pivot + measures_first=true → column_group at the very top (above pivots and measures)
		// - pivot + measures_first=false → column_group above measures, but below pivot values
		// - no pivot → column_group on top of measures
		if (hasPivots && !config.measuresFirst) {
			// Insert just before the last level (measure level)
			// headerLevels structure: [pivot_level_0, pivot_level_1, ..., measure_level]
			// We want: [pivot_level_0, pivot_level_1, ..., column_group, measure_level]
			headerLevels.splice(headerLevels.length - 1, 0, columnGroupHeader);
		} else {
			// For measures_first=true or no pivots, add at top
			headerLevels.unshift(columnGroupHeader);
		}
	}

	// Apply column filtering and header adjustment
	const filtered = filterAndAdjustHeaders(headerLevels, columns, sortedColumnMeta);

	// Create the base result
	const result: PivotResult = {
		columns: filtered.columns,
		rows,
		dimensions: config.dimensions,
		headerLevels: filtered.headerLevels,
		columnMeta: sortedColumnMeta,
		tableType: 'pivot',
		config: {
			dimensions: config.dimensions,
			pivots: config.pivots,
			measures: config.measures,
			measuresFirst: config.measuresFirst,
			subtotals: config.subtotals,
			showTotalRow: config.showTotalRow,
			showSubtotalRows: config.showSubtotalRows,
			showTotalColumn: config.showTotalColumn,
			showSubtotalColumns: config.showSubtotalColumns,
			totalLabel: config.totalLabel
		}
	};

	// Always add empty rowspan arrays for consistency
	// Actual rowspan calculation will happen later in the Table component after sorting
	// Mutate in-place instead of spreading to avoid O(rows × properties) copy overhead
	for (const row of result.rows) {
		row.__rowspans = [];
		row.__skipCell = [];
	}
	const finalResult = result;

	// Cache the result
	pivotDataCache = { dataRef: new WeakRef(data), configHash, result: finalResult };

	return finalResult;
}

export function sortPivotRows(
	data: PivotResult,
	columnName: string | undefined,
	direction: 'asc' | 'desc' | undefined,
	subtotals: boolean = true,
	subtotalPosition: 'top' | 'bottom' = 'bottom',
	totalPosition: 'top' | 'bottom' = 'bottom'
): PivotResult {
	// Return early if data is undefined or incomplete
	if (!data || !data.dimensions || !data.rows) {
		return data;
	}

	const sortCol = columnName as string;
	const dir = direction === 'asc' ? 1 : -1;
	const dims = data.dimensions || [];
	const isDimensionSort = dims.includes(sortCol);
	const rows = [...data.rows];
	const hasVisibleSubtotalRows = rows.some((row) => row.render_type === 'row_subtotal');

	const compareValues = (
		a: string | number | boolean | Date | number[] | boolean[] | null | undefined,
		b: string | number | boolean | Date | number[] | boolean[] | null | undefined,
		aRow?: PivotRow,
		bRow?: PivotRow,
		columnName?: string // Add parameter for the column being compared
	): number => {
		// Handle grand totals first - position based on totalPosition setting
		const totalOrder = totalPosition === 'top' ? -1 : 1;
		if (aRow?.render_type === 'row_total' && bRow?.render_type !== 'row_total') {
			return totalOrder;
		}
		if (aRow?.render_type !== 'row_total' && bRow?.render_type === 'row_total') {
			return -totalOrder;
		}
		if (aRow?.render_type === 'row_total' && bRow?.render_type === 'row_total') {
			return 0;
		}

		// If no sort column/direction specified, only handle subtotal placement
		if (!sortCol || !direction) {
			// Place subtotals before or after based on subtotalPosition
			const subtotalOrder = subtotalPosition === 'top' ? -1 : 1;
			if (aRow?.render_type === 'row_subtotal' && bRow?.render_type !== 'row_subtotal')
				return subtotalOrder;
			if (aRow?.render_type !== 'row_subtotal' && bRow?.render_type === 'row_subtotal')
				return -subtotalOrder;
			return 0;
		}

		if (a === null && b === null) return 0;
		// For subtotal rows with null values, position based on subtotalPosition
		if (a === null) {
			if (aRow?.render_type === 'row_subtotal') {
				return subtotalPosition === 'top' ? -1 : 1;
			}
			return 1; // Regular nulls after non-nulls
		}
		if (b === null) {
			if (bRow?.render_type === 'row_subtotal') {
				return subtotalPosition === 'top' ? 1 : -1;
			}
			return -1; // Regular nulls after non-nulls
		}

		let result;
		if (isDimensionSort) {
			// Get column type from metadata - use the column being compared, not the sort column
			const actualColumnName = columnName || sortCol;
			const columnType = data.columnMeta.find((col) => col.key === actualColumnName)?.type;
			if (columnType === 'number') {
				// Numeric comparison for number dimensions
				const aVal = typeof a === 'number' ? a : parseFloat(String(a)) || 0;
				const bVal = typeof b === 'number' ? b : parseFloat(String(b)) || 0;
				result = (aVal - bVal) * dir;
			} else {
				// String comparison for non-numeric dimensions
				result = String(a).localeCompare(String(b)) * dir;
			}
		} else {
			// Numeric comparison for measures
			const aVal = typeof a === 'number' ? a : parseFloat(String(a)) || 0;
			const bVal = typeof b === 'number' ? b : parseFloat(String(b)) || 0;
			result = (aVal - bVal) * dir;
		}

		return result;
	};

	// Hierarchical subtotal sorting requires visible subtotal rows to anchor each group.
	// If subtotal rows are hidden (e.g. show_subtotal_rows=false), fall back to flat sorting.
	if (subtotals && hasVisibleSubtotalRows) {
		if (isDimensionSort) {
			// For dimension sorts, maintain hierarchy up to the sorted dimension
			const sortDimIndex = dims.indexOf(sortCol);

			const sortByDimensions = (a: PivotRow, b: PivotRow): number => {
				// Handle grand totals first - position based on totalPosition setting
				const totalOrder = totalPosition === 'top' ? -1 : 1;
				if (a.render_type === 'row_total' && b.render_type !== 'row_total') {
					return totalOrder;
				}
				if (a.render_type !== 'row_total' && b.render_type === 'row_total') {
					return -totalOrder;
				}
				if (a.render_type === 'row_total' && b.render_type === 'row_total') {
					return 0;
				}

				// First, compare all dimensions before the sort column
				for (let i = 0; i < sortDimIndex; i++) {
					const dim = dims[i];
					const aVal = a[dim];
					const bVal = b[dim];

					// Handle subtotal rows with null dimension values
					// A subtotal row has null for dimensions at/beyond its level
					const aIsNull = aVal === null || aVal === undefined;
					const bIsNull = bVal === null || bVal === undefined;

					if (aIsNull && bIsNull) continue; // Both grouped at this level, continue to next dimension
					if (aIsNull) {
						// a is a subtotal with grouped dimension - position based on subtotalPosition
						return subtotalPosition === 'top' ? -1 : 1;
					}
					if (bIsNull) {
						// b is a subtotal with grouped dimension
						return subtotalPosition === 'top' ? 1 : -1;
					}

					// Both have values - use string comparison for hierarchy
					const comp = String(aVal).localeCompare(String(bVal));
					if (comp !== 0) return comp;
				}

				// Then compare the sort column using the type-aware compareValues
				const comp = compareValues(a[sortCol], b[sortCol], a, b, sortCol);
				if (comp !== 0) return comp;

				// If values are equal, maintain hierarchy for remaining dimensions
				for (let i = sortDimIndex + 1; i < dims.length; i++) {
					const dim = dims[i];
					const comp = compareValues(a[dim], b[dim], a, b, dim);
					if (comp !== 0) return comp;
				}

				// If all dimensions are equal, place subtotals based on subtotalPosition
				const subtotalOrder = subtotalPosition === 'top' ? -1 : 1;
				if (a.render_type === 'row_subtotal' && b.render_type !== 'row_subtotal')
					return subtotalOrder;
				if (a.render_type !== 'row_subtotal' && b.render_type === 'row_subtotal')
					return -subtotalOrder;

				return 0;
			};

			rows.sort(sortByDimensions);
		} else {
			// If we have no dimensions but have pivots, use simple sorting
			if (dims.length === 0) {
				rows.sort((a, b) => compareValues(a[sortCol], b[sortCol], a, b, sortCol));
			} else {
				// For measure sorts with subtotals enabled and dimensions present, use hierarchical sorting
				interface Group {
					key: string;
					level: number;
					rows: PivotRow[];
					subtotalRow?: PivotRow;
					subgroups: Map<string, Group>;
					value: number; // Store the sort value for the group
				}

				// Create hierarchical groups using dimKey
				function createGroups(rows: PivotRow[]): Group {
					const root: Group = {
						key: 'root',
						level: -1,
						rows: [],
						subgroups: new Map(),
						value: 0
					};

					// First separate out total rows at the root level
					const totalRows = rows.filter((row) => row.render_type === 'row_total');
					const nonTotalRows = rows.filter((row) => row.render_type !== 'row_total');

					// Store total rows directly in root
					root.rows = totalRows;

					// Process remaining rows into groups
					for (const row of nonTotalRows) {
						let currentGroup = root;
						const isSubtotal = row.render_type === 'row_subtotal';
						const dimParts = row.__dimKey?.split('|~|') || [];

						// Build the group path using dimKey parts
						for (let level = 0; level < dims.length; level++) {
							// Stop at subtotal level
							if (
								isSubtotal &&
								(row.subtotal_level === level || dimParts[level] === GROUPED_DIM_MARKER)
							) {
								currentGroup.subtotalRow = row;
								const value = row[sortCol];
								currentGroup.value =
									typeof value === 'number' ? value : parseFloat(String(value)) || 0;
								break;
							}

							const groupKey = dimParts[level];
							if (!currentGroup.subgroups.has(groupKey)) {
								currentGroup.subgroups.set(groupKey, {
									key: groupKey,
									level,
									rows: [],
									subgroups: new Map(),
									value: 0
								});
							}
							currentGroup = currentGroup.subgroups.get(groupKey)!;
						}

						// Add non-subtotal rows to the deepest group
						if (!isSubtotal) {
							currentGroup.rows.push(row);
							// Update group value based on the sort column
							const value = row[sortCol];
							currentGroup.value =
								typeof value === 'number' ? value : parseFloat(String(value)) || 0;
						}
					}

					return root;
				}

				// Sort groups recursively
				function sortGroups(group: Group): PivotRow[] {
					const sortedRows: PivotRow[] = [];

					// Sort subgroups by their values
					const sortedSubgroups = Array.from(group.subgroups.values()).sort((a, b) => {
						const aValue = a.subtotalRow
							? typeof a.subtotalRow[sortCol] === 'number'
								? a.subtotalRow[sortCol]
								: parseFloat(String(a.subtotalRow[sortCol])) || 0
							: a.value;
						const bValue = b.subtotalRow
							? typeof b.subtotalRow[sortCol] === 'number'
								? b.subtotalRow[sortCol]
								: parseFloat(String(b.subtotalRow[sortCol])) || 0
							: b.value;
						return (aValue - bValue) * dir;
					});

					// Process each subgroup
					for (const subgroup of sortedSubgroups) {
						if (subtotalPosition === 'top') {
							// Add subtotal first when position is 'top'
							if (subgroup.subtotalRow) {
								sortedRows.push(subgroup.subtotalRow);
							}

							// Then add all rows from this group
							if (subgroup.rows.length > 0) {
								// Sort the actual data rows within the group
								subgroup.rows.sort((a, b) => compareValues(a[sortCol], b[sortCol], a, b, sortCol));
								sortedRows.push(...subgroup.rows);
							}

							// Then add rows from deeper levels
							sortedRows.push(...sortGroups(subgroup));
						} else {
							// Default 'bottom' behavior: add rows first, then subtotal
							if (subgroup.rows.length > 0) {
								// Sort the actual data rows within the group
								subgroup.rows.sort((a, b) => compareValues(a[sortCol], b[sortCol], a, b, sortCol));
								sortedRows.push(...subgroup.rows);
							}

							// Then add rows from deeper levels
							sortedRows.push(...sortGroups(subgroup));

							// Finally add this level's subtotal if it exists
							if (subgroup.subtotalRow) {
								sortedRows.push(subgroup.subtotalRow);
							}
						}
					}

					// Only add total rows at the root level - position based on totalPosition
					if (group.level === -1 && group.rows.length > 0) {
						// Sort total rows if there are multiple (shouldn't happen in this case)
						group.rows.sort((a, b) => compareValues(a[sortCol], b[sortCol], a, b, sortCol));
						if (totalPosition === 'top') {
							// Add total rows at the beginning
							sortedRows.unshift(...group.rows);
						} else {
							// Add total rows at the end (default)
							sortedRows.push(...group.rows);
						}
					}

					return sortedRows;
				}

				// Apply the hierarchical sorting
				const groupedData = createGroups(rows);
				rows.splice(0, rows.length, ...sortGroups(groupedData));
			}
		}
	} else {
		// When subtotals are disabled, use simple sorting
		rows.sort((a, b) => compareValues(a[sortCol], b[sortCol], a, b, sortCol));
	}

	return {
		...data,
		rows
	};
}

/**
 * Apply client-side pagination and calculate rowspans on the final dataset
 * This should be called after sorting to ensure rowspans are calculated on the actual displayed rows
 */
export function prepareDataForDisplay(
	data: PivotResult,
	options: {
		serverSidePaginated: boolean;
		needsSubtotals: boolean;
		page: number;
		pageSize: number;
		applyClientSidePagination: boolean;
		totalPosition?: 'top' | 'bottom';
	}
): PivotResult & { __clientPaginationCount?: number } {
	const {
		serverSidePaginated,
		needsSubtotals,
		page,
		pageSize,
		applyClientSidePagination,
		totalPosition = 'bottom'
	} = options;

	// Skip rowspan logic for simple and selected_columns tables
	const shouldApplyRowspans = data.tableType === 'pivot' && needsSubtotals && !serverSidePaginated;

	// Apply client-side pagination if needed
	if (applyClientSidePagination && !serverSidePaginated) {
		// Separate paginatable rows (data + needsSubtotals) from grand totals
		const paginatableRows = data.rows.filter(
			(row) =>
				row.render_type === 'cell_data' ||
				row.render_type === undefined ||
				row.render_type === 'row_subtotal'
		);
		const grandTotalRows = data.rows.filter((row) => row.render_type === 'row_total');

		// Calculate which rows to show for this page
		const startIndex = page * pageSize;
		const endIndex = startIndex + pageSize;
		const paginatedRows = paginatableRows.slice(startIndex, endIndex);

		// Position grand totals based on totalPosition setting
		const combinedRows =
			totalPosition === 'top'
				? [...grandTotalRows, ...paginatedRows]
				: [...paginatedRows, ...grandTotalRows];

		const paginatedResult = {
			...data,
			rows: combinedRows,
			__clientPaginationCount: paginatableRows.length
		};

		// Calculate rowspans on the paginated dataset only for pivot tables
		if (shouldApplyRowspans) {
			return addRowspanInfo(paginatedResult);
		}

		return paginatedResult;
	}

	// For non-paginated data, calculate rowspans on the full dataset only for pivot tables
	if (shouldApplyRowspans) {
		return addRowspanInfo(data);
	}

	return data;
}

export interface RowWithSpans extends PivotRow {
	__rowspans?: number[]; // How many rows to span for each dimension
	__skipCell?: boolean[]; // Whether this row should skip rendering each dimension
}

interface GroupTracker {
	dimKey: string;
	startIndex: number;
	value: string | number | boolean | Date | number[] | boolean[] | null | undefined;
}

export function addRowspanInfo(pivotResult: PivotResult): PivotResult {
	const { rows, dimensions } = pivotResult;
	const processedRows: RowWithSpans[] = [];

	// Track current group for each dimension level
	const currentGroups: Array<GroupTracker | null> = new Array(dimensions.length).fill(null);

	// Helper function to safely convert any value to string
	const safeToString = (
		val: string | number | boolean | Date | number[] | boolean[] | null | undefined
	): string => {
		if (val === undefined || val === null) return '';
		if (Array.isArray(val)) return JSON.stringify(val);
		if (val instanceof Date) return val.toISOString();
		return String(val);
	};

	// Process each row
	rows.forEach((row, rowIndex) => {
		const processedRow: RowWithSpans = {
			...row,
			__rowspans: new Array(dimensions.length).fill(1),
			__skipCell: new Array(dimensions.length).fill(false)
		};

		const dimParts = row.__dimKey?.split('|~|') || [];
		const isTotal = row.render_type === 'row_total';
		const isSubtotal = row.render_type === 'row_subtotal';

		// For each dimension level
		dimensions.forEach((_, dimIndex) => {
			const value = dimParts[dimIndex];
			const current = currentGroups[dimIndex];

			// Check if group is ending - match the logic from calculateRowspans
			const valueChanged = !current || safeToString(current.value) !== safeToString(value);
			const shouldEndGroup =
				valueChanged ||
				isTotal ||
				(isSubtotal && row.subtotal_level !== null && row.subtotal_level <= dimIndex + 1);

			if (shouldEndGroup) {
				// Finish previous group if exists
				if (currentGroups[dimIndex]) {
					const span = rowIndex - currentGroups[dimIndex].startIndex;
					if (span > 0) {
						// Set rowspan on first row of group
						const firstRow = processedRows[currentGroups[dimIndex].startIndex];
						firstRow.__rowspans![dimIndex] = span;

						// Mark cells to skip for rest of group
						for (let i = currentGroups[dimIndex].startIndex + 1; i < rowIndex; i++) {
							processedRows[i].__skipCell![dimIndex] = true;
						}
					}
				}

				// Start new group if not a total/subtotal at this level
				if (
					!isTotal &&
					(!isSubtotal || (row.subtotal_level !== null && row.subtotal_level > dimIndex + 1))
				) {
					currentGroups[dimIndex] = {
						dimKey: row.__dimKey || '',
						startIndex: rowIndex,
						value
					};
				} else {
					currentGroups[dimIndex] = null;
				}
			}
		});

		processedRows.push(processedRow);
	});

	// Handle any remaining open groups at the end
	dimensions.forEach((_, dimIndex) => {
		if (currentGroups[dimIndex]) {
			const span = rows.length - currentGroups[dimIndex].startIndex;
			if (span > 0) {
				const firstRow = processedRows[currentGroups[dimIndex].startIndex];
				firstRow.__rowspans![dimIndex] = span;

				for (let i = currentGroups[dimIndex].startIndex + 1; i < rows.length; i++) {
					processedRows[i].__skipCell![dimIndex] = true;
				}
			}
		}
	});

	return {
		...pivotResult,
		rows: processedRows
	};
}

/**
 * Generate a column group header level based on column_group metadata
 * Returns null if no column groups are defined
 */
function generateColumnGroupHeaderLevel(
	columns: string[],
	columnMeta: ColumnMetaItem[],
	dimensionCount: number
): HeaderCell[] | null {
	// Check if any columns have column_group defined
	const hasAnyColumnGroup = columnMeta.some((col) => col.column_group);
	if (!hasAnyColumnGroup) {
		return null;
	}

	const headerRow: HeaderCell[] = [];
	let currentIndex = 0;
	let i = 0;

	while (i < columns.length) {
		const col = columns[i];
		const meta = columnMeta.find((m) => m.key === col);
		const columnGroup = meta?.column_group;
		const isDimension = i < dimensionCount;

		if (columnGroup) {
			// Find all consecutive columns with the same column_group
			let colspan = 1;
			let j = i + 1;
			while (j < columns.length) {
				const nextCol = columns[j];
				const nextMeta = columnMeta.find((m) => m.key === nextCol);
				if (nextMeta?.column_group === columnGroup) {
					colspan++;
					j++;
				} else {
					break;
				}
			}

			headerRow.push({
				label: columnGroup,
				isDimension: false,
				startIndex: currentIndex,
				colspan: colspan,
				render_type: 'cell_data',
				align: 'center',
				headerType: 'column_group'
			});

			currentIndex += colspan;
			i = j;
		} else {
			// No column group - add empty header cell
			headerRow.push({
				label: '',
				isDimension: isDimension,
				startIndex: currentIndex,
				colspan: 1,
				render_type: 'cell_data',
				align: isDimension ? 'left' : 'center',
				headerType: isDimension ? 'dimension' : 'column_group'
			});
			currentIndex++;
			i++;
		}
	}

	return headerRow;
}

/**
 * Filter columns and adjust header structure based on hide flags
 */
function filterAndAdjustHeaders(
	originalHeaders: HeaderCell[][],
	originalColumns: string[],
	columnMeta: ColumnMetaItem[]
): {
	headerLevels: HeaderCell[][];
	columns: string[];
	visibleColumnIndices: Set<number>;
} {
	if (originalHeaders.length === 0) {
		return {
			headerLevels: [],
			columns: originalColumns,
			visibleColumnIndices: new Set(originalColumns.map((_, i) => i))
		};
	}

	// Determine which columns should be visible based on hide flags in columnMeta
	const visibleColumnIndices = new Set<number>();
	const columnMetaByKey = new Map(columnMeta.map((meta) => [meta.key, meta]));

	for (let colIndex = 0; colIndex < originalColumns.length; colIndex++) {
		const columnKey = originalColumns[colIndex];
		const columnMetaItem = columnMetaByKey.get(columnKey);

		// Column is visible if no metadata found or column is not marked as hidden
		if (!columnMetaItem || !columnMetaItem.hide) {
			visibleColumnIndices.add(colIndex);
		}
	}

	// Filter columns array to only include visible columns
	const visibleColumns = originalColumns.filter((_, index) => visibleColumnIndices.has(index));

	// Rebuild header levels with adjusted colspan and startIndex
	const adjustedHeaderLevels = originalHeaders.map((level) => {
		const adjustedLevel: HeaderCell[] = [];
		let adjustedStartIndex = 0;

		for (const cell of level) {
			// Calculate how many of this cell's columns are actually visible
			const cellColumns = [];
			for (let i = 0; i < (cell.colspan || 1); i++) {
				const colIndex = cell.startIndex + i;
				if (colIndex < originalColumns.length) {
					cellColumns.push(colIndex);
				}
			}

			const visibleCellColumns = cellColumns.filter((colIndex) =>
				visibleColumnIndices.has(colIndex)
			);

			// Only include this header cell if it has visible columns
			if (visibleCellColumns.length > 0) {
				adjustedLevel.push({
					...cell,
					startIndex: adjustedStartIndex,
					colspan: visibleCellColumns.length
				});
				adjustedStartIndex += visibleCellColumns.length;
			}
		}

		// Merge adjacent cells with the same column_group label.
		// This can happen when a hidden column originally separated two groups
		// with the same name (e.g., a hidden __link_ column between dimension and
		// measure columns that share a column_group).
		const mergedLevel: HeaderCell[] = [];
		for (const cell of adjustedLevel) {
			const prev = mergedLevel[mergedLevel.length - 1];
			if (
				prev &&
				cell.headerType === 'column_group' &&
				prev.headerType === 'column_group' &&
				cell.label &&
				cell.label === prev.label
			) {
				prev.colspan = (prev.colspan ?? 1) + (cell.colspan ?? 1);
			} else {
				mergedLevel.push(cell);
			}
		}

		return mergedLevel;
	});

	return {
		headerLevels: adjustedHeaderLevels,
		columns: visibleColumns,
		visibleColumnIndices
	};
}

// Get comparison effective days following the priority rules (now reusing shared helper)
function getComparisonEffectiveDays(comparison: Comparison): number | null {
	if (comparison.compare_vs === 'prior year') {
		return getEffectiveDays('year', 1);
	} else if (comparison.dateGrain) {
		// For dateGrain, we don't have period count context, so assume 1
		return getEffectiveDays(comparison.dateGrain, 1);
	} else if (comparison.rangePeriodGrain) {
		// Use period count if available, otherwise default to 1
		const rangePeriodCount = comparison.rangePeriodCount;
		return getEffectiveDays(comparison.rangePeriodGrain, rangePeriodCount);
	}
	return null;
}

// Get effective days for ROW totals/subtotals (uses __ev_grouping_* flags)
function getRowEffectiveDays(
	row: PivotRow,
	config: PivotConfig,
	comparison: Comparison
): number | null {
	let finestDays: number | null = null;

	// Check ALL temporal fields (dimensions + pivots)
	const allTemporalFields = [
		...config.dimensions.map((alias) => ({ alias, type: 'dimension' as const })),
		...config.pivots.map((alias) => ({ alias, type: 'pivot' as const }))
	];

	for (const field of allTemporalFields) {
		const uc = config.unifiedColumns.find((u) => u.columnIdForRendering === field.alias);

		if (!uc || !uc.isTemporalDateGrain) {
			continue;
		}

		// Check if this field is grouped out using __ev_grouping_* indicators
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const isGroupedOut = (row as any)[`__ev_grouping_${field.alias}`] === 1;

		if (isGroupedOut) {
			continue;
		}

		const grain = uc.date_grain as string;

		if (!grain) continue;

		const currentDays = getEffectiveDays(grain, 1); // All field grains are period count 1
		if (currentDays === null) continue;

		if (finestDays === null || currentDays < finestDays) {
			finestDays = currentDays;
		}
	}

	if (finestDays !== null) {
		return finestDays;
	}

	// Fall back to comparison date range period (with period count)
	const rangePeriod = comparison?.rangePeriodGrain;
	const rangePeriodCount = comparison?.rangePeriodCount || 1;

	if (rangePeriod) {
		const effectiveDays = getEffectiveDays(rangePeriod, rangePeriodCount);
		return effectiveDays;
	}

	return null;
}

// Get effective days for COLUMN totals/subtotals (uses keyParts + row context)
function getColumnEffectiveDays(
	keyParts: (string | number | boolean | Date | null | undefined)[],
	config: PivotConfig,
	comparison: Comparison
): number | null {
	let finestDays: number | null = null;

	// For columns, we need to check:
	// 1. Dimensions - always present at their configured temporal grain (span entire column)
	// 2. Pivots - use keyParts hierarchy (nulls = grouped out)

	// Check dimensions - they maintain their configured grain across the column
	for (const dimAlias of config.dimensions) {
		const uc = config.unifiedColumns.find((u) => u.columnIdForRendering === dimAlias);

		if (!uc || !uc.isTemporalDateGrain) {
			continue;
		}

		// Dimensions are always present at their configured grain for columns
		const grain = uc.date_grain as string;
		if (!grain) continue;

		const currentDays = getEffectiveDays(grain, 1);
		if (currentDays === null) continue;

		if (finestDays === null || currentDays < finestDays) {
			finestDays = currentDays;
		}
	}

	// Check pivots - determine which are grouped out by checking their positions in keyParts
	// keyParts structure:
	// - measuresFirst=false: [pivot1_value, pivot2_value, ..., measure_name]
	// - measuresFirst=true:  [measure_name, pivot1_value, pivot2_value, ...]

	for (let i = 0; i < config.pivots.length; i++) {
		const pivotAlias = config.pivots[i];
		const uc = config.unifiedColumns.find((u) => u.columnIdForRendering === pivotAlias);

		if (!uc || !uc.isTemporalDateGrain) {
			continue;
		}

		// Calculate the position of this pivot in keyParts based on measuresFirst
		const pivotPosition = config.measuresFirst ? i + 1 : i;

		// Check if we have enough parts and if this pivot is grouped out (null)
		if (pivotPosition >= keyParts.length) {
			continue; // Not enough parts in keyParts
		}

		const pivotValue = keyParts[pivotPosition];
		if (pivotValue === null || pivotValue === undefined) {
			continue; // This pivot is grouped out
		}

		// This pivot is not grouped out, include its temporal grain
		const grain = uc.date_grain as string;
		if (!grain) continue;

		const currentDays = getEffectiveDays(grain, 1);
		if (currentDays === null) continue;

		if (finestDays === null || currentDays < finestDays) {
			finestDays = currentDays;
		}
	}

	if (finestDays !== null) {
		return finestDays;
	}

	// Fall back to comparison date range period (with period count)
	const rangePeriod = comparison?.rangePeriodGrain;
	const rangePeriodCount = comparison?.rangePeriodCount || 1;

	if (rangePeriod) {
		const effectiveDays = getEffectiveDays(rangePeriod, rangePeriodCount);
		return effectiveDays;
	}

	return null;
}

// Shared evaluator — decides hide based on temporal days & comparison
function evaluateHideForComparison(
	availableTemporalDays: number | null,
	comparison: Comparison | undefined
): boolean {
	if (!comparison) return false; // non-comparison measure

	// Target comparisons don't use temporal logic - only respect explicit hide flags
	if (comparison.compare_vs === 'target') {
		return false; // Let explicit hide_row_totals/hide_column_totals handle this
	}

	const cgDays = getComparisonEffectiveDays(comparison);

	// For temporal comparisons: if either side is null the comparison is meaningless – hide
	if (availableTemporalDays === null || cgDays === null) return true;

	return availableTemporalDays > cgDays;
}

// Row-level hide check (row totals / subtotals)
function shouldHideRowTotal(
	row: PivotRow,
	measure: UnifiedColumnDefinition,
	config: PivotConfig
): boolean {
	if (measure.hide_row_totals === true) return true;

	const availableDays = getRowEffectiveDays(row, config, measure.comparison || ({} as Comparison));
	return evaluateHideForComparison(availableDays, measure.comparison);
}

// Column-level hide check (column totals / subtotals)
function shouldHideColumnTotal(
	keyParts: (string | number | boolean | Date | null | undefined)[],
	measure: UnifiedColumnDefinition,
	config: PivotConfig
): boolean {
	if (measure.hide_column_totals === true) return true;

	const availableDays = getColumnEffectiveDays(
		keyParts,
		config,
		measure.comparison || ({} as Comparison)
	);
	return evaluateHideForComparison(availableDays, measure.comparison);
}
