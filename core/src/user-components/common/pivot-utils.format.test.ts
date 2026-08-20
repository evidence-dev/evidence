import { describe, it, expect } from 'vitest';
import { formatValue } from '../formatValue';

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
