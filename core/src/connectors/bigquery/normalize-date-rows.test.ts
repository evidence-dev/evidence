import { describe, it, expect } from 'vitest';
import { normalizeDateRows } from './normalize-date-rows';

const cols = (...names: string[]) => new Set(names);

describe('normalizeDateRows (BigQuery)', () => {
	it('is a no-op when there are no date columns', () => {
		const rows = [{ a: 1, b: 'x' }];
		normalizeDateRows(rows, cols());
		expect(rows).toEqual([{ a: 1, b: 'x' }]);
	});

	it('unwraps DATE-like wrappers ({value: "YYYY-MM-DD"}) and emits the date', () => {
		const rows = [{ d: { value: '2025-05-22' } }];
		normalizeDateRows(rows, cols('d'));
		expect(rows[0].d).toBe('2025-05-22');
	});

	it('unwraps TIMESTAMP wrappers and emits midnight as date-only', () => {
		const rows = [{ ts: { value: '2025-05-22T00:00:00.000Z' } }];
		normalizeDateRows(rows, cols('ts'));
		expect(rows[0].ts).toBe('2025-05-22');
	});

	it('unwraps TIMESTAMP wrappers and emits non-midnight as datetime string', () => {
		const rows = [{ ts: { value: '2025-05-22T14:59:12.000Z' } }];
		normalizeDateRows(rows, cols('ts'));
		expect(rows[0].ts).toBe('2025-05-22 14:59:12');
	});

	it('treats DATETIME (no zone) as UTC', () => {
		const rows = [{ dt: { value: '2025-05-22 14:59:12' } }];
		normalizeDateRows(rows, cols('dt'));
		expect(rows[0].dt).toBe('2025-05-22 14:59:12');
	});

	it('passes BQ TIME ("HH:MM:SS") through unchanged', () => {
		const rows = [{ t: { value: '14:59:12' } }, { t: { value: '01:02:03.456' } }];
		normalizeDateRows(rows, cols('t'));
		expect(rows[0].t).toBe('14:59:12');
		expect(rows[1].t).toBe('01:02:03.456');
	});

	it('handles raw Date objects', () => {
		const rows = [{ d: new Date(Date.UTC(2025, 0, 1, 0, 0, 0)) }];
		normalizeDateRows(rows, cols('d'));
		expect(rows[0].d).toBe('2025-01-01');
	});

	it('handles raw string ISO timestamps', () => {
		const rows = [{ ts: '2025-05-22T14:59:12.000Z' }];
		normalizeDateRows(rows, cols('ts'));
		expect(rows[0].ts).toBe('2025-05-22 14:59:12');
	});

	it('leaves null/undefined/unparseable values alone', () => {
		const rows = [{ d: null }, { d: undefined }, { d: { value: 'not-a-date' } }];
		normalizeDateRows(rows, cols('d'));
		expect(rows[0].d).toBeNull();
		expect(rows[1].d).toBeUndefined();
		expect(rows[2].d).toEqual({ value: 'not-a-date' });
	});
});
