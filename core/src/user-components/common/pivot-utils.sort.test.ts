import { describe, it, expect } from 'vitest';
import type { PivotResult } from './pivot-utils';
import { sortPivotRows } from './pivot-utils';

function buildResult(rows: PivotResult['rows']): PivotResult {
	return {
		columns: ['group', 'item', 'value'],
		rows,
		dimensions: ['group', 'item'],
		headerLevels: [],
		columnMeta: [],
		tableType: 'pivot',
		config: {
			dimensions: ['group', 'item'],
			pivots: [],
			measures: ['value'],
			measuresFirst: false,
			subtotals: true
		}
	};
}

describe('sortPivotRows with hidden subtotal rows', () => {
	it('falls back to flat measure sorting when subtotal rows are absent', () => {
		const data = buildResult([
			{
				group: 'A',
				item: 'a-high',
				value: 10,
				render_type: 'cell_data',
				subtotal_level: null,
				__dimKey: 'A|~|a-high'
			},
			{
				group: 'A',
				item: 'a-low',
				value: 1,
				render_type: 'cell_data',
				subtotal_level: null,
				__dimKey: 'A|~|a-low'
			},
			{
				group: 'B',
				item: 'b-high',
				value: 9,
				render_type: 'cell_data',
				subtotal_level: null,
				__dimKey: 'B|~|b-high'
			},
			{
				group: 'B',
				item: 'b-mid',
				value: 8,
				render_type: 'cell_data',
				subtotal_level: null,
				__dimKey: 'B|~|b-mid'
			}
		]);

		const sorted = sortPivotRows(data, 'value', 'desc', true);

		expect(sorted.rows.map((row) => row.value)).toEqual([10, 9, 8, 1]);
		expect(sorted.rows.map((row) => row.item)).toEqual(['a-high', 'b-high', 'b-mid', 'a-low']);
	});
});
