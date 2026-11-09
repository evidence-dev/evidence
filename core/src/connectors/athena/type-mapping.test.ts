import { describe, expect, it } from 'vitest';
import { getAthenaToJsType } from './type-mapping';

describe('getAthenaToJsType', () => {
	it.each([
		['bigint', 'number'],
		['decimal(38,2)', 'number'],
		['DOUBLE', 'number'],
		['varchar(255)', 'string'],
		['timestamp(3)', 'date'],
		['timestamp(3) with time zone', 'date'],
		['date', 'date'],
		['boolean', 'boolean'],
		['array<varchar>', 'string'],
		['row(a integer)', 'string'],
		['hyperloglog', 'unknown']
	])('%s → %s', (input, expected) => {
		expect(getAthenaToJsType(input)).toBe(expected);
	});
});
