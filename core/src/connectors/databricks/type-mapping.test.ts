import { describe, it, expect } from 'vitest';
import { getDatabricksToJsType } from './type-mapping';

describe('getDatabricksToJsType', () => {
	it('maps numeric types', () => {
		expect(getDatabricksToJsType('INT')).toBe('number');
		expect(getDatabricksToJsType('BIGINT')).toBe('number');
		expect(getDatabricksToJsType('DOUBLE')).toBe('number');
		expect(getDatabricksToJsType('FLOAT')).toBe('number');
		expect(getDatabricksToJsType('DECIMAL(18,2)')).toBe('number');
		expect(getDatabricksToJsType('TINYINT')).toBe('number');
	});
	it('maps string types', () => {
		expect(getDatabricksToJsType('STRING')).toBe('string');
		expect(getDatabricksToJsType('VARCHAR(255)')).toBe('string');
		expect(getDatabricksToJsType('CHAR(10)')).toBe('string');
		expect(getDatabricksToJsType('BINARY')).toBe('string');
	});
	it('maps BOOLEAN to boolean', () => {
		expect(getDatabricksToJsType('BOOLEAN')).toBe('boolean');
	});
	it('maps date/time types', () => {
		expect(getDatabricksToJsType('DATE')).toBe('date');
		expect(getDatabricksToJsType('TIMESTAMP')).toBe('date');
		expect(getDatabricksToJsType('TIMESTAMP_NTZ')).toBe('date');
	});
	it('maps complex types to object', () => {
		expect(getDatabricksToJsType('ARRAY<INT>')).toBe('object');
		expect(getDatabricksToJsType('MAP<STRING,INT>')).toBe('object');
		expect(getDatabricksToJsType('STRUCT<a:INT>')).toBe('object');
	});
	it('is case-insensitive', () => {
		expect(getDatabricksToJsType('string')).toBe('string');
		expect(getDatabricksToJsType('Int')).toBe('number');
	});
	it('returns unknown for unrecognized types', () => {
		expect(getDatabricksToJsType('GEOGRAPHY')).toBe('unknown');
	});
});
