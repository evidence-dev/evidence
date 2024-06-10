import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanQuery } from './cleanQuery';

describe('cleanQuery', () => {
	it('should remove single-line comments', () => {
		const query = "SELECT * FROM table -- this is a comment";
		const expected = "SELECT * FROM table";
		expect(cleanQuery(query)).toBe(expected);
	});

	it('should remove multi-line comments', () => {
		const query = "SELECT * FROM table /* this is a \n multi-line comment */ WHERE id = 1";
		const expected = "SELECT * FROM table WHERE id = 1";
		expect(cleanQuery(query)).toBe(expected);
	});

	it('should remove semicolons', () => {
		const query = "SELECT * FROM table;";
		const expected = "SELECT * FROM table";
		expect(cleanQuery(query)).toBe(expected);
	});

	it('should handle strings correctly', () => {
		const query = "SELECT * FROM table WHERE name = 'John; -- Doe'";
		const expected = "SELECT * FROM table WHERE name = 'John; -- Doe'";
		expect(cleanQuery(query)).toBe(expected);
	});

	it('should handle mixed cases correctly', () => {
		const query = "SELECT * FROM table; -- comment \n /* multi-line \n comment */ SELECT name FROM users WHERE id = 1;";
		const expected = "SELECT * FROM table SELECT name FROM users WHERE id = 1";
		expect(cleanQuery(query)).toBe(expected);
	});

	it('should handle queries without comments or semicolons', () => {
		const query = "SELECT * FROM table WHERE id = 1";
		const expected = "SELECT * FROM table WHERE id = 1";
		expect(cleanQuery(query)).toBe(expected);
	});

    it('should handle multiline query strings', () => {
		const query = `SELECT *
FROM table
WHERE id = 1; -- this is a comment`;
		const expected = `SELECT *
FROM table
WHERE id = 1`;
		expect(cleanQuery(query)).toBe(expected);
	});
    
    it('should handle empty row at end of string', () => {
        const query = `SELECT *
FROM table
WHERE id = 1; --

`;
        const expected = `SELECT *
FROM table
WHERE id = 1`;
        expect(cleanQuery(query)).toBe(expected);
    });
});
