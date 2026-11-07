/**
 * Excel export for the table component. The sheet is laid out the way the table renders:
 * multi-level headers, total/subtotal rows, pivot total columns, row lines and shading,
 * bars, color scales, deltas, links, sparklines, frozen columns and collapsible groups —
 * while staying a working spreadsheet (native numbers and dates, no merged cells).
 */
import type { CellStyle, CellValue, ColumnDef, ConditionalRule, RowDef, Sparkline } from 'hucre';
import { toast } from 'svelte-sonner';
import { logger } from '../../../shims/logger';
import { downloadExcelSheet, getExcelExportNames } from '../../../shims/data-export';
import { toExcelCell, type ExcelCellContent } from '../../../shims/excel/cell-value';
import {
	blendColors,
	resolveExcelPalette,
	toExcelRgb,
	type ExcelPalette
} from '../../../shims/excel/palette';
import {
	getExcelExportFont,
	maxDigitWidthPx,
	measureTextPx,
	pxToColumnWidth,
	type ExcelFont
} from '../../../shims/excel/font';
import {
	CELL_PADDING_PX,
	ColumnFitter,
	columnLetter,
	columnRanges,
	countWrappedLines,
	fontColor,
	MAX_COLUMN_WIDTH,
	mostCommon,
	solidFill,
	StyleCache,
	tableRowHeight,
	thinBorder,
	titleRows,
	wrappedRowHeight,
	type ExcelSheet,
	type SheetCell
} from '../../../shims/excel/workbook';
import { isSafeExternalUrl } from '../../common/transform-internal-link';
import type { ColorScaleResult } from '../../common/color-scale-utils';
import {
	addRowspanInfo,
	GROUPED_DIM_MARKER,
	type ColumnMetaItem,
	type PivotResult,
	type PivotRow
} from '../../common/pivot-utils';
import type { DataPoint } from '../../types';
import { getDeltaStatus } from '../delta/delta-status';
import {
	buildColorVizScale,
	calculateColorStyles,
	calculateColorStylesFromHex,
	calculateFormatRanges,
	calculateVizRanges
} from './table-viz';
import {
	computeRowMetadata,
	getIndentAmount,
	getSubtotalGroupKey,
	initializeCollapsedGroups,
	isEmptyDimCell,
	isRowVisible,
	type CollapsibleRow
} from './table-collapsible';
import {
	getCellDisplayFormat,
	getCellHref,
	getColorVizBorders,
	getHeaderDisplayTitle,
	hasColorViz
} from './table-cell-display';
import { getCellEmphasis, type CellEmphasis } from './table-styles';
import { parseSparklineData } from './sparkline-data';

/**
 * How the table groups rows by its dimensions, when it does:
 * - `merged`: subtotaled tables show a repeated dimension value once per group (the report
 *   merges it into one cell); `repeatValues` turns that off for every dimension that doesn't
 *   set its own `repeat_values`.
 * - `collapsible`: groups expand and collapse; they become Excel outline groups in the state
 *   the report shows.
 */
export type TableGrouping =
	| { kind: 'merged'; repeatValues: boolean }
	| { kind: 'collapsible'; collapsedGroups: ReadonlySet<string> };

export interface TableExcelOptions {
	/** The workbook font, which column widths and row heights are measured in. */
	font: ExcelFont;
	title?: string;
	subtitle?: string;
	/**
	 * Query rows before pivoting. Needed for `scale_mode="shared"` bars and color scales, which
	 * take their range from them; without them those columns get no bars or shading.
	 */
	rawRows?: DataPoint[];
	palette?: ExcelPalette;
	rowShading?: boolean;
	/** Lines between rows. Collapsible tables never draw them, as in the report. */
	rowLines?: boolean;
	wrap?: boolean;
	wrapTitles?: boolean;
	formatTitles?: boolean;
	freezeColumns?: number;
	grouping?: TableGrouping;
	/** Columns the report doesn't show, such as a row-link column. */
	hiddenColumns?: ReadonlySet<string>;
	/** The page's `down_is_good`, for deltas that don't set their own. */
	downIsGood?: boolean;
	firstDayOfWeek?: 'sunday' | 'monday';
	/** Turns a cell's link into an absolute URL; return undefined to leave the cell unlinked. */
	resolveLink?: (href: string) => string | undefined;
}

