import { describe, it, expect } from 'vitest';
import { getFabricToJsType } from './type-mapping';

describe('getFabricToJsType', () => {
	it('maps numeric types', () => {
		expect(getFabricToJsType('INT')).toBe('number');
		expect(getFabricToJsType('BIGINT')).toBe('number');
		expect(getFabricToJsType('DECIMAL')).toBe('number');
		expect(getFabricToJsType('DECIMAL(18,2)')).toBe('number');
		expect(getFabricToJsType('FLOAT')).toBe('number');
		expect(getFabricToJsType('REAL')).toBe('number');
		expect(getFabricToJsType('NUMERIC(10,0)')).toBe('number');
	});
	it('maps string types', () => {
		expect(getFabricToJsType('VARCHAR')).toBe('string');
		expect(getFabricToJsType('VARCHAR(8000)')).toBe('string');
		expect(getFabricToJsType('NVARCHAR(MAX)')).toBe('string');
		expect(getFabricToJsType('CHAR(10)')).toBe('string');
		expect(getFabricToJsType('UNIQUEIDENTIFIER')).toBe('string');
	});
	it('maps BIT to boolean', () => {
		expect(getFabricToJsType('BIT')).toBe('boolean');
	});
	it('maps date/time types', () => {
		expect(getFabricToJsType('DATE')).toBe('date');
		expect(getFabricToJsType('DATETIME2')).toBe('date');
		expect(getFabricToJsType('DATETIME2(6)')).toBe('date');
		expect(getFabricToJsType('DATETIMEOFFSET')).toBe('date');
		expect(getFabricToJsType('TIME')).toBe('date');
	});
	it('is case-insensitive', () => {
		expect(getFabricToJsType('varchar')).toBe('string');
		expect(getFabricToJsType('Int')).toBe('number');
	});
	it('returns unknown for unrecognized types', () => {
		expect(getFabricToJsType('GEOGRAPHY')).toBe('unknown');
		expect(getFabricToJsType('WHATEVER')).toBe('unknown');
	});
});
