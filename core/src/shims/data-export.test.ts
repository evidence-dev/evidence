import { describe, expect, it } from 'vitest';
import { buildDataSheet, getExcelExportNames, sanitizeWorksheetName } from './data-export';
import { CELL_PADDING_PX, sanitizeFilename, writeWorkbook } from './excel/workbook';
import { resolveExcelPalette, toExcelRgb } from './excel/palette';
import { CALIBRI_11, measureTextPx, pxToColumnWidth } from './excel/font';

const font = CALIBRI_11;
import { cellAt, readZipEntry, roundTripSheet } from '../test-utils/xlsx';

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

describe('sanitizeFilename', () => {
	it('keeps titles readable while making them valid filenames everywhere', () => {
		expect(sanitizeFilename('Brand Rank • Total US Food (52W 10/4/26).xlsx')).toBe(
			'Brand Rank • Total US Food (52W 10-4-26).xlsx'
		);
		expect(sanitizeFilename('Q1: "Revenue" <by> region?.csv')).toBe('Q1 Revenue by region.csv');
		expect(sanitizeFilename('back\\slash  and   spaces. ')).toBe('back-slash and spaces');
		expect(sanitizeFilename('???')).toBe('download');
	});
});

describe('sanitizeWorksheetName', () => {
	it('renames Excel’s reserved History sheet, even inside quotes', () => {
		expect(sanitizeWorksheetName('History')).toBe('History Data');
		expect(sanitizeWorksheetName("'History'")).toBe('History Data');
	});
});

describe('buildDataSheet', () => {
	const columns = [
		{ name: 'region', jsType: 'string', title: 'Region' },
		{ name: 'sales', jsType: 'number', title: 'Sales' }
	];

	it('exports only column headers and data rows', async () => {
		const sheet = await roundTripSheet(
			buildDataSheet([{ region: 'East', sales: '12.5' }], columns, { font })
		);

		expect(sheet.rows).toEqual([
			['Region', 'Sales'],
			['East', 12.5]
		]);
		expect(cellAt(sheet, 0, 0)?.style?.font?.bold).toBe(true);
		expect(cellAt(sheet, 0, 1)?.style?.font?.bold).toBe(true);
	});

	it('places the export title and subtitle above the table data', async () => {
		const sheet = await roundTripSheet(
			buildDataSheet([{ region: 'East', sales: '12.5' }], columns, {
				font,
				metadata: {
					title: 'Client Deep Dive',
					subtitle: 'Acme · L4 WE 2026-07-12 · 5 Boroughs'
				}
			})
		);

		expect(sheet.rows).toHaveLength(5);
		expect(sheet.rows[0][0]).toBe('Client Deep Dive');
		expect(cellAt(sheet, 0, 0)?.style?.font).toMatchObject({ bold: true, size: 13 });
		expect(sheet.rows[1][0]).toBe('Acme · L4 WE 2026-07-12 · 5 Boroughs');
		expect(cellAt(sheet, 1, 0)?.style?.font?.color?.rgb).toMatch(
			new RegExp(`${toExcelRgb(resolveExcelPalette().mutedForeground)}$`)
		);
		expect(sheet.rows[2].every((value) => value === null)).toBe(true);
		expect(sheet.rows[3][0]).toBe('Region');
		expect(sheet.rows[4][0]).toBe('East');
	});

	it('autofits columns to the header and data but not the title or subtitle', async () => {
		const sheet = await roundTripSheet(
			buildDataSheet([{ region: 'East', sales: 12.5 }], columns, {
				font,
				metadata: {
					title: 'A title much longer than any value in the first column',
					subtitle: 'And a subtitle that is longer still than the title above it'
				}
			})
		);

		const fit = (text: string) =>
			pxToColumnWidth(measureTextPx(text, CALIBRI_11, true) + CELL_PADDING_PX, CALIBRI_11);
		expect(sheet.columns?.[0]?.width).toBe(fit('Region'));
		expect(sheet.columns?.[1]?.width).toBe(fit('Sales'));
	});

	it('styles the sheet like a report table: header rule, row lines, frozen header, no gridlines', async () => {
		const palette = resolveExcelPalette();
		const sheet = await roundTripSheet(
			buildDataSheet([{ region: 'East', sales: 1 }], columns, { font })
		);
		const header = cellAt(sheet, 0, 1)?.style;
		const data = cellAt(sheet, 1, 1)?.style;

		expect(sheet.view?.showGridLines).toBe(false);
		expect(sheet.freezePane).toEqual({ rows: 1 });
		expect(header?.alignment?.horizontal).toBe('right');
		expect(header?.border?.bottom?.color?.rgb).toMatch(
			new RegExp(`${toExcelRgb(palette.emphasisBorder)}$`)
		);
		expect(data?.border?.bottom?.color?.rgb).toMatch(
			new RegExp(`${toExcelRgb(palette.rowBorder)}$`)
		);
		expect(data?.alignment?.horizontal).toBe('right');
	});

	it('writes dates as Excel dates and applies column formats', async () => {
		const sheet = await roundTripSheet(
			buildDataSheet(
				[{ day: '2024-03-15', revenue: 1234.5, units: 1234567 }],
				[
					{ name: 'day', jsType: 'date' },
					{ name: 'revenue', jsType: 'number', fmt: 'usd2' },
					{ name: 'units', jsType: 'number' }
				],
				{ font }
			)
		);

		const day = cellAt(sheet, 1, 0);
		expect(day?.type).toBe('date');
		expect((day?.value as Date).toISOString().slice(0, 10)).toBe('2024-03-15');
		expect(day?.style?.numFmt).toBe('yyyy-mm-dd');
		expect(cellAt(sheet, 1, 1)?.style?.numFmt).toBe('$#,##0.00');
		// Unformatted numbers stay in Excel's General format.
		expect(sheet.rows[1][2]).toBe(1234567);
		expect(cellAt(sheet, 1, 2)?.style?.numFmt ?? 'General').toBe('General');
	});

	it('uses Calibri 11 as the workbook font', async () => {
		const bytes = await writeWorkbook(
			[{ ...buildDataSheet([{ a: 1 }], undefined, { font }), name: 'Data' }],
			font
		);
		const styles = readZipEntry(bytes, 'xl/styles.xml');
		const [firstFont] = styles.match(/<font>.*?<\/font>/s) ?? [];

		expect(firstFont).toContain('<sz val="11"/>');
		expect(firstFont).toContain('<name val="Calibri"/>');
	});
});
