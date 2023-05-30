import { describe, it, expect } from 'vitest';

import {
	isAutoFormat,
	autoFormat,
	fallbackFormat,
	computeNumberAutoFormatCode,
	findImplicitAutoFormat,
	AUTO_FORMAT_CODE
} from '../autoFormatting';
import { BUILT_IN_FORMATS } from '../builtInFormats';

describe('isAutoFormat', () => {
	it('should return false for incorrect formats', () => {
		expect(isAutoFormat('auto')).toBe(false);
		expect(isAutoFormat({ auto: 'auto' })).toBe(false);
		expect(isAutoFormat({ formatCode: 'auto' })).toBe(false); // missing _autoFormat attribute
	});
	it('should return true for correct auto format', () => {
		expect(
			isAutoFormat({
				formatCode: 'auto',
				_autoFormat: {
					autoFormatCode: 'YYYY-MM-DD'
				}
			})
		).toBe(true);

		expect(
			isAutoFormat({
				formatCode: 'auto',
				_autoFormat: {
					autoFormatFunction: (value) => value
				}
			})
		).toBe(true);
	});
});

describe('autoFormat', () => {
	it('should handle implicit number formatting on an array of integers', () => {
		let max = 1234567.8;
		let min = -1234.56;
		let median = 91000.314521;
		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 6,
			max: max,
			min: min
		};

		let format = findImplicitAutoFormat('someColumn', undefined, columnUnitSummary);

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);
		expect(format._autoFormat.autoFormatCode).toBe('#,##0.0');
		expect(format._autoFormat.truncateUnits).toBe(true);

		expect(autoFormat(3121.12, format, columnUnitSummary)).toBe('3.1k');
		expect(autoFormat(0.001, format, columnUnitSummary)).toBe('0.0k');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('91.0k');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('1,234.6k');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('-1.2k');
	});

	it('should handle auto number formatting on an array of large integers includes a column unit and at least three digits for values equal or larger than median', () => {
		let max = 1234567;
		let min = -1234;
		let median = 91000;

		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 0,
			max: max,
			min: min
		};

		let format = findImplicitAutoFormat('someColumn', undefined, columnUnitSummary);

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);

		expect(format._autoFormat.autoFormatCode).toBe('#,##0.0');
		expect(format._autoFormat.truncateUnits).toBe(true);

		expect(autoFormat(3121, format, columnUnitSummary)).toBe('3.1k');
		expect(autoFormat(0, format, columnUnitSummary)).toBe('0.0k');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('91.0k');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('1,234.6k');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('-1.2k');
	});
	it('should handle auto number formatting on an array of only small integer values is #,##0', () => {
		let max = 1234;
		let min = -1234;
		let median = 91;
		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 0,
			max: max,
			min: min
		};

		let format = findImplicitAutoFormat('someColumn', undefined, columnUnitSummary);

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);

		expect(format._autoFormat.autoFormatCode).toBe('#,##0');
		expect(format._autoFormat.truncateUnits).toBe(false);

		expect(autoFormat(312, format, columnUnitSummary)).toBe('312');
		expect(autoFormat(0, format, columnUnitSummary)).toBe('0');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('91');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('1,234');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('-1,234');
	});
	it('should handle number formatting on an auto currency with decimals is formatted correctly', () => {
		let max = 1234567.8;
		let min = -1234.56;
		let median = 91000.314521;
		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 6,
			max: max,
			min: min
		};

		let format = BUILT_IN_FORMATS.find((format) => format.formatTag === 'usd');

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);
		expect(format._autoFormat.autoFormatFunction).toBeDefined();

		expect(autoFormat(3121, format, columnUnitSummary)).toBe('$3.1k');
		expect(autoFormat(0, format, columnUnitSummary)).toBe('$0.0k');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('$91.0k');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('$1,234.6k');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('-$1.2k');
	});

	it('should handle number formatting on an auto currency consisting of only large integer values contain a column unit and at least 3 digits for values equal or larger to the median', () => {
		let max = 1234567;
		let min = 1234;
		let median = 91000;
		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 0,
			max: max,
			min: min
		};

		let format = BUILT_IN_FORMATS.find((format) => format.formatTag === 'cad');

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);
		expect(format._autoFormat.autoFormatFunction).toBeDefined();

		expect(autoFormat(3121, format, columnUnitSummary)).toBe('C$3.1k');
		expect(autoFormat(0, format, columnUnitSummary)).toBe('C$0.0k');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('C$91.0k');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('C$1,234.6k');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('C$1.2k');
	});

	it('should handle number formatting on an auto currency consisting of only small integer values show now decimal places or column units', () => {
		let max = 1234;
		let min = 2;
		let median = 91;
		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 0,
			max: max,
			min: min
		};

		let format = BUILT_IN_FORMATS.find((format) => format.formatTag === 'jpy');

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);
		expect(format._autoFormat.autoFormatFunction).toBeDefined();

		expect(autoFormat(999, format, columnUnitSummary)).toBe('¥999');
		expect(autoFormat(0, format, columnUnitSummary)).toBe('¥0');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('¥91');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('¥1,234');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('¥2');
	});

	it('should handle implicit number formatting on an auto currency with small change only show two decimal places and no units', () => {
		let max = 1234.8;
		let min = -1234.56;
		let median = 12.345678;
		let columnUnitSummary = {
			unitType: 'number',
			median: median,
			maxDecimals: 6,
			max: max,
			min: min
		};

		let format = BUILT_IN_FORMATS.find((format) => format.formatTag === 'gbp');

		expect(format).toBeDefined();
		expect(format.formatCode).toBe(AUTO_FORMAT_CODE);
		expect(format._autoFormat.autoFormatFunction).toBeDefined();

		expect(autoFormat(1000, format, columnUnitSummary)).toBe('£1,000.00');
		expect(autoFormat(0, format, columnUnitSummary)).toBe('£0.00');
		expect(autoFormat(median, format, columnUnitSummary)).toBe('£12.35');
		expect(autoFormat(max, format, columnUnitSummary)).toBe('£1,234.80');
		expect(autoFormat(min, format, columnUnitSummary)).toBe('-£1,234.56');
	});

	it('should handle fallback formatting always show a maximum of two decimal places when a number is provided', () => {
		expect(fallbackFormat(12345)).toBe('12,345');
		expect(fallbackFormat(12345.1)).toBe('12,345.1');

		expect(fallbackFormat(9000.0)).toBe('9,000');
		expect(fallbackFormat(12345.678)).toBe('12,345.68');
		expect(fallbackFormat(-1234.56)).toBe('-1,234.56');
	});

	it('should handle fallbackFormat for undefined or null values is -', () => {
		expect(fallbackFormat(null)).toBe('-');
		expect(fallbackFormat(undefined)).toBe('-');
	});

	it('should handle fallbackFormat for string values is always the original string', () => {
		expect(fallbackFormat('mystring')).toBe('mystring');
		expect(fallbackFormat('')).toBe('');
	});

	it('should handle computeNumberAutoFormatCode returns the correct auto format code with default max decimals and significant digits (3)', () => {
		expect(computeNumberAutoFormatCode(0.01)).toBe('#,##0.0000');
		expect(computeNumberAutoFormatCode(0.1)).toBe('#,##0.000');

		expect(computeNumberAutoFormatCode(0)).toBe('#,##0.00');
		expect(computeNumberAutoFormatCode(0.0)).toBe('#,##0.00');

		expect(computeNumberAutoFormatCode(1)).toBe('#,##0.00');
		expect(computeNumberAutoFormatCode(1.0)).toBe('#,##0.00');

		expect(computeNumberAutoFormatCode(10)).toBe('#,##0.0');
		expect(computeNumberAutoFormatCode(10.0)).toBe('#,##0.0');
		expect(computeNumberAutoFormatCode(10.9)).toBe('#,##0.0');

		expect(computeNumberAutoFormatCode(100)).toBe('#,##0');
		expect(computeNumberAutoFormatCode(1000)).toBe('#,##0');
		expect(computeNumberAutoFormatCode(10000)).toBe('#,##0');
	});

	it('should handle computeNumberAutoFormatCode returns the correct auto format code with custom maxDecimals', () => {
		expect(computeNumberAutoFormatCode(0.01, 2)).toBe('#,##0.00');
		expect(computeNumberAutoFormatCode(0.01, 3)).toBe('#,##0.000');
		expect(computeNumberAutoFormatCode(0.1, 2)).toBe('#,##0.00');
		expect(computeNumberAutoFormatCode(0, 2)).toBe('#,##0.00');
		expect(computeNumberAutoFormatCode(100, 3)).toBe('#,##0');
		expect(computeNumberAutoFormatCode(10000, 2)).toBe('#,##0');
	});

	it('should handle computeNumberAutoFormatCode returns the correct auto format code with custom significant digits', () => {
		let defaultMaxDecimals = 7;
		expect(computeNumberAutoFormatCode(0.01, defaultMaxDecimals, 4)).toBe('#,##0.00000');
		expect(computeNumberAutoFormatCode(0.1, defaultMaxDecimals, 4)).toBe('#,##0.0000');

		expect(computeNumberAutoFormatCode(0, defaultMaxDecimals, 4)).toBe('#,##0.000');
		expect(computeNumberAutoFormatCode(1, defaultMaxDecimals, 4)).toBe('#,##0.000');

		expect(computeNumberAutoFormatCode(100, defaultMaxDecimals, 4)).toBe('#,##0.0');
		expect(computeNumberAutoFormatCode(10000, defaultMaxDecimals, 4)).toBe('#,##0');
		expect(computeNumberAutoFormatCode(10000, defaultMaxDecimals, 6)).toBe('#,##0.0');
	});
});
