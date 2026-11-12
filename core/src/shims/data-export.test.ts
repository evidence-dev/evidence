import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
	addDataToWorksheet,
	buildPageWorkbook,
	getExcelExportNames,
	type ExportableQueryInfoContext
} from './data-export';

describe('getExcelExportNames', () => {
	it('uses trimmed title for the filename and worksheet name', () => {
		expect(
			getExcelExportNames({
				title: ' Revenue by Region ',
				fallbackFilename: 'table_data'
			})
		).toEqual({
			filename: 'Revenue by Region',
			worksheetName: 'Revenue by Region'
		});
	});

	it('falls back when no title is present', () => {
		expect(
			getExcelExportNames({
				title: '   ',
				fallbackFilename: 'table_data'
			})
		).toEqual({
			filename: 'table_data',
			worksheetName: 'Data'
		});
	});
});

describe('addDataToWorksheet', () => {
	it('exports only column headers and data rows', () => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Data');

		addDataToWorksheet(
			worksheet,
			[{ region: 'East', sales: '12.5' }],
			[
				{ name: 'region', jsType: 'string', title: 'Region' },
				{ name: 'sales', jsType: 'number', title: 'Sales' }
			],
			undefined
		);

		expect(worksheet.rowCount).toBe(2);
		expect(worksheet.getRow(1).getCell(1).value).toBe('Region');
		expect(worksheet.getRow(1).getCell(2).value).toBe('Sales');
		expect(worksheet.getRow(1).font.bold).toBe(true);
		expect(worksheet.getRow(2).getCell(1).value).toBe('East');
		expect(worksheet.getRow(2).getCell(2).value).toBe(12.5);
	});

	it('places the export title and subtitle above the table data', async () => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Data');

		addDataToWorksheet(
			worksheet,
			[{ region: 'East', sales: '12.5' }],
			[
				{ name: 'region', jsType: 'string', title: 'Region' },
				{ name: 'sales', jsType: 'number', title: 'Sales' }
			],
			undefined,
			{
				title: 'Client Deep Dive',
				subtitle: 'Acme · L4 WE 2026-07-12 · 5 Boroughs'
			}
		);

		const exportedWorkbook = new ExcelJS.Workbook();
		await exportedWorkbook.xlsx.load(await workbook.xlsx.writeBuffer());
		const exportedWorksheet = exportedWorkbook.getWorksheet('Data')!;

		expect(exportedWorksheet.rowCount).toBe(5);
		expect(exportedWorksheet.getRow(1).getCell(1).value).toBe('Client Deep Dive');
		expect(exportedWorksheet.getRow(1).font).toMatchObject({ bold: true, size: 14 });
		expect(exportedWorksheet.getRow(2).getCell(1).value).toBe(
			'Acme · L4 WE 2026-07-12 · 5 Boroughs'
		);
		expect(exportedWorksheet.getRow(2).font).toMatchObject({ italic: true });
		expect(exportedWorksheet.getRow(3).values).toEqual([]);
		expect(exportedWorksheet.getRow(4).getCell(1).value).toBe('Region');
		expect(exportedWorksheet.getRow(5).getCell(1).value).toBe('East');
		expect(exportedWorksheet.getColumn(1).width).toBe(
			Math.min('Acme · L4 WE 2026-07-12 · 5 Boroughs'.length + 2, 50)
		);
		expect(exportedWorksheet.getColumn(2).width).toBe('Sales'.length + 2);
	});
});

describe('buildPageWorkbook', () => {
	function contextWith(
		entries: {
			tag: string;
			title?: string;
			rows: Record<string, unknown>[];
			loading?: boolean;
			error?: string;
		}[]
	): ExportableQueryInfoContext {
		return {
			queryInfoMap: new Map(
				entries.map((entry, i) => [
					`component-${i}`,
					{
						tag: entry.tag,
						title: entry.title,
						query: {
							loading: entry.loading ?? false,
							result: {
								rows: entry.rows,
								error: entry.error,
								columns: Object.keys(entry.rows[0] ?? {}).map((name) => ({
									name,
									jsType: 'string'
								}))
							}
						}
					}
				])
			) as unknown as ExportableQueryInfoContext['queryInfoMap']
		};
	}

	async function readSheets(buffer: ArrayBuffer) {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);
		return workbook.worksheets;
	}

	it('writes one sheet per component with data, skipping inputs and loading queries', async () => {
		const buffer = await buildPageWorkbook({
			queryInfoContext: contextWith([
				{ tag: 'table', title: 'Orders', rows: [{ region: 'East' }, { region: 'West' }] },
				{ tag: 'table', title: 'Orders', rows: [{ region: 'North' }] },
				{ tag: 'button_group', title: 'Region picker', rows: [{ region: 'East' }] },
				{ tag: 'table', title: 'Pending', rows: [{ region: 'South' }], loading: true }
			])
		});

		expect(buffer).not.toBeNull();
		const magic = new Uint8Array(buffer!).slice(0, 2);
		expect(Array.from(magic)).toEqual([0x50, 0x4b]);
		const sheets = await readSheets(buffer!);
		expect(sheets.map((s) => s.name)).toEqual(['Orders', 'Orders 2']);
		expect(sheets[0].getRow(2).getCell(1).value).toBe('East');
		expect(sheets[0].getRow(3).getCell(1).value).toBe('West');
		expect(sheets[1].getRow(2).getCell(1).value).toBe('North');
	});

	it('returns null for empty, empty-rows, or error-only contexts', async () => {
		expect(await buildPageWorkbook({ queryInfoContext: contextWith([]) })).toBeNull();
		expect(
			await buildPageWorkbook({
				queryInfoContext: contextWith([
					{ tag: 'table', title: 'Empty', rows: [] },
					{ tag: 'table', title: 'Failed', rows: [{ region: 'East' }], error: 'Query failed' }
				])
			})
		).toBeNull();
	});
});
