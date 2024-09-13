import { vi, describe, it, expect } from 'vitest';
vi.mock('fs', () => ({ isFile: () => true }));

const { extractQueries } = require('./extract-queries.cjs');
const {
	STANDARD,
	REFERENTIAL,
	CIRCULAR,
	SELF_REFERENTIAL,
	HAS_SPECIAL_STRING_PROTOTYPE_REPLACE_SEQUENCE
} = require('./extract-queries.fixture.cjs');

describe('extractQueries', () => {
	it('should extract queries from standard content', () => {
		const queries = extractQueries(STANDARD);

		expect(queries.length).toBe(1);
		expect(queries[0].id).toBe('myquery');
		expect(queries[0].inputQueryString).toBe('SELECT 1 as blah');
		expect(queries[0].compiledQueryString).toBe('SELECT 1 as blah');
	});

	it('should extract queries from referential content', () => {
		const queries = extractQueries(REFERENTIAL);
		queries.sort((a, b) => a.id.localeCompare(b.id));

		expect(queries.length).toBe(2);
		expect(queries[0].id).toBe('myquery');
		expect(queries[0].inputQueryString).toBe('SELECT 1 as blah');
		expect(queries[0].compiledQueryString).toBe('SELECT 1 as blah');
		expect(queries[1].id).toBe('referential');
		expect(queries[1].inputQueryString).toBe('SELECT * FROM ${myquery}');
		expect(queries[1].compiledQueryString).toBe('SELECT * FROM (SELECT 1 as blah)');
	});

	it('should return compiler error when a circular reference is detected', () => {
		const queries = extractQueries(CIRCULAR);
		queries.sort((a, b) => a.id.localeCompare(b.id));

		expect(queries.length).toBe(2);
		expect(queries[0].id).toBe('myquery');
		expect(queries[0].inputQueryString).toBe('SELECT * FROM ${referential}');
		expect(queries[0].compileError).toBe('Compiler error: circular reference');
		expect(queries[1].id).toBe('referential');
		expect(queries[1].inputQueryString).toBe('SELECT * FROM ${myquery}');
		expect(queries[1].compileError).toBe('Compiler error: circular reference');
	});

	it('should return compiler error when a query references itself', () => {
		const queries = extractQueries(SELF_REFERENTIAL);

		expect(queries.length).toBe(1);
		expect(queries[0].id).toBe('myquery');
		expect(queries[0].inputQueryString).toBe('SELECT * FROM ${myquery}');
		expect(queries[0].compileError).toBe('Compiler error: circular reference');
	});

	it('should handle special string prototype replace sequence', () => {
		const queries = extractQueries(HAS_SPECIAL_STRING_PROTOTYPE_REPLACE_SEQUENCE);
		queries.sort((a, b) => a.id.localeCompare(b.id));

		expect(queries.length).toBe(2);
		expect(queries[0].id).toBe('myquery');
		expect(queries[0].inputQueryString).toBe('SELECT * FROM ${read_string}');
		expect(queries[0].compiledQueryString).toBe("SELECT * FROM (SELECT 'evi.+e$' as str)");
		expect(queries[1].id).toBe('read_string');
		expect(queries[1].inputQueryString).toBe("SELECT 'evi.+e$' as str");
		expect(queries[1].compiledQueryString).toBe("SELECT 'evi.+e$' as str");
	});
});
