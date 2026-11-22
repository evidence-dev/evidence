import { describe, expect, it } from 'vitest';
import { getCellEmphasis } from './table-styles';
import { getColorVizBorders } from './table-cell-display';
import { getDeltaStatus } from '../delta/delta-status';

describe('getCellEmphasis', () => {
	it('emphasizes the grand total row everywhere', () => {
		expect(getCellEmphasis('row_total', 1, 0, 'column_total')).toBe('total');
	});

	it('emphasizes a subtotal row from its level’s column onward', () => {
		expect(getCellEmphasis('row_subtotal', 2, 0, undefined)).toBeNull();
		expect(getCellEmphasis('row_subtotal', 2, 1, undefined)).toBe('subtotal');
		// Pivot columns don't override a subtotal row's own styling.
		expect(getCellEmphasis('row_subtotal', 2, 0, 'column_total')).toBeNull();
	});

	it('tints pivot total and subtotal columns on data rows', () => {
		expect(getCellEmphasis('cell_data', 1, 3, 'column_subtotal')).toBe('pivot');
		expect(getCellEmphasis(undefined, 1, 3, 'column_total')).toBe('pivot');
		expect(getCellEmphasis('cell_data', 1, 3, 'cell_data')).toBeNull();
	});
});

describe('getColorVizBorders', () => {
	const styles = {
		backgroundColor: '#123456',
		color: '#ffffff',
		borderBottomColor: '#bottom',
		topBorderColor: '#top'
	};

	it('draws a bottom border unless a total or subtotal row follows', () => {
		expect(
			getColorVizBorders(styles, { nextRowIsTotal: false, emphasis: null, collapsible: false })
		).toEqual({ bottom: '#bottom', top: undefined });
		expect(
			getColorVizBorders(styles, { nextRowIsTotal: true, emphasis: null, collapsible: false })
				.bottom
		).toBeUndefined();
	});

	it('draws a top border on totals, and on subtotals outside collapsible tables', () => {
		expect(
			getColorVizBorders(styles, { nextRowIsTotal: false, emphasis: 'total', collapsible: true })
				.top
		).toBe('#top');
		expect(
			getColorVizBorders(styles, {
				nextRowIsTotal: false,
				emphasis: 'subtotal',
				collapsible: false
			}).top
		).toBe('#top');
		expect(
			getColorVizBorders(styles, { nextRowIsTotal: false, emphasis: 'subtotal', collapsible: true })
				.top
		).toBeUndefined();
	});
});

describe('getDeltaStatus', () => {
	it('reads a value against the neutral range', () => {
		expect(getDeltaStatus(0.1)).toBe('positive');
		expect(getDeltaStatus(-0.1)).toBe('negative');
		expect(getDeltaStatus(0)).toBe('neutral');
		expect(getDeltaStatus(0.5, [-1, 1])).toBe('neutral');
	});

	it('treats a null bound as unbounded', () => {
		expect(getDeltaStatus(-100, [null, 0])).toBe('neutral');
		expect(getDeltaStatus(5, [null, 0])).toBe('positive');
	});

	it('is neutral for anything that is not a number', () => {
		expect(getDeltaStatus(null)).toBe('neutral');
		expect(getDeltaStatus('12')).toBe('neutral');
	});
});
