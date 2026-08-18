import { describe, test, expect } from 'vitest';
import { enrichWarehouseError } from './enrich-warehouse-error';

describe('enrichWarehouseError', () => {
	test('appends the alias-expansion hint to CH 184 aggregate-in-WHERE errors', () => {
		const raw =
			'Code: 184. DB::Exception: Aggregate function sum(population * life_expectancy) AS population is found in WHERE in query. (ILLEGAL_AGGREGATION)';
		const enriched = enrichWarehouseError(raw);
		expect(enriched).toContain(raw);
		expect(enriched).toContain('SELECT aliases into WHERE');
		expect(enriched).toContain('inner subquery');
	});

	test('leaves other errors untouched', () => {
		expect(enrichWarehouseError('Table demo.nope does not exist')).toBe(
			'Table demo.nope does not exist'
		);
	});
});
