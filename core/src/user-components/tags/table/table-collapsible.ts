/**
 * Collapsible Table Logic
 *
 * This module contains all logic related to the collapsible table feature.
 * When collapsible=true, subtotal rows become expandable/collapsible sections.
 *
 * Key concepts:
 * - Group Key: A string like "H&S|~|Home" that identifies a collapsible section
 * - Subtotal Level: 1-indexed level of a subtotal (level 1 = top-level group)
 * - Parent Subtotal Level: The level of the most recent subtotal above a row
 */

import type { DataPoint } from '../../types';

// Extended row type with table-specific properties
export type CollapsibleRow = DataPoint & {
	render_type?: 'cell_data' | 'row_total' | 'row_subtotal';
	subtotal_level?: number;
	__dimKey?: string;
	__skipCell?: boolean[];
};

/**
 * Configuration for collapsible behavior
 */
export interface CollapsibleConfig {
	enabled: boolean;
	subtotalPosition: 'top' | 'bottom';
	totalPosition: 'top' | 'bottom';
}

// ============================================================================
// GROUP KEY FUNCTIONS
// ============================================================================

/**
 * Get the group key for a subtotal row.
 * The group key identifies which child rows belong to this subtotal.
 *
 * @example
 * Row with __dimKey "H&S|~|Home|~|[[GROUPED]]" → returns "H&S|~|Home"
 */
export function getSubtotalGroupKey(row: CollapsibleRow): string | null {
	if (row.render_type !== 'row_subtotal') return null;
	const dimParts = row.__dimKey?.split('|~|') || [];
	const groupedIndex = dimParts.findIndex((part: string) => part === '[[GROUPED]]');
	if (groupedIndex <= 0) return null;
	return dimParts.slice(0, groupedIndex).join('|~|');
}

/**
 * Initialize collapsed groups from all subtotal rows.
 * When collapsed=true, all groups start collapsed.
 *
 * @param rows All pivot rows (before pagination/filtering)
 * @returns Set of group keys that should start collapsed
 */
export function initializeCollapsedGroups(rows: CollapsibleRow[]): Set<string> {
	const allGroupKeys = new Set<string>();
	for (const row of rows) {
		if (row.render_type === 'row_subtotal' && row.__dimKey) {
			const dimParts = row.__dimKey.split('|~|');
			const groupedIndex = dimParts.indexOf('[[GROUPED]]');
			if (groupedIndex > 0) {
				const groupKey = dimParts.slice(0, groupedIndex).join('|~|');
				allGroupKeys.add(groupKey);
			}
		}
	}
	return allGroupKeys;
}

// ============================================================================
// VISIBILITY FUNCTIONS
// ============================================================================

/**
 * Check if a row should be visible based on collapsed groups.
 *
 * Rules:
 * - Total rows are always visible
 * - Subtotal rows are visible unless a PARENT group is collapsed
 * - Detail rows are visible unless ANY ancestor group is collapsed
 */
export function isRowVisible(row: CollapsibleRow, collapsedGroups: Set<string>): boolean {
	if (collapsedGroups.size === 0) return true;
	if (row.render_type === 'row_total') return true;

	const dimParts = row.__dimKey?.split('|~|') || [];

	if (row.render_type === 'row_subtotal') {
		// For subtotal rows, check if any PARENT group is collapsed
		const groupedIndex = dimParts.findIndex((part: string) => part === '[[GROUPED]]');
		if (groupedIndex <= 0) return true;

		// Check parent levels (everything before this subtotal's level)
		for (let i = 1; i < groupedIndex; i++) {
			const parentKey = dimParts.slice(0, i).join('|~|');
			if (collapsedGroups.has(parentKey)) {
				return false;
			}
		}
		return true;
	}

	// For data rows, check if any ancestor group is collapsed
	for (let i = 1; i <= dimParts.length; i++) {
		const parentKey = dimParts.slice(0, i).join('|~|');
		if (collapsedGroups.has(parentKey)) {
			return false;
		}
	}
	return true;
}

