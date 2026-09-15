import { describe, it, expect } from 'vitest';
import type { PivotResult, PivotRow } from './pivot-utils';
import { addRowspanInfo, type RowWithSpans } from './pivot-utils';

const DIMENSIONS = ['product_line', 'sku', 'channel'];

function dataRow(product_line: string, sku: string, channel: string, units: number): PivotRow {
	return {
		product_line,
		sku,
		channel,
		units,
		render_type: 'cell_data',
		subtotal_level: null,
		__dimKey: [product_line, sku, channel].join('|~|')
	};
}

function subtotalRow(product_line: string, units: number): PivotRow {
	return {
		product_line,
		units,
		render_type: 'row_subtotal',
		subtotal_level: 1,
		__dimKey: [product_line, '[[GROUPED]]', '[[GROUPED]]'].join('|~|')
	};
}

function buildResult(rows: PivotRow[]): PivotResult {
	return {
		columns: [...DIMENSIONS, 'units'],
		rows,
		dimensions: DIMENSIONS,
		headerLevels: [],
		columnMeta: [],
		tableType: 'pivot',
		config: {
			dimensions: DIMENSIONS,
			pivots: [],
			measures: ['units'],
			measuresFirst: false,
			subtotals: true
		}
	};
}

function spans(result: PivotResult, dimIndex: number): number[] {
	return (result.rows as RowWithSpans[]).map((row) => row.__rowspans![dimIndex]);
}

function skips(result: PivotResult, dimIndex: number): boolean[] {
	return (result.rows as RowWithSpans[]).map((row) => row.__skipCell![dimIndex]);
}

describe('addRowspanInfo', () => {
	it('does not merge a child cell across rows whose parent dimensions differ', () => {
		// Rows sorted by a measure, so product lines interleave while channel repeats
		const result = addRowspanInfo(
			buildResult([
				dataRow('Ketchup', 'Ketchup 20oz', 'Grocery Retail', 414),
				dataRow('Sauces', 'Marinara 24oz', 'Grocery Retail', 274),
				dataRow('Salsa', 'Salsa 16oz', 'Grocery Retail', 237),
				dataRow('Foodservice', 'Crushed #10 Can', 'Foodservice', 72)
			])
		);

		expect(spans(result, 0)).toEqual([1, 1, 1, 1]);
		expect(spans(result, 2)).toEqual([1, 1, 1, 1]);
		expect(skips(result, 2)).toEqual([false, false, false, false]);
	});

	it('merges a child cell only within a merged parent group', () => {
		const result = addRowspanInfo(
			buildResult([
				dataRow('Ketchup', 'Ketchup 20oz', 'Grocery Retail', 414),
				dataRow('Ketchup', 'Ketchup 20oz', 'E-commerce', 227),
				dataRow('Ketchup', 'Gallon', 'Foodservice', 50),
				dataRow('Sauces', 'Marinara 24oz', 'Grocery Retail', 274),
				dataRow('Sauces', 'Marinara 24oz', 'E-commerce', 150)
			])
		);

		expect(spans(result, 0)).toEqual([3, 1, 1, 2, 1]);
		expect(skips(result, 0)).toEqual([false, true, true, false, true]);
		expect(spans(result, 1)).toEqual([2, 1, 1, 2, 1]);
		expect(skips(result, 1)).toEqual([false, true, false, false, true]);
		expect(spans(result, 2)).toEqual([1, 1, 1, 1, 1]);
	});

	it('does not merge a repeated child value that straddles a parent boundary', () => {
		const result = addRowspanInfo(
			buildResult([
				dataRow('Ketchup', 'Ketchup 20oz', 'E-commerce', 227),
				dataRow('Ketchup', 'Ketchup 20oz', 'Foodservice', 50),
				dataRow('Sauces', 'Ketchup 20oz', 'Grocery Retail', 274)
			])
		);

		expect(spans(result, 1)).toEqual([2, 1, 1]);
		expect(skips(result, 1)).toEqual([false, true, false]);
	});

	it('keeps parent spans covering nested subtotal rows and ends them at their own subtotal', () => {
		const result = addRowspanInfo(
			buildResult([
				dataRow('Ketchup', 'Ketchup 20oz', 'Grocery Retail', 414),
				dataRow('Ketchup', 'Ketchup 20oz', 'E-commerce', 227),
				subtotalRow('Ketchup', 641),
				dataRow('Sauces', 'Marinara 24oz', 'Grocery Retail', 274),
				subtotalRow('Sauces', 274)
			])
		);

		expect(spans(result, 0)).toEqual([2, 1, 1, 1, 1]);
		expect(skips(result, 0)).toEqual([false, true, false, false, false]);
		expect(spans(result, 1)).toEqual([2, 1, 1, 1, 1]);
		expect(skips(result, 1)).toEqual([false, true, false, false, false]);
	});
});
