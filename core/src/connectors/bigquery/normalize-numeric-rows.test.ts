import { describe, it, expect } from 'vitest';
import { normalizeNumericRows } from './normalize-numeric-rows';

// Mirrors the runtime shape big.js produces (s = sign, c = coefficient digits,
// e = exponent), with a matching toString. Lets us exercise structural detection
// without taking a dev dep on big.js or @types/big.js.
const bigLike = (value: string) => {
	const n = Number(value);
	return {
		s: n < 0 ? -1 : 1,
		c: Math.abs(n).toString().replace('.', '').split('').map(Number),
		e: Math.floor(Math.log10(Math.abs(n) || 1)),
		toString: () => value
	};
};

describe('normalizeNumericRows', () => {
	it('coerces Big-shaped objects (NUMERIC / BIGNUMERIC) to plain numbers', () => {
		const rows = [
			{ revenue: bigLike('103818.32'), name: 'Electronics' },
			{ revenue: bigLike('0.00001'), name: 'Sports' }
		] as unknown as Record<string, unknown>[];
		normalizeNumericRows(rows, new Set(['revenue']));
		expect(rows[0].revenue).toBe(103818.32);
		expect(rows[1].revenue).toBe(0.00001);
		expect(rows[0].name).toBe('Electronics');
	});

	it('coerces bigint values', () => {
		const rows = [{ count: 1234567890123456n }, { count: 42n }] as unknown as Record<
			string,
			unknown
		>[];
		normalizeNumericRows(rows, new Set(['count']));
		expect(rows[0].count).toBe(1234567890123456);
		expect(rows[1].count).toBe(42);
	});

	it('coerces numeric strings defensively', () => {
		const rows = [{ v: '123.45' }, { v: '1.5e6' }];
		normalizeNumericRows(rows, new Set(['v']));
		expect(rows[0].v).toBe(123.45);
		expect(rows[1].v).toBe(1_500_000);
	});

	it('leaves finite JS numbers untouched', () => {
		const rows = [{ amount: 150.9 }, { amount: 0 }, { amount: -25 }];
		normalizeNumericRows(rows, new Set(['amount']));
		expect(rows[0].amount).toBe(150.9);
		expect(rows[1].amount).toBe(0);
		expect(rows[2].amount).toBe(-25);
	});

	it('normalizes non-finite JS numbers (NaN / Infinity / -Infinity) to null', () => {
		const rows = [
			{ amount: Number.NaN },
			{ amount: Number.POSITIVE_INFINITY },
			{ amount: Number.NEGATIVE_INFINITY }
		];
		normalizeNumericRows(rows, new Set(['amount']));
		expect(rows[0].amount).toBeNull();
		expect(rows[1].amount).toBeNull();
		expect(rows[2].amount).toBeNull();
	});

	it('preserves null / undefined and converts empty strings to null', () => {
		const rows = [{ v: null }, { v: undefined }, { v: '' }];
		normalizeNumericRows(rows, new Set(['v']));
		expect(rows[0].v).toBeNull();
		expect(rows[1].v).toBeUndefined();
		expect(rows[2].v).toBeNull();
	});

	it('returns null for un-parseable strings (never silently zero)', () => {
		const rows = [{ v: 'not-a-number' }, { v: 'NaN' }, { v: 'Infinity' }];
		normalizeNumericRows(rows, new Set(['v']));
		expect(rows[0].v).toBeNull();
		expect(rows[1].v).toBeNull();
		expect(rows[2].v).toBeNull();
	});

	it('does not touch columns the caller did not name', () => {
		const rows = [{ category: '42' }, { category: 'Electronics' }];
		normalizeNumericRows(rows, new Set([]));
		expect(rows[0].category).toBe('42');
		expect(rows[1].category).toBe('Electronics');
	});

	it('is a no-op when there are no numeric columns', () => {
		const rows = [{ a: 'x', b: 'y' }];
		normalizeNumericRows(rows, new Set());
		expect(rows[0]).toEqual({ a: 'x', b: 'y' });
	});

	it('is a no-op when rows array is empty', () => {
		const rows: Record<string, unknown>[] = [];
		expect(() => normalizeNumericRows(rows, new Set(['v']))).not.toThrow();
		expect(rows).toEqual([]);
	});

	it('handles a realistic mixed-column BigQuery result row', () => {
		const rows = [
			{
				order_date: '2024-01-01',
				revenue: bigLike('850123.45'),
				count: 1024n,
				category: 'Electronics'
			},
			{
				order_date: '2024-02-01',
				revenue: bigLike('920400.00'),
				count: 0n,
				category: 'Clothing'
			}
		] as unknown as Record<string, unknown>[];
		normalizeNumericRows(rows, new Set(['revenue', 'count']));
		expect(rows[0].revenue).toBe(850123.45);
		expect(rows[0].count).toBe(1024);
		expect(rows[1].revenue).toBe(920400);
		expect(rows[1].count).toBe(0);
		expect(rows[0].order_date).toBe('2024-01-01');
		expect(rows[0].category).toBe('Electronics');
	});
});
