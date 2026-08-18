// pragma: allowlist secret
import { describe, it, expect } from 'vitest';
import {
	formatValue,
	standardizeDateString,
	parseSeriesTimestampMs,
	canonicalizeTimeAxisValue
} from './formatValue';

describe('formatValue', () => {
	describe('decimal separator conversion', () => {
		describe('numeric values with comma decimal separator', () => {
			it('should convert US format to European format for simple numbers', () => {
				expect(formatValue(1234.56, 'num2', '', undefined, undefined, 'sunday', ',')).toBe(
					'1.234,56'
				);
			});

			it('should convert thousands separator for large numbers', () => {
				expect(formatValue(1234567.89, 'num2', '', undefined, undefined, 'sunday', ',')).toBe(
					'1.234.567,89'
				);
			});

			it('should handle currency formats', () => {
				expect(formatValue(1234.56, 'usd2', '', undefined, undefined, 'sunday', ',')).toBe(
					'$1.234,56'
				);
				expect(formatValue(1234.56, 'eur2', '', undefined, undefined, 'sunday', ',')).toBe(
					'€1.234,56'
				);
			});

			it('should handle percentage formats', () => {
				expect(formatValue(0.1234, 'pct2', '', undefined, undefined, 'sunday', ',')).toBe(
					`12,34${String.fromCharCode(37)}`
				);
			});

			it('should handle zero values', () => {
				expect(formatValue(0, 'num2', '', undefined, undefined, 'sunday', ',')).toBe('0,00');
			});

			it('should handle negative numbers', () => {
				expect(formatValue(-1234.56, 'num2', '', undefined, undefined, 'sunday', ',')).toBe(
					'-1.234,56'
				);
			});
		});

		describe('should NOT convert non-numeric values', () => {
			it('should not convert date formats with commas', () => {
				const date = new Date('2024-01-15');
				// longdate format outputs "January 15, 2024" - the comma should NOT become a period
				const result = formatValue(date, 'longdate', '', undefined, undefined, 'sunday', ',');
				expect(result).toContain(',');
				expect(result).not.toContain('.');
			});

			it('should not convert fulldate format', () => {
				const date = new Date('2024-01-15');
				// fulldate format outputs "Monday January 15, 2024"
				const result = formatValue(date, 'fulldate', '', undefined, undefined, 'sunday', ',');
				expect(result).toContain(',');
			});

			it('should not modify string values without format', () => {
				// String values without a format code return early
				const result = formatValue('Hello, World', null, 'Hello, World');
				expect(result).toBe('Hello, World');
			});
		});

		describe('default period decimal separator', () => {
			it('should use US format by default', () => {
				expect(formatValue(1234.56, 'num2')).toBe('1,234.56');
			});

			it('should use US format when explicitly set to period', () => {
				expect(formatValue(1234.56, 'num2', '', undefined, undefined, 'sunday', '.')).toBe(
					'1,234.56'
				);
			});
		});

		describe('edge cases', () => {
			it('should handle numbers without decimals', () => {
				expect(formatValue(1234, 'num0', '', undefined, undefined, 'sunday', ',')).toBe('1.234');
			});

			it('should handle small numbers without thousands separator', () => {
				expect(formatValue(123.45, 'num2', '', undefined, undefined, 'sunday', ',')).toBe('123,45');
			});

			it('should handle scientific notation format', () => {
				expect(formatValue(1234567, 'sci', '', undefined, undefined, 'sunday', ',')).toBe(
					'1,23E+6'
				);
			});
		});

		describe('Excel-style custom format codes', () => {
			it('should convert ###,###.00 format to European style', () => {
				expect(formatValue(123456.78, '###,###.00', '', undefined, undefined, 'sunday', ',')).toBe(
					'123.456,78'
				);
			});

			it('should convert #,##0.00 format to European style', () => {
				expect(formatValue(1234.56, '#,##0.00', '', undefined, undefined, 'sunday', ',')).toBe(
					'1.234,56'
				);
			});

			it('should convert $#,##0.00 format to European style', () => {
				expect(formatValue(1234.56, '$#,##0.00', '', undefined, undefined, 'sunday', ',')).toBe(
					'$1.234,56'
				);
			});

			it('should convert €#,##0.00 format to European style', () => {
				expect(formatValue(1234.56, '€#,##0.00', '', undefined, undefined, 'sunday', ',')).toBe(
					'€1.234,56'
				);
			});

			it('should handle format with no decimal places', () => {
				expect(formatValue(123456, '###,###', '', undefined, undefined, 'sunday', ',')).toBe(
					'123.456'
				);
			});

			it('should handle format with more decimal places', () => {
				expect(formatValue(1234.5678, '#,##0.0000', '', undefined, undefined, 'sunday', ',')).toBe(
					'1.234,5678'
				);
			});
		});

		describe('wacky edge cases - strings and special values', () => {
			it('should not corrupt string "Hello, World. How are you?"', () => {
				// String without format returns fallback
				const result = formatValue(
					'Hello, World. How are you?',
					null,
					'Hello, World. How are you?'
				);
				expect(result).toBe('Hello, World. How are you?');
			});

			it('should not corrupt IP address-like strings', () => {
				const result = formatValue('192.168.1.1', null, '192.168.1.1');
				expect(result).toBe('192.168.1.1');
			});

			it('should not corrupt version strings', () => {
				const result = formatValue('v1.2.3', null, 'v1.2.3');
				expect(result).toBe('v1.2.3');
			});

			it('should handle null value', () => {
				expect(formatValue(null, 'num2', 'N/A', undefined, undefined, 'sunday', ',')).toBe('N/A');
			});

			it('should handle undefined value', () => {
				expect(formatValue(undefined, 'num2', 'N/A', undefined, undefined, 'sunday', ',')).toBe(
					'N/A'
				);
			});

			it('should handle NaN - note: typeof NaN === "number" so separator is applied', () => {
				const result = formatValue(NaN, 'num2', 'Invalid', undefined, undefined, 'sunday', ',');
				// NaN formats as "NaN.00" then gets separator converted to "NaN,00"
				// This is a known edge case - NaN is typeof 'number'
				expect(result).toBe('NaN,00');
			});

			it('should handle Infinity', () => {
				const result = formatValue(Infinity, 'num2', '', undefined, undefined, 'sunday', ',');
				// SSF may handle this differently, just ensure no crash
				expect(typeof result).toBe('string');
			});

			it('should handle very large numbers', () => {
				expect(
					formatValue(999999999999.99, '#,##0.00', '', undefined, undefined, 'sunday', ',')
				).toBe('999.999.999.999,99');
			});

			it('should handle very small decimals', () => {
				expect(formatValue(0.000001, '0.000000', '', undefined, undefined, 'sunday', ',')).toBe(
					'0,000001'
				);
			});

			it('should not corrupt format with text literals containing periods', () => {
				// Format like "0.00 units" - the text "units" should stay, decimal should convert
				expect(formatValue(1234.56, '0.00" units"', '', undefined, undefined, 'sunday', ',')).toBe(
					'1234,56 units'
				);
			});

			it('should handle quarter format (returns early, no conversion)', () => {
				const date = new Date('2024-06-15');
				const result = formatValue(date, 'quarter', '', undefined, undefined, 'sunday', ',');
				expect(result).toBe('2024-Q2');
			});

			it('should handle string that looks like a number with comma decimal', () => {
				// European-formatted input string - should be treated as string, not converted
				const result = formatValue('1.234,56', null, '1.234,56');
				expect(result).toBe('1.234,56');
			});

			it('should handle empty string - gets auto-formatted as number', () => {
				// Empty string is falsy and gets auto-formatted, SSF treats it as 0
				expect(formatValue('', null, '')).toBe('0');
			});

			it('should handle "Total" special value', () => {
				expect(formatValue('Total', 'num2', '', undefined, undefined, 'sunday', ',')).toBe('Total');
			});
		});
	});

	describe('day of week formatting', () => {
		describe('numeric day-of-week values with ddd format', () => {
			it('should format 1-7 as short day names (sunday first)', () => {
				expect(formatValue(1, 'ddd', '', undefined, undefined, 'sunday')).toBe('Sun');
				expect(formatValue(2, 'ddd', '', undefined, undefined, 'sunday')).toBe('Mon');
				expect(formatValue(3, 'ddd', '', undefined, undefined, 'sunday')).toBe('Tue');
				expect(formatValue(4, 'ddd', '', undefined, undefined, 'sunday')).toBe('Wed');
				expect(formatValue(5, 'ddd', '', undefined, undefined, 'sunday')).toBe('Thu');
				expect(formatValue(6, 'ddd', '', undefined, undefined, 'sunday')).toBe('Fri');
				expect(formatValue(7, 'ddd', '', undefined, undefined, 'sunday')).toBe('Sat');
			});

			it('should format 1-7 as short day names (monday first)', () => {
				expect(formatValue(1, 'ddd', '', undefined, undefined, 'monday')).toBe('Mon');
				expect(formatValue(2, 'ddd', '', undefined, undefined, 'monday')).toBe('Tue');
				expect(formatValue(3, 'ddd', '', undefined, undefined, 'monday')).toBe('Wed');
				expect(formatValue(4, 'ddd', '', undefined, undefined, 'monday')).toBe('Thu');
				expect(formatValue(5, 'ddd', '', undefined, undefined, 'monday')).toBe('Fri');
				expect(formatValue(6, 'ddd', '', undefined, undefined, 'monday')).toBe('Sat');
				expect(formatValue(7, 'ddd', '', undefined, undefined, 'monday')).toBe('Sun');
			});

		});

		describe('numeric day-of-week values with dddd format', () => {
			it('should format 1-7 as long day names (sunday first)', () => {
				expect(formatValue(1, 'dddd', '', undefined, undefined, 'sunday')).toBe('Sunday');
				expect(formatValue(2, 'dddd', '', undefined, undefined, 'sunday')).toBe('Monday');
				expect(formatValue(3, 'dddd', '', undefined, undefined, 'sunday')).toBe('Tuesday');
				expect(formatValue(4, 'dddd', '', undefined, undefined, 'sunday')).toBe('Wednesday');
				expect(formatValue(5, 'dddd', '', undefined, undefined, 'sunday')).toBe('Thursday');
				expect(formatValue(6, 'dddd', '', undefined, undefined, 'sunday')).toBe('Friday');
				expect(formatValue(7, 'dddd', '', undefined, undefined, 'sunday')).toBe('Saturday');
			});

			it('should format 1-7 as long day names (monday first)', () => {
				expect(formatValue(1, 'dddd', '', undefined, undefined, 'monday')).toBe('Monday');
				expect(formatValue(2, 'dddd', '', undefined, undefined, 'monday')).toBe('Tuesday');
				expect(formatValue(3, 'dddd', '', undefined, undefined, 'monday')).toBe('Wednesday');
				expect(formatValue(4, 'dddd', '', undefined, undefined, 'monday')).toBe('Thursday');
				expect(formatValue(5, 'dddd', '', undefined, undefined, 'monday')).toBe('Friday');
				expect(formatValue(6, 'dddd', '', undefined, undefined, 'monday')).toBe('Saturday');
				expect(formatValue(7, 'dddd', '', undefined, undefined, 'monday')).toBe('Sunday');
			});
		});

		describe('string numeric day-of-week values', () => {
			it('should handle string numbers with ddd format', () => {
				expect(formatValue('1', 'ddd', '', undefined, undefined, 'sunday')).toBe('Sun');
				expect(formatValue('3', 'ddd', '', undefined, undefined, 'sunday')).toBe('Tue');
				expect(formatValue('5', 'ddd', '', undefined, undefined, 'sunday')).toBe('Thu');
			});

			it('should handle string numbers with dddd format', () => {
				expect(formatValue('1', 'dddd', '', undefined, undefined, 'sunday')).toBe('Sunday');
				expect(formatValue('4', 'dddd', '', undefined, undefined, 'monday')).toBe('Thursday');
				expect(formatValue('7', 'dddd', '', undefined, undefined, 'monday')).toBe('Sunday');
			});
		});

		describe('date values with ddd format', () => {
			it('should show correct day of week for date objects', () => {
				const monday = new Date('2024-01-15T00:00:00');
				const result = formatValue(monday, 'ddd');
				expect(result).toBe('Mon');
			});

			it('should show correct day of week for date strings', () => {
				const result = formatValue('2024-01-15', 'ddd');
				expect(result).toBe('Mon');
			});

			it('should show correct day of week for date objects with dddd format', () => {
				const wednesday = new Date('2024-01-17T00:00:00');
				expect(formatValue(wednesday, 'dddd')).toBe('Wednesday');
			});

			it('should show correct day of week for date strings with dddd format', () => {
				expect(formatValue('2024-01-17', 'dddd')).toBe('Wednesday');
			});
		});

		describe('day of week produces distinct values for all inputs', () => {
			it('should produce 7 distinct short day names for values 1-7 (sunday first)', () => {
				const results = new Set<string>();
				for (let i = 1; i <= 7; i++) {
					results.add(formatValue(i, 'ddd', '', undefined, undefined, 'sunday'));
				}
				expect(results.size).toBe(7);
				expect(results).not.toContain('');
			});

			it('should produce 7 distinct short day names for values 1-7 (monday first)', () => {
				const results = new Set<string>();
				for (let i = 1; i <= 7; i++) {
					results.add(formatValue(i, 'ddd', '', undefined, undefined, 'monday'));
				}
				expect(results.size).toBe(7);
				expect(results).not.toContain('');
			});

			it('should produce 7 distinct long day names for values 1-7', () => {
				const results = new Set<string>();
				for (let i = 1; i <= 7; i++) {
					results.add(formatValue(i, 'dddd', '', undefined, undefined, 'sunday'));
				}
				expect(results.size).toBe(7);
			});

			it('should produce 7 distinct short day names for string values 1-7', () => {
				const results = new Set<string>();
				for (let i = 1; i <= 7; i++) {
					results.add(formatValue(String(i), 'ddd', '', undefined, undefined, 'sunday'));
				}
				expect(results.size).toBe(7);
			});

			it('should produce distinct days for Date objects across a week', () => {
				const days: string[] = [];
				for (let d = 15; d <= 21; d++) {
					days.push(formatValue(new Date(`2024-01-${d}T00:00:00`), 'ddd'));
				}
				expect(new Set(days).size).toBe(7);
			});

			it('should produce distinct days for date strings across a week', () => {
				const days: string[] = [];
				for (let d = 15; d <= 21; d++) {
					days.push(formatValue(`2024-01-${d}`, 'ddd'));
				}
				expect(new Set(days).size).toBe(7);
			});
		});

		describe('day of week with default firstDayOfWeek (omitted parameter)', () => {
			it('should default to sunday-first when firstDayOfWeek is not passed', () => {
				expect(formatValue(1, 'ddd')).toBe('Sun');
				expect(formatValue(7, 'ddd')).toBe('Sat');
			});
		});

		describe('day of week values outside valid range', () => {
			it('should not convert values > 7 to day names', () => {
				const result = formatValue(8, 'ddd');
				expect(result).not.toBe('Sun');
				expect(result).not.toBe('Mon');
			});

			it('should not convert negative values to day names', () => {
				const result = formatValue(-1, 'ddd');
				expect(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).not.toContain(result);
			});
		});
	});

	describe('month formatting', () => {
		it('should format numeric months 1-12 with mmm', () => {
			const months = [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec'
			];
			for (let i = 1; i <= 12; i++) {
				expect(formatValue(i, 'mmm')).toBe(months[i - 1]);
			}
		});

		it('should format numeric months 1-12 with mmmm', () => {
			const months = [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'
			];
			for (let i = 1; i <= 12; i++) {
				expect(formatValue(i, 'mmmm')).toBe(months[i - 1]);
			}
		});

		it('should produce 12 distinct month names', () => {
			const results = new Set<string>();
			for (let i = 1; i <= 12; i++) {
				results.add(formatValue(i, 'mmm'));
			}
			expect(results.size).toBe(12);
		});
	});

	describe('cross-component consistency', () => {
		it('heatmap and chart axis should produce same result for same input', () => {
			for (let i = 1; i <= 7; i++) {
				const heatmapStyle = formatValue(
					String(i),
					'ddd',
					String(i),
					undefined,
					undefined,
					'sunday'
				);
				const chartStyle = formatValue(
					String(i),
					'ddd',
					String(i) + '',
					{ min: 1, max: 7 },
					undefined,
					'sunday'
				);
				expect(heatmapStyle).toBe(chartStyle);
			}
		});

		it('table cell should produce same result as heatmap for same input', () => {
			for (let i = 1; i <= 7; i++) {
				const tableStyle = formatValue(i, 'ddd', String(i), undefined, 'UInt8', 'monday');
				const heatmapStyle = formatValue(
					String(i),
					'ddd',
					String(i),
					undefined,
					undefined,
					'monday'
				);
				expect(tableStyle).toBe(heatmapStyle);
			}
		});

		it('monday-first mode should shift all results by one day vs sunday-first', () => {
			const sundayResults: string[] = [];
			const mondayResults: string[] = [];
			for (let i = 1; i <= 7; i++) {
				sundayResults.push(formatValue(i, 'ddd', '', undefined, undefined, 'sunday'));
				mondayResults.push(formatValue(i, 'ddd', '', undefined, undefined, 'monday'));
			}
			expect(sundayResults[0]).toBe('Sun');
			expect(mondayResults[0]).toBe('Mon');
			expect(sundayResults[1]).toBe(mondayResults[0]);
		});

		it('numeric and string inputs should produce identical results', () => {
			for (let i = 1; i <= 7; i++) {
				const fromNumber = formatValue(i, 'ddd', '', undefined, undefined, 'sunday');
				const fromString = formatValue(String(i), 'ddd', '', undefined, undefined, 'sunday');
				expect(fromNumber).toBe(fromString);
			}
		});
	});

	describe('custom date format codes on date string values (no columnType)', () => {
		it('should format date string with mmm/yy', () => {
			expect(formatValue('2024-01-15', 'mmm/yy')).toBe('Jan/24');
		});

		it('should format date string with yyyy-mmm', () => {
			expect(formatValue('2024-06-15', 'yyyy-mmm')).toBe('2024-Jun');
		});

		it('should format date string with mm/dd/yyyy', () => {
			expect(formatValue('2024-01-15', 'mm/dd/yyyy')).toBe('01/15/2024');
		});

		it('should format date string with dd-mmm-yyyy', () => {
			expect(formatValue('2024-01-15', 'dd-mmm-yyyy')).toBe('15-Jan-2024');
		});

		it('should format date string with mmmm yyyy', () => {
			expect(formatValue('2024-01-15', 'mmmm yyyy')).toBe('January 2024');
		});

		it('should not return raw ISO date string for any date format', () => {
			const dateFormats = ['mmm/yy', 'yyyy-mmm', 'dd-mmm-yyyy', 'mmmm yyyy'];
			for (const fmt of dateFormats) {
				const result = formatValue('2024-01-15', fmt);
				expect(result).not.toBe('2024-01-15');
			}
		});
	});

	describe('preset date format codes on date string values (no columnType)', () => {
		it('should format date string with shortdate', () => {
			const result = formatValue('2022-09-01', 'shortdate');
			expect(result).toBe('Sep 1/22');
		});

		it('should format date string with longdate', () => {
			const result = formatValue('2022-09-01', 'longdate');
			expect(result).toBe('September 1, 2022');
		});

		it('should format date string with fulldate', () => {
			const result = formatValue('2022-09-01', 'fulldate');
			expect(result).toContain('September');
			expect(result).toContain('2022');
		});

		it('should format date string with mdy', () => {
			const result = formatValue('2022-09-01', 'mdy');
			expect(result).toBe('9/1/22');
		});

		it('should format date string with dmy', () => {
			const result = formatValue('2022-09-01', 'dmy');
			expect(result).toBe('1/9/22');
		});

		it('should format date string with mmm-yy', () => {
			const result = formatValue('2022-09-01', 'mmm-yy');
			expect(result).toBe('Sep-22');
		});

		it('each preset format should produce a different output for the same date', () => {
			const date = '2022-09-01';
			const results = new Set([
				formatValue(date, 'shortdate'),
				formatValue(date, 'longdate'),
				formatValue(date, 'fulldate'),
				formatValue(date, 'mdy'),
				formatValue(date, 'dmy'),
				formatValue(date, 'mmm-yy')
			]);
			expect(results.size).toBe(6);
		});

		it('should format date string with hms when value has time', () => {
			const result = formatValue('2022-09-01 14:30:00', 'hms');
			expect(result).toContain(':');
		});
	});

	describe('date format codes with columnType metadata', () => {
		it('should format date string with shortdate when columnType is Date', () => {
			expect(formatValue('2022-09-01', 'shortdate', '', undefined, 'Date')).toBe('Sep 1/22');
		});

		it('should format date string with longdate when columnType is DateTime', () => {
			expect(formatValue('2022-09-01', 'longdate', '', undefined, 'DateTime')).toBe(
				'September 1, 2022'
			);
		});

		it('should format date string with custom format when columnType is Date', () => {
			expect(formatValue('2024-01-15', 'mmm/yy', '', undefined, 'Date')).toBe('Jan/24');
		});

		it('should format date string with mmm-yy when columnType is Date', () => {
			expect(formatValue('2022-09-01', 'mmm-yy', '', undefined, 'Date')).toBe('Sep-22');
		});

		it('each preset format should produce different output even with same columnType', () => {
			const date = '2022-09-01';
			const columnType = 'Date';
			const results = new Set([
				formatValue(date, 'shortdate', '', undefined, columnType),
				formatValue(date, 'longdate', '', undefined, columnType),
				formatValue(date, 'fulldate', '', undefined, columnType),
				formatValue(date, 'mdy', '', undefined, columnType),
				formatValue(date, 'dmy', '', undefined, columnType),
				formatValue(date, 'mmm-yy', '', undefined, columnType)
			]);
			expect(results.size).toBe(6);
		});
	});

	describe('columnType path vs fallback path consistency', () => {
		it('preset date formats should produce identical results with or without columnType', () => {
			const presets = ['shortdate', 'longdate', 'fulldate', 'mdy', 'dmy', 'date', 'mmm-yy'];
			const date = '2024-06-15';
			for (const fmt of presets) {
				const withType = formatValue(date, fmt, '', undefined, 'date');
				const withoutType = formatValue(date, fmt);
				expect(withType).toBe(withoutType);
			}
		});

		it('custom date formats should produce identical results with or without columnType', () => {
			const customFormats = ['mmm/yy', 'yyyy-mmm', 'dd-mmm-yyyy', 'mmmm yyyy'];
			const date = '2024-06-15';
			for (const fmt of customFormats) {
				const withType = formatValue(date, fmt, '', undefined, 'date');
				const withoutType = formatValue(date, fmt);
				expect(withType).toBe(withoutType);
			}
		});

		it('day-of-week formats should produce identical results with or without columnType', () => {
			for (let i = 1; i <= 7; i++) {
				const withType = formatValue(i, 'ddd', '', undefined, 'number', 'sunday');
				const withoutType = formatValue(i, 'ddd', '', undefined, undefined, 'sunday');
				expect(withType).toBe(withoutType);
			}
		});
	});

	describe('auto-scaling formats', () => {
		it('should auto-scale num based on range', () => {
			expect(formatValue(1500000, 'num', '', { min: 0, max: 2000000 })).toContain('M');
		});

		it('should auto-scale usd based on range', () => {
			expect(formatValue(5000, 'usd', '', { min: 0, max: 10000 })).toContain('k');
		});

		it('should not add units for small values', () => {
			const result = formatValue(42.5, 'num', '', { min: 0, max: 100 });
			expect(result).not.toContain('k');
			expect(result).not.toContain('M');
		});

		it('should use base format with no scaling for zero', () => {
			const result = formatValue(0, 'usd');
			expect(result).toBe('$0');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	// USER SCENARIO TESTS
	// Each describe block represents a real user scenario.
	// These serve as the behavioral contract for any future refactor.
	// ─────────────────────────────────────────────────────────────────────────

	describe('scenario: format a number with decimal precision', () => {
		it('num0 shows no decimals with thousands separator', () => {
			expect(formatValue(1234, 'num0')).toBe('1,234');
		});

		it('num1 shows 1 decimal place', () => {
			expect(formatValue(1234.5, 'num1')).toBe('1,234.5');
		});

		it('num2 shows 2 decimal places', () => {
			expect(formatValue(1234.56, 'num2')).toBe('1,234.56');
		});

		it('num3 shows 3 decimal places', () => {
			expect(formatValue(1234.567, 'num3')).toBe('1,234.567');
		});

		it('num4 shows 4 decimal places', () => {
			expect(formatValue(1234.5678, 'num4')).toBe('1,234.5678');
		});

		it('negative numbers get minus sign', () => {
			expect(formatValue(-1234.56, 'num2')).toBe('-1,234.56');
		});

		it('zero shows as zero', () => {
			expect(formatValue(0, 'num2')).toBe('0.00');
		});

		it('string number is treated as number', () => {
			expect(formatValue('1234.56', 'num2')).toBe('1,234.56');
		});
	});

	describe('scenario: format a number as currency', () => {
		it('usd shows dollar sign', () => {
			expect(formatValue(1234, 'usd0')).toBe('$1,234');
		});

		it('usd2 shows 2 decimal places', () => {
			expect(formatValue(1234.56, 'usd2')).toBe('$1,234.56');
		});

		it('eur shows euro sign', () => {
			expect(formatValue(1234, 'eur0')).toContain('€');
		});

		it('gbp shows pound sign', () => {
			expect(formatValue(1234, 'gbp0')).toContain('£');
		});

		it('negative currency', () => {
			expect(formatValue(-500, 'usd0')).toContain('$');
			expect(formatValue(-500, 'usd0')).toContain('500');
		});

		it('zero currency', () => {
			expect(formatValue(0, 'usd2')).toBe('$0.00');
		});

		it('with unit scaling (k, M, B, T)', () => {
			expect(formatValue(5000, 'usd0k')).toBe('$5k');
			expect(formatValue(1500000, 'usd1m')).toBe('$1.5M');
			expect(formatValue(2000000000, 'usd1b')).toBe('$2.0B');
			expect(formatValue(2000000000000, 'usd1t')).toBe('$2.0T');
		});
	});

	describe('scenario: format a number as percentage', () => {
		const P = String.fromCharCode(37); // percent sign

		it('pct0 shows whole percentage', () => {
			expect(formatValue(0.75, 'pct0')).toBe(`75${P}`);
		});

		it('pct1 shows 1 decimal', () => {
			expect(formatValue(0.123, 'pct1')).toBe(`12.3${P}`);
		});

		it('pct2 shows 2 decimals', () => {
			expect(formatValue(0.1234, 'pct2')).toBe(`12.34${P}`);
		});

		it('100 percent value', () => {
			expect(formatValue(1, 'pct0')).toBe(`100${P}`);
		});

		it('over 100 percent', () => {
			expect(formatValue(1.5, 'pct0')).toBe(`150${P}`);
		});

		it('negative percentage', () => {
			expect(formatValue(-0.05, 'pct1')).toBe(`-5.0${P}`);
		});

		it('zero percentage', () => {
			expect(formatValue(0, 'pct0')).toBe(`0${P}`);
		});
	});

	describe('scenario: format a date with preset formats', () => {
		const dateObj = new Date('2024-06-15T14:30:00');
		const dateStr = '2024-06-15';
		const datetimeStr = '2024-06-15 14:30:00';

		it('date preset: Date object', () => {
			expect(formatValue(dateObj, 'date')).toBe('2024-06-15');
		});

		it('date preset: date string', () => {
			expect(formatValue(dateStr, 'date')).toBe('2024-06-15');
		});

		it('shortdate: Date object', () => {
			expect(formatValue(dateObj, 'shortdate')).toBe('Jun 15/24');
		});

		it('shortdate: date string', () => {
			expect(formatValue(dateStr, 'shortdate')).toBe('Jun 15/24');
		});

		it('mmm-yy: Date object', () => {
			expect(formatValue(dateObj, 'mmm-yy')).toBe('Jun-24');
		});

		it('mmm-yy: date string', () => {
			expect(formatValue(dateStr, 'mmm-yy')).toBe('Jun-24');
		});

		it('longdate: Date object', () => {
			expect(formatValue(dateObj, 'longdate')).toBe('June 15, 2024');
		});

		it('longdate: date string', () => {
			expect(formatValue(dateStr, 'longdate')).toBe('June 15, 2024');
		});

		it('fulldate: Date object', () => {
			const result = formatValue(dateObj, 'fulldate');
			expect(result).toContain('Saturday');
			expect(result).toContain('June');
			expect(result).toContain('2024');
		});

		it('fulldate: date string', () => {
			const result = formatValue(dateStr, 'fulldate');
			expect(result).toContain('Saturday');
			expect(result).toContain('June');
		});

		it('mdy: Date object', () => {
			expect(formatValue(dateObj, 'mdy')).toBe('6/15/24');
		});

		it('mdy: date string', () => {
			expect(formatValue(dateStr, 'mdy')).toBe('6/15/24');
		});

		it('dmy: Date object', () => {
			expect(formatValue(dateObj, 'dmy')).toBe('15/6/24');
		});

		it('dmy: date string', () => {
			expect(formatValue(dateStr, 'dmy')).toBe('15/6/24');
		});

		it('hms: datetime object', () => {
			const result = formatValue(dateObj, 'hms');
			expect(result).toMatch(/2:30:00 PM/);
		});

		it('hms: datetime string', () => {
			const result = formatValue(datetimeStr, 'hms');
			expect(result).toMatch(/2:30:00 PM/);
		});

		it('all date presets produce distinct results for same date', () => {
			const presets = ['date', 'shortdate', 'longdate', 'fulldate', 'mdy', 'dmy', 'mmm-yy'];
			const results = new Set(presets.map((p) => formatValue(dateObj, p)));
			expect(results.size).toBe(presets.length);
		});
	});

	describe('scenario: format a date with custom format code', () => {
		const dateObj = new Date('2024-06-15T00:00:00');
		const dateStr = '2024-06-15';

		it('mmm/yy from Date object', () => {
			expect(formatValue(dateObj, 'mmm/yy')).toBe('Jun/24');
		});

		it('mmm/yy from date string', () => {
			expect(formatValue(dateStr, 'mmm/yy')).toBe('Jun/24');
		});

		it('dd-mmm-yyyy from Date object', () => {
			expect(formatValue(dateObj, 'dd-mmm-yyyy')).toBe('15-Jun-2024');
		});

		it('mmmm yyyy from Date object', () => {
			expect(formatValue(dateObj, 'mmmm yyyy')).toBe('June 2024');
		});

		it('mm/dd/yyyy from Date object', () => {
			expect(formatValue(dateObj, 'mm/dd/yyyy')).toBe('06/15/2024');
		});

		it('Date object and string produce same result', () => {
			const fmts = ['mmm/yy', 'dd-mmm-yyyy', 'mmmm yyyy', 'mm/dd/yyyy'];
			for (const fmt of fmts) {
				expect(formatValue(dateObj, fmt)).toBe(formatValue(dateStr, fmt));
			}
		});
	});

	describe('scenario: display day of week from date grain', () => {
		// User has date_grain="day of week" which returns toDayOfWeek() → 1-7

		it('ClickHouse sunday-first (mode 3): 1=Sun, 7=Sat', () => {
			const expected = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			for (let i = 1; i <= 7; i++) {
				expect(formatValue(i, 'ddd', '', undefined, undefined, 'sunday')).toBe(expected[i - 1]);
			}
		});

		it('ClickHouse monday-first (mode 0): 1=Mon, 7=Sun', () => {
			const expected = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
			for (let i = 1; i <= 7; i++) {
				expect(formatValue(i, 'ddd', '', undefined, undefined, 'monday')).toBe(expected[i - 1]);
			}
		});

		it('long format (dddd) produces full names', () => {
			expect(formatValue(1, 'dddd', '', undefined, undefined, 'sunday')).toBe('Sunday');
			expect(formatValue(1, 'dddd', '', undefined, undefined, 'monday')).toBe('Monday');
		});

		it('works with string values from heatmap/chart category axes', () => {
			expect(formatValue('3', 'ddd', '', undefined, undefined, 'sunday')).toBe('Tue');
		});
	});

	describe('scenario: display month name from date grain', () => {
		// User has date_grain="month of year" which returns toMonth() → 1-12

		it('short month names (mmm) for all 12 months', () => {
			const expected = [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec'
			];
			for (let i = 1; i <= 12; i++) {
				expect(formatValue(i, 'mmm')).toBe(expected[i - 1]);
			}
		});

		it('long month names (mmmm) for all 12 months', () => {
			const expected = [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'
			];
			for (let i = 1; i <= 12; i++) {
				expect(formatValue(i, 'mmmm')).toBe(expected[i - 1]);
			}
		});

		it('works with string values', () => {
			expect(formatValue('6', 'mmm')).toBe('Jun');
		});
	});

	describe('scenario: display year from date grain', () => {
		it('numeric year with yyyy format', () => {
			expect(formatValue(2024, 'yyyy')).toBe('2024');
		});

		it('string year with yyyy format', () => {
			expect(formatValue('2024', 'yyyy')).toBe('2024');
		});

		it('epoch-millisecond number with yyyy format', () => {
			// Timestamps stored as raw epoch-ms BIGINTs. Without the ms-plausibility
			// check, ssf treats the huge number as an Excel serial and returns ""
			// — silently blank axis labels and table cells.
			expect(formatValue(Date.UTC(2020, 0, 1), 'yyyy')).toBe('2020');
			expect(formatValue(Date.UTC(1974, 5, 15), 'yyyy')).toBe('1974');
			expect(formatValue(Date.UTC(2099, 11, 31), 'yyyy')).toBe('2099');
		});

		it('epoch-millisecond number with a composite yyyy format', () => {
			expect(formatValue(Date.UTC(2020, 5, 15), 'mmm yyyy')).toBe('Jun 2020');
		});

		it('epoch-millisecond number with day-of-week and month formats', () => {
			expect(formatValue(Date.UTC(2020, 0, 1), 'ddd')).toBe('Wed');
			expect(formatValue(Date.UTC(2020, 5, 15), 'mmm')).toBe('Jun');
		});

		it('numbers outside both the year and plausible-timestamp ranges fall through', () => {
			// Not a year, not a plausible ms timestamp for 1900-2100: no conversion.
			expect(formatValue(3000, 'yyyy')).not.toBe('1970');
			expect(formatValue(1e16, 'yyyy')).not.toBe('2286');
		});
	});

	describe('scenario: display hour from date grain', () => {
		it('numeric hour with hms format', () => {
			const result = formatValue(14, 'hms');
			expect(result).toMatch(/2:00:00 PM/);
		});

		it('midnight (0) with hms format', () => {
			const result = formatValue(0, 'hms');
			expect(result).toMatch(/12:00:00 AM/);
		});
	});

	describe('scenario: format quarter from date', () => {
		it('Date object in Q1', () => {
			expect(formatValue(new Date('2024-02-15'), 'quarter')).toBe('2024-Q1');
		});

		it('Date object in Q2', () => {
			expect(formatValue(new Date('2024-06-15'), 'quarter')).toBe('2024-Q2');
		});

		it('Date object in Q3', () => {
			expect(formatValue(new Date('2024-08-15'), 'quarter')).toBe('2024-Q3');
		});

		it('Date object in Q4', () => {
			expect(formatValue(new Date('2024-11-15'), 'quarter')).toBe('2024-Q4');
		});

		it('date string', () => {
			expect(formatValue('2024-06-15', 'quarter')).toBe('2024-Q2');
		});
	});

	describe('scenario: auto-scaling with base format names', () => {
		it('num: 2 decimal places when max < 10', () => {
			const result = formatValue(3.14, 'num', '', { min: 0, max: 9 });
			expect(result).toBe('3.14');
		});

		it('num: 1 decimal place when max 10-99', () => {
			const result = formatValue(42.5, 'num', '', { min: 0, max: 50 });
			expect(result).toBe('42.5');
		});

		it('num: 0 decimal places when max >= 100', () => {
			const result = formatValue(42.5, 'num', '', { min: 0, max: 100 });
			expect(result).toBe('43');
		});

		it('num: no decimals, no units for hundreds', () => {
			const result = formatValue(500, 'num', '', { min: 0, max: 1000 });
			expect(result).toBe('500');
		});

		it('num: adds k for thousands', () => {
			const result = formatValue(5000, 'num', '', { min: 0, max: 10000 });
			expect(result).toContain('k');
		});

		it('num: adds M for millions', () => {
			const result = formatValue(1500000, 'num', '', { min: 0, max: 5000000 });
			expect(result).toContain('M');
		});

		it('num: adds B for billions', () => {
			const result = formatValue(2500000000, 'num', '', { min: 0, max: 5000000000 });
			expect(result).toContain('B');
		});

		it('num: adds T for trillions', () => {
			const result = formatValue(2500000000000, 'num', '', { min: 0, max: 5000000000000 });
			expect(result).toContain('T');
		});

		it('single value (no range) auto-scales from value itself', () => {
			const result = formatValue(1500000, 'num');
			expect(result).toContain('M');
		});
	});

	describe('scenario: no format code provided (auto-format)', () => {
		it('number value auto-formats as number', () => {
			const result = formatValue(1234, null);
			expect(result).toBe('1,234');
		});

		it('date string with columnType=date auto-formats as date', () => {
			const result = formatValue('2024-06-15', null, '', undefined, 'date');
			expect(result).toBe('2024-06-15');
		});

		it('number with columnType=number auto-formats as number', () => {
			const result = formatValue(1234.5, null, '', undefined, 'number');
			expect(result).toBe('1,235');
		});

		it('plain string returns as-is', () => {
			expect(formatValue('hello world', null, 'hello world')).toBe('hello world');
		});
	});

	describe('scenario: null, undefined, and edge case values', () => {
		it('null returns fallback', () => {
			expect(formatValue(null, 'num2', 'N/A')).toBe('N/A');
		});

		it('undefined returns fallback', () => {
			expect(formatValue(undefined, 'num2', 'N/A')).toBe('N/A');
		});

		it('"Total" passes through unchanged', () => {
			expect(formatValue('Total', 'usd2')).toBe('Total');
		});

		it('boolean true', () => {
			const result = formatValue(true, null);
			expect(typeof result).toBe('string');
		});

		it('boolean false', () => {
			const result = formatValue(false, null);
			expect(typeof result).toBe('string');
		});

		it('object value returns JSON', () => {
			const result = formatValue({ a: 1 }, null, 'fallback');
			expect(result).toBe('{"a":1}');
		});
	});

	describe('scenario: custom SSF number format strings', () => {
		it('plain decimal format', () => {
			expect(formatValue(1234.5, '0.00')).toBe('1234.50');
		});

		it('thousands with custom decimals', () => {
			expect(formatValue(1234567.89, '#,##0.00')).toBe('1,234,567.89');
		});

		it('format with text suffix', () => {
			expect(formatValue(42, '0" units"')).toBe('42 units');
		});

		it('format with quoted text prefix', () => {
			expect(formatValue(3, '"Q"0')).toBe('Q3');
		});

		it('scientific notation', () => {
			expect(formatValue(1234567, 'sci')).toBe('1.23E+6');
		});

		it('fraction format', () => {
			const result = formatValue(0.5, 'fract');
			expect(result).toContain('/');
		});

		it('multiplier format', () => {
			expect(formatValue(2.5, 'mult1')).toBe('2.5x');
		});

		it('id format (no thousands separator)', () => {
			expect(formatValue(12345, 'id')).toBe('12345');
		});

		it('format with double-quoted text containing h should not trigger hour conversion', () => {
			expect(formatValue(5, '0"th"')).toBe('5th');
			expect(formatValue(12, '0"th"')).toBe('12th');
		});

		it('format with single-quoted text containing h should not trigger hour conversion', () => {
			expect(formatValue(5, "0'th'")).toBe('5th');
			expect(formatValue(12, "0'th'")).toBe('12th');
		});
	});

	// The "same for everyone" rule: the chart never converts a timestamp to the
	// viewer's timezone. Any UTC offset is stripped up front so the wall-clock
	// digits render verbatim, identically for every viewer. These helpers are the
	// one place that stripping happens; see X_AXIS_SPEC.md § "Timezone rules".
	describe('timezone normalization (same for everyone)', () => {
		describe('standardizeDateString', () => {
			it('leaves a zoneless date-time untouched (just space→T)', () => {
				expect(standardizeDateString('2024-06-01 04:00:00')).toBe('2024-06-01T04:00:00');
			});

			it('appends midnight to a bare date', () => {
				expect(standardizeDateString('2024-06-01')).toBe('2024-06-01T00:00:00');
			});

			it('strips a trailing Z', () => {
				expect(standardizeDateString('2024-06-01T04:00:00Z')).toBe('2024-06-01T04:00:00');
			});

			it('strips a "+hh:mm" offset', () => {
				expect(standardizeDateString('2024-06-01T04:00:00+05:00')).toBe('2024-06-01T04:00:00');
			});

			it('strips a "-hhmm" offset (no colon)', () => {
				expect(standardizeDateString('2024-06-01T04:00:00-0430')).toBe('2024-06-01T04:00:00');
			});

			it('strips a fractional-second + offset via the microsecond rule', () => {
				expect(standardizeDateString('2024-06-01T04:00:00.123Z')).toBe('2024-06-01T04:00:00');
				expect(standardizeDateString('2024-06-01T04:00:00.123456+05:00')).toBe(
					'2024-06-01T04:00:00'
				);
			});

			it('does not mistake a bare date\'s day component for an offset', () => {
				// "2024-06-01" ends in "-01" — only two digits, not a "-hhmm" offset.
				expect(standardizeDateString('2024-06-01')).toBe('2024-06-01T00:00:00');
			});
		});

		describe('parseSeriesTimestampMs', () => {
			it('parses a zoneless string as local wall-clock', () => {
				expect(parseSeriesTimestampMs('2024-06-01T04:00:00')).toBe(
					new Date(2024, 5, 1, 4).getTime()
				);
			});

			it('parses "…Z" to the SAME local wall-clock (offset stripped)', () => {
				expect(parseSeriesTimestampMs('2024-06-01T04:00:00Z')).toBe(
					new Date(2024, 5, 1, 4).getTime()
				);
			});

			it('parses a "+hh:mm" offset to the same local wall-clock', () => {
				expect(parseSeriesTimestampMs('2024-06-01T04:00:00+05:00')).toBe(
					new Date(2024, 5, 1, 4).getTime()
				);
			});

			it('a bare date lands on local midnight, not Date.parse\'s UTC midnight', () => {
				expect(parseSeriesTimestampMs('2024-06-01')).toBe(new Date(2024, 5, 1).getTime());
			});
		});

		describe('canonicalizeTimeAxisValue', () => {
			it('strips the offset from a string (matches what parseSeriesTimestampMs parses)', () => {
				const raw = '2024-06-01T04:00:00Z';
				expect(canonicalizeTimeAxisValue(raw)).toBe('2024-06-01T04:00:00');
				// The value fed to ECharts and the tick-pipeline parse agree.
				expect(Date.parse(canonicalizeTimeAxisValue(raw) as string)).toBe(
					parseSeriesTimestampMs(raw)
				);
			});

			it('passes non-strings (Date, number) through unchanged', () => {
				const d = new Date(2024, 5, 1);
				expect(canonicalizeTimeAxisValue(d)).toBe(d);
				expect(canonicalizeTimeAxisValue(1717200000000)).toBe(1717200000000);
			});
		});
	});
});
