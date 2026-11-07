import type { CellStyle, RowDef, SheetImage, WriteSheet } from 'hucre';
import type { QueryInfo, QueryInfoContext } from '../query-info-context.svelte';
import type { Query } from '../Query.svelte';
import formatTitle from '../user-components/formatTitle';
import { tags } from '../index';
import { logger } from './logger';
import { toast } from 'svelte-sonner';
import { capturePng, type CapturedPng } from '../utils/png-download';
import { toExcelCell } from './excel/cell-value';
import { resolveExcelPalette, type ExcelPalette } from './excel/palette';
import { calculateFormatRanges } from '../user-components/tags/table/table-viz';
import { getExcelExportFont, type ExcelFont } from './excel/font';
import {
	ColumnFitter,
	downloadBlob,
	downloadWorkbook,
	mostCommon,
	StyleCache,
	tableRowHeight,
	thinBorder,
	titleRows,
	writeWorkbook,
	type ExcelSheet,
	type SheetCell
} from './excel/workbook';

// Categories to exclude from Excel export (inputs/filters and logic/conditionals don't produce meaningful data)
const EXCLUDED_EXPORT_CATEGORIES = new Set(['input', 'logic']);

export interface ExcelExportColumn {
	name: string;
	jsType: string;
	title?: string;
	fmt?: string;
}

export interface ExcelExportMetadata {
	title?: string;
	subtitle?: string;
}

export interface SingleDataExportOptions {
	filename: string;
	worksheetName?: string;
	data: Record<string, unknown>[];
	columns?: ExcelExportColumn[];
	metadata?: ExcelExportMetadata;
}

export interface ExcelExportNamesOptions {
	title?: string;
	fallbackFilename: string;
	fallbackWorksheetName?: string;
}

export type ExportableQueryInfo = Pick<QueryInfo, 'tag' | 'title'> & {
	query: Pick<Query, 'result' | 'loading'>;
	/** The component's styled sheet; without one, its query results are exported as-is. */
	excelSheet?: ExcelSheet;
};

export interface ExportableQueryInfoContext {
	queryInfoMap: ReadonlyMap<string, ExportableQueryInfo>;
}

export interface MultiSheetExportOptions {
	filename: string;
	queryInfoContext: ExportableQueryInfoContext | undefined;
	/** The font the workbook is written in; styled sheets in the context must use it too. */
	font: ExcelFont;
	/** Added as the first sheet, ahead of the data sheets. */
	reportImage?: CapturedPng;
	onError?: (message: string, description?: string) => void;
	onSuccess?: () => void;
}

export interface PageExcelExportOptions {
	pageName: string;
	queryInfoContext: QueryInfoContext;
	/** Capture the report and add it as the first sheet. Off by default: it's slow and most exports only need the data. */
	includeImage?: boolean;
	/** Report element to capture when `includeImage` is set. */
	imageSelector?: string;
	onError?: (message: string, description?: string) => void;
	onSuccess?: () => void;
}

const REPORT_SHEET_NAME = 'Report';

const defaultPageExcelExportErrorHandler = (message: string, description?: string): void => {
	toast.error(message, { description });
};

function getExcelExportTimestamp(): string {
	return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
}

function buildPageExcelFilename(pageName: string): string {
	return `${pageName}_${getExcelExportTimestamp()}`;
}

// A failed capture shouldn't block the data export, so the image is best-effort.
async function captureReportImage(selector: string): Promise<CapturedPng | undefined> {
	const target = document.querySelector<HTMLElement>(selector);
	if (!target) {
		logger.warn({ selector }, 'Report content not found; exporting without image');
		return undefined;
	}
	try {
		return await capturePng(target);
	} catch (err) {
		logger.warn({ err }, 'Report image capture failed; exporting without image');
		return undefined;
	}
}

