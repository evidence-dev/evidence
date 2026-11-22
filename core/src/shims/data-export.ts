import type { CellStyle, RowDef, SheetImage, WriteSheet } from 'hucre';
import type { QueryInfo, QueryInfoContext } from '../query-info-context.svelte';
import type { Query } from '../Query.svelte';
import formatTitle from '../user-components/formatTitle';
import { tags } from '../index';
import { logger } from './logger';
import { toast } from 'svelte-sonner';
import { capturePng, type CapturedPng } from '../utils/png-download';
import { toExcelCell, type ExcelCellContent } from './excel/cell-value';
import { isTemporalColumnType } from '../user-components/formatValue';
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
import { waitForFonts } from '../readiness';

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
const DATA_DATE_FORMAT = 'yyyy-mm-dd';
const DATA_TIMESTAMP_FORMAT = 'yyyy-mm-dd hh:mm:ss';

const defaultPageExcelExportErrorHandler = (message: string, description?: string): void => {
	toast.error(message, { description });
};

function getExcelExportTimestamp(): string {
	return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
}

function buildPageExcelFilename(pageName: string): string {
	return `${pageName}_${getExcelExportTimestamp()}`;
}

const REPORT_SETTLE_TIMEOUT_MS = 60_000;
const REPORT_SETTLE_POLL_MS = 250;
// A query that finishes can kick off a dependent one, so one quiet poll isn't enough.
const REPORT_SETTLE_QUIET_POLLS = 2;

// Same signals the scheduled PDF renderer waits on before it captures.
function isReportSettled(target: HTMLElement, queryInfoContext: QueryInfoContext): boolean {
	for (const { query } of queryInfoContext.queryInfoMap.values()) {
		if (query.loading) return false;
	}
	if (target.querySelector('[data-echarts-ready="false"], [data-map-ready="false"]')) return false;
	return !Array.from(target.querySelectorAll('.animate-spin')).some(
		(spinner) => getComputedStyle(spinner).opacity !== '0'
	);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// False if the user navigated away mid-wait, since the shared query context then holds another page's results.
async function waitForReportToSettle(
	target: HTMLElement,
	queryInfoContext: QueryInfoContext
): Promise<boolean> {
	const deadline = Date.now() + REPORT_SETTLE_TIMEOUT_MS;
	const pathname = location.pathname;
	const isSameReport = () => target.isConnected && location.pathname === pathname;
	let quietPolls = 0;
	while (quietPolls < REPORT_SETTLE_QUIET_POLLS) {
		if (!isSameReport()) return false;
		if (Date.now() >= deadline) {
			logger.warn('Report still loading after timeout; capturing as-is');
			break;
		}
		quietPolls = isReportSettled(target, queryInfoContext) ? quietPolls + 1 : 0;
		if (quietPolls < REPORT_SETTLE_QUIET_POLLS) await sleep(REPORT_SETTLE_POLL_MS);
	}
	await Promise.race([waitForFonts(), sleep(Math.max(0, deadline - Date.now()))]);
	return isSameReport();
}

// A failed capture shouldn't block the data export, so the image is best-effort.
async function captureReportImage(target: HTMLElement): Promise<CapturedPng | undefined> {
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

// Snapshot up front so a filter change during the slow image capture can't alter the export.
function snapshotQueryInfo(
	queryInfoContext: Pick<QueryInfoContext, 'queryInfoMap'>,
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
		const target = document.querySelector<HTMLElement>(imageSelector);
		if (target) {
			if (!(await waitForReportToSettle(target, queryInfoContext))) {
				onError(
					'Excel report cancelled',
					'The page changed before the report finished loading. Try again on the page you want to export.'
				);
				return;
			}
		} else {
			logger.warn({ selector: imageSelector }, 'Report content not found; exporting without image');
		}
		const snapshot = snapshotQueryInfo(queryInfoContext, font);
		const reportImage = target ? await captureReportImage(target) : undefined;
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
	font: ExcelFont;
	metadata?: ExcelExportMetadata;
	palette?: ExcelPalette;
}

// Raw data: General numbers (no auto-scaling), timestamps keep their time, pre-1900 dates as text.
function rawDataCell(
	value: unknown,
	column: ExcelExportColumn | undefined,
	range: { min: number; max: number } | undefined
): ExcelCellContent {
	const columnType = column?.jsType;
	if (column?.fmt || !isTemporalColumnType(columnType)) {
		return toExcelCell(value, {
			fmt: column?.fmt ?? (columnType === 'number' ? 'General' : undefined),
			columnType,
			range
		});
	}
	const timestamp = toExcelCell(value, { fmt: DATA_TIMESTAMP_FORMAT, columnType });
	if (!(timestamp.value instanceof Date)) return toExcelCell(value, { fmt: 'General' });
	const hasTime = timestamp.value.getTime() % 86_400_000 !== 0;
	return hasTime ? timestamp : toExcelCell(value, { fmt: DATA_DATE_FORMAT, columnType });
}

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
				const content = rawDataCell(row[name], column, formatRanges.get(name));
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
		// Excel applies a column's style to data typed below the table.
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

// One sheet per component with data; null when none has any.
function buildPageSheets(
	{ queryInfoMap }: ExportableQueryInfoContext,
	font: ExcelFont,
	reportImage?: CapturedPng
): WriteSheet[] | null {
	const sheets: WriteSheet[] = [];
	let hasData = false;

	// Track used sheet names for deduplication (case-insensitive)
	const usedNames = new Set<string>();

	if (reportImage) {
		sheets.push({ ...buildReportImageSheet(reportImage), name: REPORT_SHEET_NAME });
		usedNames.add(REPORT_SHEET_NAME.toLowerCase());
		hasData = true;
	}

	for (const [componentId, queryInfo] of queryInfoMap) {
		try {
			if (!isExportable(queryInfo)) continue;
			const result = queryInfo.query.result!;

			// Tables export the way they render; other components export their query results.
			const sheet = queryInfo.excelSheet ?? buildDataSheet(result.rows, result.columns, { font });

			const name = getUniqueSheetName(queryInfo.title || formatTitle(queryInfo.tag), usedNames);
			sheets.push({ ...sheet, name });
			hasData = true;
		} catch (err) {
			logger.error({ err }, `Error processing query ${componentId}`);
			const name = getUniqueSheetName(`Error - ${formatTitle(queryInfo.tag)}`, usedNames);
			sheets.push({ ...buildErrorSheet(componentId, err), name });
		}
	}

	return hasData ? sheets : null;
}

// Used by the (pdf) layout to attach the page's workbook to scheduled emails.
export async function buildPageWorkbook({
	queryInfoContext,
	reportImage
}: {
	queryInfoContext: Pick<QueryInfoContext, 'queryInfoMap'>;
	reportImage?: CapturedPng;
}): Promise<ArrayBuffer | null> {
	const font = getExcelExportFont();
	const sheets = buildPageSheets(snapshotQueryInfo(queryInfoContext, font), font, reportImage);
	if (!sheets) return null;
	const bytes = await writeWorkbook(sheets, font);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
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

		const sheets = buildPageSheets({ queryInfoMap }, font, reportImage);
		if (!sheets) {
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
