import { describe, expect, it } from 'vitest';
import type { CellStyle } from 'hucre';
import type { ColumnMetaItem, HeaderCell, PivotResult, PivotRow } from '../../common/pivot-utils';
import { buildTableExcelSheet, type TableExcelOptions } from './table-export';
import { CALIBRI_11, columnWidthToPx, measureTextPx } from '../../../shims/excel/font';
import { calculateColorStyles } from './table-viz';
import { resolveExcelPalette, toExcelRgb, blendColors } from '../../../shims/excel/palette';
import { writeWorkbook, type SheetCell } from '../../../shims/excel/workbook';
import { readZipEntry, roundTripSheet, cellAt } from '../../../test-utils/xlsx';

const palette = resolveExcelPalette();
const rgb = (color: string) => toExcelRgb(color);

function meta(key: string, overrides: Partial<ColumnMetaItem> = {}): ColumnMetaItem {
	const isMeasure = overrides.columnType === 'measure';
	return {
		key,
		parts: [key],
		render_type: 'cell_data',
		columnType: 'dimension',
		alias: key,
		type: isMeasure ? 'number' : 'string',
		align: isMeasure ? 'right' : 'left',
		fmt: undefined,
		...overrides
	};
}

function measure(key: string, overrides: Partial<ColumnMetaItem> = {}): ColumnMetaItem {
	return meta(key, { columnType: 'measure', type: 'number', align: 'right', ...overrides });
}

function dataRow(values: Record<string, unknown>, overrides: Partial<PivotRow> = {}): PivotRow {
	return { render_type: 'cell_data', subtotal_level: null, ...values, ...overrides } as PivotRow;
}

/** A one-header-row table of `columnMeta` columns, with `dimensionCount` leading dimensions. */
function table(
	columnMeta: ColumnMetaItem[],
	rows: PivotRow[],
	{
		dimensionCount = columnMeta.filter((m) => m.columnType === 'dimension').length,
		headerLevels,
		tableType = 'pivot'
	}: {
		dimensionCount?: number;
		headerLevels?: HeaderCell[][];
		tableType?: PivotResult['tableType'];
	} = {}
): PivotResult {
	const columns = columnMeta.map((m) => m.key);
	return {
		columns,
		rows,
		dimensions: columns.slice(0, dimensionCount),
		columnMeta,
		tableType,
		headerLevels: headerLevels ?? [
			columnMeta.map((m, startIndex) => ({
				label: m.key,
				title: m.title,
				isDimension: m.columnType === 'dimension',
				render_type: m.render_type,
				startIndex,
				colspan: 1,
				align: m.align,
				headerType: m.columnType
			}))
		],
		config: {
			dimensions: columns.slice(0, dimensionCount),
			pivots: [],
			measures: columns.slice(dimensionCount),
			measuresFirst: false,
			subtotals: false
		}
	};
}

type BuildOptions = Omit<TableExcelOptions, 'font'>;

function build(result: PivotResult, options: BuildOptions = {}) {
	return buildTableExcelSheet(result, { font: CALIBRI_11, ...options });
}

/** The body rows; a cell written as a bare value (it matches its column's default) reads as `{ value }`. */
function body(result: PivotResult, options?: BuildOptions): SheetCell[][] {
	const sheet = build(result, options);
	return (sheet.rows as unknown[][])
		.slice(sheet.freezePane?.rows ?? 0)
		.map((row) =>
			row.map((cell) =>
				typeof cell === 'object' && cell !== null && !(cell instanceof Date)
					? (cell as SheetCell)
					: { value: cell as SheetCell['value'] }
			)
		);
}

function style(cell: SheetCell | undefined): CellStyle {
	return cell?.style ?? {};
}

