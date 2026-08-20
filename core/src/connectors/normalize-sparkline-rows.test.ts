import { describe, it, expect } from 'vitest';
import { normalizeSparklineRows } from './normalize-sparkline-rows';
import type { Column } from '../user-components/interfaces/query-service';

const sparklineCol = (name: string): Column => ({
	name,
	clickhouseType: 'STRING',
	jsType: 'string'
});

describe('normalizeSparklineRows', () => {
	it('parses JSON-encoded sparkline strings into tuple arrays', () => {
		const rows = [
			{
				__ev_sparkline_sum_total_sales: '[["2025-01-01",100],["2025-01-02",110]]'
			}
		];
		normalizeSparklineRows(rows, [sparklineCol('__ev_sparkline_sum_total_sales')]);
		expect(rows[0].__ev_sparkline_sum_total_sales).toEqual([
			['2025-01-01', 100],
			['2025-01-02', 110]
		]);
	});

	it('handles multiple sparkline columns in one pass', () => {
		const rows = [
			{
				__ev_sparkline_a: '[["2025-01-01",1]]',
				__ev_sparkline_b: '[["2025-01-02",2]]',
				other: 'unchanged'
			}
		];
		normalizeSparklineRows(rows, [
			sparklineCol('__ev_sparkline_a'),
			sparklineCol('__ev_sparkline_b'),
			{ name: 'other', clickhouseType: 'STRING', jsType: 'string' }
		]);
		expect(rows[0].__ev_sparkline_a).toEqual([['2025-01-01', 1]]);
		expect(rows[0].__ev_sparkline_b).toEqual([['2025-01-02', 2]]);
		expect(rows[0].other).toBe('unchanged');
	});

	it('ignores user columns that happen to end in _sparkline', () => {
		// The whole point of the __ev_sparkline_ prefix is collision-proofing.
		const rows = [{ my_sparkline: '[["x",1]]', hello_sparkline: 'arbitrary user value' }];
		normalizeSparklineRows(rows, [
			{ name: 'my_sparkline', clickhouseType: 'STRING', jsType: 'string' },
			{ name: 'hello_sparkline', clickhouseType: 'STRING', jsType: 'string' }
		]);
		expect(rows[0].my_sparkline).toBe('[["x",1]]');
		expect(rows[0].hello_sparkline).toBe('arbitrary user value');
	});

	it('is a no-op when there are no sparkline columns', () => {
		const rows = [{ a: 1 }];
		normalizeSparklineRows(rows, [
			{ name: 'a', clickhouseType: 'INT64', jsType: 'number' }
		]);
		expect(rows[0]).toEqual({ a: 1 });
	});

	it('leaves the column untouched when the value is not a string', () => {
		const rows = [
			{ __ev_sparkline_s: null },
			{ __ev_sparkline_s: undefined },
			{ __ev_sparkline_s: [['already', 'parsed']] }
		];
		normalizeSparklineRows(rows, [sparklineCol('__ev_sparkline_s')]);
		expect(rows[0].__ev_sparkline_s).toBe(null);
		expect(rows[1].__ev_sparkline_s).toBe(undefined);
		expect(rows[2].__ev_sparkline_s).toEqual([['already', 'parsed']]);
	});

	it('sets the column to null when JSON is malformed', () => {
		const rows = [{ __ev_sparkline_s: 'not json' }];
		normalizeSparklineRows(rows, [sparklineCol('__ev_sparkline_s')]);
		expect(rows[0].__ev_sparkline_s).toBe(null);
	});
});
