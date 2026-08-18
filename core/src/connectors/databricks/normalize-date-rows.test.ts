import { describe, it, expect } from 'vitest';
import { normalizeDateRows } from './normalize-date-rows';

describe('normalizeDateRows (Databricks)', () => {
	it('collapses a true-midnight Date to "YYYY-MM-DD"', () => {
		const rows = [{ d: new Date('2024-01-01T00:00:00.000Z') }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('2024-01-01');
	});

	it('keeps a non-midnight Date as "YYYY-MM-DD HH:MM:SS"', () => {
		const rows = [{ d: new Date('2024-01-01T14:30:45.000Z') }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('2024-01-01 14:30:45');
	});

	it('preserves sub-second precision by NOT collapsing 00:00:00.123 to a date', () => {
		const rows = [{ d: new Date('2024-01-01T00:00:00.123Z') }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('2024-01-01 00:00:00');
	});

	it('parses ISO strings the same as Date inputs', () => {
		const rows = [{ d: '2024-06-15T09:00:00.000Z' }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('2024-06-15 09:00:00');
	});

	it('leaves un-parseable strings untouched', () => {
		const rows = [{ d: 'not-a-date' }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('not-a-date');
	});

	it('is a no-op when there are no date columns', () => {
		const rows = [{ a: 1, b: 'x' }];
		normalizeDateRows(rows, new Set());
		expect(rows[0]).toEqual({ a: 1, b: 'x' });
	});
});
