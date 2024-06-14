import { describe, expect, it } from 'vitest';
import { sterilizeQuery } from './sterilizeQuery.js';

describe('seterilizeQuery', () => {
	it('should not change queries with no comments or semicolons', () => {
		const query = 'SELECT 1'.trim();
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should not remove evidence auto-injected comments', () => {
		const query = `
        ---- Data queryId queryHash
        SELECT * FROM table
        `.trim();
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should add a newline if the last line is a comment', () => {
		const query = `
        SELECT * FROM table
        -- Data queryId queryHash
        `.trim();
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should add a newline if the last line has a comment', () => {
		const query = `
		SELECT * FROM table -- Data queryId queryHash
		`.trim();
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should remove any trailing semicolons', () => {
		const query = `
		SELECT * 
		FROM table;`;
		const adjustedQuery = `
		SELECT * 
		FROM table`;
		expect(sterilizeQuery(query)).toBe(adjustedQuery + '\n');
	});
	it('should remove any trailing semicolons, while maintaining any comments', () => {
		const query = `
		SELECT * 
		FROM table; -- comment
		`;
		const adjustedQuery = `
		SELECT * 
		FROM table -- comment
		`;
		expect(sterilizeQuery(query)).toBe(adjustedQuery + '\n');
	});
	it('should ignore semicolons inside strings', () => {
		const query = `
		SELECT ';' as valid
		FROM table -- comment
		`;
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should ignore semicolons inside strings when they are not alone', () => {
		const query = `
		SELECT 'SELECT 1;' as valid
		FROM table -- comment
		`;
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should ignore semicolons inside strings, but still remove a trailing semicolon', () => {
		const query = `
		SELECT ';' as valid;
		`.trim();
		expect(sterilizeQuery(query)).toBe(query.substring(0, query.length - 1) + '\n');
	});
	it('should ignore trailing semicolons that appear in comments', () => {
		const query = `
		SELECT 1; -- ;
		`.trim();
		const expectedQuery = `
		SELECT 1 -- ;
		`.trim();
		expect(sterilizeQuery(query)).toBe(expectedQuery + '\n');
	});
	it('should ignore trailing semicolons that appear in comments and are quoted', () => {
		const query = `
		SELECT 1, 'stringliteral'; -- '; ; ;'
		`.trim();
		const expectedQuery = `
		SELECT 1, 'stringliteral' -- '; ; ;'
		`.trim();
		expect(sterilizeQuery(query)).toBe(expectedQuery + '\n');
	});
	it('should ignore semicolons that appear in comments, and remove the trailing semicolon', () => {
		const query = `
		SELECT 1, '-- ;';
		`.trim();
		const expectedQuery = `
		SELECT 1, '-- ;'
		`.trim();
		expect(sterilizeQuery(query)).toBe(expectedQuery + '\n');
	});
	it('should ignore semicolons that appear in comments', () => {
		const query = `
		SELECT 1, '-- ;'
		`.trim();
		const expectedQuery = `
		SELECT 1, '-- ;'
		`.trim();
		expect(sterilizeQuery(query)).toBe(expectedQuery + '\n');
	});
	it('should work with all cases', () => {
		const query = `
		SELECT ';' as valid, ' ; ; ' as also_valid; -- ;
		`.trim();
		const expectedQuery = `
		SELECT ';' as valid, ' ; ; ' as also_valid -- ;
		`.trim();
		expect(sterilizeQuery(query)).toBe(expectedQuery + '\n');
	});
	it('should ignore semicolons in multiline comments (on one line)', () => {
		const query = `SELECT 1 /* ; */`;
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should ignore semicolons in multiline comments (on multiple line)', () => {
		const query = `SELECT 1 /* ; 
		*/`;
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should ignore semicolons in multiline comments (on single line), but remove trailing', () => {
		const query = `SELECT 1; /* ; */`;
		const expected = `SELECT 1 /* ; */` + '\n';
		expect(sterilizeQuery(query)).toBe(expected);
	});
	it('should ignore semicolons in multiline comments (on multiple line), but remove trailing', () => {
		const query = `
		SELECT 1; /* ; 
		*/`;
		const expected =
			`
		SELECT 1 /* ; 
		*/` + '\n';
		expect(sterilizeQuery(query)).toBe(expected);
	});
	it('should ignore semicolons in inline multiline comments', () => {
		const query = `SELECT /* ; */ 1 `;
		expect(sterilizeQuery(query)).toBe(query + '\n');
	});
	it('should ignore semicolons in inline multiline comments, but remove trailing', () => {
		const query = `SELECT /* ; */ 1;`;
		expect(sterilizeQuery(query)).toBe(query.slice(0, -1) + '\n');
	});
	it('should handle trailing semicolons that appear at the end of a multiline comment across multiple lines', () => {
		const query = `
		SELECT 1 /*

		*/;
		`;
		const expected = `
		SELECT 1 /*

		*/
		`;
		expect(sterilizeQuery(query)).toBe(expected + '\n');
	});
	it('should handle trailing semicolons that appear at the end of a multiline comment across multiple lines, even when the comment contains semicolons', () => {
		const query = `
		SELECT 1 /*;
				;
		;*/;
		`;
		const expected = `
		SELECT 1 /*;
				;
		;*/
		`;
		expect(sterilizeQuery(query)).toBe(expected + '\n');
	});
});
