import { describe, it, expect } from 'vitest';
import { normalizeNumericRows } from './normalize-numeric-rows';

describe('normalizeNumericRows (Databricks)', () => {
	it('coerces DECIMAL strings to JS numbers', () => {
		const rows = [{ n: '19.99' }];
		normalizeNumericRows(rows, new Set(['n']));
		expect(rows[0].n).toBe(19.99);
	});

	it('coerces BIGINT bigints to JS numbers', () => {
		const rows = [{ n: 42n }];
		normalizeNumericRows(rows, new Set(['n']));
		expect(rows[0].n).toBe(42);
	});

	it('leaves finite JS numbers untouched', () => {
		const rows = [{ n: 3.14 }];
		normalizeNumericRows(rows, new Set(['n']));
		expect(rows[0].n).toBe(3.14);
	});

	it('maps non-finite / un-parseable values to null (never a silent 0)', () => {
		const rows = [{ a: Infinity, b: 'not-a-number', c: '' }];
		normalizeNumericRows(rows, new Set(['a', 'b', 'c']));
		expect(rows[0].a).toBeNull();
		expect(rows[0].b).toBeNull();
		expect(rows[0].c).toBeNull();
	});

	it('leaves null / undefined untouched', () => {
		const rows = [{ a: null, b: undefined }];
		normalizeNumericRows(rows, new Set(['a', 'b']));
		expect(rows[0].a).toBeNull();
		expect(rows[0].b).toBeUndefined();
	});

	it('is a no-op when there are no numeric columns', () => {
		const rows = [{ a: '1', b: 'x' }];
		normalizeNumericRows(rows, new Set());
		expect(rows[0]).toEqual({ a: '1', b: 'x' });
	});
});
