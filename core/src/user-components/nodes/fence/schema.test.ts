import { describe, test, expect } from 'vitest';
import { schema } from './schema';
import type { Node } from '@markdoc/markdoc';

const sqlFence = (content: string) =>
	({ attributes: { language: 'sql', content } }) as unknown as Node;

const validate = (content: string) => schema.validate(sqlFence(content));

describe('fence validate — bare SQL-file path hint', () => {
	test('a bare /queries/ path after FROM errors with the {{ "..." }} teaching', () => {
		const errors = validate('select * from /queries/dev_trajectory');
		expect(errors).toHaveLength(1);
		expect(errors[0].id).toBe('bare-sql-file-path');
		expect(errors[0].message).toContain('{{ "/queries/dev_trajectory" }}');
	});

	test('a relative queries/ path suggests the absolute form', () => {
		const errors = validate('select * from queries/dev_trajectory');
		expect(errors[0]?.message).toContain('{{ "/queries/dev_trajectory" }}');
	});

	test('JOIN is covered too', () => {
		const errors = validate('select * from t join /queries/other on t.id = other.id');
		expect(errors[0]?.id).toBe('bare-sql-file-path');
	});

	test('the correct {{ "..." }} form passes', () => {
		expect(validate('select * from {{ "/queries/dev_trajectory" }}')).toEqual([]);
	});

	test('normal table references pass', () => {
		expect(validate('select * from demo.daily_orders')).toEqual([]);
		expect(validate('select * from {{ other_query }} join t on 1=1')).toEqual([]);
	});

	test('oss ${...} references still error first', () => {
		expect(validate('select * from ${orders}')[0]?.id).toBe('oss-query-reference');
	});

	test('path-shaped text in a SQL comment does not error', () => {
		expect(validate('-- migrated from /models/foo.sql\nselect * from demo.daily_orders')).toEqual(
			[]
		);
		expect(validate('/* moved from /old/path */ select * from demo.daily_orders')).toEqual([]);
	});

	test('path-shaped text inside a string literal does not error', () => {
		expect(validate("select * from t where note like '%from /assets/img%'")).toEqual([]);
		expect(validate("select * from t where src = 'copied from /queries/legacy'")).toEqual([]);
	});

	test('a real bare path still errors when comments are also present', () => {
		const errors = validate("-- don't touch\nselect * from /queries/dev_trajectory");
		expect(errors[0]?.id).toBe('bare-sql-file-path');
	});
});