describe('table Excel export: headers', () => {
	const groupedTable = table(
		[meta('region'), measure('sales'), measure('orders')],
		[dataRow({ region: 'East', sales: 10, orders: 2 })],
		{
			headerLevels: [
				[
					{
						label: '',
						isDimension: true,
						startIndex: 0,
						colspan: 1,
						align: 'left',
						headerType: 'dimension'
					},
					{
						label: 'Totals',
						isDimension: false,
						startIndex: 1,
						colspan: 2,
						align: 'center',
						headerType: 'column_group'
					}
				],
				[
					{
						label: 'region',
						isDimension: true,
						startIndex: 0,
						colspan: 1,
						align: 'left',
						headerType: 'dimension'
					},
					{
						label: 'sales',
						isDimension: false,
						startIndex: 1,
						colspan: 1,
						align: 'right',
						headerType: 'measure'
					},
					{
						label: 'orders',
						isDimension: false,
						startIndex: 2,
						colspan: 1,
						align: 'right',
						headerType: 'measure'
					}
				]
			]
		}
	);

	it('centers column group and pivot labels across their columns with an accounting underline', () => {
		const [groupRow] = build(groupedTable).rows as SheetCell[][];

		expect(groupRow.map((cell) => cell.value ?? null)).toEqual([null, 'Totals', null]);
		for (const cell of groupRow.slice(1)) {
			expect(style(cell).alignment?.horizontal).toBe('centerContinuous');
			expect(style(cell).font).toMatchObject({ bold: true, underline: 'singleAccounting' });
		}
		// No merged cells: the columns underneath stay sortable and selectable.
		expect(build(groupedTable).merges).toBeUndefined();
	});

	it('underlines the bottom header row', () => {
		const headerRow = (build(groupedTable).rows as SheetCell[][])[1];

		expect(headerRow.map((cell) => cell.value)).toEqual(['Region', 'Sales', 'Orders']);
		expect(style(headerRow[1]).border?.bottom?.color?.rgb).toBe(rgb(palette.emphasisBorder));
		expect(style(headerRow[1]).alignment?.horizontal).toBe('right');
	});

	it('freezes the header, the title above it, and freeze_columns', () => {
		const sheet = build(groupedTable, { title: 'Sales', freezeColumns: 1 });

		// Title, blank spacer, two header rows.
		expect(sheet.freezePane).toEqual({ rows: 4, columns: 1 });
		expect(sheet.view?.showGridLines).toBe(false);
		expect(sheet.pageSetup?.printTitlesRow).toBe('$3:$4');
	});
});

