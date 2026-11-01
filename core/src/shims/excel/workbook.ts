// Only types come from hucre statically: its writer is loaded on first export (see writeWorkbook).
import type { BorderSide, Cell, CellStyle, Color, FillStyle, FontStyle, WriteSheet } from 'hucre';
import type { ExcelCellContent } from './cell-value';
import { toExcelRgb, type ExcelPalette } from './palette';
import { columnWidthToPx, measureTextPx, pxToColumnWidth, type ExcelFont } from './font';

/**
 * Points added to a line's height for a table row. With Calibri 11's 15pt line that makes 18pt
 * (24px), the height of a report table row: a 16px line of `text-xs` plus `py-1` padding.
 */
const TABLE_ROW_PADDING = 3;
/** The title sits a little larger than the table, as on the report. */
const TITLE_SIZE_INCREASE = 2;
const MIN_COLUMN_WIDTH = 4;
export const MAX_COLUMN_WIDTH = 100;
/**
 * Breathing room added to autofit widths. Excel's own autofit leaves 5px; report cells are
 * padded by about 18px, so columns sized like Excel's look cramped next to the report.
 */
export const CELL_PADDING_PX = 8;

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type SheetCell = Partial<Cell>;
/** A worksheet before it's given a name. */
export type ExcelSheet = Omit<WriteSheet, 'name'>;

function excelColor(color: string | undefined): Color | undefined {
	const rgb = toExcelRgb(color);
	return rgb ? { rgb } : undefined;
}

export function thinBorder(color: string | undefined): BorderSide {
	return { style: 'thin', color: excelColor(color) };
}

export function solidFill(color: string | undefined): FillStyle | undefined {
	const fgColor = excelColor(color);
	return fgColor ? { type: 'pattern', pattern: 'solid', fgColor } : undefined;
}

export function fontColor(color: string | undefined): Pick<FontStyle, 'color'> {
	const resolved = excelColor(color);
	return resolved ? { color: resolved } : {};
}

/**
 * Hands out one style object per distinct key. hucre reuses a style it has already seen by
 * object identity, so cells that look alike should share an object rather than each build one.
 * The key must cover everything `build` reads that varies within one cache's lifetime.
 */
export class StyleCache {
	#styles = new Map<string, CellStyle>();

	get(key: string, build: () => CellStyle): CellStyle {
		let style = this.#styles.get(key);
		if (!style) {
			style = build();
			this.#styles.set(key, style);
		}
		return style;
	}
}

/** Row height for a table row in `font`: one line plus the report's cell padding. */
export function tableRowHeight(font: ExcelFont): number {
	return font.lineHeight + TABLE_ROW_PADDING;
}

/**
 * The title and subtitle above an exported table, followed by a blank spacer row.
 * Matches the report's component title: bold title, muted subtitle.
 */
export function titleRows(
	title: string | undefined,
	subtitle: string | undefined,
	{ palette, font }: { palette: ExcelPalette; font: ExcelFont }
): SheetCell[][] {
	const rows: SheetCell[][] = [];
	const trimmedTitle = title?.trim();
	const trimmedSubtitle = subtitle?.trim();
	if (trimmedTitle) {
		rows.push([
			{
				value: trimmedTitle,
				style: { font: { bold: true, size: font.size + TITLE_SIZE_INCREASE } }
			}
		]);
	}
	if (trimmedSubtitle) {
		rows.push([{ value: trimmedSubtitle, style: { font: fontColor(palette.mutedForeground) } }]);
	}
	if (rows.length > 0) rows.push([]);
	return rows;
}

/**
 * Accumulates the widest content of each column so columns can be autofit. Title and
 * subtitle rows are deliberately never measured: they overflow across the empty cells
 * to their right instead of stretching the first column.
 */
export class ColumnFitter {
	#widthsPx: number[] = [];
	/** Per column and format, the values whose text is widest: the largest, and the most negative. */
	#widestNumbers = new Map<number, Map<string, WidestNumbers>>();

	constructor(readonly font: ExcelFont) {}

	/** Records `px` of content (already measured) for `column`. */
	fitPx(column: number, px: number): void {
		this.#widthsPx[column] = Math.max(this.#widthsPx[column] ?? 0, px);
	}

	fit(column: number, text: string, bold = false, extraPx = 0): void {
		if (!text) return;
		this.fitPx(column, measureTextPx(text, this.font, bold) + extraPx);
	}

	/**
	 * Records a number cell. Digits share one width, so under a fixed number format the widest
	 * text belongs to the largest value or the most negative one; only those get formatted and
	 * measured. Formats where that doesn't hold are measured cell by cell.
	 */
	fitNumber(column: number, cell: ExcelCellContent, bold = false, extraPx = 0): void {
		const value = cell.value;
		if (typeof value !== 'number' || !isMonotonicWidthFormat(cell.numFmt)) {
			this.fit(column, cell.text, bold, extraPx);
			return;
		}
		let formats = this.#widestNumbers.get(column);
		if (!formats) this.#widestNumbers.set(column, (formats = new Map()));
		const key = `${cell.numFmt}|${bold}|${extraPx}`;
		let widest = formats.get(key);
		if (!widest) formats.set(key, (widest = { bold, extraPx }));
		if (
			value >= 0 ? value > (widest.largest?.value ?? -1) : value < (widest.mostNegative?.value ?? 0)
		) {
			widest[value >= 0 ? 'largest' : 'mostNegative'] = { value, cell };
		}
	}

