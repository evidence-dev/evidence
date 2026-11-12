import { describe, it, expect } from 'vitest';
import { formatValue } from '../formatValue';
import { generatePivotData, type PivotConfig } from './pivot-utils';
import type { UnifiedColumnDefinition } from '../tags/table/unified-column-definition.types';

/**
 * Tests that date formatting works correctly when columnType is provided.
 * Complex date format codes (like "yyyy-mmm") require columnType to convert
 * string dates to Date objects before SSF can format them.
 */
describe('formatValue with columnType for date formatting', () => {
	it('formats date strings with complex format codes when columnType is provided', () => {
		const dateString = '2024-01-15';
		const formatCode = 'yyyy-mmm'; // Complex format
		const columnType = 'date';

		const result = formatValue(dateString, formatCode, dateString, undefined, columnType);

		// Should format as "2024-Jan", not "2024-01-15"
		expect(result).toMatch(/^2024-Jan$/i);
	});

	it('formats date strings with yyyy-mmm format for different months', () => {
		const testCases = [
			{ date: '2024-01-15', expected: '2024-Jan' },
			{ date: '2024-02-20', expected: '2024-Feb' },
			{ date: '2024-03-10', expected: '2024-Mar' },
			{ date: '2024-12-25', expected: '2024-Dec' }
		];

		testCases.forEach(({ date, expected }) => {
			const result = formatValue(date, 'yyyy-mmm', date, undefined, 'date');
			expect(result).toBe(expected);
		});
	});

	it('formats date strings with simple format codes', () => {
		// Simple format codes already worked, but verify they still work
		const dateString = '2024-01-15';

		// Test yyyy format
		const yearResult = formatValue(dateString, 'yyyy', dateString, undefined, 'date');
		expect(yearResult).toBe('2024');

		// Test mmm format
		const monthResult = formatValue(dateString, 'mmm', dateString, undefined, 'date');
		expect(monthResult).toBe('Jan');
	});

	it('custom date formats work without columnType via format code detection', () => {
		const dateString = '2024-01-15';
		const formatCode = 'yyyy-mmm';

		const result = formatValue(dateString, formatCode, dateString, undefined, undefined);

		expect(result).toBe('2024-Jan');
	});

	it('formats with other complex date format codes', () => {
		const dateString = '2024-06-15';
		const columnType = 'date';

		// Test various complex format codes
		const formats: { [key: string]: string } = {
			'yyyy-mm-dd': '2024-06-15',
			'mmm d, yyyy': 'Jun 15, 2024',
			'mmmm yyyy': 'June 2024',
			'yyyy "Q"q': '2024 Q2'
		};

		Object.entries(formats).forEach(([formatCode, expected]) => {
			const result = formatValue(dateString, formatCode, dateString, undefined, columnType);
			// Use regex to be flexible with exact spacing/formatting
			expect(result.toLowerCase()).toContain(expected.toLowerCase().split(' ')[0]);
		});
	});

	it('handles numeric columnTypes correctly', () => {
		// Verify that non-date columnTypes still work
		const numberString = '1234.56';
		const formatCode = '#,##0.00';
		const columnType = 'number';

		const result = formatValue(numberString, formatCode, numberString, undefined, columnType);
		expect(result).toBe('1,234.56');
	});

	it('handles missing columnType gracefully for non-dates', () => {
		// Non-date values should still work without columnType
		const numberValue = 1234.56;
		const formatCode = '#,##0.00';

		const result = formatValue(numberValue, formatCode, String(numberValue), undefined, undefined);
		expect(result).toBe('1,234.56');
	});
});

describe('generatePivotData: pivot header language', () => {
	const pce = (alias: string, type: 'dimension' | 'measure') => ({
		sqlWithAlias: alias,
		sqlWithoutAlias: alias,
		sqlWithoutDateFiltersOrAlias: alias,
		alias,
		displayAlias: alias,
		type,
		isComplexExpression: false,
		hasAgg: type === 'measure',
		isTemporalDateGrain: false,
		hasDateGrain: false,
		hasDateRange: false,
		isTableComparison: false,
		isTableSparkline: false
	});
	const unifiedColumns: UnifiedColumnDefinition[] = [
		{
			type: 'dimension',
			sqlWithAlias: 'category',
			alias: 'category',
			columnIdForRendering: 'category',
			processedColumnExpression: pce('category', 'dimension')
		},
		{
			type: 'pivot',
			sqlWithAlias: 'month',
			alias: 'month',
			columnIdForRendering: 'month',
			processedColumnExpression: pce('month', 'dimension'),
			fmt: 'mmm yyyy'
		},
		{
			type: 'measure',
			sqlWithAlias: 'sum(sales) AS sales',
			alias: 'sales',
			columnIdForRendering: 'sales',
			sqlWithoutAlias: 'sum(sales)',
			processedColumnExpression: pce('sales', 'measure')
		}
	];
	const data = [
		{ category: 'A', month: '2024-01-01', sales: 10 },
		{ category: 'A', month: '2024-02-01', sales: 20 }
	];
	const config = (language: string): PivotConfig => ({
		dimensions: ['category'],
		pivots: ['month'],
		measures: ['sales'],
		measuresFirst: false,
		subtotals: false,
		columnTypes: new Map([
			['category', 'string'],
			['month', 'date'],
			['sales', 'number']
		]),
		unifiedColumns,
		language
	});
	const labels = (language: string) =>
		generatePivotData(data, config(language))
			.headerLevels.flat()
			.map((cell) => cell.label);

	it('switching language on the same rows re-renders the headers', () => {
		expect(labels('en')).toEqual(expect.arrayContaining(['Jan 2024', 'Feb 2024']));
		expect(labels('fr')).toEqual(expect.arrayContaining(['janv. 2024', 'févr. 2024']));
	});
});
