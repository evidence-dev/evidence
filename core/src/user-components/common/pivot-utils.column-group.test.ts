import { describe, it, expect } from 'vitest';
import { generatePivotData, generateSelectedColumnTable, type PivotConfig } from './pivot-utils';
import type { UnifiedColumnDefinition } from '../tags/table/unified-column-definition.types';

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

function makeUnifiedColumns(includeLink: boolean): UnifiedColumnDefinition[] {
	const cols: UnifiedColumnDefinition[] = [
		{
			type: 'dimension',
			sqlWithAlias: 'category',
			alias: 'category',
			columnIdForRendering: 'category',
			processedColumnExpression: makePCE('category', 'dimension', false),
			link: includeLink ? 'category' : undefined
		},
		{
			type: 'measure',
			sqlWithAlias: 'sum(total_sales) AS total_sales',
			alias: 'total_sales',
			columnIdForRendering: 'total_sales',
			sqlWithoutAlias: 'sum(total_sales)',
			processedColumnExpression: makePCE('total_sales', 'measure', true),
			column_group: 'Metrics'
		},
		{
			type: 'measure',
			sqlWithAlias: 'sum(transactions) AS transactions',
			alias: 'transactions',
			columnIdForRendering: 'transactions',
			sqlWithoutAlias: 'sum(transactions)',
			processedColumnExpression: makePCE('transactions', 'measure', true),
			column_group: 'Metrics'
		},
		{
			type: 'dimension',
			sqlWithAlias: 'date',
			alias: 'date',
			columnIdForRendering: 'date',
			processedColumnExpression: makePCE('date', 'dimension', false),
			column_group: 'Metrics'
		}
	];

	if (includeLink) {
		cols.push({
			type: 'measure',
			sqlWithAlias: 'any(category) AS __link_category',
			alias: '__link_category',
			columnIdForRendering: '__link_category',
			sqlWithoutAlias: 'any(category)',
			processedColumnExpression: makePCE('__link_category', 'measure', true),
			hide: true
		});
	}

	return cols;
}

describe('generatePivotData: column groups with hidden link columns', () => {
	const sampleData = [
		{
			category: 'Electronics',
			date: '2024-01-01',
			__link_category: '/electronics',
			total_sales: 1000,
			transactions: 50
		},
		{
			category: 'Clothing',
			date: '2024-01-02',
			__link_category: '/clothing',
			total_sales: 800,
			transactions: 30
		}
	];

	it('should preserve column groups with link attribute', () => {
		const unifiedColumns = makeUnifiedColumns(true);
		const config: PivotConfig = {
			dimensions: ['category', 'date'],
			pivots: [],
			measures: ['__link_category', 'total_sales', 'transactions'],
			measuresFirst: false,
			subtotals: false,
			columnTypes: new Map([
				['category', 'string'],
				['date', 'string'],
				['__link_category', 'string'],
				['total_sales', 'number'],
				['transactions', 'number']
			]),
			unifiedColumns
		};

		const result = generatePivotData(sampleData, config);

		expect(result.columns).not.toContain('__link_category');
		expect(result.columns).toEqual(['category', 'date', 'total_sales', 'transactions']);
		expect(result.headerLevels.length).toBe(2);

		const columnGroupHeader = result.headerLevels[0];
		const metricsGroup = columnGroupHeader.find((cell) => cell.label === 'Metrics');
		expect(metricsGroup).toBeDefined();
		// date (dimension with column_group=Metrics) + total_sales + transactions = 3
		expect(metricsGroup!.colspan).toBe(3);
	});
});

describe('generateSelectedColumnTable: column groups with hidden link columns', () => {
	const sampleData = [
		{
			category: 'Electronics',
			date: '2024-01-01',
			__link_category: '/electronics',
			total_sales: 1000,
			transactions: 50
		},
		{
			category: 'Clothing',
			date: '2024-01-02',
			__link_category: '/clothing',
			total_sales: 800,
			transactions: 30
		}
	];

	const columnTypes = new Map([
		['category', 'string'],
		['date', 'string'],
		['__link_category', 'string'],
		['total_sales', 'number'],
		['transactions', 'number']
	]);

	it('should preserve column groups WITHOUT link attribute', () => {
		const unifiedColumns = makeUnifiedColumns(false);
		const selectedColumns = ['category', 'date', 'total_sales', 'transactions'];
		const ct = new Map([
			['category', 'string'],
			['date', 'string'],
			['total_sales', 'number'],
			['transactions', 'number']
		]);
		const data = sampleData.map(({ __link_category: _, ...rest }) => rest);

		const result = generateSelectedColumnTable(data, ct, unifiedColumns, selectedColumns);

		expect(result.columns).toEqual(['category', 'date', 'total_sales', 'transactions']);

		// Should have column group header
		const columnGroupLevel = result.headerLevels.find((level) =>
			level.some((cell) => cell.label === 'Metrics')
		);
		expect(columnGroupLevel).toBeDefined();
	});

	it('should preserve column groups WITH link attribute (hidden __link_ column)', () => {
		const unifiedColumns = makeUnifiedColumns(true);
		const selectedColumns = ['category', 'date', '__link_category', 'total_sales', 'transactions'];

		const result = generateSelectedColumnTable(sampleData, columnTypes, unifiedColumns, selectedColumns);

		// Hidden columns should be filtered out
		expect(result.columns).not.toContain('__link_category');
		expect(result.columns).toEqual(['category', 'date', 'total_sales', 'transactions']);

		// Should STILL have column group header
		const columnGroupLevel = result.headerLevels.find((level) =>
			level.some((cell) => cell.label === 'Metrics')
		);
		expect(columnGroupLevel).toBeDefined();
		if (columnGroupLevel) {
			const metricsGroup = columnGroupLevel.find((cell) => cell.label === 'Metrics');
			expect(metricsGroup).toBeDefined();
		}
	});

	it('column groups should be identical with and without link', () => {
		// Without link
		const unifiedNoLink = makeUnifiedColumns(false);
		const selectedNoLink = ['category', 'date', 'total_sales', 'transactions'];
		const ctNoLink = new Map([
			['category', 'string'],
			['date', 'string'],
			['total_sales', 'number'],
			['transactions', 'number']
		]);
		const dataNoLink = sampleData.map(({ __link_category: _, ...rest }) => rest);
		const resultNoLink = generateSelectedColumnTable(dataNoLink, ctNoLink, unifiedNoLink, selectedNoLink);

		// With link
		const unifiedWithLink = makeUnifiedColumns(true);
		const selectedWithLink = ['category', 'date', '__link_category', 'total_sales', 'transactions'];
		const resultWithLink = generateSelectedColumnTable(sampleData, columnTypes, unifiedWithLink, selectedWithLink);

		// Visible columns should be identical
		expect(resultWithLink.columns).toEqual(resultNoLink.columns);

		// Header levels count should be identical
		expect(resultWithLink.headerLevels.length).toEqual(resultNoLink.headerLevels.length);

		// Both should have a column group header with "Metrics"
		const groupNoLink = resultNoLink.headerLevels.find((level) =>
			level.some((cell) => cell.label === 'Metrics')
		);
		const groupWithLink = resultWithLink.headerLevels.find((level) =>
			level.some((cell) => cell.label === 'Metrics')
		);
		expect(groupNoLink).toBeDefined();
		expect(groupWithLink).toBeDefined();
	});
});
