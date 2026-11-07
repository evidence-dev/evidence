import { describe, expect, it } from 'vitest';
import { excelNumberFormat, toExcelCell } from './cell-value';

describe('excelNumberFormat', () => {
	it('maps presets to their Excel format codes', () => {
		expect(excelNumberFormat('usd2', 5)).toBe('$#,##0.00');
		expect(excelNumberFormat('pct1', 0.5)).toBe('#,##0.0%');
		expect(excelNumberFormat('num1m', 5)).toBe('#,##0.0,,"M"');
	});

	it('scales auto formats by the column range, like the report', () => {
		expect(excelNumberFormat('usd', 5, { min: 0, max: 2_500_000 })).toBe('$#,##0.0,,"M"');
		expect(excelNumberFormat('num', 5, { min: 0, max: 50 })).toBe('#,##0.0');
		// Without a range a value scales on its own.
		expect(excelNumberFormat('usd', 12_000)).toBe('$#,##0,"k"');
	});

	it('drops units and decimals for zero, like the report', () => {
		expect(excelNumberFormat('usd', 0, { min: 0, max: 2_500_000 })).toBe('$#,##0');
		expect(excelNumberFormat('usd1m', 0)).toBe('$#,##0');
	});

	it('turns single quotes in custom formats into Excel double quotes', () => {
		expect(excelNumberFormat("0.0' pts'", 1)).toBe('0.0" pts"');
	});

	it('returns null where Excel has no equivalent', () => {
		expect(excelNumberFormat('quarter', 1)).toBeNull();
		expect(excelNumberFormat('ddd', 3)).toBeNull();
	});
});

describe('toExcelCell', () => {
	it('parses numeric strings in number columns', () => {
		expect(toExcelCell('12.50', { columnType: 'number', fmt: 'usd2' })).toEqual({
			value: 12.5,
			numFmt: '$#,##0.00',
			text: '$12.50'
		});
	});

	it('writes dates as the calendar day the report shows, whatever the timezone', () => {
		const cell = toExcelCell('2024-03-15', { columnType: 'date' });
		expect(cell.value).toEqual(new Date(Date.UTC(2024, 2, 15)));
		expect(cell.numFmt).toBe('yyyy-mm-dd');
		expect(cell.text).toBe('2024-03-15');

		// A UTC timestamp keeps its wall-clock digits, as on screen.
		expect(toExcelCell('2024-03-15T23:30:00Z', { columnType: 'date', fmt: 'date' }).value).toEqual(
			new Date(Date.UTC(2024, 2, 15, 23, 30))
		);
	});

	it('writes formats Excel cannot express as the report text', () => {
		expect(toExcelCell('2024-05-10', { columnType: 'date', fmt: 'quarter' })).toEqual({
			value: '2024-Q2',
			text: '2024-Q2'
		});
		expect(toExcelCell(1, { columnType: 'number', fmt: 'ddd' }).value).toBe('Sun');
		expect(
			toExcelCell(1, { columnType: 'number', fmt: 'ddd', firstDayOfWeek: 'monday' }).value
		).toBe('Mon');
	});

	it('keeps text, booleans and empty values as they are', () => {
		expect(toExcelCell('01234', { columnType: 'string' })).toEqual({
			value: '01234',
			text: '01234'
		});
		expect(toExcelCell(true)).toEqual({ value: true, text: 'TRUE' });
		expect(toExcelCell(null)).toEqual({ value: null, text: '' });
		expect(toExcelCell(Number.NaN, { columnType: 'number' }).value).toBe('NaN');
	});

	it('serializes objects as JSON, including nested bigints', () => {
		expect(toExcelCell({ a: 1 })).toEqual({ value: '{"a":1}', text: '{"a":1}' });
		expect(toExcelCell({ id: 1n }).value).toBe('{"id":"1"}');
	});

	it('keeps bigints exact: small ones as numbers, larger ones as text', () => {
		expect(toExcelCell(42n).value).toBe(42);
		expect(toExcelCell(9007199254740993n).value).toBe('9007199254740993');
	});

	it('keeps numbers numeric under custom formats with unit text', () => {
		expect(toExcelCell(12.5, { fmt: '0.0" s"' })).toMatchObject({ value: 12.5, numFmt: '0.0" s"' });
		expect(toExcelCell(3, { fmt: "#,##0' h'" })).toMatchObject({ value: 3, numFmt: '#,##0" h"' });
	});

	it('passes non-numbers in unformatted number columns through unchanged', () => {
		expect(toExcelCell('N/A', { fmt: 'General', columnType: 'number' }).value).toBe('N/A');
		expect(toExcelCell('', { fmt: 'General', columnType: 'number' }).value).toBe('');
		expect(toExcelCell('12', { fmt: 'General', columnType: 'number' })).toMatchObject({
			value: 12,
			numFmt: 'General'
		});
	});
});
