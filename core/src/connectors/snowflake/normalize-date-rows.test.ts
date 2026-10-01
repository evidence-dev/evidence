import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { normalizeDateRows } from './normalize-date-rows';

type SfTimestampCtor = new (
	epochSeconds: number,
	nanoSeconds: number,
	scale: number,
	timezone: string | number,
	format: string
) => { toSfDate(): Date };

const require = createRequire(import.meta.url);
const SfTimestamp: SfTimestampCtor = require('snowflake-sdk/dist/lib/connection/result/sf_timestamp.js');

// 2026-09-25T11:00:00Z
const EPOCH = 1790334000;
const sfDate = (timezone: string | number) =>
	new SfTimestamp(EPOCH, 0, 3, timezone, 'YYYY-MM-DD HH24:MI:SS').toSfDate();

describe('normalizeDateRows (Snowflake)', () => {
	it('renders TIMESTAMP_TZ in its stored offset', () => {
		const rows = [{ ts: sfDate(-240) }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2026-09-25 07:00:00');
	});

	it('handles positive offsets that cross a day boundary', () => {
		const rows = [{ ts: sfDate(14 * 60) }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2026-09-26 01:00:00');
	});

	it('collapses TIMESTAMP_TZ local midnight to a date', () => {
		const rows = [{ ts: sfDate(-11 * 60) }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2026-09-25');
	});

	it('renders TIMESTAMP_NTZ wall-clock unchanged', () => {
		const rows = [{ ts: sfDate('UTC') }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2026-09-25 11:00:00');
	});

	it('keeps TIMESTAMP_LTZ in UTC', () => {
		const rows = [{ ts: sfDate('America/Toronto') }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBe('2026-09-25 11:00:00');
	});

	it('leaves null values alone', () => {
		const rows = [{ ts: null }];
		normalizeDateRows(rows, new Set(['ts']));
		expect(rows[0].ts).toBeNull();
	});
});
