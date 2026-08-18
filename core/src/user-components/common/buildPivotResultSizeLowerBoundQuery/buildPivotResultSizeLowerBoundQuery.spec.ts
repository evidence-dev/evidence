import { describe, test, expect, it } from 'vitest';
import { buildPivotResultSizeLowerBoundQuery } from './buildPivotResultSizeLowerBoundQuery';

describe('buildPivotResultSizeLowerBoundQuery', () => {
	it('supports aggregations in pivots', () => {
		const dimensions = ['category'];
		const pivots = ['year(date)'];
		const table = 'order_details';
		const lowerBound = 1000;

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT category, year(date)
		FROM order_details
		LIMIT 1001
	),
	pivot_combos AS (
		SELECT DISTINCT year(date)
		FROM order_details
		LIMIT 1001
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 1000 AS exceeds_lower_bound,
	0 AS exceeds_column_limit,
	1 + (SELECT COUNT(*) FROM pivot_combos) * 1 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(dimensions, pivots, table, lowerBound);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('0 dimensions, 0 pivots', () => {
		const dimensions: string[] = [];
		const pivots: string[] = [];
		const table = 'my_table';
		const lowerBound = 1000;

		const expected = `SELECT 1`;

		const actual = buildPivotResultSizeLowerBoundQuery(dimensions, pivots, table, lowerBound);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('0 dimensions, 1 pivot', () => {
		const dimensions: string[] = [];
		const pivots = ['pivot1'];
		const table = 'my_table';
		const lowerBound = 1000;

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT pivot1
		FROM my_table
		LIMIT 1001
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 1000 AS exceeds_lower_bound,
	0 AS exceeds_column_limit,
	0 + (SELECT COUNT(*) FROM detail_combos) * 1 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(dimensions, pivots, table, lowerBound);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('1 dimension, 0 pivots', () => {
		const dimensions = ['dimension1'];
		const pivots: string[] = [];
		const table = 'my_table';
		const lowerBound = 1000;

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT dimension1
		FROM my_table
		LIMIT 1001
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 1000 AS exceeds_lower_bound,
	0 AS exceeds_column_limit,
	1 + 1 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(dimensions, pivots, table, lowerBound);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('1 dimension, 1 pivot', () => {
		const dimensions = ['d1'];
		const pivots = ['p1'];
		const table = 'my_table';
		const lowerBound = 1000;

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT d1, p1
		FROM my_table
		LIMIT 1001
	),
	pivot_combos AS (
		SELECT DISTINCT p1
		FROM my_table
		LIMIT 1001
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 1000 AS exceeds_lower_bound,
	0 AS exceeds_column_limit,
	1 + (SELECT COUNT(*) FROM pivot_combos) * 1 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(dimensions, pivots, table, lowerBound);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('2 dimensions, 2 pivots', () => {
		const dimensions = ['dimension1', 'dimension2'];
		const pivots = ['pivot1', 'pivot2'];
		const table = 'my_table';
		const lowerBound = 1000;

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT dimension1, dimension2, pivot1, pivot2
		FROM my_table
		LIMIT 1001
	),
	pivot_combos AS (
		SELECT DISTINCT pivot1, pivot2
		FROM my_table
		LIMIT 1001
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 1000 AS exceeds_lower_bound,
	0 AS exceeds_column_limit,
	2 + (SELECT COUNT(*) FROM pivot_combos) * 1 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(dimensions, pivots, table, lowerBound);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('1 dimension, 1 pivot with WHERE clause', () => {
		const dimensions = ['category'];
		const pivots = ['item_name'];
		const table = 'order_details';
		const lowerBound = 1000;
		const whereClause = "WHERE date >= toDate('2024-01-01')";

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT category, item_name
		FROM order_details
		WHERE date >= toDate('2024-01-01')
		LIMIT 1001
	),
	pivot_combos AS (
		SELECT DISTINCT item_name
		FROM order_details
		WHERE date >= toDate('2024-01-01')
		LIMIT 1001
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 1000 AS exceeds_lower_bound,
	0 AS exceeds_column_limit,
	1 + (SELECT COUNT(*) FROM pivot_combos) * 1 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			lowerBound,
			whereClause
		);
		expect(actual.trim()).toEqual(expected.trim());
	});

	test('with column limit', () => {
		const dimensions = ['category'];
		const pivots = ['month'];
		const table = 'orders';
		const lowerBound = 25000;
		const columnLimit = 100;
		const measuresCount = 2;

		const expected = `
WITH
	detail_combos AS (
		SELECT DISTINCT category, month
		FROM orders
		LIMIT 25001
	),
	pivot_combos AS (
		SELECT DISTINCT month
		FROM orders
		LIMIT 101
	)
SELECT
	(SELECT COUNT(*) FROM detail_combos) > 25000 AS exceeds_lower_bound,
	1 + (SELECT COUNT(*) FROM pivot_combos) * 2 > 100 AS exceeds_column_limit,
	1 + (SELECT COUNT(*) FROM pivot_combos) * 2 AS estimated_columns
		`;

		const actual = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			lowerBound,
			undefined,
			columnLimit,
			measuresCount
		);
		expect(actual.trim()).toEqual(expected.trim());
	});
});
