import { describe, test, expect } from 'vitest';
import { hasAgg } from './sql-expression-utils';
import { CubeDialect } from '../../sql-dialect';
describe('ClickHouse aggregate detection', () => {
	test('argMax counts as an aggregate (no more false aggregation warning)', () => {
		expect(hasAgg('argMax(value, year_date)')).toBe(true);
		expect(hasAgg('argMin(value, year_date)')).toBe(true);
		expect(hasAgg('anyLast(value)')).toBe(true);
	});
	test('a bare column still does not', () => {
		expect(hasAgg('value')).toBe(false);
	});
});

describe('Cube aggregate detection', () => {
	test('MEASURE() is the aggregate, with or without the dialect', () => {
		expect(hasAgg('MEASURE(line_items_sum_price)', new CubeDialect())).toBe(true);
		expect(hasAgg('MEASURE(line_items_sum_price)')).toBe(true);
		expect(hasAgg('measure(line_items_sum_price)')).toBe(true);
	});
	test('a bare measure reference still does not', () => {
		expect(hasAgg('line_items_sum_price', new CubeDialect())).toBe(false);
	});
});