/** A table column as exported, with what's the same for every one of its cells worked out once. */
interface ExportColumn {
	key: string;
	/** Index into `PivotResult.columns`, which header cells and row arrays use. */
	tableIndex: number;
	meta: ColumnMetaItem | undefined;
	/** A dimension whose repeated values show once, on the first row of their group. */
	mergesRepeats: boolean;
	wraps: boolean;
	formatRange?: { min: number; max: number };
	vizRange?: { min: number; max: number };
	/** The color-viz scale; null for columns without one. */
	colorScale: ColorScaleResult | null;
}

type ExportRow = PivotRow & { __hideCell?: Record<string, boolean> };

/**
 * Indent steps for nested collapsible rows. An Excel indent step is three spaces (about 10px in
 * Calibri 11), so three steps approximate the report's 2rem (32px).
 */
const COLLAPSIBLE_INDENT = 3;
const INDENT_STEP = '   ';
/** Header text longer than this wraps (when titles may wrap) rather than widening its column. */
const HEADER_WRAP_PX = 200;
/**
 * About the width a table gets on a default (article-width) page: 64rem, less the page's and
 * the card's padding. A table that fits in it keeps its titles on one line; a wider one wraps
 * them, as the report's table does when it runs out of room.
 */
const TABLE_LAYOUT_WIDTH_PX = 960;
/** Wrapping columns stop growing at this width and wrap instead. */
const WRAP_COLUMN_MAX_WIDTH = 50;
/** Room for a sparkline: the report draws them 50px wide. */
const SPARKLINE_COLUMN_WIDTH = 12;
/** Excel supports seven outline levels. */
const MAX_OUTLINE_LEVEL = 7;
/** Opacity of a report table bar; negative bars in the default red are a little lighter. */
const BAR_OPACITY = 0.4;
/** Default negative bars are `bg-(--theme-negative)/85`: this scales `BAR_OPACITY` for them. */
const DEFAULT_NEGATIVE_BAR_OPACITY = 0.85;
/** Excel's limit on hyperlinks in one worksheet; past it, Excel repairs the file and drops them. */
const MAX_HYPERLINKS = 65530;

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
	const list = map.get(key);
	if (list) list.push(value);
	else map.set(key, [value]);
}

function hasTopRule(emphasis: CellEmphasis | null): boolean {
	return emphasis === 'total' || emphasis === 'subtotal';
}

let htmlParser: DOMParser | undefined;

const HTML_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: '\u00a0'
};

