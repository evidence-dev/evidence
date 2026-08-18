import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { addDataToWorksheet } from '../../../shims/data-export';
import { generatePivotData, type PivotConfig, type PivotResult } from '../../common/pivot-utils';
import type { DataPoint } from '../../types';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import { buildTableExcelExportColumns } from './table-export';

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

	return generatePivotData(
		subtotals ? [...detailRows, ...totalRows] : [...detailRows],
		config
	);
}

function getExportedHeaders(result: PivotResult): unknown[] {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Data');
	addDataToWorksheet(worksheet, result.rows, buildTableExcelExportColumns(result));
	return (worksheet.getRow(1).values as unknown[]).slice(1);
}

describe('table Excel export headers', () => {
	it('uses pivot values instead of the titled measure for a single pivot and measure', () => {
		const result = makePivotResult({ pivots: ['item'], measures: ['acv'] });

		expect(getExportedHeaders(result)).toEqual([
			'Geography',
			'Avocado',
			'Balsamic',
			'Marinara'
		]);
	});

	it('multi-pivot combines the full pivot path so columns are unambiguous', () => {
		const result = makePivotResult({ pivots: ['category', 'item'], measures: ['acv'] });

		expect(getExportedHeaders(result)).toEqual([
			'Geography',
			'Dressings - Avocado',
			'Dressings - Balsamic',
			'Sauces - Marinara'
		]);
	});

	// The general case the single-measure fix missed: with >1 measure the leaf
	// header row IS the measure name, so a leaf-only header repeated the measure title on
	// every column and dropped the pivot context entirely.
	it('multi-measure keeps the pivot path AND the measure on every column', () => {
		const result = makePivotResult({ pivots: ['category', 'item'], measures: ['acv', 'sales'] });
		const headers = (getExportedHeaders(result) as string[]).slice(1); // drop the Geography dimension col

		// the bug: every measure column read just the bare measure title
		expect(headers).not.toContain('ACV Wtd Dist');
		expect(headers).not.toContain('Sales');
		// each column now carries the full pivot path + the measure
		expect(headers).toContain('Dressings - Avocado - ACV Wtd Dist');
		expect(headers).toContain('Dressings - Avocado - Sales');
		// and no two columns collide
		expect(new Set(headers).size).toBe(headers.length);
	});

	it('a non-pivot table keeps the plain measure titles', () => {
		const result = makePivotResult({ pivots: [], measures: ['acv', 'sales'] });

		expect(getExportedHeaders(result)).toEqual(['Geography', 'ACV Wtd Dist', 'Sales']);
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
	])('every column header is distinct and carries the measure ($name)', ({ options }) => {
		const result = makePivotResult(options);
		const headers = (getExportedHeaders(result) as string[]).slice(1); // drop the dimension col

		expect(headers.length).toBeGreaterThan(0);
		expect(headers.every((h) => h && h.length > 0)).toBe(true);
		// every measure column names its measure (so ACV vs Sales is never ambiguous)...
		expect(headers.every((h) => h.includes('ACV Wtd Dist') || h.includes('Sales'))).toBe(true);
		// ...but never as a BARE repeated title, and no two columns collide.
		expect(headers).not.toContain('ACV Wtd Dist');
		expect(new Set(headers).size).toBe(headers.length);
	});
});
