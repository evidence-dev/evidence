import { describe, expect, it } from 'vitest';
import { generatePivotData, type PivotConfig } from './pivot-utils';
import type { DataPoint } from '../types';
import type { UnifiedColumnDefinition } from '../tags/table/unified-column-definition.types';

function makePCE(alias: string, type: 'dimension' | 'measure', hasAgg: boolean) {
	return {
		sqlWithAlias: type === 'measure' ? `sum(${alias}) AS ${alias}` : alias,
		sqlWithoutAlias: type === 'measure' ? `sum(${alias})` : alias,
		sqlWithoutDateFiltersOrAlias: type === 'measure' ? `sum(${alias})` : alias,
		alias,
		displayAlias: alias,
		type,
		isComplexExpression: false,
		hasAgg,
		isTemporalDateGrain: false,
		hasDateGrain: false,
		hasDateRange: false,
		isTableComparison: false,
		isTableSparkline: false
	};
}

function makeConfig(dimensions: string[]): PivotConfig {
	const unifiedColumns: UnifiedColumnDefinition[] = [
		...dimensions.map((dim) => ({
			type: 'dimension' as const,
			sqlWithAlias: dim,
			alias: dim,
			columnIdForRendering: dim,
			processedColumnExpression: makePCE(dim, 'dimension', false)
		})),
		{
			type: 'measure',
			sqlWithAlias: 'sum(value) AS value',
			sqlWithoutAlias: 'sum(value)',
			alias: 'value',
			columnIdForRendering: 'value',
			processedColumnExpression: makePCE('value', 'measure', true)
		}
	];

	return {
		dimensions,
		pivots: [],
		measures: ['value'],
		measuresFirst: false,
		subtotals: true,
		showTotalRow: true,
		showSubtotalRows: true,
		columnTypes: new Map<string, string>([
			...dimensions.map((dim) => [dim, 'string'] as const),
			['value', 'number']
		]),
		unifiedColumns
	};
}

const cell = (row: Record<string, unknown>): DataPoint =>
	({
		...row,
		__ev_render_type: 'cell_data',
		__ev_subtotal_level: null
	}) as DataPoint;