function isExportable({ tag, query }: Pick<ExportableQueryInfo, 'tag' | 'query'>): boolean {
	const userComponent = tags[tag];
	if (userComponent && EXCLUDED_EXPORT_CATEGORIES.has(userComponent.schema.category)) return false;
	return Boolean(
		query.result && !query.loading && !query.result.error && query.result.rows?.length
	);
}

// Freeze each component's results, and build its styled sheet, when the export starts, so a
// filter change during the slow image capture can't alter what's exported.
function snapshotQueryInfo(
	queryInfoContext: QueryInfoContext,
	font: ExcelFont
): ExportableQueryInfoContext {
	const queryInfoMap = new Map<string, ExportableQueryInfo>();
	for (const [componentId, info] of queryInfoContext.queryInfoMap) {
		let excelSheet: ExcelSheet | undefined;
		if (info.buildExcelSheet && isExportable(info)) {
			try {
				excelSheet = info.buildExcelSheet(font);
			} catch (err) {
				// The data still exports, unstyled; a failure here is a bug worth seeing.
				logger.error({ err, componentId }, 'Styled export failed; exporting the raw query results');
			}
		}
		queryInfoMap.set(componentId, {
			tag: info.tag,
			title: info.title,
			query: { result: info.query.result, loading: info.query.loading },
			excelSheet
		});
	}
	return { queryInfoMap };
}

export async function downloadPageDataAsExcel({
	pageName,
	queryInfoContext,
	includeImage = false,
	imageSelector = '[data-markdoc-content]',
	onError = defaultPageExcelExportErrorHandler,
	onSuccess
}: PageExcelExportOptions): Promise<void> {
	const filename = buildPageExcelFilename(pageName);
	const font = getExcelExportFont();

	if (!includeImage) {
		const snapshot = snapshotQueryInfo(queryInfoContext, font);
		await downloadPageAsExcel({ filename, queryInfoContext: snapshot, font, onError, onSuccess });
		return;
	}

	const loadingToast = toast.loading('Generating Excel report…', { duration: Infinity });

	try {
		// Let the toast paint before building every table's sheet, which can take a moment.
		await new Promise((resolve) => setTimeout(resolve));
		const snapshot = snapshotQueryInfo(queryInfoContext, font);
		const reportImage = await captureReportImage(imageSelector);
		await downloadPageAsExcel({
			filename,
			queryInfoContext: snapshot,
			font,
			reportImage,
			onError,
			onSuccess
		});
	} finally {
		toast.dismiss(loadingToast);
	}
}

export function buildReportImageSheet(image: CapturedPng): ExcelSheet {
	const reportImage: SheetImage = {
		data: base64ToBytes(image.dataUrl),
		type: 'png',
		anchor: { from: { row: 0, col: 0 } },
		width: image.width,
		height: image.height,
		altText: 'Report'
	};
	return { view: { showGridLines: false }, images: [reportImage] };
}