function htmlToText(html: string): string {
	if (!/[<&]/.test(html)) return html;
	if (typeof DOMParser !== 'undefined') {
		htmlParser ??= new DOMParser();
		return htmlParser.parseFromString(html, 'text/html').body.textContent ?? '';
	}
	// Outside a browser (SSR, tests): strip tags and decode the common entities.
	return html
		.replace(/<[^>]*>/g, '')
		.replace(/&(#\d+|[a-z]+);/gi, (entity, name: string) =>
			name.startsWith('#')
				? String.fromCodePoint(Number(name.slice(1)))
				: (HTML_ENTITIES[name.toLowerCase()] ?? entity)
		);
}

function outlineLevel(row: PivotRow, dimParts: string[], groupKeys: ReadonlySet<string>): number {
	if (row.render_type === 'row_total') return 0;
	const groupedIndex = dimParts.indexOf(GROUPED_DIM_MARKER);
	// A subtotal row sits inside its parents' groups; a data row inside every group above it.
	const depth =
		row.render_type === 'row_subtotal' && groupedIndex >= 0
			? Math.max(groupedIndex - 1, 0)
			: dimParts.length;
	let level = 0;
	let key = '';
	for (let i = 0; i < depth; i++) {
		key = i === 0 ? dimParts[0] : `${key}|~|${dimParts[i]}`;
		if (groupKeys.has(key)) level++;
	}
	return Math.min(level, MAX_OUTLINE_LEVEL);
}

function deltaColor(
	value: unknown,
	meta: ColumnMetaItem,
	palette: ExcelPalette,
	pageDownIsGood: boolean
): string {
	const status = getDeltaStatus(value, meta.delta_options?.neutral_range ?? [0, 0]);
	if (status === 'neutral') return palette.neutral;
	const downIsGood = meta.delta_options?.down_is_good ?? pageDownIsGood;
	return (status === 'positive') !== downIsGood ? palette.positive : palette.negative;
}

/** A translucent report bar, as the opaque `RRGGBB` color it shows over the sheet. */
function barColor(palette: ExcelPalette, color: string, opacity: number): string | undefined {
	return toExcelRgb(blendColors(palette.background, color, opacity));
}

function dataBarRule(
	column: number,
	rows: number[],
	{ meta, vizRange }: ExportColumn,
	palette: ExcelPalette,
	priority: number
): ConditionalRule | undefined {
	if (!meta || !vizRange) return undefined;
	const options = meta.bar_options;
	const fitToData = options?.fit_to_data ?? false;
	const min = fitToData ? vizRange.min : Math.min(vizRange.min, 0);
	const max = fitToData ? vizRange.max : Math.max(vizRange.max, 0);
	if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return undefined;

	const color = barColor(palette, options?.bar_color ?? palette.bar, BAR_OPACITY);
	const customNegative = options?.bar_color_negative || options?.bar_color;
	const negativeFillColor = customNegative
		? barColor(palette, customNegative, BAR_OPACITY)
		: barColor(palette, palette.negative, BAR_OPACITY * DEFAULT_NEGATIVE_BAR_OPACITY);
	if (!color) return undefined;

	return {
		type: 'dataBar',
		priority,
		range: columnRanges(column, rows),
		dataBar: {
			// Pinned to the report's scale, which for scale_mode="shared" spans every pivot column.
			cfvo: [
				{ type: 'num', value: String(min) },
				{ type: 'num', value: String(max) }
			],
			color,
			negativeFillColor,
			gradient: false,
			minLength: 0,
			maxLength: 100,
			// fit_to_data bars all grow from the left edge; otherwise they grow from zero.
			axisPosition: fitToData ? 'none' : 'automatic',
			axisColor: toExcelRgb(palette.rowBorder),
			...(options?.hide_labels ? { showValue: false } : {})
		}
	};
}

/** A non-empty cell's value, as the table displays it. */
function cellContent(
	{ meta, formatRange }: ExportColumn,
	row: ExportRow,
	value: unknown,
	firstDayOfWeek: TableExcelOptions['firstDayOfWeek']
): ExcelCellContent {
	// Same precedence as the table template: delta, then HTML, then a static link label.
	const fmt = getCellDisplayFormat(meta, row);
	// Deltas scale each value on its own, as the delta component does.
	if (meta?.viz === 'delta') return toExcelCell(value, { fmt });
	if (meta?.html && typeof value === 'string' && row.render_type === 'cell_data') {
		const text = htmlToText(value);
		return { value: text, text };
	}
	if (meta?.link_label) return { value: meta.link_label, text: meta.link_label };
	return toExcelCell(value, { fmt, columnType: meta?.type, range: formatRange, firstDayOfWeek });
}

interface StyleParts {
	bold: boolean;
	textColor?: string;
	align: 'left' | 'center' | 'right';
	wraps: boolean;
	indent: number;
	fill?: string;
	top?: string;
	bottom?: string;
	numFmt?: string;
}

function buildCellStyle({
	bold,
	textColor,
	align,
	wraps,
	indent,
	fill,
	top,
	bottom,
	numFmt
}: StyleParts): CellStyle {
	return {
		font: { ...(bold ? { bold: true } : {}), ...fontColor(textColor) },
		alignment: {
			horizontal: align,
			vertical: 'center',
			...(wraps ? { wrapText: true } : {}),
			...(indent ? { indent } : {})
		},
		...(fill ? { fill: solidFill(fill) } : {}),
		...(top || bottom
			? {
					border: {
						...(top ? { top: thinBorder(top) } : {}),
						...(bottom ? { bottom: thinBorder(bottom) } : {})
					}
				}
			: {}),
		...(numFmt ? { numFmt } : {})
	};
}

interface HeaderLayout {
	rows: SheetCell[][];
	/** Labels centered across several columns, which must be at least as wide as the label. */
	spans: { first: number; last: number; px: number }[];
	/** Bottom-row titles, which share in sizing their columns (see `layoutColumnWidths`). */
	titles: HeaderTitle[];
}

interface HeaderTitle {
	column: number;
	text: string;
	/** The title on one line, in bold. */
	px: number;
	/** The title's longest word, in bold: the narrowest it can wrap to. */
	longestWordPx: number;
}

/**
 * The table's header rows. Column groups and pivot values use Center Across Selection rather
 * than merged cells, so the columns under them can still be selected, sorted and filtered.
 */
function buildHeader(
	pivotData: PivotResult,
	columns: ExportColumn[],
	{
		palette,
		font,
		wrapTitles,
		formatTitles
	}: Required<Pick<TableExcelOptions, 'palette' | 'font' | 'wrapTitles' | 'formatTitles'>>
): HeaderLayout {
	const excelColumnByTableIndex = new Map(columns.map((column, i) => [column.tableIndex, i]));
	const layout: HeaderLayout = { rows: [], spans: [], titles: [] };
	const levels = pivotData.headerLevels;

	levels.forEach((level, levelIndex) => {
		const isBottomLevel = levelIndex === levels.length - 1;
		const headerRow: SheetCell[] = columns.map(() => ({}));
		for (const cell of level) {
			const covered: number[] = [];
			for (let i = cell.startIndex; i < cell.startIndex + (cell.colspan ?? 1); i++) {
				const excelColumn = excelColumnByTableIndex.get(i);
				if (excelColumn !== undefined) covered.push(excelColumn);
			}
			if (covered.length === 0) continue;

			const title = getHeaderDisplayTitle(
				cell,
				pivotData.columnMeta,
				pivotData.columns,
				formatTitles
			);
			const isTotalColumn =
				cell.render_type === 'column_total' || cell.render_type === 'column_subtotal';
			const fill = isTotalColumn ? solidFill(palette.pivotFill) : undefined;

			if (isBottomLevel) {
				const [column] = covered;
				layout.titles.push({
					column,
					text: title,
					px: measureTextPx(title, font, true),
					longestWordPx: Math.max(
						0,
						...title.split(/\s+/).map((word) => measureTextPx(word, font, true))
					)
				});
				headerRow[column] = {
					value: title,
					style: {
						font: { bold: true },
						// Titles sit on the rule under them, as on screen, when others wrap taller.
						alignment: {
							horizontal: cell.align,
							vertical: 'bottom',
							...(wrapTitles ? { wrapText: true } : {})
						},
						border: { bottom: thinBorder(palette.emphasisBorder) },
						...(fill ? { fill } : {})
					}
				};
			} else if (title) {
				layout.spans.push({
					first: covered[0],
					last: covered[covered.length - 1],
					px: measureTextPx(title, font, true)
				});
				// The accounting underline spans the label's columns like the report's rule under it.
				const style: CellStyle = {
					font: { bold: true, underline: 'singleAccounting' },
					alignment: { horizontal: 'centerContinuous', vertical: 'center' },
					...(fill ? { fill } : {})
				};
				covered.forEach((column, i) => {
					headerRow[column] = { ...(i === 0 ? { value: title } : {}), style };
				});
			} else if (fill) {
				for (const column of covered) headerRow[column] = { style: { fill } };
			}
		}
		layout.rows.push(headerRow);
	});
	return layout;
}

/**
 * Column widths with the bottom header titles laid out over the data, the way the report lays
 * out its table, which fills the page's width. Each column ranges from its narrowest (its data,
 * or the title's longest word when titles wrap) to its widest (its data, or the title on one
 * line, up to `HEADER_WRAP_PX`). A table that fits in `TABLE_LAYOUT_WIDTH_PX` at its widest gets
 * those widths, one that doesn't fit at its narrowest gets those, and in between each column
 * gets its narrowest plus a share of the remaining room in proportion to how much wider it
 * could be.
 */
function layoutColumnWidths(
	dataWidths: number[],
	maxWidths: number[],
	titles: HeaderTitle[],
	{ font, wrapTitles }: { font: ExcelFont; wrapTitles: boolean }
): number[] {
	const narrowest = [...dataWidths];
	const widest = [...dataWidths];
	for (const { column, px, longestWordPx } of titles) {
		const width = (contentPx: number) =>
			Math.min(pxToColumnWidth(contentPx + CELL_PADDING_PX, font), maxWidths[column]);
		const oneLinePx = wrapTitles ? Math.max(longestWordPx, Math.min(px, HEADER_WRAP_PX)) : px;
		widest[column] = Math.max(widest[column], width(oneLinePx));
		narrowest[column] = Math.max(narrowest[column], width(wrapTitles ? longestWordPx : px));
	}

	const sum = (widths: number[]) => widths.reduce((total, width) => total + width, 0);
	const available = TABLE_LAYOUT_WIDTH_PX / maxDigitWidthPx(font);
	const [totalNarrowest, totalWidest] = [sum(narrowest), sum(widest)];
	if (totalWidest <= available) return widest;
	if (totalNarrowest >= available) return narrowest;
	const share = (available - totalNarrowest) / (totalWidest - totalNarrowest);
	return narrowest.map(
		(width, column) => Math.ceil((width + (widest[column] - width) * share) * 256) / 256
	);
}

/** Builds the worksheet for a table, from the same sorted pivot data the table renders. */
export function buildTableExcelSheet(
	pivotData: PivotResult,
	options: TableExcelOptions
): ExcelSheet {
	const {
		palette = resolveExcelPalette(),
		font,
		rowShading = false,
		rowLines = true,
		wrap = false,
		wrapTitles = true,
		formatTitles = true,
		freezeColumns = 0,
		grouping,
		hiddenColumns,
		downIsGood = false,
		firstDayOfWeek,
		resolveLink = (href: string) => href
	} = options;
	const merged = grouping?.kind === 'merged' ? grouping : undefined;
	const collapsible = grouping?.kind === 'collapsible' ? grouping : undefined;

	const rows = (
		merged && pivotData.tableType === 'pivot' ? addRowspanInfo(pivotData).rows : pivotData.rows
	) as ExportRow[];
	const collapsibleRows = rows as CollapsibleRow[];
	const numDimensions = pivotData.config.dimensions?.length ?? 0;

	const formatRanges = calculateFormatRanges({
		columnMeta: pivotData.columnMeta,
		sortedRows: rows
	});
	const vizRanges = calculateVizRanges({
		columnMeta: pivotData.columnMeta,
		sortedRows: rows,
		rawRows: options.rawRows ?? []
	});
	const metaByKey = new Map(pivotData.columnMeta.map((meta) => [meta.key, meta]));
	const columns: ExportColumn[] = pivotData.columns
		.map((key, tableIndex) => ({ key, tableIndex, meta: metaByKey.get(key) }))
		.filter(({ key, meta }) => !hiddenColumns?.has(key) && !meta?.hide)
		.map(({ key, tableIndex, meta }) => {
			const vizRange = vizRanges.get(key);
			return {
				key,
				tableIndex,
				meta,
				mergesRepeats:
					merged !== undefined &&
					tableIndex < numDimensions &&
					!(meta?.repeat_values ?? merged.repeatValues),
				wraps: meta?.wrap ?? wrap,
				formatRange: formatRanges.get(key),
				vizRange,
				colorScale:
					meta?.viz === 'color' && vizRange
						? buildColorVizScale(meta, vizRange, palette.colorScale)
						: null
			};
		});

	const fitter = new ColumnFitter(font);
	const header = buildHeader(pivotData, columns, {
		palette,
		font,
		wrapTitles,
		formatTitles
	});
	const sheetRows: (SheetCell | CellValue)[][] = [
		...titleRows(options.title, options.subtitle, { palette, font }),
		...header.rows
	];
	const bodyStart = sheetRows.length;
	const headerStart = bodyStart - header.rows.length;

	const rowDefs = new Map<number, RowDef>();
	const styles = new StyleCache();
	const cellStyle = (parts: StyleParts): CellStyle =>
		styles.get(
			[
				parts.bold,
				parts.textColor,
				parts.align,
				parts.wraps,
				parts.indent,
				parts.fill,
				parts.top,
				parts.bottom,
				parts.numFmt
			].join('|'),
			() => buildCellStyle(parts)
		);
	const numFmtCounts = columns.map(() => new Map<string, number>());
	const barRows = new Map<number, number[]>();
	const sparklineSeries = new Map<number, { row: number; values: number[] }[]>();
	const wrappedCells = new Map<number, { column: number; text: string; bold?: boolean }[]>();
	// Titles wrap to their column's final width, which the header row grows to fit.
	if (wrapTitles) {
		for (const { column, text } of header.titles) {
			push(wrappedCells, bodyStart - 1, { column, text, bold: true });
		}
	}
	let hyperlinkCount = 0;
	// Where a merged dimension cell ends, so row lines don't cut through it.
	const spanEnds = new Map<number, number>();

	const collapsibleMeta = collapsible
		? computeRowMetadata(collapsibleRows, numDimensions, pivotData.columns)
		: undefined;
	const groupKeys = collapsible ? initializeCollapsedGroups(collapsibleRows) : undefined;
	const shadingColor = collapsible ? palette.rowShadingCollapsible : palette.rowShading;

	rows.forEach((row, rowIndex) => {
		const excelRow = sheetRows.length;
		const isDataRow = row.render_type === 'cell_data' || row.render_type === undefined;
		const subtotalLevel = row.subtotal_level ?? 1;
		const rowColor = isDataRow ? row['__row_conditional_colors'] : null;
		const rowColorStyle = rowColor ? calculateColorStylesFromHex(String(rowColor)) : null;
		// `even:bg-muted` counts every rendered row, subtotals included. In collapsible tables the
		// parity follows the fully expanded table, so stripes still alternate once groups are
		// expanded in Excel.
		const isShaded = rowShading && isDataRow && !rowColorStyle && rowIndex % 2 === 1;
		const nextRow = rows[rowIndex + 1];
		const nextRowIsTotal =
			nextRow?.render_type === 'row_total' || nextRow?.render_type === 'row_subtotal';
		const parentSubtotalLevel = collapsibleMeta?.[rowIndex].parentSubtotalLevel ?? 1;

		const cellOf = (column: ExportColumn, excelColumn: number): SheetCell => {
			const { key, tableIndex, meta } = column;
			const value = row[key];
			const rowspan = column.mergesRepeats ? (row.__rowspans?.[tableIndex] ?? 1) : 1;
			if (rowspan > 1) spanEnds.set(excelColumn, rowIndex + rowspan - 1);
			const isSkipped = column.mergesRepeats && Boolean(row.__skipCell?.[tableIndex]);
			const isInSpan = rowspan > 1 || isSkipped;
			const endsSpan = !isInSpan || spanEnds.get(excelColumn) === rowIndex;

			// ---- content ----
			const isBlank =
				value === null ||
				value === undefined ||
				isSkipped ||
				(row.render_type !== 'cell_data' && Boolean(row.__hideCell?.[key])) ||
				(collapsible !== undefined &&
					isEmptyDimCell(
						row as CollapsibleRow,
						tableIndex,
						numDimensions,
						parentSubtotalLevel,
						pivotData.columns
					));
			let content: ExcelCellContent | undefined;
			if (!isBlank && meta?.viz === 'sparkline') {
				// The cell stays empty; an Excel sparkline is drawn over it from hidden columns.
				const values = parseSparklineData(value).map(([, y]) => y);
				if (values.length > 0) push(sparklineSeries, excelColumn, { row: excelRow, values });
			} else if (!isBlank) {
				content = cellContent(column, row, value, firstDayOfWeek);
			}

			// ---- emphasis and fills ----
			const emphasis = getCellEmphasis(
				row.render_type,
				subtotalLevel,
				tableIndex,
				meta?.render_type
			);
			const colorStyles =
				(hasColorViz(meta, row, value)
					? calculateColorStyles(
							meta,
							key,
							row,
							column.vizRange ?? { min: 0, max: 0 },
							palette.colorScale,
							column.colorScale
						)
					: null) ?? rowColorStyle;
			let fill: string | undefined;
			if (colorStyles) fill = colorStyles.backgroundColor;
			else if (emphasis === 'total') fill = palette.totalFill;
			else if (emphasis === 'subtotal') fill = palette.subtotalFill;
			else if (emphasis === 'pivot') fill = palette.pivotFill;
			else if (isShaded && !isInSpan) fill = shadingColor;

			// ---- text color and link ----
			const href = row.render_type === 'cell_data' && content ? getCellHref(meta, row) : null;
			const target = href !== null && href !== undefined ? resolveLink(String(href)) : undefined;
			const linkTarget =
				target && isSafeExternalUrl(target) && hyperlinkCount < MAX_HYPERLINKS ? target : undefined;
			if (linkTarget) hyperlinkCount++;
			let textColor: string | undefined;
			if (linkTarget) textColor = palette.link;
			else if (meta?.viz === 'delta' && content) {
				textColor = deltaColor(value, meta, palette, downIsGood);
			} else if (colorStyles) textColor = colorStyles.color;
			else if (meta?.red_negatives && typeof content?.value === 'number' && content.value < 0) {
				textColor = palette.negative;
			}

			// ---- borders ----
			const colorBorders = colorStyles
				? getColorVizBorders(colorStyles, {
						nextRowIsTotal,
						emphasis,
						collapsible: collapsible !== undefined
					})
				: undefined;
			const top = hasTopRule(emphasis) ? (colorBorders?.top ?? palette.emphasisBorder) : undefined;
			let bottom =
				colorBorders?.bottom ??
				(rowLines && !collapsible && endsSpan ? palette.rowBorder : undefined);
			// The rule above a total or subtotal replaces the line under the cell above it.
			const nextEmphasis = nextRow
				? getCellEmphasis(
						nextRow.render_type,
						nextRow.subtotal_level ?? 1,
						tableIndex,
						meta?.render_type
					)
				: null;
			if (hasTopRule(nextEmphasis)) bottom = undefined;

			// ---- bars ----
			if (
				meta?.viz === 'bar' &&
				typeof content?.value === 'number' &&
				row.render_type !== 'row_total' &&
				(row.render_type !== 'row_subtotal' || meta.viz_include_subtotals !== false)
			) {
				push(barRows, excelColumn, excelRow);
			}

			// ---- layout ----
			const indent =
				collapsible && getIndentAmount(row as CollapsibleRow, tableIndex, numDimensions) > 0
					? COLLAPSIBLE_INDENT
					: 0;
			const bold = emphasis !== null;
			if (content) {
				const indentPx = indent ? measureTextPx(INDENT_STEP.repeat(indent), font) : 0;
				if (typeof content.value === 'number') {
					fitter.fitNumber(excelColumn, content, bold, indentPx);
				} else {
					fitter.fit(excelColumn, content.text, bold, indentPx);
				}
				if (column.wraps && content.text) {
					push(wrappedCells, excelRow, { column: excelColumn, text: content.text });
				}
			}

			const align = meta?.align ?? 'left';
			if (content) {
				const numFmt = content.numFmt ?? '';
				numFmtCounts[excelColumn].set(numFmt, (numFmtCounts[excelColumn].get(numFmt) ?? 0) + 1);
			}
			const style = cellStyle({
				bold,
				textColor,
				align,
				wraps: column.wraps,
				indent,
				fill,
				top,
				bottom,
				numFmt: content?.numFmt
			});
			return {
				value: content?.value ?? null,
				style,
				...(linkTarget ? { hyperlink: { target: linkTarget } } : {})
			};
		};
		sheetRows.push(columns.map(cellOf));

		if (collapsible && groupKeys) {
			const dimParts = row.__dimKey?.split('|~|') ?? [];
			const level = outlineLevel(row, dimParts, groupKeys);
			const groupKey = getSubtotalGroupKey(row as CollapsibleRow);
			const rowDef: RowDef = {
				...(level > 0 ? { outlineLevel: level } : {}),
				...(isRowVisible(row as CollapsibleRow, collapsible.collapsedGroups as Set<string>)
					? {}
					: { hidden: true }),
				...(groupKey && collapsible.collapsedGroups.has(groupKey) ? { collapsed: true } : {})
			};
			if (Object.keys(rowDef).length > 0) rowDefs.set(excelRow, rowDef);
		}
	});

	// Every header and body row gets an explicit height. Excel for Windows re-measures a row that
	// has content but no height of its own, ignoring the sheet's default row height, so a long
	// table's rows would shrink partway down.
	for (let r = headerStart; r < sheetRows.length; r++) {
		rowDefs.set(r, { height: tableRowHeight(font), ...rowDefs.get(r) });
	}

	// ==================== COLUMN DEFAULTS ====================
	// Each column's default format is its alignment and most common number format: Excel gives
	// it to data typed below the table, and cells that match it are written without a style of
	// their own. Fills, borders and bold stay on cells; on a column they'd run down the sheet.
	const columnStyles = columns.map(({ meta, wraps }, excelColumn) =>
		cellStyle({
			bold: false,
			align: meta?.align ?? 'left',
			wraps,
			indent: 0,
			numFmt: mostCommon(numFmtCounts[excelColumn])
		})
	);
	for (let r = bodyStart; r < sheetRows.length; r++) {
		const row = sheetRows[r];
		columns.forEach((_, c) => {
			const cell = row[c] as SheetCell;
			if (cell.style !== columnStyles[c]) return;
			row[c] = cell.hyperlink
				? { value: cell.value, hyperlink: cell.hyperlink }
				: (cell.value ?? null);
		});
	}

	// ==================== WIDTHS AND HEIGHTS ====================
	const maxWidths = columns.map(({ wraps }) => (wraps ? WRAP_COLUMN_MAX_WIDTH : MAX_COLUMN_WIDTH));
	const dataWidths = columns.map((_, column) => fitter.width(column, maxWidths[column]));
	for (const column of sparklineSeries.keys()) {
		dataWidths[column] = Math.max(dataWidths[column], SPARKLINE_COLUMN_WIDTH);
	}
	const widths = layoutColumnWidths(dataWidths, maxWidths, header.titles, { font, wrapTitles });
	// Widen the columns under a spanning label that's longer than they are.
	for (const { first, last, px } of header.spans) {
		const spanWidth = widths.slice(first, last + 1).reduce((sum, width) => sum + width, 0);
		// The label plus padding on both sides, against the width of the columns it spans.
		const shortfallPx = px + 2 * CELL_PADDING_PX - spanWidth * maxDigitWidthPx(font);
		if (shortfallPx > 0) {
			const extra = shortfallPx / maxDigitWidthPx(font) / (last - first + 1);
			for (let column = first; column <= last; column++) widths[column] += extra;
		}
	}
	for (const [excelRow, cells] of wrappedCells) {
		const lines = Math.max(
			...cells.map(({ column, text, bold }) => countWrappedLines(text, widths[column], font, bold))
		);
		if (lines > 1) {
			rowDefs.set(excelRow, { ...rowDefs.get(excelRow), height: wrappedRowHeight(lines, font) });
		}
	}

	// ==================== DATA BARS ====================
	const conditionalRules: ConditionalRule[] = [];
	for (const [column, barRowIndexes] of barRows) {
		const rule = dataBarRule(
			column,
			barRowIndexes,
			columns[column],
			palette,
			conditionalRules.length + 1
		);
		if (rule) conditionalRules.push(rule);
	}

	// ==================== SPARKLINES ====================
	// Each row's series goes in hidden columns past the table (after a one-column gap), which
	// the sparkline in the visible cell plots. Ranges are qualified with the sheet name on write.
	const columnDefs: ColumnDef[] = widths.map((width, c) => ({ width, style: columnStyles[c] }));
	const sparklines: Sparkline[] = [];
	let nextDataColumn = columns.length + 1;
	for (const [column, series] of sparklineSeries) {
		const sparklineOptions = columns[column].meta?.sparkline_options;
		const firstDataColumn = nextDataColumn;
		for (const { row, values } of series) {
			values.forEach((value, i) => (sheetRows[row][firstDataColumn + i] = value));
			const lastDataColumn = firstDataColumn + values.length - 1;
			sparklines.push({
				location: `${columnLetter(column)}${row + 1}`,
				dataRange: `${columnLetter(firstDataColumn)}${row + 1}:${columnLetter(lastDataColumn)}${row + 1}`,
				type: sparklineOptions?.type === 'bar' ? 'column' : 'line',
				color: toExcelRgb(sparklineOptions?.color ?? palette.sparkline),
				displayHidden: true,
				// Like the report, the axis starts at or below zero unless fit_to_data is set.
				...(sparklineOptions?.fit_to_data ? {} : { manualMin: Math.min(0, ...values) })
			});
		}
		nextDataColumn += Math.max(...series.map(({ values }) => values.length));
		for (let i = firstDataColumn; i < nextDataColumn; i++) columnDefs[i] = { hidden: true };
	}

	const frozenColumns = columns.filter(({ tableIndex }) => tableIndex < freezeColumns).length;
	const totalWidth = widths.reduce((sum, width) => sum + width, 0);

	return {
		rows: sheetRows,
		rowDefs,
		columns: Array.from(columnDefs, (def) => def ?? {}),
		// The header stays in view like the report's sticky header, with freeze_columns alongside.
		freezePane: {
			rows: bodyStart,
			...(frozenColumns > 0 ? { columns: frozenColumns } : {})
		},
		view: { showGridLines: false },
		...(conditionalRules.length ? { conditionalRules } : {}),
		...(sparklines.length ? { sparklines } : {}),
		// Collapsible tables put each subtotal above its detail rows.
		...(collapsible ? { outlineProperties: { summaryBelow: false } } : {}),
		pageSetup: {
			// About 100 character widths no longer fit across a portrait page legibly.
			orientation: totalWidth > 100 ? 'landscape' : 'portrait',
			fitToWidth: 1,
			fitToHeight: 0,
			...(bodyStart > headerStart ? { printTitlesRow: `$${headerStart + 1}:$${bodyStart}` } : {})
		}
	};
}

interface BuildExportHandlerParams {
	/** Builds the table's sheet, measured in `font`. */
	getSheet: (font: ExcelFont) => ExcelSheet;
	filename?: string;
	title?: string;
}

export function buildTableExcelExportHandler({
	getSheet,
	filename = 'table_data',
	title
}: BuildExportHandlerParams): () => Promise<void> {
	return async () => {
		const { filename: exportFilename, worksheetName } = getExcelExportNames({
			title,
			fallbackFilename: filename
		});
		const font = getExcelExportFont();
		try {
			await downloadExcelSheet({
				filename: exportFilename,
				worksheetName,
				sheet: getSheet(font),
				font
			});
		} catch (error) {
			logger.error(error, 'Error exporting table to Excel');
			toast.error("Couldn't export the table", {
				description: error instanceof Error ? error.message : undefined
			});
		}
	};
}
