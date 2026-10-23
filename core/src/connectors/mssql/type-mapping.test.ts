import { describe, it, expect } from 'vitest';
import { getMssqlToJsType } from './type-mapping';

describe('getMssqlToJsType', () => {
	it('maps numeric types', () => {
		expect(getMssqlToJsType('INT')).toBe('number');
		expect(getMssqlToJsType('BIGINT')).toBe('number');
		expect(getMssqlToJsType('DECIMAL')).toBe('number');
		expect(getMssqlToJsType('DECIMAL(18,2)')).toBe('number');
		expect(getMssqlToJsType('FLOAT')).toBe('number');
		expect(getMssqlToJsType('REAL')).toBe('number');
		expect(getMssqlToJsType('NUMERIC(10,0)')).toBe('number');
	});
	it('maps string types', () => {
		expect(getMssqlToJsType('VARCHAR')).toBe('string');
		expect(getMssqlToJsType('VARCHAR(8000)')).toBe('string');
		expect(getMssqlToJsType('NVARCHAR(MAX)')).toBe('string');
		expect(getMssqlToJsType('CHAR(10)')).toBe('string');
		expect(getMssqlToJsType('UNIQUEIDENTIFIER')).toBe('string');
	});
	it('maps BIT to boolean', () => {
		expect(getMssqlToJsType('BIT')).toBe('boolean');
	});
	it('maps date/time types', () => {
		expect(getMssqlToJsType('DATE')).toBe('date');
		expect(getMssqlToJsType('DATETIME2')).toBe('date');
		expect(getMssqlToJsType('DATETIME2(6)')).toBe('date');
		expect(getMssqlToJsType('DATETIMEOFFSET')).toBe('date');
		expect(getMssqlToJsType('TIME')).toBe('date');
	});
	it('is case-insensitive', () => {
		expect(getMssqlToJsType('varchar')).toBe('string');
		expect(getMssqlToJsType('Int')).toBe('number');
	});
	it('returns unknown for unrecognized types', () => {
		expect(getMssqlToJsType('GEOGRAPHY')).toBe('unknown');
		expect(getMssqlToJsType('WHATEVER')).toBe('unknown');
	});
});
