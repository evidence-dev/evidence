import { describe, it, expect } from 'vitest';
import {
	getUniqueColumnName,
	getXColumnType,
	mergeSeriesData,
	type SeriesDataInput
} from './merge-series-data';

describe('merge-series-data', () => {
	describe('getUniqueColumnName', () => {
		it('returns base name for first occurrence', () => {
			const countMap = new Map<string, number>();
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue');
		});

		it('appends _2 for second occurrence', () => {
			const countMap = new Map<string, number>();
			getUniqueColumnName('Revenue', countMap);
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue_2');
		});

		it('increments suffix for subsequent occurrences', () => {
			const countMap = new Map<string, number>();
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue');
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue_2');
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue_3');
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue_4');
		});

		it('tracks different names independently', () => {
			const countMap = new Map<string, number>();
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue');
			expect(getUniqueColumnName('Orders', countMap)).toBe('Orders');
			expect(getUniqueColumnName('Revenue', countMap)).toBe('Revenue_2');
			expect(getUniqueColumnName('Orders', countMap)).toBe('Orders_2');
		});
	});

	describe('getXColumnType', () => {
		it('returns jsType from first series with matching column', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [],
					columns: [{ name: 'date', jsType: 'date' }],
					yColumnName: 'value',
					yDisplayName: 'Value',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];
			expect(getXColumnType(seriesData, 'date')).toBe('date');
		});

		it('returns string if column not found', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [],
					columns: [{ name: 'other', jsType: 'number' }],
					yColumnName: 'value',
					yDisplayName: 'Value',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];
			expect(getXColumnType(seriesData, 'date')).toBe('string');
		});

		it('searches through multiple series', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [],
					columns: [{ name: 'other', jsType: 'string' }],
					yColumnName: 'val1',
					yDisplayName: 'Val 1',
					seriesColumnName: undefined,
					fmt: undefined
				},
				{
					rows: [],
					columns: [{ name: 'date', jsType: 'date' }],
					yColumnName: 'val2',
					yDisplayName: 'Val 2',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];
			expect(getXColumnType(seriesData, 'date')).toBe('date');
		});
	});

	describe('mergeSeriesData', () => {
		it('returns null for empty x column name', () => {
			const result = mergeSeriesData('', []);
			expect(result).toBeNull();
		});

		it('returns null for empty series data', () => {
			const result = mergeSeriesData('date', []);
			expect(result).toBeNull();
		});

		it('merges single series correctly', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [
						{ date: '2024-01', revenue: 100 },
						{ date: '2024-02', revenue: 200 }
					],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'revenue', jsType: 'number' }
					],
					yColumnName: 'revenue',
					yDisplayName: 'Revenue',
					seriesColumnName: undefined,
					fmt: 'usd'
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			expect(result!.columns).toEqual([
				{ name: 'date', jsType: 'string' },
				{ name: 'Revenue', jsType: 'number', fmt: 'usd' }
			]);
			expect(result!.rows).toEqual([
				{ date: '2024-01', Revenue: 100 },
				{ date: '2024-02', Revenue: 200 }
			]);
		});

		it('merges multiple series with different display names', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [
						{ date: '2024-01', revenue: 100 },
						{ date: '2024-02', revenue: 200 }
					],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'revenue', jsType: 'number' }
					],
					yColumnName: 'revenue',
					yDisplayName: 'Revenue',
					seriesColumnName: undefined,
					fmt: 'usd'
				},
				{
					rows: [
						{ date: '2024-01', orders: 10 },
						{ date: '2024-02', orders: 20 }
					],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'orders', jsType: 'number' }
					],
					yColumnName: 'orders',
					yDisplayName: 'Orders',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			expect(result!.columns).toEqual([
				{ name: 'date', jsType: 'string' },
				{ name: 'Revenue', jsType: 'number', fmt: 'usd' },
				{ name: 'Orders', jsType: 'number', fmt: undefined }
			]);
			expect(result!.rows).toEqual([
				{ date: '2024-01', Revenue: 100, Orders: 10 },
				{ date: '2024-02', Revenue: 200, Orders: 20 }
			]);
		});

		it('deduplicates columns when different SQL aliases produce same display name', () => {
			// This is the bug scenario we fixed:
			// sum_orders -> "Sum Of Orders"
			// sumOrders -> "Sum Of Orders"
			const seriesData: SeriesDataInput[] = [
				{
					rows: [
						{ date: '2024-01', sum_orders: 100 },
						{ date: '2024-02', sum_orders: 200 }
					],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'sum_orders', jsType: 'number' }
					],
					yColumnName: 'sum_orders',
					yDisplayName: 'Sum Of Orders', // Same display name!
					seriesColumnName: undefined,
					fmt: undefined
				},
				{
					rows: [
						{ date: '2024-01', sumOrders: 50 },
						{ date: '2024-02', sumOrders: 75 }
					],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'sumOrders', jsType: 'number' }
					],
					yColumnName: 'sumOrders',
					yDisplayName: 'Sum Of Orders', // Same display name!
					seriesColumnName: undefined,
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			// Columns should have unique names
			expect(result!.columns).toEqual([
				{ name: 'date', jsType: 'string' },
				{ name: 'Sum Of Orders', jsType: 'number', fmt: undefined },
				{ name: 'Sum Of Orders_2', jsType: 'number', fmt: undefined }
			]);
			// Data should be preserved in separate columns
			expect(result!.rows).toEqual([
				{ date: '2024-01', 'Sum Of Orders': 100, 'Sum Of Orders_2': 50 },
				{ date: '2024-02', 'Sum Of Orders': 200, 'Sum Of Orders_2': 75 }
			]);
		});

		it('falls back to yColumnName when yDisplayName is undefined', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [{ date: '2024-01', val: 100 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'val', jsType: 'number' }
					],
					yColumnName: 'val',
					yDisplayName: undefined, // No display name
					seriesColumnName: undefined,
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result!.columns[1].name).toBe('val');
		});

		it('handles series column for grouping', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [
						{ date: '2024-01', category: 'A', revenue: 100 },
						{ date: '2024-01', category: 'B', revenue: 150 },
						{ date: '2024-02', category: 'A', revenue: 200 }
					],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'category', jsType: 'string' },
						{ name: 'revenue', jsType: 'number' }
					],
					yColumnName: 'revenue',
					yDisplayName: 'Revenue',
					seriesColumnName: 'category',
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			// Should include series column
			expect(result!.columns).toContainEqual({ name: 'category', jsType: 'string' });
			// Rows with same x but different series values should be kept separate
			expect(result!.rows).toHaveLength(3);
			expect(result!.rows).toContainEqual({ date: '2024-01', category: 'A', Revenue: 100 });
			expect(result!.rows).toContainEqual({ date: '2024-01', category: 'B', Revenue: 150 });
			expect(result!.rows).toContainEqual({ date: '2024-02', category: 'A', Revenue: 200 });
		});

		it('skips series with no yColumnName', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [{ date: '2024-01', revenue: 100 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'revenue', jsType: 'number' }
					],
					yColumnName: undefined, // No y column
					yDisplayName: 'Revenue',
					seriesColumnName: undefined,
					fmt: undefined
				},
				{
					rows: [{ date: '2024-01', orders: 10 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'orders', jsType: 'number' }
					],
					yColumnName: 'orders',
					yDisplayName: 'Orders',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			// Should only have Orders column (first series was skipped)
			expect(result!.columns).toHaveLength(2);
			expect(result!.columns[1].name).toBe('Orders');
		});

		it('skips series with empty rows', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [], // Empty!
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'revenue', jsType: 'number' }
					],
					yColumnName: 'revenue',
					yDisplayName: 'Revenue',
					seriesColumnName: undefined,
					fmt: undefined
				},
				{
					rows: [{ date: '2024-01', orders: 10 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'orders', jsType: 'number' }
					],
					yColumnName: 'orders',
					yDisplayName: 'Orders',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			// Should only have Orders column (first series was skipped)
			expect(result!.columns).toHaveLength(2);
			expect(result!.columns[1].name).toBe('Orders');
		});

		it('handles three or more series with same display name', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [{ date: '2024-01', a: 1 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'a', jsType: 'number' }
					],
					yColumnName: 'a',
					yDisplayName: 'Value',
					seriesColumnName: undefined,
					fmt: undefined
				},
				{
					rows: [{ date: '2024-01', b: 2 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'b', jsType: 'number' }
					],
					yColumnName: 'b',
					yDisplayName: 'Value',
					seriesColumnName: undefined,
					fmt: undefined
				},
				{
					rows: [{ date: '2024-01', c: 3 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'c', jsType: 'number' }
					],
					yColumnName: 'c',
					yDisplayName: 'Value',
					seriesColumnName: undefined,
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			expect(result).not.toBeNull();
			expect(result!.columns.map((c) => c.name)).toEqual(['date', 'Value', 'Value_2', 'Value_3']);
			expect(result!.rows[0]).toEqual({
				date: '2024-01',
				Value: 1,
				Value_2: 2,
				Value_3: 3
			});
		});

		it('adds series column only once when present in multiple series', () => {
			const seriesData: SeriesDataInput[] = [
				{
					rows: [{ date: '2024-01', category: 'A', revenue: 100 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'category', jsType: 'string' },
						{ name: 'revenue', jsType: 'number' }
					],
					yColumnName: 'revenue',
					yDisplayName: 'Revenue',
					seriesColumnName: 'category',
					fmt: undefined
				},
				{
					rows: [{ date: '2024-01', category: 'A', orders: 10 }],
					columns: [
						{ name: 'date', jsType: 'string' },
						{ name: 'category', jsType: 'string' },
						{ name: 'orders', jsType: 'number' }
					],
					yColumnName: 'orders',
					yDisplayName: 'Orders',
					seriesColumnName: 'category',
					fmt: undefined
				}
			];

			const result = mergeSeriesData('date', seriesData);

			// Category column should appear only once
			const categoryColumns = result!.columns.filter((c) => c.name === 'category');
			expect(categoryColumns).toHaveLength(1);
		});
	});
});
