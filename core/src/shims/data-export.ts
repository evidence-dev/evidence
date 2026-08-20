import ExcelJS from 'exceljs';
import type { QueryInfoContext } from '../query-info-context.svelte';
import formatTitle from '../user-components/formatTitle';
import { FORMAT_PRESETS, BASE_AUTO_FORMATS, formatAsQuarter } from '../user-components/formatValue';
import { tags } from '../index';
import { logger } from './logger';
import { toast } from 'svelte-sonner';

// Categories to exclude from Excel export (inputs/filters and logic/conditionals don't produce meaningful data)
const EXCLUDED_EXPORT_CATEGORIES = new Set(['input', 'logic']);

export interface CellStyle {
	font?: Partial<ExcelJS.Font>;
	border?: Partial<ExcelJS.Borders>;
}

export interface GetCellStyleArgs {
	row: Record<string, unknown>;
	column: { name: string; jsType: string; title?: string; fmt?: string };
	columnIndex: number;
}

export interface ExcelExportMetadata {
	title?: string;
	subtitle?: string;
}

export interface SingleDataExportOptions {
	filename: string;
	worksheetName?: string;
	data: Record<string, unknown>[];
	filterInternalColumns?: boolean;
	columns?: { name: string; jsType: string; title?: string; fmt?: string }[];
	getCellStyle?: (args: GetCellStyleArgs) => CellStyle | undefined;
	metadata?: ExcelExportMetadata;
}

export interface ExcelExportNamesOptions {
	title?: string;
	fallbackFilename: string;
	fallbackWorksheetName?: string;
}

export interface MultiSheetExportOptions {
	filename: string;
	queryInfoContext: QueryInfoContext;
	onError?: (message: string, description?: string) => void;
	onSuccess?: () => void;
}

export interface PageExcelExportOptions {
	pageName: string;
	queryInfoContext: QueryInfoContext;
	onError?: (message: string, description?: string) => void;
	onSuccess?: () => void;
}

const defaultPageExcelExportErrorHandler = (message: string, description?: string): void => {
	toast.error(message, { description });
};

function getExcelExportTimestamp(): string {
	return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
}

function buildPageExcelFilename(pageName: string): string {
	return `${pageName}_${getExcelExportTimestamp()}`;
}

export async function downloadPageDataAsExcel({
	pageName,
	queryInfoContext,
	onError = defaultPageExcelExportErrorHandler,
	onSuccess
}: PageExcelExportOptions): Promise<void> {
	const filename = buildPageExcelFilename(pageName);

	await downloadPageAsExcel({
		filename,
		queryInfoContext,
		onError,
		onSuccess
	});
}

