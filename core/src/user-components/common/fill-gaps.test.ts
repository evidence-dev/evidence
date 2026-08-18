import { describe, it, expect } from 'vitest';
import { fillGaps, inferDateGrain, inferNumericInterval } from './fill-gaps';

// ============================================================================
// MAIN FUNCTION: fillGaps
// ============================================================================

describe('fillGaps', () => {
	// ──────────────────────────────────────────────────────────────────────────
	// EARLY EXITS - Zero cost paths for common cases
	// ──────────────────────────────────────────────────────────────────────────

	describe('early exits (performance optimization)', () => {
		it('should return data unchanged when empty', () => {
			const result = fillGaps({
				data: [],
				xColumn: 'x',
				yColumn: 'y'
			});
			expect(result).toEqual([]);
		});

		it('should return same reference when handleMissing=connect and single series', () => {
			const data = [
				{ x: 1, y: 10 },
				{ x: 2, y: 20 },
				{ x: 3, y: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'connect' // default
			});

			// Should be exact same reference (zero cost)
			expect(result).toBe(data);
		});

		it('should return same reference when grid is already complete', () => {
			const data = [
				{ x: 1, series: 'A', y: 10 },
				{ x: 2, series: 'A', y: 20 },
				{ x: 1, series: 'B', y: 15 },
				{ x: 2, series: 'B', y: 25 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				seriesColumn: 'series'
			});

			// Grid already complete - should return same reference
			expect(result).toBe(data);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// CROSS-SERIES ALIGNMENT (handleMissing='connect' with multi-series)
	// ──────────────────────────────────────────────────────────────────────────

	describe('cross-series alignment (existing fillSeriesGaps behavior)', () => {
		it('should fill missing x values across series with nulls', () => {
			const data = [
				{ date: 'Jan', category: 'A', value: 10 },
				{ date: 'Feb', category: 'A', value: 20 },
				{ date: 'Mar', category: 'A', value: 30 },
				{ date: 'Jan', category: 'B', value: 15 },
				{ date: 'Mar', category: 'B', value: 25 }
				// Missing: Feb for category B
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				seriesColumn: 'category'
			});

			expect(result).toHaveLength(6); // 3 dates × 2 categories

			const febB = result.find((row) => row.date === 'Feb' && row.category === 'B');
			expect(febB).toBeDefined();
			expect(febB?.value).toBeNull();
		});

		it('should handle series with completely different x values', () => {
			const data = [
				{ x: 'Jan', series: 'A', y: 10 },
				{ x: 'Feb', series: 'A', y: 20 },
				{ x: 'Mar', series: 'B', y: 30 },
				{ x: 'Apr', series: 'B', y: 40 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				seriesColumn: 'series'
			});

			expect(result).toHaveLength(8); // 4 x values × 2 series

			// Series A should now have Mar, Apr with null
			const marA = result.find((row) => row.x === 'Mar' && row.series === 'A');
			expect(marA?.y).toBeNull();
		});

		it('should fill sizeColumn with null when provided', () => {
			const data = [
				{ x: 1, series: 'A', y: 10, size: 5 },
				{ x: 2, series: 'A', y: 20, size: 10 },
				{ x: 1, series: 'B', y: 15, size: 7 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				seriesColumn: 'series',
				sizeColumn: 'size'
			});

			const x2B = result.find((row) => row.x === 2 && row.series === 'B');
			expect(x2B?.y).toBeNull();
			expect(x2B?.size).toBeNull();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// TEMPORAL GAP FILLING (handleMissing='gaps' or 'zero')
	// ──────────────────────────────────────────────────────────────────────────

	describe('temporal gap filling with explicit dateGrain', () => {
		it('should insert nulls at missing daily intervals', () => {
			// Data with gap: Jan 1, 2, 5 (missing 3, 4)
			const data = [
				{ date: new Date('2024-01-01T12:00:00Z'), value: 10 },
				{ date: new Date('2024-01-02T12:00:00Z'), value: 20 },
				{ date: new Date('2024-01-05T12:00:00Z'), value: 50 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(5); // Jan 1, 2, 3, 4, 5

			// Check that gaps are filled with null (use getUTCDate for timezone safety)
			const jan3 = result.find((row) => (row.date as Date).getUTCDate() === 3);
			const jan4 = result.find((row) => (row.date as Date).getUTCDate() === 4);

			expect(jan3?.value).toBeNull();
			expect(jan4?.value).toBeNull();
		});

		it('should insert zeros when handleMissing=zero', () => {
			const data = [
				{ date: new Date('2024-01-01T12:00:00Z'), value: 10 },
				{ date: new Date('2024-01-03T12:00:00Z'), value: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);

			const jan2 = result.find((row) => (row.date as Date).getUTCDate() === 2);
			expect(jan2?.value).toBe(0);
		});

		it('should handle monthly grain with calendar-aware stepping', () => {
			// Jan, Feb, May (missing Mar, Apr)
			const data = [
				{ date: new Date('2024-01-01T12:00:00Z'), value: 10 },
				{ date: new Date('2024-02-01T12:00:00Z'), value: 20 },
				{ date: new Date('2024-05-01T12:00:00Z'), value: 50 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				dateGrain: 'month',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(5); // Jan, Feb, Mar, Apr, May

			const march = result.find(
				(row) => (row.date as Date).getUTCMonth() === 2 // 0-indexed
			);
			expect(march?.value).toBeNull();
		});

		it('should handle weekly grain correctly', () => {
			// Week 1, Week 3 (missing Week 2)
			const data = [
				{ date: new Date('2024-01-01T12:00:00Z'), value: 10 },
				{ date: new Date('2024-01-15T12:00:00Z'), value: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				dateGrain: 'week',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
		});
	});

	describe('temporal gap filling with multi-series', () => {
		it('should fill both temporal gaps and cross-series gaps', () => {
			// Series A: Jan 1, Jan 2, Jan 3
			// Series B: Jan 1 only
			// Cross-series gaps: Jan 2, Jan 3 for B
			const data = [
				{ date: new Date('2024-01-01T12:00:00Z'), series: 'A', value: 10 },
				{ date: new Date('2024-01-02T12:00:00Z'), series: 'A', value: 20 },
				{ date: new Date('2024-01-01T12:00:00Z'), series: 'B', value: 15 },
				{ date: new Date('2024-01-03T12:00:00Z'), series: 'A', value: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				seriesColumn: 'series',
				handleMissing: 'gaps',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			// Should have: 3 dates × 2 series = 6
			expect(result).toHaveLength(6);

			// Jan 2 for B should be filled (cross-series)
			const jan2B = result.find(
				(row) => (row.date as Date).getUTCDate() === 2 && row.series === 'B'
			);
			expect(jan2B?.value).toBeNull();

			// Jan 3 for B should be filled (cross-series after temporal fill)
			const jan3B = result.find(
				(row) => (row.date as Date).getUTCDate() === 3 && row.series === 'B'
			);
			expect(jan3B?.value).toBeNull();
		});
	});

	describe('temporal gap filling with numeric x-axis', () => {
		it('should infer interval using GCD and fill gaps', () => {
			// Data with gap: 0, 10, 20, 50 (missing 30, 40)
			const data = [
				{ x: 0, y: 100 },
				{ x: 10, y: 200 },
				{ x: 20, y: 300 },
				{ x: 50, y: 600 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'gaps',
				xColumnType: 'number'
			});

			expect(result).toHaveLength(6); // 0, 10, 20, 30, 40, 50

			const x30 = result.find((row) => row.x === 30);
			const x40 = result.find((row) => row.x === 40);
			expect(x30?.y).toBeNull();
			expect(x40?.y).toBeNull();
		});

		it('should handle decimal intervals (0.5)', () => {
			const data = [
				{ x: 0, y: 10 },
				{ x: 0.5, y: 15 },
				{ x: 1.5, y: 25 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'gaps',
				xColumnType: 'number'
			});

			expect(result).toHaveLength(4); // 0, 0.5, 1.0, 1.5

			const x1 = result.find((row) => row.x === 1);
			expect(x1?.y).toBeNull();
		});

		it('should handle GCD with multiple different intervals', () => {
			// Intervals: 10, 10, 15, 15 → GCD = 5
			const data = [
				{ x: 0, y: 100 },
				{ x: 10, y: 200 },
				{ x: 20, y: 300 },
				{ x: 35, y: 450 },
				{ x: 50, y: 600 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'gaps',
				xColumnType: 'number'
			});

			// GCD of [10, 10, 15, 15] = 5
			// Sequence: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 = 11 values
			expect(result).toHaveLength(11);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// SAFETY LIMITS
	// ──────────────────────────────────────────────────────────────────────────

	describe('safety limits', () => {
		it('should fall back when maxFillPoints would be exceeded', () => {
			// Data that would require many fill points
			const data = [
				{ x: 0, y: 10 },
				{ x: 1, y: 20 },
				{ x: 1000, y: 30 } // Gap of 999 points if interval is 1
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'gaps',
				xColumnType: 'number',
				maxFillPoints: 100 // Would need 997 new points
			});

			// Should fall back to just the 3 original points
			expect(result).toHaveLength(3);
		});

		it('should respect explicit maxFillPoints limit', () => {
			const data = [
				{ date: new Date('2024-01-01'), value: 10 },
				{ date: new Date('2024-12-31'), value: 20 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				dateGrain: 'day',
				xColumnType: 'date',
				maxFillPoints: 10 // Would need ~364 points for a year
			});

			// Should fall back to just the 2 original points
			expect(result).toHaveLength(2);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// DATE GRAIN INFERENCE
	// ──────────────────────────────────────────────────────────────────────────

	describe('date grain inference (when dateGrain not provided)', () => {
		it('should infer daily grain from daily data', () => {
			const data = [
				{ date: new Date('2024-01-01'), value: 10 },
				{ date: new Date('2024-01-02'), value: 20 },
				{ date: new Date('2024-01-03'), value: 30 },
				{ date: new Date('2024-01-05'), value: 50 } // Gap at Jan 4
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				xColumnType: 'date'
				// No dateGrain - should infer 'day'
			});

			expect(result).toHaveLength(5);
		});

		it('should infer weekly grain from weekly data', () => {
			const data = [
				{ date: new Date('2024-01-01'), value: 10 },
				{ date: new Date('2024-01-08'), value: 20 },
				{ date: new Date('2024-01-15'), value: 30 },
				{ date: new Date('2024-01-29'), value: 50 } // Gap at Jan 22
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(5); // 5 weeks
		});

		it('should fall back when grain cannot be inferred', () => {
			// Irregular intervals that don't match any known grain
			const data = [
				{ date: new Date('2024-01-01'), value: 10 },
				{ date: new Date('2024-01-04'), value: 20 }, // 3 days
				{ date: new Date('2024-01-09'), value: 30 } // 5 days
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				xColumnType: 'date'
			});

			// Can't infer - should return original data
			expect(result).toHaveLength(3);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// STRING X-AXIS (no temporal filling possible)
	// ──────────────────────────────────────────────────────────────────────────

	describe('string x-axis (cross-series only)', () => {
		it('should only do cross-series alignment for string x values', () => {
			const data = [
				{ x: 'Apple', series: 'A', y: 10 },
				{ x: 'Banana', series: 'A', y: 20 },
				{ x: 'Apple', series: 'B', y: 15 }
			];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				seriesColumn: 'series',
				handleMissing: 'gaps' // Requested but can't interpolate strings
			});

			// Should still do cross-series alignment
			expect(result).toHaveLength(4);

			const bananaB = result.find((row) => row.x === 'Banana' && row.series === 'B');
			expect(bananaB?.y).toBeNull();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// EDGE CASES
	// ──────────────────────────────────────────────────────────────────────────

	describe('ISO date strings (from ClickHouse)', () => {
		it('should handle ISO date strings and fill gaps', () => {
			// This is how dates typically come from ClickHouse
			const data = [
				{ date: '2025-01-01', sales: 100 },
				{ date: '2025-01-02', sales: 140 },
				{ date: '2025-01-03', sales: 160 },
				{ date: '2025-01-07', sales: 130 },
				{ date: '2025-01-08', sales: 120 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'sales',
				handleMissing: 'zero',
				xColumnType: 'date' // Column type from query result
			});

			// Should fill Jan 4, 5, 6
			expect(result).toHaveLength(8);

			// Check that gaps are filled with zero
			const jan4 = result.find((row) => row.date === '2025-01-04');
			const jan5 = result.find((row) => row.date === '2025-01-05');
			const jan6 = result.find((row) => row.date === '2025-01-06');

			expect(jan4?.sales).toBe(0);
			expect(jan5?.sales).toBe(0);
			expect(jan6?.sales).toBe(0);
		});

		it('should handle ISO date strings with explicit grain', () => {
			const data = [
				{ date: '2025-01-01', value: 10 },
				{ date: '2025-01-08', value: 20 },
				{ date: '2025-01-22', value: 40 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				dateGrain: 'week',
				xColumnType: 'date'
			});

			// Should have 4 weeks: Jan 1, 8, 15, 22
			expect(result).toHaveLength(4);

			const jan15 = result.find((row) => row.date === '2025-01-15');
			expect(jan15?.value).toBeNull();
		});

		it('should preserve string format for filled dates', () => {
			const data = [
				{ date: '2025-01-01', value: 10 },
				{ date: '2025-01-03', value: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'gaps',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			// All dates should be strings, not Date objects
			result.forEach((row) => {
				expect(typeof row.date).toBe('string');
			});

			// Check format is YYYY-MM-DD
			const jan2 = result.find((row) => row.date === '2025-01-02');
			expect(jan2).toBeDefined();
			expect(jan2?.date).toBe('2025-01-02');
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// COMPREHENSIVE DATE HANDLING TESTS
	// These tests verify the timezone-agnostic string arithmetic works correctly
	// ──────────────────────────────────────────────────────────────────────────

	describe('date format handling (ClickHouse types)', () => {
		it('should handle Date format: YYYY-MM-DD', () => {
			const data = [
				{ date: '2024-01-01', value: 100 },
				{ date: '2024-01-03', value: 300 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
		});

		it('should handle DateTime format: YYYY-MM-DD HH:MM:SS', () => {
			// DateTime from ClickHouse includes time but we only care about the date portion
			const data = [
				{ date: '2024-01-01 14:30:00', value: 100 },
				{ date: '2024-01-03 09:15:00', value: 300 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			// Should extract date portion only
			expect(result.map((r) => r.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
		});

		it('should handle DateTime64 format: YYYY-MM-DD HH:MM:SS.sss', () => {
			const data = [
				{ date: '2024-01-01 14:30:00.123', value: 100 },
				{ date: '2024-01-03 09:15:00.456', value: 300 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
		});

		it('should handle ISO format: YYYY-MM-DDTHH:MM:SS.sssZ', () => {
			const data = [
				{ date: '2024-01-01T14:30:00.000Z', value: 100 },
				{ date: '2024-01-03T09:15:00.000Z', value: 300 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
		});
	});

	describe('date grain handling', () => {
		it('should handle day grain correctly', () => {
			const data = [
				{ date: '2024-01-01', value: 10 },
				{ date: '2024-01-05', value: 50 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(5);
			expect(result.map((r) => r.date)).toEqual([
				'2024-01-01',
				'2024-01-02',
				'2024-01-03',
				'2024-01-04',
				'2024-01-05'
			]);
		});

		it('should handle week grain correctly', () => {
			const data = [
				{ date: '2024-01-01', value: 10 },
				{ date: '2024-01-22', value: 40 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'week',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(4);
			expect(result.map((r) => r.date)).toEqual([
				'2024-01-01',
				'2024-01-08',
				'2024-01-15',
				'2024-01-22'
			]);
		});

		it('should handle month grain correctly', () => {
			const data = [
				{ date: '2024-01-01', value: 10 },
				{ date: '2024-05-01', value: 50 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'month',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(5);
			expect(result.map((r) => r.date)).toEqual([
				'2024-01-01',
				'2024-02-01',
				'2024-03-01',
				'2024-04-01',
				'2024-05-01'
			]);
		});

		it('should handle quarter grain correctly', () => {
			const data = [
				{ date: '2024-01-01', value: 10 },
				{ date: '2024-10-01', value: 40 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'quarter',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(4);
			expect(result.map((r) => r.date)).toEqual([
				'2024-01-01',
				'2024-04-01',
				'2024-07-01',
				'2024-10-01'
			]);
		});

		it('should handle year grain correctly', () => {
			const data = [
				{ date: '2020-01-01', value: 10 },
				{ date: '2024-01-01', value: 50 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'year',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(5);
			expect(result.map((r) => r.date)).toEqual([
				'2020-01-01',
				'2021-01-01',
				'2022-01-01',
				'2023-01-01',
				'2024-01-01'
			]);
		});
	});

	describe('date edge cases', () => {
		it('should handle year rollover (December to January)', () => {
			const data = [
				{ date: '2023-11-01', value: 10 },
				{ date: '2024-02-01', value: 40 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'month',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(4);
			expect(result.map((r) => r.date)).toEqual([
				'2023-11-01',
				'2023-12-01',
				'2024-01-01',
				'2024-02-01'
			]);
		});

		it('should handle leap year February correctly', () => {
			// 2024 is a leap year
			const data = [
				{ date: '2024-02-28', value: 10 },
				{ date: '2024-03-01', value: 20 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
		});

		it('should handle non-leap year February correctly', () => {
			// 2023 is not a leap year
			const data = [
				{ date: '2023-02-27', value: 10 },
				{ date: '2023-03-01', value: 20 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual(['2023-02-27', '2023-02-28', '2023-03-01']);
		});

		it('should handle weeks spanning month boundaries', () => {
			// Week grain should correctly step across month boundaries
			const data = [
				{ date: '2024-01-29', value: 10 },
				{ date: '2024-02-12', value: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'week',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual([
				'2024-01-29',
				'2024-02-05', // Week after Jan 29
				'2024-02-12'
			]);
		});

		it('should handle month boundaries with 30/31 day months', () => {
			const data = [
				{ date: '2024-01-30', value: 10 },
				{ date: '2024-02-01', value: 30 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(3);
			expect(result.map((r) => r.date)).toEqual(['2024-01-30', '2024-01-31', '2024-02-01']);
		});

		it('should handle dates spanning multiple years', () => {
			const data = [
				{ date: '2022-06-01', value: 10 },
				{ date: '2025-06-01', value: 40 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'year',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(4);
			expect(result.map((r) => r.date)).toEqual([
				'2022-06-01',
				'2023-06-01',
				'2024-06-01',
				'2025-06-01'
			]);
		});

		it('should preserve original values when generating sequence', () => {
			// Ensure original data points are not modified or lost
			const data = [
				{ date: '2024-01-01', value: 111 },
				{ date: '2024-01-02', value: 222 },
				{ date: '2024-01-04', value: 444 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				handleMissing: 'zero',
				dateGrain: 'day',
				xColumnType: 'date'
			});

			expect(result).toHaveLength(4);
			expect(result.find((r) => r.date === '2024-01-01')?.value).toBe(111);
			expect(result.find((r) => r.date === '2024-01-02')?.value).toBe(222);
			expect(result.find((r) => r.date === '2024-01-03')?.value).toBe(0); // filled
			expect(result.find((r) => r.date === '2024-01-04')?.value).toBe(444);
		});
	});

	describe('sparse series with connect mode', () => {
		it('should preserve original values when filling sparse series', () => {
			// Scenario: 2 series with full data, 1 series with only 1 entry (value 0)
			// This tests that fillGaps doesn't overwrite existing values
			const data = [
				{ date: '2024-01', category: 'A', value: 100 },
				{ date: '2024-02', category: 'A', value: 110 },
				{ date: '2024-03', category: 'A', value: 120 },
				{ date: '2024-04', category: 'A', value: 130 },
				{ date: '2024-05', category: 'A', value: 140 },
				{ date: '2024-01', category: 'B', value: 200 },
				{ date: '2024-02', category: 'B', value: 210 },
				{ date: '2024-03', category: 'B', value: 220 },
				{ date: '2024-04', category: 'B', value: 230 },
				{ date: '2024-05', category: 'B', value: 240 },
				// Series C: sparse - only 1 entry with value 0
				{ date: '2024-03', category: 'C', value: 0 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				seriesColumn: 'category',
				handleMissing: 'connect'
			});

			// Series A should preserve all original values
			const seriesA = result.filter((row) => row.category === 'A');
			expect(seriesA.find((r) => r.date === '2024-01')?.value).toBe(100);
			expect(seriesA.find((r) => r.date === '2024-02')?.value).toBe(110);
			expect(seriesA.find((r) => r.date === '2024-03')?.value).toBe(120);
			expect(seriesA.find((r) => r.date === '2024-04')?.value).toBe(130);
			expect(seriesA.find((r) => r.date === '2024-05')?.value).toBe(140);

			// Series B should preserve all original values
			const seriesB = result.filter((row) => row.category === 'B');
			expect(seriesB.find((r) => r.date === '2024-01')?.value).toBe(200);
			expect(seriesB.find((r) => r.date === '2024-02')?.value).toBe(210);
			expect(seriesB.find((r) => r.date === '2024-03')?.value).toBe(220);
			expect(seriesB.find((r) => r.date === '2024-04')?.value).toBe(230);
			expect(seriesB.find((r) => r.date === '2024-05')?.value).toBe(240);

			// Series C: original value should be preserved, others filled with null
			const seriesC = result.filter((row) => row.category === 'C');
			expect(seriesC.find((r) => r.date === '2024-03')?.value).toBe(0);
		});

		it('should generate correct dates with handleMissing=zero (timezone-agnostic)', () => {
			// This test verifies that date sequence generation is timezone-agnostic.
			// Previously, using date-fns with local time caused dates to shift incorrectly.
			// The fix uses pure string arithmetic which works in any timezone.
			const data = [
				{ date: '2024-01-01', category: 'A', value: 100 },
				{ date: '2024-02-01', category: 'A', value: 110 },
				{ date: '2024-03-01', category: 'A', value: 120 },
				{ date: '2024-04-01', category: 'A', value: 130 },
				{ date: '2024-05-01', category: 'A', value: 140 },
				{ date: '2024-01-01', category: 'B', value: 200 },
				{ date: '2024-02-01', category: 'B', value: 210 },
				{ date: '2024-03-01', category: 'B', value: 220 },
				{ date: '2024-04-01', category: 'B', value: 230 },
				{ date: '2024-05-01', category: 'B', value: 240 },
				// Sparse series C
				{ date: '2024-03-01', category: 'C', value: 0 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				seriesColumn: 'category',
				handleMissing: 'zero',
				dateGrain: 'month',
				xColumnType: 'date'
			});

			// All dates should be on the 1st - no timezone shifting
			const uniqueDates = [...new Set(result.map((r) => r.date))].sort();
			expect(uniqueDates).toEqual([
				'2024-01-01',
				'2024-02-01',
				'2024-03-01',
				'2024-04-01',
				'2024-05-01'
			]);

			// Series A and B should preserve original values
			const seriesA = result.filter((row) => row.category === 'A');
			expect(seriesA.find((r) => r.date === '2024-01-01')?.value).toBe(100);
			expect(seriesA.find((r) => r.date === '2024-05-01')?.value).toBe(140);

			// Series C should be filled with zeros
			const seriesC = result.filter((row) => row.category === 'C');
			expect(seriesC).toHaveLength(5);
			expect(seriesC.find((r) => r.date === '2024-01-01')?.value).toBe(0);
			expect(seriesC.find((r) => r.date === '2024-03-01')?.value).toBe(0); // original
			expect(seriesC.find((r) => r.date === '2024-05-01')?.value).toBe(0);
		});
	});

	describe('edge cases', () => {
		it('should handle single data point', () => {
			const data = [{ x: 1, y: 10 }];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'gaps'
			});

			expect(result).toHaveLength(1);
		});

		it('should preserve original row objects (not clone)', () => {
			const originalRow = { x: 1, y: 10, extra: 'metadata' };
			const data = [originalRow, { x: 2, y: 20 }];

			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				seriesColumn: undefined,
				handleMissing: 'connect'
			});

			expect(result[0]).toBe(originalRow);
		});

		it('should handle null values in x column gracefully', () => {
			const data = [
				{ x: 1, y: 10 },
				{ x: null, y: 20 },
				{ x: 3, y: 30 }
			];

			// Should not throw
			const result = fillGaps({
				data,
				xColumn: 'x',
				yColumn: 'y',
				handleMissing: 'gaps'
			});

			expect(result.length).toBeGreaterThanOrEqual(3);
		});

		it('should handle Date objects correctly in lookup map', () => {
			const date1 = new Date('2024-01-01');
			const date2 = new Date('2024-01-01'); // Same date, different object

			const data = [
				{ date: date1, series: 'A', value: 10 },
				{ date: date2, series: 'B', value: 20 }
			];

			const result = fillGaps({
				data,
				xColumn: 'date',
				yColumn: 'value',
				seriesColumn: 'series'
			});

			// Should recognize these as the same date
			expect(result).toHaveLength(2);
		});
	});
});

// ============================================================================
// HELPER FUNCTION: inferDateGrain
// ============================================================================

describe('inferDateGrain', () => {
	it('should infer daily grain from daily differences', () => {
		const dates = [
			new Date('2024-01-01'),
			new Date('2024-01-02'),
			new Date('2024-01-03'),
			new Date('2024-01-04')
		];

		expect(inferDateGrain(dates)).toBe('day');
	});

	it('should infer weekly grain from weekly differences', () => {
		const dates = [
			new Date('2024-01-01'),
			new Date('2024-01-08'),
			new Date('2024-01-15'),
			new Date('2024-01-22')
		];

		expect(inferDateGrain(dates)).toBe('week');
	});

	it('should infer monthly grain from monthly differences', () => {
		const dates = [
			new Date('2024-01-01'),
			new Date('2024-02-01'),
			new Date('2024-03-01'),
			new Date('2024-04-01')
		];

		expect(inferDateGrain(dates)).toBe('month');
	});

	it('should infer hourly grain from hourly differences', () => {
		const dates = [
			new Date('2024-01-01T00:00:00'),
			new Date('2024-01-01T01:00:00'),
			new Date('2024-01-01T02:00:00'),
			new Date('2024-01-01T03:00:00')
		];

		expect(inferDateGrain(dates)).toBe('hour');
	});

	it('should return null for irregular intervals', () => {
		const dates = [
			new Date('2024-01-01'),
			new Date('2024-01-04'), // 3 days
			new Date('2024-01-09') // 5 days
		];

		expect(inferDateGrain(dates)).toBeNull();
	});

	it('should return null for single date', () => {
		const dates = [new Date('2024-01-01')];
		expect(inferDateGrain(dates)).toBeNull();
	});

	it('should use median to handle outliers', () => {
		// 3 daily intervals + 1 outlier (weekly jump)
		const dates = [
			new Date('2024-01-01'),
			new Date('2024-01-02'),
			new Date('2024-01-03'),
			new Date('2024-01-04'),
			new Date('2024-01-11') // 7 day jump (outlier)
		];

		// Median of [1d, 1d, 1d, 7d] = 1d (median of sorted diffs)
		expect(inferDateGrain(dates)).toBe('day');
	});
});

// ============================================================================
// HELPER FUNCTION: inferNumericInterval
// ============================================================================

describe('inferNumericInterval', () => {
	it('should find interval from uniform spacing', () => {
		const numbers = [0, 10, 20, 30, 40];
		expect(inferNumericInterval(numbers)).toBe(10);
	});

	it('should find GCD interval from mixed spacing', () => {
		// Diffs: 10, 10, 15, 15 → GCD = 5
		const numbers = [0, 10, 20, 35, 50];
		expect(inferNumericInterval(numbers)).toBe(5);
	});

	it('should handle decimal intervals', () => {
		const numbers = [0, 0.5, 1.0, 1.5, 2.0];
		expect(inferNumericInterval(numbers)).toBe(0.5);
	});

	it('should handle unsorted input', () => {
		const numbers = [30, 10, 20, 0, 40];
		expect(inferNumericInterval(numbers)).toBe(10);
	});

	it('should return null for single value', () => {
		const numbers = [42];
		expect(inferNumericInterval(numbers)).toBeNull();
	});

	it('should handle negative numbers', () => {
		const numbers = [-20, -10, 0, 10, 20];
		expect(inferNumericInterval(numbers)).toBe(10);
	});
});
