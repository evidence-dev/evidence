import { describe, expect, it } from 'vitest';
import { hasAlias } from './sql-expression-utils';

describe('sql-expression-utils', () => {
	describe('hasAlias', () => {
		it('1', () => {
			const value =
				'(sum(dollar_sales - incremental_dollars) - sum(dollar_sales_year_ago - incremental_dollars_year_ago)) / nullif(sum(dollar_sales_year_ago - incremental_dollars_year_ago), 0) as base_sales_yoy_pct';
			const start = performance.now();
			const result = hasAlias(value);
			const end = performance.now();
			console.debug(`hasAlias took ${end - start}ms`);
			expect(result).toBe(true);
		});
	});
});
