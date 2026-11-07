import { describe, expect, it } from 'vitest';
import { generatePivotData, type PivotConfig, type PivotResult } from '../../common/pivot-utils';
import type { DataPoint } from '../../types';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import { buildTableExcelSheet } from './table-export';
import { CALIBRI_11 } from '../../../shims/excel/font';
import type { ExcelSheet, SheetCell } from '../../../shims/excel/workbook';

function makePCE(alias: string, type: 'dimension' | 'measure', hasAgg: boolean) {
	return {
		sqlWithAlias: type === 'measure' ? `sum(${alias}) AS ${alias}` : alias,
		sqlWithoutAlias: type === 'measure' ? `sum(${alias})` : alias,
		sqlWithoutDateFiltersOrAlias: type === 'measure' ? `sum(${alias})` : alias,
		alias,
		displayAlias: alias,
		type,
		isComplexExpression: false,
		hasAgg,
		isTemporalDateGrain: false,
		hasDateGrain: false,
		hasDateRange: false,
		isTableComparison: false,
		isTableSparkline: false
	};
}

const unifiedColumns: UnifiedColumnDefinition[] = [
	{
		type: 'dimension',
		sqlWithAlias: 'geography',
		alias: 'geography',
		columnIdForRendering: 'geography',
		processedColumnExpression: makePCE('geography', 'dimension', false),
		title: 'Geography'
	},
	...['category', 'item'].map(
		(alias): UnifiedColumnDefinition => ({
			type: 'pivot',
			sqlWithAlias: alias,
			alias,
			columnIdForRendering: alias,
			processedColumnExpression: makePCE(alias, 'dimension', false)
		})
	),
	{
		type: 'measure',
		sqlWithAlias: 'sum(acv) AS acv',
		sqlWithoutAlias: 'sum(acv)',
		alias: 'acv',
		columnIdForRendering: 'acv',
		processedColumnExpression: makePCE('acv', 'measure', true),
		title: 'ACV Wtd Dist'
	},
	{
		type: 'measure',
		sqlWithAlias: 'sum(sales) AS sales',
		sqlWithoutAlias: 'sum(sales)',
		alias: 'sales',
		columnIdForRendering: 'sales',
		processedColumnExpression: makePCE('sales', 'measure', true),
		title: 'Sales'
	}
];

const detailRows = [
	{
		geography: 'East',
		category: 'Dressings',
		item: 'Avocado',
		acv: 10,
		sales: 100,
		__ev_render_type: 'cell_data',
		__ev_subtotal_level: null,
		__ev_grouping_category: 0,
		__ev_grouping_item: 0
	},
	{
		geography: 'East',
		category: 'Dressings',
		item: 'Balsamic',
		acv: 20,
		sales: 200,
		__ev_render_type: 'cell_data',
		__ev_subtotal_level: null,
		__ev_grouping_category: 0,
		__ev_grouping_item: 0
	},
	{
		geography: 'East',
		category: 'Sauces',
		item: 'Marinara',
		acv: 30,
		sales: 300,
		__ev_render_type: 'cell_data',
		__ev_subtotal_level: null,
		__ev_grouping_category: 0,
		__ev_grouping_item: 0
	}
] as DataPoint[];

const totalRows = [
	{
		geography: 'East',
		category: 'Dressings',
		item: null,
		acv: 30,
		sales: 300,
		__ev_render_type: 'column_subtotal',
		__ev_subtotal_level: 1,
		__ev_grouping_category: 0,
		__ev_grouping_item: 1
	},
	{
		geography: 'East',
		category: null,
		item: null,
		acv: 60,
		sales: 600,
		__ev_render_type: 'column_total',
		__ev_subtotal_level: 0,
		__ev_grouping_category: 1,
		__ev_grouping_item: 1
	}
] as DataPoint[];

function makePivotResult({
	pivots,
	measures,
	measuresFirst = false,
	subtotals = false,
	showTotalColumn = false,
	showSubtotalColumns = false
}: {
	pivots: string[];
	measures: string[];
	measuresFirst?: boolean;
	subtotals?: boolean;
	showTotalColumn?: boolean;
	showSubtotalColumns?: boolean;
}): PivotResult {
	const configuredColumns = new Set(['geography', ...pivots, ...measures]);
	const config: PivotConfig = {
		dimensions: ['geography'],
		pivots,
		measures,
		measuresFirst,
		subtotals,
		showTotalColumn,
		showSubtotalColumns,
		columnTypes: new Map(
			(
				[
					['geography', 'string'],
					['category', 'string'],
					['item', 'string'],
					['acv', 'number'],
					['sales', 'number']
				] as [string, string][]
			).filter(([alias]) => configuredColumns.has(alias))
		),
		unifiedColumns: unifiedColumns.filter((column) =>
			configuredColumns.has(column.columnIdForRendering)
		)
	};

	return generatePivotData(subtotals ? [...detailRows, ...totalRows] : [...detailRows], config);
}