	/** Excel column width for `column`, clamped to `[MIN_COLUMN_WIDTH, maxWidth]`. */
	width(column: number, maxWidth = MAX_COLUMN_WIDTH): number {
		for (const { largest, mostNegative, bold, extraPx } of this.#widestNumbers
			.get(column)
			?.values() ?? []) {
			if (largest) this.fit(column, largest.cell.text, bold, extraPx);
			if (mostNegative) this.fit(column, mostNegative.cell.text, bold, extraPx);
		}
		this.#widestNumbers.delete(column);
		const width = pxToColumnWidth((this.#widthsPx[column] ?? 0) + CELL_PADDING_PX, this.font);
		return Math.min(Math.max(width, MIN_COLUMN_WIDTH), maxWidth);
	}
}

interface WidestNumbers {
	bold: boolean;
	extraPx: number;
	largest?: { value: number; cell: ExcelCellContent };
	mostNegative?: { value: number; cell: ExcelCellContent };
}

/**
 * Whether a number format's text grows with the number's magnitude: no General (which shows
 * as many decimals as the value has), sections, conditions, fractions or scientific notation.
 */
function isMonotonicWidthFormat(numFmt: string | undefined): boolean {
	return Boolean(numFmt) && numFmt !== 'General' && !/[[;?/]|E[+-]/i.test(numFmt!);
}

/** The key counted most often (the first one on a tie), or undefined when there are none. */
export function mostCommon(counts: ReadonlyMap<string, number>): string | undefined {
	let winner: string | undefined;
	let most = 0;
	for (const [key, count] of counts) {
		if (count > most) [winner, most] = [key, count];
	}
	return winner || undefined;
}

/** Number of lines `text` wraps to in a column `width` wide (greedy, on spaces). */
export function countWrappedLines(
	text: string,
	width: number,
	font: ExcelFont,
	bold = false
): number {
	const availablePx = columnWidthToPx(width, font);
	if (availablePx <= 0) return 1;
	const spacePx = measureTextPx(' ', font, bold);
	let lines = 0;
	for (const paragraph of text.split('\n')) {
		lines += 1;
		let linePx = 0;
		for (const word of paragraph.split(' ')) {
			const wordPx = measureTextPx(word, font, bold);
			if (linePx > 0 && linePx + spacePx + wordPx > availablePx) {
				lines += 1;
				linePx = wordPx;
			} else {
				linePx += (linePx > 0 ? spacePx : 0) + wordPx;
			}
			// A word wider than the column breaks across lines of its own.
			if (linePx > availablePx) {
				lines += Math.ceil(linePx / availablePx) - 1;
				linePx %= availablePx;
			}
		}
	}
	return lines;
}

/** Row height for a row of wrapping cells; never shorter than a table row. */
export function wrappedRowHeight(lines: number, font: ExcelFont): number {
	return Math.max(tableRowHeight(font), lines * font.lineHeight + TABLE_ROW_PADDING);
}

/**
 * Excel's A1 column letters for a 0-based column index. (hucre has one, but importing it would
 * pull hucre into the page bundle; it is loaded only when an export runs.)
 */
export function columnLetter(column: number): string {
	let letters = '';
	for (let n = column + 1; n > 0; n = Math.floor((n - 1) / 26)) {
		letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
	}
	return letters;
}

/** A1 references for ascending 0-based `rows` in one column, with consecutive rows merged. */
export function columnRanges(column: number, rows: number[]): string {
	const letter = columnLetter(column);
	const ranges: string[] = [];
	for (let i = 0; i < rows.length; i++) {
		const start = rows[i];
		while (rows[i + 1] === rows[i] + 1) i++;
		const end = rows[i];
		ranges.push(
			start === end ? `${letter}${start + 1}` : `${letter}${start + 1}:${letter}${end + 1}`
		);
	}
	return ranges.join(' ');
}

function quoteSheetName(name: string): string {
	return `'${name.replace(/'/g, "''")}'`;
}

/**
 * Writes the workbook in `font`, which must be the font its sheets were measured with. Sheets
 * are built before they're named (a page export dedupes names afterwards), so a sparkline's
 * data range may omit its sheet; it's qualified here.
 */
export async function writeWorkbook(sheets: WriteSheet[], font: ExcelFont): Promise<Uint8Array> {
	const resolvedSheets = sheets.map((sheet) =>
		sheet.sparklines
			? {
					...sheet,
					sparklines: sheet.sparklines.map((sparkline) =>
						sparkline.dataRange.includes('!')
							? sparkline
							: { ...sparkline, dataRange: `${quoteSheetName(sheet.name)}!${sparkline.dataRange}` }
					)
				}
			: sheet
	);
	// Loaded on first export so the writer stays out of the page's initial bundle.
	const { writeXlsx } = await import('hucre');
	return writeXlsx({ sheets: resolvedSheets, defaultFont: { name: font.name, size: font.size } });
}

/** Triggers a browser download of `blob` as `filename`. */
/**
 * A download filename that every OS accepts as-is. Titles often hold dates like "10/4/26", and
 * browsers would otherwise swap each slash for a character of their own choosing.
 */
export function sanitizeFilename(filename: string): string {
	const sanitized = filename
		.replace(/[/\\]/g, '-')
		.replace(/[:*?"<>|\u0000-\u001f]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		// Windows drops trailing dots and spaces from a name.
		.replace(/[. ]+$/, '');
	return sanitized || 'download';
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', sanitizeFilename(filename));
	document.body.appendChild(link);
	link.click();
	link.parentNode?.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/** Triggers a browser download of an .xlsx file. */
export function downloadWorkbook(bytes: Uint8Array, filename: string): void {
	downloadBlob(
		new Blob([bytes as BlobPart], { type: XLSX_MIME_TYPE }),
		filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
	);
}
