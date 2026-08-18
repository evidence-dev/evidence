import { describe, test, expect } from 'vitest';
import { hasAgg } from './sql-expression-utils';
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