describe('table Excel export: rows', () => {
	const totalsTable = table(
		[
			meta('region'),
			measure('sales', { fmt: 'num0' }),
			measure('total', { fmt: 'num0', render_type: 'column_total' })
		],
		[
			dataRow({ region: 'East', sales: 1, total: 1 }),
			dataRow({ region: 'West', sales: 2, total: 2 }),
			dataRow({ region: 'Total', sales: 3, total: 3 }, { render_type: 'row_total' })
		]
	);

	it('styles totals like the report: bold, total fill, rule above; total columns tinted', () => {
		const [east, west, total] = body(totalsTable);

		expect(style(total[1]).font?.bold).toBe(true);
		expect(style(total[1]).fill).toMatchObject({ fgColor: { rgb: rgb(palette.totalFill) } });
		expect(style(total[0]).border?.top?.color?.rgb).toBe(rgb(palette.emphasisBorder));
		// The rule above the total replaces the row line under the row before it.
		expect(style(west[1]).border?.bottom).toBeUndefined();
		expect(style(east[1]).border?.bottom?.color?.rgb).toBe(rgb(palette.rowBorder));
		expect(style(east[2]).fill).toMatchObject({ fgColor: { rgb: rgb(palette.pivotFill) } });
		expect(style(east[2]).font?.bold).toBe(true);
	});

	it('shades alternate data rows and drops row lines when asked', () => {
		const [east, west] = body(totalsTable, { rowShading: true, rowLines: false });

		expect(style(east[0]).fill).toBeUndefined();
		expect(style(west[0]).fill).toMatchObject({ fgColor: { rgb: rgb(palette.rowShading) } });
		expect(style(east[0]).border?.bottom).toBeUndefined();
	});

	it('shows a merged dimension value once per group, unless values repeat', () => {
		const grouped = table(
			[meta('region'), meta('city'), measure('sales')],
			[
				dataRow({ region: 'East', city: 'Boston', sales: 1, __dimKey: 'East|~|Boston' }),
				dataRow({ region: 'East', city: 'NYC', sales: 2, __dimKey: 'East|~|NYC' }),
				dataRow(
					{ region: 'East', city: null, sales: 3, __dimKey: 'East|~|[[GROUPED]]' },
					{ render_type: 'row_subtotal', subtotal_level: 1 }
				)
			]
		);

		const merged = body(grouped, { grouping: { kind: 'merged', repeatValues: false } });
		expect(merged.map((row) => row[0].value)).toEqual(['East', null, 'East']);
		// The merged cell reads as one cell: no row line inside it.
		expect(style(merged[0][0]).border?.bottom).toBeUndefined();

		const repeated = body(grouped, { grouping: { kind: 'merged', repeatValues: true } });
		expect(repeated.map((row) => row[0].value)).toEqual(['East', 'East', 'East']);
	});

	it('mirrors collapsible groups as Excel outline groups in their current state', () => {
		const rows = [
			dataRow(
				{ region: 'East', city: null, sales: 3, __dimKey: 'East|~|[[GROUPED]]' },
				{ render_type: 'row_subtotal', subtotal_level: 1 }
			),
			dataRow({ region: 'East', city: 'Boston', sales: 1, __dimKey: 'East|~|Boston' }),
			dataRow({ region: 'East', city: 'NYC', sales: 2, __dimKey: 'East|~|NYC' }),
			dataRow(
				{ region: 'Total', city: null, sales: 3, __dimKey: '[[GROUPED]]|~|[[GROUPED]]' },
				{ render_type: 'row_total' }
			)
		];
		const sheet = build(table([meta('region'), meta('city'), measure('sales')], rows), {
			grouping: { kind: 'collapsible', collapsedGroups: new Set(['East']) }
		});
		const firstBodyRow = sheet.freezePane?.rows ?? 0;
		const defs = [0, 1, 2, 3].map((i) => sheet.rowDefs?.get(firstBodyRow + i));

		expect(sheet.outlineProperties).toEqual({ summaryBelow: false });
		expect(defs[0]).toMatchObject({ collapsed: true });
		expect(defs[0]?.outlineLevel).toBeUndefined();
		expect(defs[1]).toMatchObject({ outlineLevel: 1, hidden: true });
		expect(defs[2]).toMatchObject({ outlineLevel: 1, hidden: true });
		expect(defs[3]?.outlineLevel).toBeUndefined();
	});
});

