import { describe, expect, it, vi } from 'vitest';
import { sterilizeQuery } from './sterilizeQuery.js';

describe('seterilizeQuery', () => {
	it('should not change queries with no comments or semicolons', () => {
		const query = 'SELECT 1'.trim();
		expect(sterilizeQuery(query)).toBe(query);
	});
	it('should not remove evidence auto-injected comments', () => {
		const query = `
        ---- Data queryId queryHash
        SELECT * FROM table
        `.trim();
		expect(sterilizeQuery(query)).toBe(query);
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
		expect(sterilizeQuery(query)).toBe(adjustedQuery);
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
		expect(sterilizeQuery(query)).toBe(adjustedQuery);
	});
	it('should ignore semicolons inside strings', () => {
		const query = `
		SELECT ';' as valid
		FROM table -- comment
		`;
		expect(sterilizeQuery(query)).toBe(query);
	});
	it('should ignore semicolons inside strings, but still remove a trailing semicolon', () => {
		const query = `
		SELECT ';' as valid;
		`.trim();
		expect(sterilizeQuery(query)).toBe(query.substring(0, query.length - 1));
	});
	it.only('should ignore trailing semicolons that appear in comments', () => {
		const query = `
		SELECT ';' as valid, ' ; ; ' as also_valid; -- ;
		`.trim();
		const expectedQuery = `
		SELECT ';' as valid -- ;
		`.trim() + '\n'; 
		expect(sterilizeQuery(query)).toBe(expectedQuery);
	});
});
