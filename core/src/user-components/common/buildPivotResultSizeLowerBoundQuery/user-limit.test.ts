import { describe, it, expect } from 'vitest';
import { buildPivotResultSizeLowerBoundQuery } from './buildPivotResultSizeLowerBoundQuery';

describe('User LIMIT in pivot check', () => {
	it('should use user limit when smaller than lowerBound', () => {
		const dimensions = ['category AS category'];
		const pivots = ["DATE_TRUNC('day', order_date) AS order_date_day"];
		const table = 'orders';
		const lowerBound = 25000;
		const whereClause = undefined;
		const columnLimit = 100;
		const measuresCount = 2;
		const userLimit = 100; // User specified LIMIT 100

		const result = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			lowerBound,
			whereClause,
			columnLimit,
			measuresCount,
			userLimit
		);

		// Should use LIMIT 101 (user's limit + 1) instead of LIMIT 25001
		expect(result).toContain('LIMIT 101');
		expect(result).not.toContain('LIMIT 25001');
	});

	it('should use lowerBound when user limit is larger', () => {
		const dimensions = ['category AS category'];
		const pivots = ["DATE_TRUNC('day', order_date) AS order_date_day"];
		const table = 'orders';
		const lowerBound = 25000;
		const whereClause = undefined;
		const columnLimit = 100;
		const measuresCount = 2;
		const userLimit = 50000; // User specified LIMIT 50000 (larger than default)

		const result = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			lowerBound,
			whereClause,
			columnLimit,
			measuresCount,
			userLimit
		);

		// Should use LIMIT 25001 (lowerBound + 1) because it's smaller
		expect(result).toContain('LIMIT 25001');
		expect(result).not.toContain('LIMIT 50001');
	});

	it('should use lowerBound when no user limit provided', () => {
		const dimensions = ['category AS category'];
		const pivots = ["DATE_TRUNC('day', order_date) AS order_date_day"];
		const table = 'orders';
		const lowerBound = 25000;
		const whereClause = undefined;
		const columnLimit = 100;
		const measuresCount = 2;
		const userLimit = undefined; // No user limit

		const result = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			lowerBound,
			whereClause,
			columnLimit,
			measuresCount,
			userLimit
		);

		// Should use LIMIT 25001 (lowerBound + 1)
		expect(result).toContain('LIMIT 25001');
	});

	it('should demonstrate the fix: WHERE clause + user LIMIT', () => {
		const dimensions = ['category AS category'];
		const pivots = ["DATE_TRUNC('day', order_date) AS order_date_day"];
		const table = 'orders';
		const lowerBound = 25000;
		const whereClause = "WHERE order_date >= '2024-01-01'";
		const columnLimit = 100;
		const measuresCount = 2;
		const userLimit = 200;

		const result = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			lowerBound,
			whereClause,
			columnLimit,
			measuresCount,
			userLimit
		);

		// Verify both WHERE and LIMIT are applied
		expect(result).toContain("WHERE order_date >= '2024-01-01'");
		expect(result).toContain('LIMIT 201');
	});

	it('should show before vs after for user scenario', () => {
		const dimensions = ['region AS region'];
		const pivots = ["DATE_TRUNC('day', created_at) AS created_at_day"];
		const table = 'transactions';
		const whereClause = "WHERE status = 'completed'";
		const columnLimit = 100;
		const measuresCount = 3;

		// BEFORE fix: no user limit passed
		const before = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			25000,
			whereClause,
			columnLimit,
			measuresCount,
			undefined // OLD: userLimit not passed
		);

		expect(before).toContain('LIMIT 25001');

		// AFTER fix: user limit is passed
		const after = buildPivotResultSizeLowerBoundQuery(
			dimensions,
			pivots,
			table,
			25000,
			whereClause,
			columnLimit,
			measuresCount,
			500 // NEW: userLimit passed
		);

		expect(after).toContain('LIMIT 501');
	});
});
