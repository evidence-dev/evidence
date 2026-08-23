import { describe, it, expect } from 'vitest';
import { parseSqlFileHeader } from './parse-sql-file-header';

describe('parseSqlFileHeader', () => {
	it('reads a leading connection directive', () => {
		expect(parseSqlFileHeader('-- connection: snowflake\nselect 1').connection).toBe('snowflake');
	});

	it('tolerates spacing, casing and quotes', () => {
		expect(parseSqlFileHeader('--connection:snowflake\nselect 1').connection).toBe('snowflake');
		expect(parseSqlFileHeader('--  Connection :  snowflake \nselect 1').connection).toBe(
			'snowflake'
		);
		expect(parseSqlFileHeader('-- connection: "my conn"\nselect 1').connection).toBe('my conn');
	});

	it('scans past blank lines and other leading comments', () => {
		const body = ['-- owner: analytics', '', '-- connection: clickhouse', 'select 1'].join('\n');
		expect(parseSqlFileHeader(body).connection).toBe('clickhouse');
	});

	it('ignores a directive that appears after real SQL', () => {
		// Otherwise a comment mid-file could silently re-route the query.
		const body = ['select 1', '-- connection: clickhouse'].join('\n');
		expect(parseSqlFileHeader(body).connection).toBeUndefined();
	});

	it('returns nothing for a plain file or empty input', () => {
		expect(parseSqlFileHeader('select * from orders').connection).toBeUndefined();
		expect(parseSqlFileHeader('').connection).toBeUndefined();
		expect(parseSqlFileHeader(undefined).connection).toBeUndefined();
	});
});
