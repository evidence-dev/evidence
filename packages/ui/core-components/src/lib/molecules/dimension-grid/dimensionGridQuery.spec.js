import { describe, expect, it } from 'vitest';
import { getDimensionCutQuery, getWhereClause } from './dimensionGridQuery.js';

describe('dimensionGridQuery', () => {
	describe('getDimensionCutQuery', () => {
		it('should let me run it', () => {
			getDimensionCutQuery(
				{
					originalText: 'SELECT * FROM orders'
				},
				{ column_name: 'A' },
				'metric',
				5
			);
		});
	});
	describe('getWhereClause', () => {
		it('should output a known sql string when passed no dimensions', () => {
			const result = getWhereClause([], []);

			expect(result).toBe('( true )');
		});
		it('should output a known sql string when passed one dimension with one value', () => {
			const result = getWhereClause([{ dimension: 'A', value: 'x' }], []);

			expect(result).toBe(`( ( "A" in ( 'x' ) ) )`);
		});
		it('should output a known sql string when passed one dimension with multiple values', () => {
			const result = getWhereClause([{ dimension: 'A', value: ['x', 'y'] }], []);

			expect(result).toBe(`( ( "A" in ( 'x','y' ) ) )`);
		});
		it('should output a known sql string when passed one dimension with multiple values where one is null', () => {
			const result = getWhereClause([{ dimension: 'A', value: ['x', 'y', null] }], []);

			expect(result).toBe(`( ( "A" in ( 'x','y' ) OR "A" is null ) )`);
		});
		it('should output a known sql string when passed one dimension with one null value', () => {
			const result = getWhereClause([{ dimension: 'A', value: [null] }], []);

			expect(result).toBe(`( ( "A" is null ) )`);
		});
		it('should output the same sql string if dimension value is a string or single-element array', () => {
			expect(getWhereClause([{ dimension: 'A', value: ['x'] }], [])).toBe(
				getWhereClause([{ dimension: 'A', value: 'x' }], [])
			);
		});
		it('should allow non-string values', () => {
			const result = getWhereClause([{ dimension: 'A', value: 1 }], []);
			expect(result).toBe(`( ( "A" in ( '1' ) ) )`);
		});

		it('should output a known sql string when passed two dimensions', () => {
			const result = getWhereClause(
				[
					{ dimension: 'A', value: ['x', 'y'] },
					{ dimension: 'B', value: [1, 2] }
				],
				[]
			);

			expect(result).toBe(`( ( "A" in ( 'x','y' ) ) and ( "B" in ( '1','2' ) ) )`);
		});
	});
});

/*
These are the same

SELECT * FROM my_table
    WHERE ("A" in ('x','y') OR "A" is null)

SELECT * FROM my_table
    WHERE "A" in ('x','y') OR "A" is null

====

SELECT * FROM my_table
    WHERE ("A" in ('x','y') OR "A" is null)
      AND ("B" in ('z'))

("A" in ('x','y') OR "A" is null) 
AND ("B" in ('z'))

 A   | B   |
-----|-----|-------|
x    | a   | false |  B != z
y    | a   | false |  B != z
null | a   | false |  B != z
x    | z   | true  | 
y    | z   | true  | 
null | z   | true  | 
z    | z   | false | A != x, y, z

  1 + 1   * 3 -> 7
( 1 + 1 ) * 3 -> 6

SELECT * FROM my_table
    WHERE "A" in ('x','y') OR "A" is null
      AND "B" in ('z')

"A" in ('x','y') OR 
("A" is null AND "B" in ('z'))

 A   | B   |
-----|-----|-------|
x    | a   | true  |  
y    | a   | true  |  
null | a   | false |  
x    | z   | true  | 
y    | z   | true  | 
null | z   | true  | 
z    | z   | false | 


*/
