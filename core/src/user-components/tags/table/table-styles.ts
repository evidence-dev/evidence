/**
 * Table Styling Logic
 *
 * This module contains styling logic for the table component,
 * with special handling for collapsible mode.
 *
 * Keeps styling rules centralized and testable.
 */

import { cn } from '../../../shadcn/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface RowStyleConfig {
	rowLines: boolean;
	rowShading: boolean;
	isCollapsibleActive: boolean;
	isCollapsibleSubtotal: boolean;
	isDataRow: boolean;
	hasRowLink: boolean;
	isTotal: boolean;
	totalPosition: 'top' | 'bottom';
}

export interface CellStyleConfig {
	// Row context
	renderType: 'cell_data' | 'row_total' | 'row_subtotal' | undefined;
	subtotalLevel: number;

	// Column context
	tableColumnIndex: number;
	renderedCellIndex: number;
	filteredColumnCount: number;
	numDimensions: number;
	columnRenderType?: 'column_total' | 'column_subtotal';

	// Collapsible context
	collapsible: boolean;
	isCollapsibleActive: boolean;
	rowIndentLevel: number;
	isLastRowBeforeTotal: boolean;

	// Table settings
	rowLines: boolean;
	wrap: boolean;
	cellWrap?: boolean;
	cellAlign: 'left' | 'center' | 'right';

	// Special cases
	hasRowspan: boolean;
	isSparklineColumn: boolean;
	isHiddenLinkColumn: boolean;
}

// ============================================================================
// ROW STYLING
// ============================================================================

/**
 * Get CSS classes for a table row (<tr>).
 *
 * Handles:
 * - Row lines (borders between rows)
 * - Row shading (alternating colors)
 * - Clickable rows (links and collapsible subtotals)
 * - Total row top border
 */
export function getRowClasses(config: RowStyleConfig): string {
	return cn(
		// Row lines - disabled in collapsible mode (handled at cell level instead)
		config.rowLines && !config.isCollapsibleActive
			? 'border-(--theme-table-row-border) border-b'
			: 'border-0',

		// Row shading for data rows
		config.rowShading && config.isDataRow ? 'even:bg-muted/50' : '',

		// Transition for hover effects
		'transition-colors',

		// Clickable row link
		config.hasRowLink ? 'hover:bg-(--theme-table-hover) cursor-pointer' : '',

		// Clickable collapsible subtotal - cursor only, no hover bg (would affect parent dimension columns)
		config.isCollapsibleSubtotal ? 'cursor-pointer' : '',

		// Total row border (only when at bottom)
		config.isTotal && config.totalPosition === 'bottom' ? 'border-t border-foreground/40' : ''
	);
}

// ============================================================================
// CELL STYLING
// ============================================================================

/**
 * Get CSS classes for a table cell (<td>).
 *
 * This is the most complex styling function, handling:
 * - Collapsible mode borders
 * - Row type styling (total, subtotal)
 * - Column type styling (pivot totals/subtotals)
 * - Dimension cell merging
 * - Text wrapping, alignment, padding
 */
export function getCellClasses(config: CellStyleConfig): string {
	const {
		renderType,
		subtotalLevel,
		tableColumnIndex,
		renderedCellIndex,
		filteredColumnCount,
		numDimensions,
		columnRenderType,
		collapsible,
		isCollapsibleActive,
		rowIndentLevel,
		isLastRowBeforeTotal,
		rowLines,
		wrap,
		cellWrap,
		cellAlign,
		hasRowspan,
		isSparklineColumn,
		isHiddenLinkColumn
	} = config;

	return cn(
		// Base cell styles
		'relative align-middle',

		// ==================== COLLAPSIBLE: Cell borders ====================
		// In collapsible mode, borders are at cell level starting from indent
		// Not on total row, not on row before total
		isCollapsibleActive &&
			rowLines &&
			renderType !== 'row_total' &&
			!isLastRowBeforeTotal &&
			tableColumnIndex >= rowIndentLevel
			? 'border-b border-border/30'
			: '',

		// ==================== ROW TYPE STYLING ====================
		getRowTypeClasses(renderType, subtotalLevel, tableColumnIndex, collapsible),

		// ==================== COLUMN TYPE STYLING ====================
		getColumnTypeClasses(renderType, columnRenderType, collapsible),

		// ==================== DIMENSION MERGING ====================
		// Background for rowspan cells (disabled in collapsible mode)
		!collapsible && tableColumnIndex < numDimensions && hasRowspan ? 'bg-background' : '',

		// ==================== TEXT STYLING ====================
		// Wrapping
		(cellWrap !== undefined ? cellWrap : wrap) ? '' : 'whitespace-nowrap',

		// Padding (vertical)
		isSparklineColumn ? 'pb-0.5' : 'py-1',

		// Padding (horizontal)
		tableColumnIndex === 0
			? 'pr-3 pl-1'
			: renderedCellIndex === filteredColumnCount - 1
				? 'pr-3 pl-1.5'
				: 'pl-1.5 pr-3',

		// Alignment
		cellAlign === 'right' ? 'text-right' : cellAlign === 'center' ? 'text-center' : 'text-left',

		// Visibility
		isHiddenLinkColumn ? 'hidden' : ''
	);
}

/**
 * Get classes for row type (total, subtotal, data).
 */
function getRowTypeClasses(
	renderType: 'cell_data' | 'row_total' | 'row_subtotal' | undefined,
	subtotalLevel: number,
	tableColumnIndex: number,
	collapsible: boolean
): string {
	if (renderType === 'row_total') {
		// Grand total row - distinctive background
		return 'bg-(--theme-table-total-bg) font-semibold';
	}

	if (renderType === 'row_subtotal') {
		if (collapsible) {
			// Collapsible mode: only bold the subtotal's own column and beyond
			return tableColumnIndex >= subtotalLevel - 1 ? 'font-semibold' : '';
		} else {
			// Non-collapsible: full styling for columns at/after subtotal level
			return tableColumnIndex >= subtotalLevel - 1
				? 'border-t border-foreground/40 dark:border-foreground/40 bg-(--theme-table-subtotal-bg) font-semibold'
				: '';
		}
	}

	return '';
}

/**
 * Get classes for column type (pivot total, pivot subtotal).
 */
function getColumnTypeClasses(
	renderType: 'cell_data' | 'row_total' | 'row_subtotal' | undefined,
	columnRenderType: 'column_total' | 'column_subtotal' | undefined,
	collapsible: boolean
): string {
	// Column styling applies to:
	// - Data rows always
	// - Subtotal rows only in collapsible mode (since they don't have row background)
	// - Never to grand total (keeps its distinctive styling)
	const shouldApplyColumnStyle =
		renderType === 'cell_data' || (renderType === 'row_subtotal' && collapsible);

	if (!shouldApplyColumnStyle) return '';

	if (columnRenderType === 'column_total') {
		return 'bg-(--theme-table-pivot-bg) font-semibold';
	}

	if (columnRenderType === 'column_subtotal') {
		return 'bg-(--theme-table-pivot-bg) font-semibold dark:border-r-(--theme-table-row-border)';
	}

	return '';
}