/**
 * Check if a dimension cell should be empty (content hidden) in collapsible mode.
 *
 * Rules:
 * - Grouped-out cells are always empty
 * - Subtotal rows: hide grandparent+ columns (show only immediate parent + own)
 * - Detail rows: hide columns before parent subtotal's level
 */
export function isEmptyDimCell(
	row: CollapsibleRow,
	colIdx: number,
	numDims: number,
	parentSubtotalLevel: number,
	columns: string[]
): boolean {
	if (colIdx >= numDims) return false;

	const col = columns[colIdx];
	const dimParts = row.__dimKey?.split('|~|') || [];
	const isGroupedOut = row[col] === null && dimParts[colIdx] === '[[GROUPED]]';
	if (isGroupedOut) return true;

	// For subtotal rows: only show immediate parent + own column
	if (row.render_type === 'row_subtotal') {
		const subtotalLevel = row.subtotal_level ?? 1;
		// Hide columns more than 1 level above the subtotal
		if (colIdx < subtotalLevel - 2) return true;
		return false;
	}

	// For detail rows: hide dimension columns before the parent subtotal's level
	if (row.render_type === 'cell_data') {
		if (colIdx < parentSubtotalLevel - 1) return true;
	}

	return false;
}

// ============================================================================
// INDENTATION FUNCTIONS
// ============================================================================

/**
 * Calculate the indent amount (in rem) for a cell in collapsible mode.
 *
 * Rules:
 * - Only dimension columns are indented
 * - Fixed indent amount for visual consistency across table sizes
 * - Detail rows: indent parent dimension columns (except last dim column)
 * - Subtotal rows: indent parent dimension columns (not the chevron column)
 */
export function getIndentAmount(
	row: CollapsibleRow,
	tableColumnIndex: number,
	numDimensions: number
): number {
	const INDENT_AMOUNT = 2; // Fixed indent for all nested content

	const isDimensionColumn = tableColumnIndex < numDimensions;
	if (!isDimensionColumn) return 0;

	const rowSubtotalLevel = row.subtotal_level ?? 0;

	// Indent detail rows - but NOT the last dimension column (the item itself)
	if (row.render_type === 'cell_data') {
		if (tableColumnIndex === numDimensions - 1) return 0;
		return INDENT_AMOUNT;
	}

	// Indent parent dimension values on subtotal rows (not the chevron column)
	if (row.render_type === 'row_subtotal' && tableColumnIndex < rowSubtotalLevel - 1) {
		return INDENT_AMOUNT;
	}

	return 0;
}

// ============================================================================
// ROW METADATA (for pre-computation)
// ============================================================================

export interface RowMetadata {
	parentSubtotalLevel: number;
	rowIndentLevel: number;
	isLastRowBeforeTotal: boolean;
}

/**
 * Compute metadata for each visible row.
 * This avoids recalculating values inside the render loop.
 */
export function computeRowMetadata(
	visibleRows: CollapsibleRow[],
	numDims: number,
	columns: string[]
): RowMetadata[] {
	return visibleRows.map((row, rowIndex) => {
		// Find parent subtotal level
		let parentSubtotalLevel = 1;
		for (let i = rowIndex - 1; i >= 0; i--) {
			const prevRow = visibleRows[i];
			if (prevRow.render_type === 'row_subtotal') {
				parentSubtotalLevel = prevRow.subtotal_level ?? 1;
				break;
			}
		}

		// Calculate first non-empty dimension column
		let rowIndentLevel = 0;
		for (let i = 0; i < numDims; i++) {
			if (!isEmptyDimCell(row, i, numDims, parentSubtotalLevel, columns)) {
				rowIndentLevel = i;
				break;
			}
		}

		// Check if next row is total
		const nextRow = visibleRows[rowIndex + 1];
		const isLastRowBeforeTotal = nextRow?.render_type === 'row_total';

		return {
			parentSubtotalLevel,
			rowIndentLevel,
			isLastRowBeforeTotal
		};
	});
}