/** The header rows of an exported table (the rows above the frozen pane). */
function headerRows(sheet: ExcelSheet): SheetCell[][] {
	return (sheet.rows as SheetCell[][]).slice(0, sheet.freezePane?.rows ?? 0);
}

/**
 * Each column's header path, top level first. Spanning labels are written once, in their
 * first column, and centered across the empty cells that follow, so carry them right.
 */
function getHeaderPaths(sheet: ExcelSheet): string[][] {
	const rows = headerRows(sheet);
	const width = rows[rows.length - 1].length;
	return Array.from({ length: width }, (_, column) =>
		rows
			.map((row, level) => {
				const isBottom = level === rows.length - 1;
				for (let c = column; c >= 0; c--) {
					const cell = row[c];
					if (cell?.value) return String(cell.value);
					if (isBottom || cell?.style?.alignment?.horizontal !== 'centerContinuous') return '';
				}
				return '';
			})
			.filter(Boolean)
	);
}

function getBottomHeaders(result: PivotResult): unknown[] {
	const rows = headerRows(buildTableExcelSheet(result, { font: CALIBRI_11 }));
	return rows[rows.length - 1].map((cell) => cell.value);
}

describe('table Excel export headers', () => {
	it('uses pivot values instead of the titled measure for a single pivot and measure', () => {
		const result = makePivotResult({ pivots: ['item'], measures: ['acv'] });

		expect(getBottomHeaders(result)).toEqual(['Geography', 'Avocado', 'Balsamic', 'Marinara']);
	});

	it('multi-pivot renders the pivot hierarchy as header rows, as on screen', () => {
		const result = makePivotResult({ pivots: ['category', 'item'], measures: ['acv'] });
		const sheet = buildTableExcelSheet(result, { font: CALIBRI_11 });

		expect(headerRows(sheet).map((row) => row.map((cell) => cell.value ?? null))).toEqual([
			[null, 'Dressings', null, 'Sauces'],
			['Geography', 'Avocado', 'Balsamic', 'Marinara']
		]);
		expect(getHeaderPaths(sheet)).toEqual([
			['Geography'],
			['Dressings', 'Avocado'],
			['Dressings', 'Balsamic'],
			['Sauces', 'Marinara']
		]);
	});

	// With >1 measure the leaf header row is the measure name; the pivot path must stay
	// visible above it so ACV and Sales columns are never ambiguous.
	it('multi-measure keeps the pivot path AND the measure on every column', () => {
		const result = makePivotResult({ pivots: ['category', 'item'], measures: ['acv', 'sales'] });
		const paths = getHeaderPaths(buildTableExcelSheet(result, { font: CALIBRI_11 })).slice(1); // drop the Geography dimension col

		expect(paths).toContainEqual(['Dressings', 'Avocado', 'ACV Wtd Dist']);
		expect(paths).toContainEqual(['Dressings', 'Avocado', 'Sales']);
		expect(new Set(paths.map((path) => path.join('/'))).size).toBe(paths.length);
	});

	it('a non-pivot table keeps the plain measure titles', () => {
		const result = makePivotResult({ pivots: [], measures: ['acv', 'sales'] });

		expect(getBottomHeaders(result)).toEqual(['Geography', 'ACV Wtd Dist', 'Sales']);
	});

	it.each([
		{
			name: 'measure-first columns',
			options: { pivots: ['category', 'item'], measures: ['acv', 'sales'], measuresFirst: true }
		},
		{
			name: 'visible total and subtotal columns',
			options: {
				pivots: ['category', 'item'],
				measures: ['acv', 'sales'],
				subtotals: true,
				showTotalColumn: true,
				showSubtotalColumns: true
			}
		}
	])('every column header path is distinct and names its measure ($name)', ({ options }) => {
		const result = makePivotResult(options);
		const paths = getHeaderPaths(buildTableExcelSheet(result, { font: CALIBRI_11 })).slice(1); // drop the dimension col

		expect(paths.length).toBeGreaterThan(0);
		expect(paths.every((path) => path.includes('ACV Wtd Dist') || path.includes('Sales'))).toBe(
			true
		);
		expect(new Set(paths.map((path) => path.join('/'))).size).toBe(paths.length);
	});
});
