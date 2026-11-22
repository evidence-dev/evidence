import { describe, expect, it } from 'vitest';
import {
	buildDataSheet,
	buildPageWorkbook,
	getExcelExportNames,
	sanitizeWorksheetName
} from './data-export';
import type { QueryInfoContext } from '../query-info-context.svelte';
import { CELL_PADDING_PX, sanitizeFilename, writeWorkbook } from './excel/workbook';
import { resolveExcelPalette, toExcelRgb } from './excel/palette';
import { CALIBRI_11, measureTextPx, pxToColumnWidth } from './excel/font';
import { cellAt, readWorkbook, readZipEntry, roundTripSheet } from '../test-utils/xlsx';

const font = CALIBRI_11;

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

	it('keeps timestamps’ time, and dates Excel can’t hold as the query returned them', async () => {
		const sheet = await roundTripSheet(
			buildDataSheet(
				[
					{ at: '2024-01-15 13:45:00' },
					{ at: '2024-01-15' },
					{ at: '1850-06-01' },
					{ at: 'not a date' }
				],
				[{ name: 'at', jsType: 'date' }],
				{ font }
			)
		);

		expect(cellAt(sheet, 1, 0)?.style?.numFmt).toBe('yyyy-mm-dd hh:mm:ss');
		expect((cellAt(sheet, 1, 0)?.value as Date).toISOString()).toBe('2024-01-15T13:45:00.000Z');
		expect(cellAt(sheet, 2, 0)?.style?.numFmt).toBe('yyyy-mm-dd');
		expect(sheet.rows.slice(3).map((row) => row[0])).toEqual(['1850-06-01', 'not a date']);
	});

	it('writes text that spells an Excel error as text, not an error cell', async () => {
		const bytes = await writeWorkbook(
			[{ ...buildDataSheet([{ code: '#N/A' }], undefined, { font }), name: 'Data' }],
			font
		);
		const xml = readZipEntry(bytes, 'xl/worksheets/sheet1.xml');

		expect(xml).toContain('<c r="A2" t="s"');
		expect(xml).not.toContain('t="e"');
	});

	it('writes an explicit height on the header and every data row', () => {
		const data = Array.from({ length: 80 }, (_, i) => ({ region: `R${i}`, sales: i }));
		const sheet = buildDataSheet(data, columns, { font });

		expect([...(sheet.rowDefs?.keys() ?? [])]).toHaveLength(81);
		expect([...(sheet.rowDefs?.values() ?? [])].every(({ height }) => height === 18)).toBe(true);
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

describe('buildPageWorkbook', () => {
	function contextWith(
		entries: {
			tag: string;
			title?: string;
			rows: Record<string, unknown>[];
			loading?: boolean;
			error?: string;
		}[]
	): Pick<QueryInfoContext, 'queryInfoMap'> {
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
			) as unknown as QueryInfoContext['queryInfoMap']
		};
	}

	async function readSheets(buffer: ArrayBuffer) {
		return (await readWorkbook(buffer)).sheets;
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
		expect(sheets[0].rows[1][0]).toBe('East');
		expect(sheets[0].rows[2][0]).toBe('West');
		expect(sheets[1].rows[1][0]).toBe('North');
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