describe('table Excel export: visualizations', () => {
	it('renders bars as Excel 2010 data bars on the report scale', async () => {
		const result = table(
			[
				meta('region'),
				measure('sales', { viz: 'bar' }),
				measure('hidden', { viz: 'bar', bar_options: { hide_labels: true, fit_to_data: true } })
			],
			[
				dataRow({ region: 'East', sales: -5, hidden: 4 }),
				dataRow({ region: 'West', sales: 10, hidden: 8 }),
				dataRow({ region: 'Total', sales: 5, hidden: 12 }, { render_type: 'row_total' })
			]
		);
		const sheet = build(result);
		const [bar, fitted] = sheet.conditionalRules ?? [];

		// Totals never get bars.
		expect(bar.range).toBe('B2:B3');
		expect(bar.dataBar).toMatchObject({
			cfvo: [
				{ type: 'num', value: '-5' },
				{ type: 'num', value: '10' }
			],
			color: rgb(blendColors(palette.background, palette.bar, 0.4)),
			negativeFillColor: rgb(blendColors(palette.background, palette.negative, 0.34)),
			gradient: false,
			minLength: 0,
			maxLength: 100,
			axisPosition: 'automatic'
		});
		expect(fitted.dataBar).toMatchObject({
			cfvo: [
				{ type: 'num', value: '4' },
				{ type: 'num', value: '8' }
			],
			axisPosition: 'none',
			showValue: false
		});

		const xml = readZipEntry(
			await writeWorkbook([{ ...sheet, name: 'Data' }], CALIBRI_11),
			'xl/worksheets/sheet1.xml'
		);
		expect(xml).toContain('<dataBar showValue="0">');
		expect(xml).toContain('gradient="0"');
		expect(xml).toContain('<x14:negativeFillColor rgb="FF');
		expect(xml).toMatch(/<x14:id>(\{[^}]+\})<\/x14:id>[\s\S]*<x14:cfRule type="dataBar" id="\1">/);
	});

	it('shades color-scale cells with the same static colors as the report', () => {
		const sales = measure('sales', { viz: 'color' });
		const rows = [dataRow({ region: 'East', sales: 1 }), dataRow({ region: 'West', sales: 9 })];
		const [east] = body(table([meta('region'), sales], rows));
		const expected = calculateColorStyles(
			sales,
			'sales',
			rows[0],
			{ min: 1, max: 9 },
			palette.colorScale
		)!;

		expect(style(east[1]).fill).toMatchObject({ fgColor: { rgb: rgb(expected.backgroundColor) } });
		expect(style(east[1]).font?.color?.rgb).toBe(rgb(expected.color));
		expect(style(east[1]).border?.bottom?.color?.rgb).toBe(rgb(expected.borderBottomColor));
	});

	it('colors deltas and red negatives, keeping the values numeric', () => {
		const result = table(
			[
				meta('region'),
				measure('change', { viz: 'delta', fmt: 'pct1' }),
				measure('cost', {
					viz: 'delta',
					fmt: 'num0',
					delta_options: {
						down_is_good: true,
						neutral_range: [-1, 1],
						show_symbol: true,
						symbol_position: 'right'
					}
				}),
				measure('net', { red_negatives: true, fmt: 'num0' })
			],
			[
				dataRow({ region: 'A', change: 0.1, cost: 5, net: -3 }),
				dataRow({ region: 'B', change: -0.2, cost: 0.5, net: 3 })
			]
		);
		const [a, b] = body(result);

		expect(a[1].value).toBe(0.1);
		expect(style(a[1]).numFmt).toBe('#,##0.0%');
		expect(style(a[1]).font?.color?.rgb).toBe(rgb(palette.positive));
		expect(style(b[1]).font?.color?.rgb).toBe(rgb(palette.negative));
		// down_is_good flips the colors; values inside the neutral range are gray.
		expect(style(a[2]).font?.color?.rgb).toBe(rgb(palette.negative));
		expect(style(b[2]).font?.color?.rgb).toBe(rgb(palette.neutral));
		expect(style(a[3]).font?.color?.rgb).toBe(rgb(palette.negative));
		expect(style(b[3]).font?.color).toBeUndefined();
	});

	it('draws sparklines from hidden columns past the table', async () => {
		const result = table(
			[
				meta('region'),
				measure('trend', {
					viz: 'sparkline',
					sparkline_options: { type: 'bar', x: 'date', date_grain: 'day', fit_to_data: false }
				})
			],
			[
				dataRow({
					region: 'East',
					trend: [
						[1, 3],
						[2, 5],
						[3, 4]
					]
				})
			]
		);
		const sheet = build(result);
		const roundTripped = await roundTripSheet(sheet, "East's Sales");

		expect(sheet.sparklines).toEqual([
			expect.objectContaining({ location: 'B2', type: 'column', displayHidden: true, manualMin: 0 })
		]);
		expect(roundTripped.rows[1].slice(3, 6)).toEqual([3, 5, 4]);
		expect(roundTripped.columns?.slice(3, 6).every((column) => column.hidden)).toBe(true);
		const xml = readZipEntry(
			await writeWorkbook([{ ...sheet, name: "East's Sales" }], CALIBRI_11),
			'xl/worksheets/sheet1.xml'
		);
		expect(xml).toContain("<xm:f>'East''s Sales'!D2:F2</xm:f>");
	});
});

