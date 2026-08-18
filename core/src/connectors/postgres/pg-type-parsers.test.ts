import { describe, it, expect } from 'vitest';
import {
	makePostgresTypeParser,
	pgSetSearchPathStatement,
	POSTGRES_RAW_STRING_OIDS
} from './pg-type-parsers';

describe('makePostgresTypeParser', () => {
	const fallback = () => (v: string) => `PARSED:${v}`;
	const getParser = makePostgresTypeParser(fallback);

	it('returns the raw string for date/timestamp OIDs (no Date round-trip)', () => {
		for (const oid of POSTGRES_RAW_STRING_OIDS) {
			expect(getParser(oid)('2025-01-03 23:30:00')).toBe('2025-01-03 23:30:00');
		}
	});

	it('defers to the driver default parser for other OIDs', () => {
		expect(getParser(23)('42')).toBe('PARSED:42'); // int4
	});
});

describe('pgSetSearchPathStatement', () => {
	it('always quotes the schema (literal identifier)', () => {
		expect(pgSetSearchPathStatement('public')).toBe('SET search_path TO "public"');
		expect(pgSetSearchPathStatement('my_schema$1')).toBe('SET search_path TO "my_schema$1"');
	});

	it("quotes reserved-keyword schema names (e.g. `user`) so they aren't misinterpreted", () => {
		expect(pgSetSearchPathStatement('user')).toBe('SET search_path TO "user"');
		expect(pgSetSearchPathStatement('order')).toBe('SET search_path TO "order"');
	});

	it('contains special characters so it stays one identifier (no injection)', () => {
		expect(pgSetSearchPathStatement('evil; DROP TABLE x')).toBe(
			'SET search_path TO "evil; DROP TABLE x"'
		);
		expect(pgSetSearchPathStatement('my schema')).toBe('SET search_path TO "my schema"');
	});

	it('escapes embedded double quotes', () => {
		expect(pgSetSearchPathStatement('a"b')).toBe('SET search_path TO "a""b"');
	});
});
