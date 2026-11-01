/**
 * Display decisions shared by the rendered table and its Excel export, so the two
 * can't drift apart.
 */
import formatTitle from '../../formatTitle';
import type { ColumnMetaItem, HeaderCell } from '../../common/pivot-utils';
import type { CellEmphasis } from './table-styles';
import type { ColorStylesResult } from './table-viz';

/** The text a header cell shows. */
export function getHeaderDisplayTitle(
	cell: HeaderCell,
	columnMeta: ColumnMetaItem[],
	columns: string[],
	formatTitles: boolean
): string {
	if (cell.title != null) return cell.title;
	if (!formatTitles || cell.headerType === 'pivot_value' || cell.headerType === 'column_group') {
		return cell.label;
	}
	const meta = columnMeta.find((m) => m.key === columns[cell.startIndex]);
	return formatTitle(
		cell.label,
		meta?.comparison?.dateGrain,
		meta?.comparison?.periodCount ?? 1,
		meta?.comparison?.name
	);
}

/** The per-row format from `fmt_column`, when the measure has one. */
export function getDynamicFormat(
	meta: ColumnMetaItem | undefined,
	row: Record<string, unknown>
): string | undefined {
	if (!meta?.fmt_column || !(meta.fmt_column in row)) return undefined;
	const value = row[meta.fmt_column];
	return value !== null && value !== undefined ? String(value) : undefined;
}

/** The format a column displays with when no per-row format applies: its comparison's, or its own. */
export function getColumnDisplayFormat(meta: ColumnMetaItem | undefined): string | undefined {
	if (meta?.comparison?.compare_vs) {
		const displayType = meta.comparison.display_type ?? 'pct';
		if (displayType === 'pct') return meta.comparison.pct_fmt || 'pct';
		if (displayType === 'compared_value') return meta.fmt;
		return meta.comparison.abs_fmt || meta.fmt || 'num0';
	}
	return meta?.fmt;
}

/** The format a cell is displayed with: per-row format, then comparison format, then the column's. */
export function getCellDisplayFormat(
	meta: ColumnMetaItem | undefined,
	row: Record<string, unknown>
): string | undefined {
	return getDynamicFormat(meta, row) || getColumnDisplayFormat(meta);
}

/** The cell's link target from the column's `link`, before any internal-link rewriting. */
export function getCellHref(
	meta: ColumnMetaItem | undefined,
	row: Record<string, unknown>
): unknown {
	return meta?.link ? (row[`__link_${meta.alias}`] ?? row[meta.link]) : null;
}

/**
 * Borders a color-viz cell draws in its own color, so they read against its shading: a bottom
 * border unless a total or subtotal row follows, and a top border on a total row or (outside
 * collapsible tables) an emphasized subtotal cell.
 */
export function getColorVizBorders(
	styles: ColorStylesResult,
	{
		nextRowIsTotal,
		emphasis,
		collapsible
	}: { nextRowIsTotal: boolean; emphasis: CellEmphasis | null; collapsible: boolean }
): { top?: string; bottom?: string } {
	return {
		bottom: nextRowIsTotal ? undefined : styles.borderBottomColor,
		top:
			emphasis === 'total' || (emphasis === 'subtotal' && !collapsible)
				? styles.topBorderColor
				: undefined
	};
}

/** Whether a cell is shaded by `viz="color"` (a scale or per-row conditional colors). */
export function hasColorViz(
	meta: ColumnMetaItem | undefined,
	row: Record<string, unknown>,
	value: unknown
): boolean {
	if (meta?.viz !== 'color' || value === null || value === undefined) return false;
	const conditionalColors = meta.color_options?.conditional_colors;
	if (!conditionalColors && Number.isNaN(Number(value))) return false;
	if (row.render_type === 'row_total') return false;
	if (row.render_type === 'row_subtotal') {
		return !conditionalColors && meta.viz_include_subtotals !== false;
	}
	return true;
}
