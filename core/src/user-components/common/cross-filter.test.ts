import { describe, it, expect, vi } from 'vitest';
import { setupCrossFilter } from './cross-filter.svelte';
import { schema as barChartSchema } from '../tags/series_charts/bar_chart/schema';
import { schema as lineChartSchema } from '../tags/series_charts/line_chart/schema';
import { schema as pieChartSchema } from '../tags/pie_chart/schema';
import { schema as funnelChartSchema } from '../tags/funnel_chart/schema';
import { schema as treemapSchema } from '../tags/treemap/schema';
import { schema as horizontalBarChartSchema } from '../tags/series_charts/horizontal_bar_chart/schema';

describe('Cross-filtering (#1111)', () => {
	describe('Schema Attributes', () => {
		it('includes cross_filter attributes in bar_chart schema', () => {
			expect(barChartSchema.attributes.cross_filter).toBeDefined();
			expect(barChartSchema.attributes.cross_filter_column).toBeDefined();
			expect(barChartSchema.attributes.cross_filter_multiple).toBeDefined();
		});

		it('includes cross_filter attributes in line_chart schema', () => {
			expect(lineChartSchema.attributes.cross_filter).toBeDefined();
			expect(lineChartSchema.attributes.cross_filter_column).toBeDefined();
			expect(lineChartSchema.attributes.cross_filter_multiple).toBeDefined();
		});

		it('includes cross_filter attributes in pie_chart schema', () => {
			expect(pieChartSchema.attributes.cross_filter).toBeDefined();
			expect(pieChartSchema.attributes.cross_filter_column).toBeDefined();
			expect(pieChartSchema.attributes.cross_filter_multiple).toBeDefined();
		});

		it('includes cross_filter attributes in funnel_chart and treemap schemas', () => {
			expect(funnelChartSchema.attributes.cross_filter).toBeDefined();
			expect(treemapSchema.attributes.cross_filter).toBeDefined();
		});

		it('includes cross_filter attributes in horizontal_bar_chart schema', () => {
			expect(horizontalBarChartSchema.attributes.cross_filter).toBeDefined();
		});
	});

	describe('setupCrossFilter Logic', () => {
		it('reports isEnabled correctly', () => {
			const helperDisabled = setupCrossFilter({
				chart: () => undefined,
				pageFilters: undefined,
				crossFilter: false,
				crossFilterColumn: 'category'
			});
			expect(helperDisabled.isEnabled()).toBe(false);

			const helperEnabled = setupCrossFilter({
				chart: () => undefined,
				pageFilters: undefined,
				crossFilter: true,
				crossFilterColumn: 'category'
			});
			expect(helperEnabled.isEnabled()).toBe(true);
			expect(helperEnabled.targetColumn()).toBe('category');
			expect(helperEnabled.filterId()).toBe('category');
		});

		it('supports custom cross_filter filter name / id', () => {
			const helper = setupCrossFilter({
				chart: () => undefined,
				pageFilters: undefined,
				crossFilter: 'selected_category',
				crossFilterColumn: 'category'
			});
			expect(helper.isEnabled()).toBe(true);
			expect(helper.filterId()).toBe('selected_category');
		});

		it('handles single-select chart element click and toggle off', () => {
			let storedValue: unknown = undefined;
			const mockFilter = {
				get value() {
					return storedValue;
				},
				set value(v: unknown) {
					storedValue = v;
				}
			};

			const mockPageFilters = {
				get: vi.fn().mockReturnValue(mockFilter),
				createExternal: vi.fn().mockReturnValue(mockFilter)
			} as any;

			const helper = setupCrossFilter({
				chart: () => undefined,
				pageFilters: mockPageFilters,
				crossFilter: true,
				crossFilterColumn: 'country'
			});

			// First click: selects Canada
			helper.handleChartClick({ name: 'Canada' });
			expect(storedValue).toBe('Canada');

			// Second click on same item: toggles off (undefined)
			helper.handleChartClick({ name: 'Canada' });
			expect(storedValue).toBeUndefined();

			// Click on another item: selects USA
			helper.handleChartClick({ name: 'USA' });
			expect(storedValue).toBe('USA');
		});

		it('handles multi-select chart element clicks', () => {
			let storedValue: unknown = undefined;
			const mockFilter = {
				get value() {
					return storedValue;
				},
				set value(v: unknown) {
					storedValue = v;
				}
			};

			const mockPageFilters = {
				get: vi.fn().mockReturnValue(mockFilter),
				createExternal: vi.fn().mockReturnValue(mockFilter)
			} as any;

			const helper = setupCrossFilter({
				chart: () => undefined,
				pageFilters: mockPageFilters,
				crossFilter: true,
				crossFilterColumn: 'region',
				crossFilterMultiple: true
			});

			// Select North
			helper.handleChartClick({ name: 'North' });
			expect(storedValue).toEqual(['North']);

			// Select South
			helper.handleChartClick({ name: 'South' });
			expect(storedValue).toEqual(['North', 'South']);

			// Deselect North
			helper.handleChartClick({ name: 'North' });
			expect(storedValue).toEqual(['South']);

			// Deselect South -> becomes undefined
			helper.handleChartClick({ name: 'South' });
			expect(storedValue).toBeUndefined();
		});

		it('extracts value from series data or value arrays when name is absent', () => {
			let storedValue: unknown = undefined;
			const mockFilter = {
				get value() {
					return storedValue;
				},
				set value(v: unknown) {
					storedValue = v;
				}
			};

			const mockPageFilters = {
				get: vi.fn().mockReturnValue(mockFilter),
				createExternal: vi.fn().mockReturnValue(mockFilter)
			} as any;

			const helper = setupCrossFilter({
				chart: () => undefined,
				pageFilters: mockPageFilters,
				crossFilter: true,
				crossFilterColumn: 'date'
			});

			helper.handleChartClick({ value: ['2026-01-01', 100] });
			expect(storedValue).toBe('2026-01-01');
		});
	});
});