describe('table Excel export: values', () => {
	it('keeps numbers and dates native with the report formats', async () => {
		const result = table(
			[
				meta('month', { type: 'date', fmt: 'mmm yyyy' }),
				meta('weekday', { type: 'number', fmt: 'ddd' }),
				measure('sales', { fmt: 'usd' })
			],
			[
				dataRow({ month: '2024-03-01', weekday: 2, sales: 1_250_000 }),
				dataRow({ month: '2024-04-01', weekday: 3, sales: 0 })
			],
			{ dimensionCount: 2 }
		);
		const sheet = await roundTripSheet(build(result));

		expect(cellAt(sheet, 1, 0)?.type).toBe('date');
		expect(cellAt(sheet, 1, 0)?.style?.numFmt).toBe('mmm yyyy');
		// A day-of-week number has no Excel date equivalent; it's written as the report shows it.
		expect(sheet.rows[1][1]).toBe('Mon');
		// usd auto-scales by column, like the report; zero drops the unit.
		expect(sheet.rows[1][2]).toBe(1_250_000);
		expect(cellAt(sheet, 1, 2)?.style?.numFmt).toBe('$#,##0.0,,"M"');
		expect(cellAt(sheet, 2, 2)?.style?.numFmt).toBe('$#,##0');
	});

	it('links cells, resolving report-relative links', () => {
		const result = table(
			[meta('site', { link: 'url' }), meta('page', { link: 'path', link_label: 'Open' })],
			[dataRow({ site: 'Evidence', url: 'https://evidence.dev', page: 'Home', path: '/home' })]
		);
		const [[site, page]] = body(result, {
			resolveLink: (href) => new URL(href, 'https://reports.example.com/app/').href
		});

		expect(site.hyperlink).toEqual({ target: 'https://evidence.dev/' });
		expect(style(site).font?.color?.rgb).toBe(rgb(palette.link));
		expect(page.value).toBe('Open');
		expect(page.hyperlink).toEqual({ target: 'https://reports.example.com/home' });
	});

	it('leaves out hidden and row-link columns', () => {
		const result = table(
			[meta('region'), meta('url'), measure('sales'), measure('secret', { hide: true })],
			[dataRow({ region: 'East', url: '/east', sales: 1, secret: 2 })]
		);

		expect(body(result, { hiddenColumns: new Set(['url']) })[0].map((cell) => cell.value)).toEqual([
			'East',
			1
		]);
	});

	it('wraps long text in wrapping columns and grows the row to fit', () => {
		const note =
			'A long note that will not fit on one line in a column capped at fifty characters wide';
		const sheet = build(
			table([meta('region'), meta('note', { wrap: true })], [dataRow({ region: 'East', note })], {
				dimensionCount: 2
			})
		);
		const bodyRow = sheet.freezePane?.rows ?? 0;

		expect(sheet.columns?.[1]?.width).toBe(50);
		expect(style((sheet.rows as SheetCell[][])[bodyRow][1]).alignment?.wrapText).toBe(true);
		expect(sheet.rowDefs?.get(bodyRow)?.height).toBeGreaterThan(18);
	});
});

