import { describe, it, expect } from 'vitest';
import { normalizeDateRows } from './normalize-date-rows';

describe('normalizeDateRows', () => {
	it('passes a DATE string through unchanged', () => {
		const rows = [{ d: '2025-01-03' }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('2025-01-03');
	});

	// The bug this connector shipped with: a `timestamp without time zone` must
	// NOT be shifted by the host timezone. Since it has no offset, keep it verbatim.
	it('keeps a no-tz TIMESTAMP as wall-clock (no timezone shift)', () => {
		const rows = [{ ts: '2025-01-03 23:30:00' }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2025-01-03 23:30:00');
	});

	it('strips fractional seconds and normalizes T-separator on no-tz timestamps', () => {
		const rows = [{ ts: '2025-01-03T23:30:00.123456' }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2025-01-03 23:30:00');
	});

	it('collapses a no-tz midnight timestamp to a date', () => {
		const rows = [{ ts: '2025-01-03 00:00:00' }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2025-01-03');
	});

	it('renders an offset-bearing TIMESTAMPTZ in UTC', () => {
		// 18:30 at -05:00 is 23:30 UTC — the offset is explicit, so this is safe.
		const rows = [{ ts: '2025-01-03 18:30:00-05' }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2025-01-03 23:30:00');
	});

	it('collapses a UTC-midnight TIMESTAMPTZ to a date', () => {
		const rows = [{ ts: '2025-01-03 00:00:00+00' }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2025-01-03');
	});

	it('renders a Date instant (defensive fallback) in UTC', () => {
		const rows = [{ ts: new Date('2025-01-03T23:30:00.000Z') }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2025-01-03 23:30:00');
	});

	it('leaves unparseable offset strings and non-date columns untouched', () => {
		const rows = [{ d: 'nonsense', other: '2025-01-03 23:30:00' }];
		normalizeDateRows(rows, new Set(['d']));
		expect(rows[0].d).toBe('nonsense');
		expect(rows[0].other).toBe('2025-01-03 23:30:00');
	});

	it('is a no-op when no date columns are given', () => {
		const rows = [{ d: '2025-01-03 23:30:00' }];
		normalizeDateRows(rows, new Set());
		expect(rows[0].d).toBe('2025-01-03 23:30:00');
	});
});