function getExcelFormat(evidenceFormat: string): string | null {
	// `quarter` has no Excel equivalent — the cell value is pre-formatted as a
	// string elsewhere, so don't set a numFmt here.
	if (evidenceFormat === 'quarter') return null;
	if (evidenceFormat in FORMAT_PRESETS) {
		return FORMAT_PRESETS[evidenceFormat as keyof typeof FORMAT_PRESETS];
	}
	if (BASE_AUTO_FORMATS.includes(evidenceFormat as (typeof BASE_AUTO_FORMATS)[number])) {
		if (evidenceFormat === 'pct') {
			return FORMAT_PRESETS.pct1;
		}
		const defaultFormat = `${evidenceFormat}0` as keyof typeof FORMAT_PRESETS;
		if (defaultFormat in FORMAT_PRESETS) {
			return FORMAT_PRESETS[defaultFormat];
		}
	}
	return evidenceFormat.replace(/'/g, '"');
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
 * Triggers a file download
 */
function triggerDownload(blob: Blob, filename: string): void {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
	document.body.appendChild(link);
	link.click();
	link.parentNode?.removeChild(link);
	window.URL.revokeObjectURL(url);
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

	// "History" is a reserved name in Excel
	if (sanitized.toLowerCase() === 'history') {
		sanitized = 'History Data';
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

export function addDataToWorksheet(
	worksheet: ExcelJS.Worksheet,
	data: Record<string, unknown>[],
	columns?: { name: string; jsType: string; fmt?: string; title?: string }[],
	getCellStyle?: (args: GetCellStyleArgs) => CellStyle | undefined,
	metadata?: ExcelExportMetadata
): void {
	if (!data.length) return;

	const processedData = filterInternalColumns(data);
	if (processedData.length === 0) return;

	const columnNames = columns
		? columns
				.map((col) => col.name)
				.filter((name) => !name.startsWith('__ev_') || name.includes('_comparison'))
		: Object.keys(processedData[0]);

	const title = metadata?.title?.trim();
	const subtitle = metadata?.subtitle?.trim();
	if (title) {
		const titleRow = worksheet.addRow([title]);
		titleRow.font = { bold: true, name: 'Arial', size: 14 };
	}
	if (subtitle) {
		const subtitleRow = worksheet.addRow([subtitle]);
		subtitleRow.font = { italic: true, name: 'Arial' };
	}
	if (title || subtitle) {
		worksheet.addRow([]);
	}

	const headers = columnNames.map((name) => {
		const column = columns?.find((col) => col.name === name);
		return column?.title || formatTitle(name);
	});
	const headerRow = worksheet.addRow(headers);
	headerRow.font = { bold: true, name: 'Arial' };
	headerRow.height = 18;

	columnNames.forEach((columnName, colIndex) => {
		const column = columns?.find((col) => col.name === columnName);
		const cell = headerRow.getCell(colIndex + 1);
		cell.border = { bottom: { style: 'thin' } };
		cell.alignment = {
			vertical: 'middle',
			...(column?.jsType === 'number' ? { horizontal: 'right' } : {})
		};
	});

	processedData.forEach((row, rowIndex) => {
		// getCellStyle receives the pre-filter row so hidden columns (e.g.
		// conditional-color hex) are still accessible.
		const originalRow = data[rowIndex];
		const values = columnNames.map((columnName) => {
			let value = row[columnName];
			const column = columns?.find((col) => col.name === columnName);

			// ClickHouse Decimal types are returned as strings
			if (column?.jsType === 'number' && typeof value === 'string' && value !== '') {
				const numValue = Number(value);
				if (!isNaN(numValue)) {
					value = numValue;
				}
			}

			// Quarter has no Excel numFmt equivalent — match on-screen output by
			// pre-formatting the value to a string ("2024-Q1").
			if (column?.fmt === 'quarter') {
				const quarter = formatAsQuarter(value);
				if (quarter !== null) value = quarter;
			}

			return value;
		});
		const dataRow = worksheet.addRow(values);
		dataRow.height = 18;

		columnNames.forEach((columnName, colIndex) => {
			const column = columns?.find((col) => col.name === columnName);
			const cell = dataRow.getCell(colIndex + 1); // ExcelJS uses 1-based indexing
			cell.font = { name: 'Arial' };
			if (column?.fmt) {
				const excelFormat = getExcelFormat(column.fmt);
				if (excelFormat !== null) {
					cell.numFmt = excelFormat;
				}
			}
			cell.alignment = {
				vertical: 'middle',
				...(column?.jsType === 'number' ? { horizontal: 'right' } : {})
			};

			if (getCellStyle && column) {
				const style = getCellStyle({
					row: originalRow,
					column,
					columnIndex: colIndex
				});
				if (style?.font) {
					cell.font = { ...cell.font, ...style.font };
				}
				if (style?.border) {
					cell.border = { ...cell.border, ...style.border };
				}
			}
		});
	});

	// Adjust column widths based on content
	const metadataLength = Math.max(title?.length ?? 0, subtitle?.length ?? 0);
	worksheet.columns.forEach((column, index) => {
		if (!column) return;

		const columnName = columnNames[index];
		const columnMeta = columns?.find((col) => col.name === columnName);
		const displayTitle = columnMeta?.title || formatTitle(columnName);

		let maxLength = displayTitle.length;

		const sampleRows = processedData.slice(0, 10);
		sampleRows.forEach((row) => {
			const value = row[columnName];
			if (value !== null && value !== undefined) {
				const cellLength = String(value).length;
				if (cellLength > maxLength) {
					maxLength = cellLength;
				}
			}
		});

		column.width = Math.min(maxLength + 2, 50);
	});

	const firstColumn = worksheet.getColumn(1);
	firstColumn.width = Math.max(firstColumn.width ?? 0, Math.min(metadataLength + 2, 50));
}

/**
 * Export a single dataset to Excel
 */
export async function downloadAsExcel({
	filename,
	worksheetName = 'Data',
	data,
	columns,
	getCellStyle,
	metadata
}: SingleDataExportOptions): Promise<void> {
	if (!data.length) {
		logger.warn('No data available to download');
		return;
	}

	try {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet(sanitizeWorksheetName(worksheetName));
		worksheet.views = [{ showGridLines: false }];

		addDataToWorksheet(worksheet, data, columns, getCellStyle, metadata);

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		triggerDownload(blob, filename);
	} catch (error) {
		logger.error(error, 'Error downloading Excel file');
		throw error;
	}
}

/**
 * Export all queries from a page to a multi-sheet Excel file
 */
export async function downloadPageAsExcel({
	filename,
	queryInfoContext,
	onError,
	onSuccess
}: MultiSheetExportOptions): Promise<void> {
	try {
		if (!queryInfoContext || queryInfoContext.queryInfoMap.size === 0) {
			onError?.(
				'No queries found on this page',
				'Make sure the page contains tables, charts, or other components with data.'
			);
			return;
		}

		const workbook = new ExcelJS.Workbook();
		let hasData = false;

		// Track used sheet names for deduplication (case-insensitive)
		const usedNames = new Set<string>();

		// Add a sheet for each query
		for (const [componentId, queryInfo] of queryInfoContext.queryInfoMap) {
			try {
				// Skip input/filter and logic/conditional components based on their schema category
				const userComponent = tags[queryInfo.tag];
				if (userComponent && EXCLUDED_EXPORT_CATEGORIES.has(userComponent.schema.category)) {
					continue;
				}

				const query = queryInfo.query;

				// Skip if query has no results or is loading
				if (!query.result || query.loading || query.result.error || !query.result.rows?.length) {
					continue;
				}

				// Create worksheet - use title if available, otherwise format tag name
				const sheetName = getUniqueSheetName(
					queryInfo.title || formatTitle(queryInfo.tag),
					usedNames
				);

				const worksheet = workbook.addWorksheet(sheetName);
				worksheet.views = [{ showGridLines: false }];

				addDataToWorksheet(worksheet, query.result.rows, query.result.columns);

				if (worksheet.rowCount > 0) {
					hasData = true;
				}
			} catch (err) {
				logger.error({ err }, `Error processing query ${componentId}`);
				// Add an error sheet for failed queries
				const errorSheetName = getUniqueSheetName(
					`Error - ${formatTitle(queryInfo.tag)}`,
					usedNames
				);

				const errorSheet = workbook.addWorksheet(errorSheetName);
				errorSheet.views = [{ showGridLines: false }];
				errorSheet.addRow(['Error', 'Message']);
				errorSheet.addRow([
					`Failed to process query: ${componentId}`,
					err instanceof Error ? err.message : 'Unknown error'
				]);
			}
		}

		if (!hasData) {
			onError?.(
				'No data available for export',
				'The queries on this page have no results or encountered errors.'
			);
			return;
		}

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		triggerDownload(blob, filename);
		onSuccess?.();
	} catch (error) {
		logger.error('Error downloading page data');
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

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', csvFilename);
	document.body.appendChild(link);
	link.click();
	link.parentNode?.removeChild(link);
	window.URL.revokeObjectURL(url);
}
