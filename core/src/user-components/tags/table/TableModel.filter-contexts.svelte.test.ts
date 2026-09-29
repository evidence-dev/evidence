import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { ClickHouseDialect } from '../../../sql-dialect';
import { Filters } from '../../../Filters.svelte';
import type { FilterClass } from '../../../Filter.svelte';
import { DropdownFilter } from '../dropdown/DropdownFilter.svelte';
import { InlineQueries } from '../../common/inline-queries';
import { TableModel } from './TableModel.svelte';

const dialect = new ClickHouseDialect();

function filters(): Filters {
	return new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: () => dialect
	});
}

/**
 * Inside `{% repeat %}` a child's filter contexts are `[repeatScope, pageFilters]`.
 * A page input referenced from the table's where/having must resolve through the
 * page context even though the repeat scope comes first.
 */
describe('TableModel filter contexts', () => {
	it('resolves page inputs in where/having when a repeat scope is the first context', () => {
		const pageFilters = filters();
		const category = pageFilters.create(
			{
				id: 'category',
				userComponentName: 'dropdown',
				attributes: { value_column: 'category', multiple: false }
			},
			DropdownFilter as unknown as FilterClass<'dropdown', Record<string, unknown>>
		);
		category.setDefault('Clothing');
		const repeatScope = filters();
		const filterContexts = [repeatScope, pageFilters];
		const inlineQueries = new InlineQueries({ filterContexts });

		const model = new TableModel({
			attributes: {
				data: 'orders',
				where: 'category = {{category}}',
				having: 'countIf(category = {{category}}) > 0',
				filters: []
				// The schema's remaining attributes are irrelevant to resolution.
			} as unknown as ConstructorParameters<typeof TableModel>[0]['attributes'],
			validationErrors: [],
			parent: null,
			deps: {
				connection: { id: 'default', type: 'managed', dialect, query: vi.fn() },
				filterContexts,
				inlineQueries,
				projectSettings: undefined,
				defaultRefreshInterval: undefined
			}
		});
		flushSync();

		expect(model.resolvedWhere).toBe("category = 'Clothing'");
		expect(model.resolvedHaving).toBe("countIf(category = 'Clothing') > 0");
	});
});
