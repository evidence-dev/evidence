import { describe, it, expect } from 'vitest';
import { getMotherduckToJsType } from './type-mapping';

describe('getMotherduckToJsType', () => {
	it('maps numeric types', () => {
		expect(getMotherduckToJsType('INTEGER')).toBe('number');
		expect(getMotherduckToJsType('BIGINT')).toBe('number');
		expect(getMotherduckToJsType('HUGEINT')).toBe('number');
		expect(getMotherduckToJsType('UBIGINT')).toBe('number');
		expect(getMotherduckToJsType('DOUBLE')).toBe('number');
		expect(getMotherduckToJsType('DECIMAL')).toBe('number');
		expect(getMotherduckToJsType('DECIMAL(18,2)')).toBe('number');
		expect(getMotherduckToJsType('NUMERIC(10,0)')).toBe('number');
	});
	it('maps string types', () => {
		expect(getMotherduckToJsType('VARCHAR')).toBe('string');
		expect(getMotherduckToJsType('VARCHAR(255)')).toBe('string');
		expect(getMotherduckToJsType('TEXT')).toBe('string');
		expect(getMotherduckToJsType('UUID')).toBe('string');
		expect(getMotherduckToJsType('JSON')).toBe('string');
	});
	it('maps boolean', () => {
		expect(getMotherduckToJsType('BOOLEAN')).toBe('boolean');
		expect(getMotherduckToJsType('BOOL')).toBe('boolean');
	});
	it('maps date/time types', () => {
		expect(getMotherduckToJsType('DATE')).toBe('date');
		expect(getMotherduckToJsType('TIMESTAMP')).toBe('date');
		expect(getMotherduckToJsType('TIMESTAMP_NS')).toBe('date');
		expect(getMotherduckToJsType('TIMESTAMPTZ')).toBe('date');
		expect(getMotherduckToJsType('TIME')).toBe('date');
	});
	it('maps nested / array types to object', () => {
		expect(getMotherduckToJsType('INTEGER[]')).toBe('object');
		expect(getMotherduckToJsType('VARCHAR[]')).toBe('object');
		expect(getMotherduckToJsType('STRUCT(a INTEGER, b VARCHAR)')).toBe('object');
		expect(getMotherduckToJsType('MAP(VARCHAR, INTEGER)')).toBe('object');
		expect(getMotherduckToJsType('LIST')).toBe('object');
	});
	it('is case-insensitive', () => {
		expect(getMotherduckToJsType('varchar')).toBe('string');
		expect(getMotherduckToJsType('Integer')).toBe('number');
	});
	it('returns unknown for unrecognized types', () => {
		expect(getMotherduckToJsType('GEOMETRY')).toBe('unknown');
		expect(getMotherduckToJsType('WHATEVER')).toBe('unknown');
	});
});
