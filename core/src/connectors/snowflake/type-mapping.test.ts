import { describe, it, expect } from 'vitest';
import { getSnowflakeToJsType } from './type-mapping';

describe('getSnowflakeToJsType', () => {
	it('maps numeric types', () => {
		expect(getSnowflakeToJsType('NUMBER')).toBe('number');
		expect(getSnowflakeToJsType('NUMBER(38,0)')).toBe('number');
		expect(getSnowflakeToJsType('DECIMAL')).toBe('number');
		expect(getSnowflakeToJsType('INTEGER')).toBe('number');
		expect(getSnowflakeToJsType('FLOAT')).toBe('number');
		expect(getSnowflakeToJsType('DOUBLE')).toBe('number');
		expect(getSnowflakeToJsType('DOUBLE PRECISION')).toBe('number');
		expect(getSnowflakeToJsType('REAL')).toBe('number');
		expect(getSnowflakeToJsType('FIXED')).toBe('number');
	});

	it('maps string types', () => {
		expect(getSnowflakeToJsType('VARCHAR')).toBe('string');
		expect(getSnowflakeToJsType('VARCHAR(256)')).toBe('string');
		expect(getSnowflakeToJsType('STRING')).toBe('string');
		expect(getSnowflakeToJsType('TEXT')).toBe('string');
		expect(getSnowflakeToJsType('CHAR(10)')).toBe('string');
	});

	it('maps geography/geometry to string', () => {
		expect(getSnowflakeToJsType('GEOGRAPHY')).toBe('string');
		expect(getSnowflakeToJsType('GEOMETRY')).toBe('string');
	});

	it('maps boolean', () => {
		expect(getSnowflakeToJsType('BOOLEAN')).toBe('boolean');
	});

	it('maps date/time types', () => {
		expect(getSnowflakeToJsType('DATE')).toBe('date');
		expect(getSnowflakeToJsType('TIMESTAMP_NTZ')).toBe('date');
		expect(getSnowflakeToJsType('TIMESTAMP_LTZ')).toBe('date');
		expect(getSnowflakeToJsType('TIMESTAMP_TZ')).toBe('date');
		expect(getSnowflakeToJsType('TIMESTAMP_NTZ(9)')).toBe('date');
		expect(getSnowflakeToJsType('TIME')).toBe('date');
	});

	it('maps semi-structured types', () => {
		expect(getSnowflakeToJsType('VARIANT')).toBe('object');
		expect(getSnowflakeToJsType('OBJECT')).toBe('object');
		expect(getSnowflakeToJsType('ARRAY')).toBe('object');
	});

	it('is case-insensitive', () => {
		expect(getSnowflakeToJsType('varchar')).toBe('string');
		expect(getSnowflakeToJsType('Number')).toBe('number');
	});

	it('returns unknown for unrecognized types', () => {
		expect(getSnowflakeToJsType('UNKNOWN_TYPE')).toBe('unknown');
	});
});
