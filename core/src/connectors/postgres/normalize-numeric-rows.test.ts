import { describe, it, expect } from 'vitest';
import { normalizeNumericRows } from './normalize-numeric-rows';

describe('normalizeNumericRows', () => {
	it('coerces NUMERIC/INT8 strings (the pg default) to JS numbers', () => {
		const rows = [{ n: '1234.5', big: '9007199254740991' }];
		normalizeNumericRows(rows, new Set(['n', 'big']));
		expect(rows[0].n).toBe(1234.5);
		expect(rows[0].big).toBe(9007199254740991);
	});

	it('coerces bigint to number', () => {
		const rows = [{ n: 42n }];
		normalizeNumericRows(rows, new Set(['n']));
		expect(rows[0].n).toBe(42);
	});

	it('maps empty strings and un-parseable values to null (never 0)', () => {
		const rows = [{ a: '', b: 'abc' }];
		normalizeNumericRows(rows, new Set(['a', 'b']));
		expect(rows[0].a).toBeNull();
		expect(rows[0].b).toBeNull();
	});

	it('maps non-finite numbers to null and passes finite numbers through', () => {
		const rows = [{ inf: Infinity, ok: 3.14 }];
		normalizeNumericRows(rows, new Set(['inf', 'ok']));
		expect(rows[0].inf).toBeNull();
		expect(rows[0].ok).toBe(3.14);
	});

	it('leaves null/undefined and non-numeric columns untouched', () => {
		const rows = [{ n: null, other: '999' }];
		normalizeNumericRows(rows, new Set(['n']));
		expect(rows[0].n).toBeNull();
		expect(rows[0].other).toBe('999');
	});
});