describe('table Excel export: review cases', () => {
	it('never links unsafe URLs, but keeps the cell value', () => {
		const result = table(
			[meta('name', { link: 'url' })],
			[
				dataRow({ name: 'x', url: 'javascript:alert(1)' }),
				dataRow({ name: 'y', url: 'file:///C:/secrets.txt' })
			]
		);
		for (const [cell] of body(result)) {
			expect(cell.hyperlink).toBeUndefined();
			expect(style(cell).font?.color?.rgb).not.toBe(rgb(palette.link));
		}
		expect(body(result).map(([cell]) => cell.value)).toEqual(['x', 'y']);
	});

	it('shows HTML text ahead of a link label, as the table does', () => {
		const result = table(
			[meta('note', { html: true, link_label: 'Open' })],
			[dataRow({ note: '<b>Bold</b> &amp; plain' })]
		);
		expect(body(result)[0][0].value).toBe('Bold & plain');
	});

	describe('nested collapsible groups', () => {
		const rows = [
			dataRow(
				{
					region: 'East',
					city: null,
					store: null,
					sales: 6,
					__dimKey: 'East|~|[[GROUPED]]|~|[[GROUPED]]'
				},
				{ render_type: 'row_subtotal', subtotal_level: 1 }
			),
			dataRow(
				{
					region: 'East',
					city: 'Boston',
					store: null,
					sales: 6,
					__dimKey: 'East|~|Boston|~|[[GROUPED]]'
				},
				{ render_type: 'row_subtotal', subtotal_level: 2 }
			),
			dataRow({
				region: 'East',
				city: 'Boston',
				store: 'A',
				sales: 6,
				__dimKey: 'East|~|Boston|~|A'
			})
		];
		const nested = table([meta('region'), meta('city'), meta('store'), measure('sales')], rows);
		const outline = (collapsedGroups: Set<string>) => {
			const sheet = build(nested, { grouping: { kind: 'collapsible', collapsedGroups } });
			const first = sheet.freezePane?.rows ?? 0;
			return [0, 1, 2].map((i) => sheet.rowDefs?.get(first + i) ?? {});
		};

		it('nests each level one deeper, all visible when expanded', () => {
			const [region, city, store] = outline(new Set());
			expect(region.outlineLevel).toBeUndefined();
			expect(city).toEqual({ outlineLevel: 1 });
			expect(store).toEqual({ outlineLevel: 2 });
		});

		it('hides a collapsed group’s rows and marks its summary row', () => {
			const [, city, store] = outline(new Set(['East|~|Boston']));
			expect(city).toEqual({ outlineLevel: 1, collapsed: true });
			expect(store).toEqual({ outlineLevel: 2, hidden: true });
		});
	});

	it('autofits columns wide enough for the formatted value', () => {
		const sheet = build(
			table(
				[meta('region'), measure('sales', { fmt: 'num2' })],
				[dataRow({ region: 'East', sales: 1234567.89 })]
			)
		);
		const width = sheet.columns?.[1]?.width ?? 0;
		expect(columnWidthToPx(width, CALIBRI_11)).toBeGreaterThanOrEqual(
			measureTextPx('1,234,567.89', CALIBRI_11)
		);
	});
});

describe('table Excel export: column defaults', () => {
	it('gives each column its alignment and number format, and plain cells no style of their own', () => {
		const result = table(
			[meta('region'), measure('sales', { fmt: 'usd' })],
			[
				dataRow({ region: 'East', sales: 2_500_000 }),
				dataRow({ region: 'North', sales: 1_200_000 }),
				dataRow({ region: 'West', sales: 0 })
			]
		);
		const sheet = build(result, { rowLines: false });
		const [east, , west] = (sheet.rows as unknown[][]).slice(sheet.freezePane?.rows ?? 0);

		expect(sheet.columns?.[1]?.style).toMatchObject({
			numFmt: '$#,##0.0,,"M"',
			alignment: { horizontal: 'right', vertical: 'center' }
		});
		// Plain cells inherit the column format...
		expect(east).toEqual(['East', 2_500_000]);
		// ...and a cell that differs (zero drops the unit, as on screen) keeps its own style.
		expect(west[1]).toMatchObject({ value: 0, style: { numFmt: '$#,##0' } });
	});
});
