// Only types come from hucre statically: its writer is loaded on first export (see writeWorkbook).
import type { BorderSide, Cell, CellStyle, Color, FillStyle, FontStyle, WriteSheet } from 'hucre';
import type { ExcelCellContent } from './cell-value';
import { toExcelRgb, type ExcelPalette } from './palette';
import { columnWidthToPx, measureTextPx, pxToColumnWidth, type ExcelFont } from './font';

/** 15pt Calibri line + 3pt = 24px, a report row (`text-xs` line plus `py-1`). */
const TABLE_ROW_PADDING = 3;
const TITLE_SIZE_INCREASE = 2;
const MIN_COLUMN_WIDTH = 4;
export const MAX_COLUMN_WIDTH = 100;
/** More than Excel's 5px autofit margin, which looks cramped next to the report's ~18px. */
export const CELL_PADDING_PX = 8;

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type SheetCell = Partial<Cell>;
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

/** hucre dedupes styles by object identity; the key must cover everything `build` reads. */
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

export function tableRowHeight(font: ExcelFont): number {
	return font.lineHeight + TABLE_ROW_PADDING;
}

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

/** Titles aren't measured: they overflow into empty cells rather than stretch the first column. */
export class ColumnFitter {
	#widthsPx: number[] = [];
	#widestNumbers = new Map<number, Map<string, WidestNumbers>>();

	constructor(readonly font: ExcelFont) {}

	fitPx(column: number, px: number): void {
		this.#widthsPx[column] = Math.max(this.#widthsPx[column] ?? 0, px);
	}

	fit(column: number, text: string, bold = false, extraPx = 0): void {
		if (!text) return;
		this.fitPx(column, measureTextPx(text, this.font, bold) + extraPx);
	}

	/** Digits share one width, so only a format's largest and most negative values are measured. */
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

/** General, sections, conditions, fractions and scientific notation don't widen with magnitude. */
function isMonotonicWidthFormat(numFmt: string | undefined): boolean {
	return Boolean(numFmt) && numFmt !== 'General' && !/[[;?/]|E[+-]/i.test(numFmt!);
}

export function mostCommon(counts: ReadonlyMap<string, number>): string | undefined {
	let winner: string | undefined;
	let most = 0;
	for (const [key, count] of counts) {
		if (count > most) [winner, most] = [key, count];
	}
	return winner || undefined;
}

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

export function wrappedRowHeight(lines: number, font: ExcelFont): number {
	return Math.max(tableRowHeight(font), lines * font.lineHeight + TABLE_ROW_PADDING);
}

/** hucre has one, but importing it would pull hucre into the page bundle. */
export function columnLetter(column: number): string {
	let letters = '';
	for (let n = column + 1; n > 0; n = Math.floor((n - 1) / 26)) {
		letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
	}
	return letters;
}

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
	return `'${name.replaceAll("'", "''")}'`;
}

/** `font` must be the one the sheets were measured with; sparkline ranges get their sheet here. */
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
	let writeXlsx: typeof import('hucre').writeXlsx;
	try {
		({ writeXlsx } = await import('hucre'));
	} catch (err) {
		// A tab left open across a deploy can ask for a chunk that no longer exists.
		throw new Error('The Excel export failed to load. Reload the page and try again.', {
			cause: err
		});
	}
	return writeXlsx({ sheets: resolvedSheets, defaultFont: { name: font.name, size: font.size } });
}

/** Titles often hold dates like "10/4/26", whose slashes browsers would replace unpredictably. */
export function sanitizeFilename(filename: string): string {
	const sanitized = filename
		.replace(/[/\\]/g, '-')
		.replace(/[:*?"<>|\u0000-\u001f]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	// Windows drops trailing dots and spaces from a name.
	let end = sanitized.length;
	while (end > 0 && (sanitized[end - 1] === '.' || sanitized[end - 1] === ' ')) end--;
	return sanitized.slice(0, end) || 'download';
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

export function downloadWorkbook(bytes: Uint8Array, filename: string): void {
	downloadBlob(
		new Blob([bytes as BlobPart], { type: XLSX_MIME_TYPE }),
		filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
	);
}
