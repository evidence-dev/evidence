import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { addDataToWorksheet, getExcelExportNames } from './data-export';

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