function base64ToBytes(dataUrl: string): Uint8Array {
	const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/**
 * Filters out Evidence internal columns (starting with __ev_)
 */
function filterInternalColumns(data: Record<string, unknown>[]): Record<string, unknown>[] {
	return data.map((row) => {
		const filteredRow: Record<string, unknown> = {};
		Object.entries(row).forEach(([key, value]) => {
			// Retain internal comparison columns (e.g., __ev_sum_sales_prior year_comparison_pct)
			// Strip other Evidence helper columns that start with __ev_
			if (!key.startsWith('__ev_') || key.includes('_comparison')) {
				filteredRow[key] = value;
			}
		});
		return filteredRow;
	});
}

/**
 * Sanitizes a string to be a valid Excel worksheet name.
 * Excel worksheet names:
 * - Cannot exceed 31 characters
 * - Cannot contain: * ? : / \ [ ]
 * - Cannot start or end with a single quote (')
 * - Cannot be blank
 * - Cannot be "History" (reserved)
 *
 * @param name - The name to sanitize
 * @param maxLength - Maximum length (default 31, but can be less to reserve space for suffixes)
 */
export function sanitizeWorksheetName(name: string, maxLength: number = 31): string {
	if (!name || name.trim() === '') {
		return 'Sheet';
	}

	// Remove invalid characters: * ? : / \ [ ]
	let sanitized = name.replace(/[*?:/\\[\]]/g, '');

	// Trim whitespace
	sanitized = sanitized.trim();

	// If empty after sanitization, use default
	if (sanitized === '') {
		return 'Sheet';
	}

	// Truncate to maxLength characters
	if (sanitized.length > maxLength) {
		sanitized = sanitized.substring(0, maxLength).trim();
	}

	// Remove single quotes from start and end (must be done after truncation)
	sanitized = sanitized.replace(/^'+|'+$/g, '');

	// If empty after quote removal, use default
	if (sanitized === '') {
		return 'Sheet';
	}

	// "History" is a reserved name in Excel (checked last, so "'History'" is caught too)
	if (sanitized.toLowerCase() === 'history') {
		sanitized = 'History Data';
	}

	return sanitized;
}

/**
 * Generates a unique worksheet name that doesn't collide with existing names.
 * Handles Excel's 31-character limit when adding numeric suffixes.
 */
export function getUniqueSheetName(baseName: string, usedNames: Set<string>): string {
	// Sanitize with full length first
	const name = sanitizeWorksheetName(baseName);

	// If the name isn't used, we're done
	if (!usedNames.has(name.toLowerCase())) {
		usedNames.add(name.toLowerCase());
		return name;
	}

	// Need to add a suffix - find the next available number
	let counter = 2;
	while (counter <= 999) {
		const suffix = ` ${counter}`;
		// Reserve space for the suffix when sanitizing
		const truncatedBase = sanitizeWorksheetName(baseName, 31 - suffix.length);
		const candidateName = `${truncatedBase}${suffix}`;

		if (!usedNames.has(candidateName.toLowerCase())) {
			usedNames.add(candidateName.toLowerCase());
			return candidateName;
		}
		counter++;
	}

	// Fallback (very unlikely to reach here)
	const fallback = `Sheet ${Date.now() % 100000}`;
	usedNames.add(fallback.toLowerCase());
	return fallback;
}

export function getExcelExportNames({
	title,
	fallbackFilename,
	fallbackWorksheetName = 'Data'
}: ExcelExportNamesOptions): { filename: string; worksheetName: string } {
	const exportTitle = title?.trim();
	if (!exportTitle) {
		return {
			filename: fallbackFilename,
			worksheetName: fallbackWorksheetName
		};
	}

	return {
		filename: exportTitle,
		worksheetName: exportTitle
	};
}

export interface DataSheetOptions {
	/** The font the workbook is written in, which columns are measured in. */
	font: ExcelFont;
	metadata?: ExcelExportMetadata;
	palette?: ExcelPalette;
}

/**
 * Lays out query results as a plain report table: optional title block, a bold header
 * underlined like a report table's, row lines, native number and date formats, autofit
 * columns, and the header frozen the way a report table's header stays in view.
 */
export function buildDataSheet(
	data: Record<string, unknown>[],
	columns: ExcelExportColumn[] | undefined,
	{ font, metadata, palette = resolveExcelPalette() }: DataSheetOptions
): ExcelSheet {
	const processedData = filterInternalColumns(data);
	const rows: SheetCell[][] = titleRows(metadata?.title, metadata?.subtitle, { palette, font });
	if (processedData.length === 0) return { rows, view: { showGridLines: false } };

	const columnsByName = new Map(columns?.map((column) => [column.name, column]));
	const columnNames = columns
		? columns
				.map((col) => col.name)
				.filter((name) => !name.startsWith('__ev_') || name.includes('_comparison'))
		: Object.keys(processedData[0]);
	const fitter = new ColumnFitter(font);
	const styles = new StyleCache();
	// Table rows get explicit heights: Excel for Windows re-measures rows that don't have one.
	const rowDefs = new Map<number, RowDef>();
	// Auto formats (`usd`, `num`) pick one unit per column, as a report table does.
	const formatRanges = calculateFormatRanges({
		columnMeta: (columns ?? []).map((column) => ({ key: column.name, fmt: column.fmt })),
		sortedRows: processedData
	});
	const numFmtCounts = columnNames.map(() => new Map<string, number>());

	const headerRowIndex = rows.length;
	rowDefs.set(headerRowIndex, { height: tableRowHeight(font) });
	rows.push(
		columnNames.map((name, columnIndex) => {
			const column = columnsByName.get(name);
			const title = column?.title || formatTitle(name);
			fitter.fit(columnIndex, title, true);
			return {
				value: title,
				style: {
					font: { bold: true },
					alignment: {
						vertical: 'center',
						horizontal: column?.jsType === 'number' ? 'right' : 'left'
					},
					border: { bottom: thinBorder(palette.emphasisBorder) }
				}
			};
		})
	);

	for (const row of processedData) {
		rowDefs.set(rows.length, { height: tableRowHeight(font) });
		rows.push(
			columnNames.map((name, columnIndex) => {
				const column = columnsByName.get(name);
				const isNumber = column?.jsType === 'number';
				// Unformatted numbers stay in Excel's General format rather than the report's auto-scaling.
				const content = toExcelCell(row[name], {
					fmt: column?.fmt ?? (isNumber ? 'General' : undefined),
					columnType: column?.jsType,
					range: formatRanges.get(name)
				});
				fitter.fitNumber(columnIndex, content);
				const counts = numFmtCounts[columnIndex];
				counts.set(content.numFmt ?? '', (counts.get(content.numFmt ?? '') ?? 0) + 1);
				const style = styles.get(`${isNumber}|${content.numFmt ?? ''}`, () => ({
					alignment: { vertical: 'center', ...(isNumber ? { horizontal: 'right' } : {}) },
					border: { bottom: thinBorder(palette.rowBorder) },
					...(content.numFmt ? { numFmt: content.numFmt } : {})
				}));
				return { value: content.value, style };
			})
		);
	}

	return {
		rows,
		rowDefs,
		// Each column's alignment and most common number format, which Excel gives to data typed
		// below the table. Cells keep their own style too, for their row lines.
		columns: columnNames.map((name, columnIndex) => {
			const numFmt = mostCommon(numFmtCounts[columnIndex]);
			return {
				width: fitter.width(columnIndex),
				style: {
					alignment: {
						vertical: 'center',
						...(columnsByName.get(name)?.jsType === 'number' ? { horizontal: 'right' } : {})
					},
					...(numFmt ? { numFmt } : {})
				}
			};
		}),
		freezePane: { rows: headerRowIndex + 1 },
		view: { showGridLines: false }
	};
}

/** Writes one sheet to an .xlsx file and downloads it. */
export async function downloadExcelSheet({
	filename,
	worksheetName = 'Data',
	sheet,
	font
}: {
	filename: string;
	worksheetName?: string;
	sheet: ExcelSheet;
	/** The font the sheet was built with. */
	font: ExcelFont;
}): Promise<void> {
	try {
		const bytes = await writeWorkbook(
			[{ ...sheet, name: sanitizeWorksheetName(worksheetName) }],
			font
		);
		downloadWorkbook(bytes, filename);
	} catch (error) {
		logger.error(error, 'Error downloading Excel file');
		throw error;
	}
}

/**
 * Export a single dataset to Excel
 */
export async function downloadAsExcel({
	filename,
	worksheetName = 'Data',
	data,
	columns,
	metadata
}: SingleDataExportOptions): Promise<void> {
	if (!data.length) {
		logger.warn('No data available to download');
		return;
	}

	const font = getExcelExportFont();
	await downloadExcelSheet({
		filename,
		worksheetName,
		sheet: buildDataSheet(data, columns, { font, metadata }),
		font
	});
}

function buildErrorSheet(componentId: string, err: unknown): ExcelSheet {
	const header: CellStyle = { font: { bold: true } };
	return {
		rows: [
			[
				{ value: 'Error', style: header },
				{ value: 'Message', style: header }
			],
			[
				{ value: `Failed to process query: ${componentId}` },
				{ value: err instanceof Error ? err.message : 'Unknown error' }
			]
		],
		view: { showGridLines: false }
	};
}

/**
 * Export all queries from a page to a multi-sheet Excel file
 */
export async function downloadPageAsExcel({
	filename,
	queryInfoContext,
	font,
	reportImage,
	onError,
	onSuccess
}: MultiSheetExportOptions): Promise<void> {
	try {
		const queryInfoMap = queryInfoContext?.queryInfoMap ?? new Map<string, ExportableQueryInfo>();
		if (queryInfoMap.size === 0 && !reportImage) {
			onError?.(
				'No queries found on this page',
				'Make sure the page contains tables, charts, or other components with data.'
			);
			return;
		}

		const sheets: WriteSheet[] = [];
		let hasData = false;

		// Track used sheet names for deduplication (case-insensitive)
		const usedNames = new Set<string>();

		if (reportImage) {
			sheets.push({ ...buildReportImageSheet(reportImage), name: REPORT_SHEET_NAME });
			usedNames.add(REPORT_SHEET_NAME.toLowerCase());
			hasData = true;
		}

		// Add a sheet for each query
		for (const [componentId, queryInfo] of queryInfoMap) {
			try {
				if (!isExportable(queryInfo)) continue;
				const result = queryInfo.query.result!;

				// Tables export the way they render; other components export their query results.
				const sheet = queryInfo.excelSheet ?? buildDataSheet(result.rows, result.columns, { font });

				// Create worksheet - use title if available, otherwise format tag name
				const name = getUniqueSheetName(queryInfo.title || formatTitle(queryInfo.tag), usedNames);
				sheets.push({ ...sheet, name });
				hasData = true;
			} catch (err) {
				logger.error({ err }, `Error processing query ${componentId}`);
				// Add an error sheet for failed queries
				const name = getUniqueSheetName(`Error - ${formatTitle(queryInfo.tag)}`, usedNames);
				sheets.push({ ...buildErrorSheet(componentId, err), name });
			}
		}

		if (!hasData) {
			onError?.(
				'No data available for export',
				'The queries on this page have no results or encountered errors.'
			);
			return;
		}

		downloadWorkbook(await writeWorkbook(sheets, font), filename);
		onSuccess?.();
	} catch (error) {
		logger.error(error, 'Error downloading page data');
		onError?.(
			'Failed to download data',
			error instanceof Error
				? error.message
				: 'An unexpected error occurred while generating the Excel file.'
		);
	}
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: Record<string, unknown>[]): string {
	if (!data.length) return '';

	const processedData = filterInternalColumns(data);
	if (processedData.length === 0) return '';

	const headers = Object.keys(processedData[0]);

	const csvRows = [
		// Headers row
		headers.map((header) => `"${header}"`).join(','),
		// Data rows
		...processedData.map((row) =>
			headers
				.map((header) => {
					const value = row[header];
					if (value === null || value === undefined) return '';
					// Escape quotes and wrap in quotes
					return `"${String(value).replace(/"/g, '""')}"`;
				})
				.join(',')
		)
	];

	return csvRows.join('\n');
}

/**
 * Download data as CSV
 */
export function downloadAsCSV(data: Record<string, unknown>[], filename: string): void {
	const csvContent = convertToCSV(data);
	if (!csvContent) {
		logger.warn('No data available to download');
		return;
	}

	downloadBlob(
		new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
		filename.endsWith('.csv') ? filename : `${filename}.csv`
	);
}
