import { describe, it, expect } from 'vitest';
import { getRedshiftToJsType } from './type-mapping';

describe('getRedshiftToJsType', () => {
	it('inherits the Postgres map for the shared types', () => {
		expect(getRedshiftToJsType('character varying(256)')).toBe('string');
		expect(getRedshiftToJsType('integer')).toBe('number');
		expect(getRedshiftToJsType('bigint')).toBe('number');
		expect(getRedshiftToJsType('numeric(18,2)')).toBe('number');
		expect(getRedshiftToJsType('double precision')).toBe('number');
		expect(getRedshiftToJsType('boolean')).toBe('boolean');
		expect(getRedshiftToJsType('date')).toBe('date');
		expect(getRedshiftToJsType('timestamp without time zone')).toBe('date');
		expect(getRedshiftToJsType('timestamp with time zone')).toBe('date');
		expect(getRedshiftToJsType('time without time zone')).toBe('string');
	});

	it('maps Redshift-only local types to text', () => {
		expect(getRedshiftToJsType('super')).toBe('string');
		expect(getRedshiftToJsType('geometry')).toBe('string');
		expect(getRedshiftToJsType('geography')).toBe('string');
		expect(getRedshiftToJsType('hllsketch')).toBe('string');
		expect(getRedshiftToJsType('varbyte(1024)')).toBe('string');
	});

	it('maps Spectrum (Glue/Hive) type names', () => {
		expect(getRedshiftToJsType('string')).toBe('string');
		expect(getRedshiftToJsType('varchar(100)')).toBe('string');
		expect(getRedshiftToJsType('int')).toBe('number');
		expect(getRedshiftToJsType('tinyint')).toBe('number');
		expect(getRedshiftToJsType('double')).toBe('number');
		expect(getRedshiftToJsType('float')).toBe('number');
		expect(getRedshiftToJsType('decimal(10,2)')).toBe('number');
		expect(getRedshiftToJsType('timestamp')).toBe('date');
		expect(getRedshiftToJsType('array<string>')).toBe('object');
		expect(getRedshiftToJsType('struct<a:int,b:string>')).toBe('object');
		expect(getRedshiftToJsType('map<string,int>')).toBe('object');
	});

	it('falls back to unknown for unrecognised types', () => {
		expect(getRedshiftToJsType('mystery')).toBe('unknown');
	});
});
