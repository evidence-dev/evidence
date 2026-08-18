import { describe, it, expect } from 'vitest';
import { getBigQueryToJsType } from './type-mapping';

describe('getBigQueryToJsType', () => {
	it('maps numeric types', () => {
		expect(getBigQueryToJsType('INT64')).toBe('number');
		expect(getBigQueryToJsType('INTEGER')).toBe('number');
		expect(getBigQueryToJsType('FLOAT64')).toBe('number');
		expect(getBigQueryToJsType('NUMERIC')).toBe('number');
		expect(getBigQueryToJsType('NUMERIC(38,9)')).toBe('number');
		expect(getBigQueryToJsType('BIGNUMERIC')).toBe('number');
	});

	it('maps string-ish types', () => {
		expect(getBigQueryToJsType('STRING')).toBe('string');
		expect(getBigQueryToJsType('BYTES')).toBe('string');
		expect(getBigQueryToJsType('GEOGRAPHY')).toBe('string');
		expect(getBigQueryToJsType('INTERVAL')).toBe('string');
	});

	it('maps boolean', () => {
		expect(getBigQueryToJsType('BOOL')).toBe('boolean');
		expect(getBigQueryToJsType('BOOLEAN')).toBe('boolean');
	});

	it('maps date/time types', () => {
		expect(getBigQueryToJsType('DATE')).toBe('date');
		expect(getBigQueryToJsType('DATETIME')).toBe('date');
		expect(getBigQueryToJsType('TIME')).toBe('date');
		expect(getBigQueryToJsType('TIMESTAMP')).toBe('date');
	});

	it('maps semi-structured types', () => {
		expect(getBigQueryToJsType('JSON')).toBe('object');
		expect(getBigQueryToJsType('STRUCT')).toBe('object');
		expect(getBigQueryToJsType('RECORD')).toBe('object');
		expect(getBigQueryToJsType('ARRAY')).toBe('object');
	});

	it('unwraps ARRAY<inner> to the inner type category', () => {
		expect(getBigQueryToJsType('ARRAY<INT64>')).toBe('number');
		expect(getBigQueryToJsType('ARRAY<STRING>')).toBe('string');
		expect(getBigQueryToJsType('ARRAY<TIMESTAMP>')).toBe('date');
	});

	it('treats STRUCT<...> / RECORD<...> as object', () => {
		expect(getBigQueryToJsType('STRUCT<a INT64, b STRING>')).toBe('object');
		expect(getBigQueryToJsType('RECORD<x DATE>')).toBe('object');
		expect(getBigQueryToJsType('ARRAY<STRUCT<a INT64>>')).toBe('object');
	});

	it('is case-insensitive', () => {
		expect(getBigQueryToJsType('string')).toBe('string');
		expect(getBigQueryToJsType('Int64')).toBe('number');
	});

	it('returns unknown for unrecognized types', () => {
		expect(getBigQueryToJsType('SOMETHING_ELSE')).toBe('unknown');
	});
});