describe('generatePivotData subtotal pruning', () => {
	it('hides subtotal rows when every group maps to one detail row, keeping the total', () => {
		const result = generatePivotData(
			[
				cell({
					category: 'A',
					item: 'a1',
					value: 10,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				cell({
					category: 'B',
					item: 'b1',
					value: 20,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				{
					category: 'A',
					item: null,
					value: 10,
					__ev_render_type: 'row_subtotal',
					__ev_subtotal_level: 1,
					__ev_grouping_category: 0,
					__ev_grouping_item: 1
				},
				{
					category: 'B',
					item: null,
					value: 20,
					__ev_render_type: 'row_subtotal',
					__ev_subtotal_level: 1,
					__ev_grouping_category: 0,
					__ev_grouping_item: 1
				},
				{
					category: null,
					item: null,
					value: 30,
					__ev_render_type: 'row_total',
					__ev_subtotal_level: 0,
					__ev_grouping_category: 1,
					__ev_grouping_item: 1
				}
			] as DataPoint[],
			makeConfig(['category', 'item'])
		);

		expect(result.rows.filter((row) => row.render_type === 'row_subtotal')).toHaveLength(0);
		expect(result.rows.filter((row) => row.render_type === 'row_total')).toHaveLength(1);
		expect(result.rows.filter((row) => row.render_type === 'cell_data')).toHaveLength(2);
	});

	it('keeps every subtotal at a level if any group there has multiple detail rows', () => {
		const result = generatePivotData(
			[
				cell({
					category: 'A',
					item: 'a1',
					value: 7,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				cell({
					category: 'A',
					item: 'a2',
					value: 3,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				cell({
					category: 'B',
					item: 'b1',
					value: 20,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				{
					category: 'A',
					item: null,
					value: 10,
					__ev_render_type: 'row_subtotal',
					__ev_subtotal_level: 1,
					__ev_grouping_category: 0,
					__ev_grouping_item: 1
				},
				{
					category: 'B',
					item: null,
					value: 20,
					__ev_render_type: 'row_subtotal',
					__ev_subtotal_level: 1,
					__ev_grouping_category: 0,
					__ev_grouping_item: 1
				},
				{
					category: null,
					item: null,
					value: 30,
					__ev_render_type: 'row_total',
					__ev_subtotal_level: 0,
					__ev_grouping_category: 1,
					__ev_grouping_item: 1
				}
			] as DataPoint[],
			makeConfig(['category', 'item'])
		);

		// Both subtotals stay even though group B only has one row, because group A has two.
		expect(result.rows.filter((row) => row.render_type === 'row_subtotal')).toHaveLength(2);
		expect(result.rows.filter((row) => row.render_type === 'row_total')).toHaveLength(1);
		expect(result.rows.filter((row) => row.render_type === 'cell_data')).toHaveLength(3);
	});

	it('hides only the redundant deeper level when an outer level still aggregates rows', () => {
		// region -> category -> item. Every (region, category) has exactly one item, so the
		// level-2 subtotals are redundant. But region "north" has two categories, so the
		// level-1 (region) subtotals must remain.
		const detail = (region: string, category: string, item: string, value: number) =>
			cell({
				region,
				category,
				item,
				value,
				__ev_grouping_region: 0,
				__ev_grouping_category: 0,
				__ev_grouping_item: 0
			});

		const level2 = (region: string, category: string, value: number): DataPoint =>
			({
				region,
				category,
				item: null,
				value,
				__ev_render_type: 'row_subtotal',
				__ev_subtotal_level: 2,
				__ev_grouping_region: 0,
				__ev_grouping_category: 0,
				__ev_grouping_item: 1
			}) as DataPoint;

		const level1 = (region: string, value: number): DataPoint =>
			({
				region,
				category: null,
				item: null,
				value,
				__ev_render_type: 'row_subtotal',
				__ev_subtotal_level: 1,
				__ev_grouping_region: 0,
				__ev_grouping_category: 1,
				__ev_grouping_item: 1
			}) as DataPoint;

		const result = generatePivotData(
			[
				detail('north', 'fruit', 'apple', 5),
				detail('north', 'veg', 'carrot', 8),
				detail('south', 'fruit', 'banana', 3),
				level2('north', 'fruit', 5),
				level2('north', 'veg', 8),
				level2('south', 'fruit', 3),
				level1('north', 13),
				level1('south', 3),
				{
					region: null,
					category: null,
					item: null,
					value: 16,
					__ev_render_type: 'row_total',
					__ev_subtotal_level: 0,
					__ev_grouping_region: 1,
					__ev_grouping_category: 1,
					__ev_grouping_item: 1
				}
			] as DataPoint[],
			makeConfig(['region', 'category', 'item'])
		);

		const subtotals = result.rows.filter((row) => row.render_type === 'row_subtotal');
		// Level-2 subtotals dropped (all singleton), level-1 subtotals kept.
		expect(subtotals.map((row) => row.subtotal_level).sort()).toEqual([1, 1]);
		expect(result.rows.filter((row) => row.render_type === 'row_total')).toHaveLength(1);
		expect(result.rows.filter((row) => row.render_type === 'cell_data')).toHaveLength(3);
	});

	it('keeps subtotal rows when collapsible is enabled', () => {
		const config = makeConfig(['category', 'item']);
		config.collapsible = true;

		const result = generatePivotData(
			[
				cell({
					category: 'A',
					item: 'a1',
					value: 10,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				cell({
					category: 'B',
					item: 'b1',
					value: 20,
					__ev_grouping_category: 0,
					__ev_grouping_item: 0
				}),
				{
					category: 'A',
					item: null,
					value: 10,
					__ev_render_type: 'row_subtotal',
					__ev_subtotal_level: 1,
					__ev_grouping_category: 0,
					__ev_grouping_item: 1
				},
				{
					category: 'B',
					item: null,
					value: 20,
					__ev_render_type: 'row_subtotal',
					__ev_subtotal_level: 1,
					__ev_grouping_category: 0,
					__ev_grouping_item: 1
				},
				{
					category: null,
					item: null,
					value: 30,
					__ev_render_type: 'row_total',
					__ev_subtotal_level: 0,
					__ev_grouping_category: 1,
					__ev_grouping_item: 1
				}
			] as DataPoint[],
			config
		);

		expect(result.rows.filter((row) => row.render_type === 'row_subtotal')).toHaveLength(2);
	});
});
