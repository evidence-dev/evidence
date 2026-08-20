import { describe, it, expect } from 'vitest';
import { getPostgresToJsType, PG_OID_TO_NAME } from './type-mapping';

describe('getPostgresToJsType', () => {
	it('maps numeric types to number', () => {
		for (const t of ['int2', 'int4', 'int8', 'numeric', 'float8', 'BIGINT']) {
			expect(getPostgresToJsType(t)).toBe('number');
		}
	});

	it('maps text-ish types to string (incl. money, which arrives locale-formatted)', () => {
		for (const t of ['text', 'varchar', 'bpchar', 'uuid', 'inet', 'bytea', 'time', 'money']) {
			expect(getPostgresToJsType(t)).toBe('string');
		}
	});

	it('maps date/timestamp types to date but not time-of-day', () => {
		expect(getPostgresToJsType('date')).toBe('date');
		expect(getPostgresToJsType('timestamp')).toBe('date');
		expect(getPostgresToJsType('timestamptz')).toBe('date');
		expect(getPostgresToJsType('timestamp with time zone')).toBe('date');
		// TIME has no date part — keep it text, not a bogus date.
		expect(getPostgresToJsType('time')).toBe('string');
	});

	it('maps json/jsonb to object', () => {
		expect(getPostgresToJsType('json')).toBe('object');
		expect(getPostgresToJsType('jsonb')).toBe('object');
	});

	it('strips precision/length suffixes before lookup', () => {
		expect(getPostgresToJsType('numeric(38,2)')).toBe('number');
		expect(getPostgresToJsType('varchar(255)')).toBe('string');
	});

	it('treats array types as object', () => {
		expect(getPostgresToJsType('int4[]')).toBe('object');
		expect(getPostgresToJsType('_text')).toBe('object');
	});

	it('falls back to unknown for unrecognised types', () => {
		expect(getPostgresToJsType('tsvector')).toBe('unknown');
	});
});

describe('PG_OID_TO_NAME', () => {
	it('maps the load-bearing built-in OIDs', () => {
		expect(PG_OID_TO_NAME[23]).toBe('INT4');
		expect(PG_OID_TO_NAME[20]).toBe('INT8');
		expect(PG_OID_TO_NAME[1700]).toBe('NUMERIC');
		expect(PG_OID_TO_NAME[25]).toBe('TEXT');
		expect(PG_OID_TO_NAME[1082]).toBe('DATE');
		expect(PG_OID_TO_NAME[1184]).toBe('TIMESTAMPTZ');
		expect(PG_OID_TO_NAME[3802]).toBe('JSONB');
		expect(PG_OID_TO_NAME[16]).toBe('BOOL');
	});

	it('every mapped OID resolves to a known jsType (no dangling names)', () => {
		for (const name of Object.values(PG_OID_TO_NAME)) {
			expect(getPostgresToJsType(name)).not.toBe('unknown');
		}
	});
});
