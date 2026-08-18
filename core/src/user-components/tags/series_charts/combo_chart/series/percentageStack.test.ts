import { describe, it, expect } from 'vitest';
import type { SeriesOption } from 'echarts';
import {
	transformToPercentageStack,
	getOriginalValue,
	type PercentageSeriesOption
} from './percentageStack';

// 3 series across 3 x-categories, with off-diagonal values that differ from the
// diagonal so a series-index vs data-index mix-up resolves a visibly wrong value.
const series = (data: [string, number][]): SeriesOption => ({ type: 'bar', data });

const fixture: SeriesOption[] = [
	series([
		['AUH', 10],
		['BFH', 20],
		['HGH', 30]
	]),
	series([
		['AUH', 1],
		['BFH', 2],
		['HGH', 3]
	]),
	series([
		['AUH', 100],
		['BFH', 200],
		['HGH', 300]
	])
];

describe('transformToPercentageStack', () => {
	it('normalizes each x-category to its cross-series total', () => {
		const out = transformToPercentageStack(fixture);

		// AUH total = 10 + 1 + 100 = 111
		expect((out[0].data as number[][])[0][1]).toBeCloseTo(10 / 111);
		expect((out[1].data as number[][])[0][1]).toBeCloseTo(1 / 111);
		expect((out[2].data as number[][])[0][1]).toBeCloseTo(100 / 111);

		// Each x-category sums to 1
		for (let i = 0; i < 3; i++) {
			const total = out.reduce((sum, s) => sum + (s.data as number[][])[i][1], 0);
			expect(total).toBeCloseTo(1);
		}
	});

	it('preserves the x-value and trailing point elements (e.g. size) through the transform', () => {
		const withSize: SeriesOption = { type: 'bar', data: [['AUH', 10, 5]] };
		const out = transformToPercentageStack([withSize]);
		const point = (out[0].data as unknown[][])[0];
		expect(point[0]).toBe('AUH');
		expect(point[2]).toBe(5);
	});
});

// These pin the data-layer contract the ComboChart tooltip fix relies on
// (resolve by data-index, not series-index); the call site itself —
// ComboChart.svelte passing p.dataIndex — is covered by manual/E2E verification.
describe('getOriginalValue — the tooltip parenthetical lookup', () => {
	const out = transformToPercentageStack(fixture);

	// This reproduces exactly what the tooltip value formatter does:
	// look up the hovered category's x-value via the data index, then fetch
	// THAT series' original (un-normalized) value for that x.
	const originalAtDataIndex = (s: PercentageSeriesOption, dataIndex: number) => {
		const xValue = (s.data as unknown[][])[dataIndex][0] as string;
		return getOriginalValue(s, xValue);
	};

	it('returns the hovered column value for each series (indexed by data-index)', () => {
		// Hover BFH (data-index 1): each series shows its own BFH value.
		expect(out.map((s) => originalAtDataIndex(s, 1))).toEqual([20, 2, 200]);
		// Hover HGH (data-index 2).
		expect(out.map((s) => originalAtDataIndex(s, 2))).toEqual([30, 3, 300]);
	});

	it('indexing by series-index resolves the column-independent diagonal (the former defect)', () => {
		// series i reading category i ignores the hovered column entirely, yielding
		// the fixture diagonal regardless of which bar is hovered.
		const buggy = out.map((s, seriesIndex) => originalAtDataIndex(s, seriesIndex));
		expect(buggy).toEqual([10, 2, 300]);
	});
});
