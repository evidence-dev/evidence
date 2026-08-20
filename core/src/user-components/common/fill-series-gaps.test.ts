import { describe, it, expect } from 'vitest';
import { fillSeriesGaps } from './fill-series-gaps';

describe('fillSeriesGaps', () => {
	it('should fill missing x values across series', () => {
		const data = [
			{ date: 'Jan', category: 'A', value: 10 },
			{ date: 'Feb', category: 'A', value: 20 },
			{ date: 'Mar', category: 'A', value: 30 },
			{ date: 'Jan', category: 'B', value: 15 },
			{ date: 'Mar', category: 'B', value: 25 }
			// Missing: Feb for category B
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		expect(result).toHaveLength(6); // 3 dates × 2 categories = 6

		// Check that Feb exists for category B with null value
		const febB = result.find((row) => row.date === 'Feb' && row.category === 'B');
		expect(febB).toBeDefined();
		expect(febB?.value).toBeNull();

		// Check that existing values are preserved
		const janA = result.find((row) => row.date === 'Jan' && row.category === 'A');
		expect(janA?.value).toBe(10);
	});

	it('should NOT fill when all series already have the same x values (optimization)', () => {
		const data = [
			{ date: 'Jan', category: 'A', value: 10 },
			{ date: 'Feb', category: 'A', value: 20 },
			{ date: 'Jan', category: 'B', value: 15 },
			{ date: 'Feb', category: 'B', value: 25 }
			// Already complete!
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		// Should return original data (no fill needed)
		expect(result).toBe(data); // Same reference
		expect(result).toHaveLength(4);
	});

	it('should fill even when series have SAME LENGTH but DIFFERENT x values', () => {
		// This is the tricky edge case!
		const data = [
			{ date: 'Jan', category: 'A', value: 10 },
			{ date: 'Feb', category: 'A', value: 20 },
			{ date: 'Mar', category: 'A', value: 30 },
			{ date: 'Jan', category: 'B', value: 15 },
			{ date: 'Apr', category: 'B', value: 25 }, // Different month!
			{ date: 'May', category: 'B', value: 35 } // Different month!
			// Series A has [Jan, Feb, Mar], Series B has [Jan, Apr, May]
			// Both length 3 but NOT aligned!
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		// Should have all 5 unique dates × 2 categories = 10 rows
		expect(result).toHaveLength(10);

		// Check that A now has Apr and May (with null)
		const aprA = result.find((row) => row.date === 'Apr' && row.category === 'A');
		expect(aprA).toBeDefined();
		expect(aprA?.value).toBeNull();

		// Check that B now has Feb and Mar (with null)
		const febB = result.find((row) => row.date === 'Feb' && row.category === 'B');
		expect(febB).toBeDefined();
		expect(febB?.value).toBeNull();
	});

	it('should NOT fill when only one series exists', () => {
		const data = [
			{ date: 'Jan', category: 'A', value: 10 },
			{ date: 'Feb', category: 'A', value: 20 },
			{ date: 'Mar', category: 'A', value: 30 }
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		// Single series doesn't need fill
		expect(result).toBe(data);
		expect(result).toHaveLength(3);
	});

	it('should handle empty data', () => {
		const result = fillSeriesGaps({
			data: [],
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		expect(result).toEqual([]);
	});

	it('should fill size column when provided', () => {
		const data = [
			{ date: 'Jan', category: 'A', value: 10, size: 5 },
			{ date: 'Feb', category: 'A', value: 20, size: 10 },
			{ date: 'Jan', category: 'B', value: 15, size: 7 }
			// Missing: Feb for category B
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category',
			sizeColumn: 'size'
		});

		expect(result).toHaveLength(4);

		const febB = result.find((row) => row.date === 'Feb' && row.category === 'B');
		expect(febB).toBeDefined();
		expect(febB?.value).toBeNull();
		expect(febB?.size).toBeNull();
	});

	it('should handle multiple missing gaps in same series', () => {
		const data = [
			{ x: 1, series: 'A', y: 10 },
			{ x: 2, series: 'A', y: 20 },
			{ x: 3, series: 'A', y: 30 },
			{ x: 4, series: 'A', y: 40 },
			{ x: 1, series: 'B', y: 15 },
			{ x: 4, series: 'B', y: 45 }
			// Series B missing x=2 and x=3
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'x',
			yColumn: 'y',
			seriesColumn: 'series'
		});

		expect(result).toHaveLength(8); // 4 x values × 2 series = 8

		// Check both gaps are filled
		const x2B = result.find((row) => row.x === 2 && row.series === 'B');
		const x3B = result.find((row) => row.x === 3 && row.series === 'B');
		expect(x2B?.y).toBeNull();
		expect(x3B?.y).toBeNull();
	});

	it('should handle numeric x and series values', () => {
		const data = [
			{ x: 1, series: 10, value: 'a' },
			{ x: 2, series: 10, value: 'b' },
			{ x: 1, series: 20, value: 'c' }
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'x',
			yColumn: 'value',
			seriesColumn: 'series'
		});

		expect(result).toHaveLength(4);

		const x2s20 = result.find((row) => row.x === 2 && row.series === 20);
		expect(x2s20).toBeDefined();
		expect(x2s20?.value).toBeNull();
	});

	it('should handle Date objects as x values', () => {
		const date1 = new Date('2024-01-01');
		const date2 = new Date('2024-01-02');

		const data = [
			{ date: date1, category: 'A', value: 10 },
			{ date: date2, category: 'A', value: 20 },
			{ date: date1, category: 'B', value: 15 }
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		expect(result).toHaveLength(4);

		const date2B = result.find((row) => row.date === date2 && row.category === 'B');
		expect(date2B).toBeDefined();
		expect(date2B?.value).toBeNull();
	});

	it('should preserve all original rows unchanged', () => {
		const data = [
			{ date: 'Jan', category: 'A', value: 10, extra: 'foo' },
			{ date: 'Feb', category: 'A', value: 20, extra: 'bar' },
			{ date: 'Jan', category: 'B', value: 15, extra: 'baz' }
		];

		const result = fillSeriesGaps({
			data,
			xColumn: 'date',
			yColumn: 'value',
			seriesColumn: 'category'
		});

		// Check that original rows are preserved exactly
		const janA = result.find((row) => row.date === 'Jan' && row.category === 'A');
		expect(janA).toEqual(data[0]); // Exact match including 'extra' field
	});
});
