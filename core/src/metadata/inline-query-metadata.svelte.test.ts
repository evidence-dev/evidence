import { describe, expect, it, vi } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { defaultDialect } from '../sql-dialect';
import { InlineQueries } from '../user-components/common/inline-queries';
import type { QueryService } from '../user-components/interfaces/query-service';
import type { Filters } from '../Filters.svelte';
import { InlineQueryMetadata } from './inline-query-metadata.svelte';

describe('InlineQueryMetadata', () => {
	it('retries a query after its previously missing filter becomes available', async () => {
		let filter:
			| {
					value: string;
					templateValues: { selected: string };
			  }
			| undefined;
		const filters = {
			get filterIds() {
				return filter ? ['category_filter'] : [];
			},
			get: () => filter
		} as unknown as Filters;
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		inlineQueries.set(
			'orders_by_category',
			'SELECT {{ category_filter }} AS category, 1 AS transactions'
		);

		const query = vi.fn(async () => ({
			rows: [
				{ name: 'category', type: 'String' },
				{ name: 'transactions', type: 'UInt64' }
			],
			columns: [],
			error: null
		}));
		const metadata = new InlineQueryMetadata(
			{
				workspaceId: 'workspace',
				dialect: defaultDialect,
				query: query as unknown as QueryService['query']
			} satisfies QueryService,
			{ inlineQueries, pageFilters: filters }
		);

		await metadata.loadInlineQueryMetadata('orders_by_category');
		expect(metadata.getTable('orders_by_category')?.error).toContain(
			'Missing filter ID: `category_filter`'
		);
		expect(query).not.toHaveBeenCalled();

		filter = { value: 'Electronics', templateValues: { selected: "'Electronics'" } };
		await metadata.loadInlineQueryMetadata('orders_by_category');

		expect(query).toHaveBeenCalledOnce();
		expect(query).toHaveBeenCalledWith(
			"DESCRIBE TABLE (SELECT 'Electronics' AS category, 1 AS transactions)"
		);
		expect(metadata.getTable('orders_by_category')?.error).toBeUndefined();
		expect(metadata.getTable('orders_by_category')?.columns.map((column) => column.name)).toEqual([
			'category',
			'transactions'
		]);

		filter = undefined;
		await metadata.loadInlineQueryMetadata('orders_by_category');
		expect(metadata.getTable('orders_by_category')?.error).toContain(
			'Missing filter ID: `category_filter`'
		);

		filter = { value: 'Electronics', templateValues: { selected: "'Electronics'" } };
		await metadata.loadInlineQueryMetadata('orders_by_category');

		expect(query).toHaveBeenCalledTimes(2);
		expect(metadata.getTable('orders_by_category')?.error).toBeUndefined();
		expect(metadata.getTable('orders_by_category')?.columns.map((column) => column.name)).toEqual([
			'category',
			'transactions'
		]);
	});

	it('stops rewriting metadata while a referenced filter stays missing', async () => {
		const filters = {
			get filterIds() {
				return [];
			},
			get: () => undefined
		} as unknown as Filters;
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		inlineQueries.set('orders_by_category', 'SELECT {{ category_filter }} AS category');

		const query = vi.fn(async () => ({ rows: [], columns: [], error: null }));
		const metadata = new InlineQueryMetadata(
			{
				workspaceId: 'workspace',
				dialect: defaultDialect,
				query: query as unknown as QueryService['query']
			} satisfies QueryService,
			{ inlineQueries, pageFilters: filters }
		);

		await metadata.loadInlineQueryMetadata('orders_by_category');
		expect(metadata.getTable('orders_by_category')?.error).toContain(
			'Missing filter ID: `category_filter`'
		);

		// Failures are deliberately not cached, so every later pass re-runs this
		// branch. It must not keep notifying readers with an identical error.
		const setSpy = vi.spyOn(SvelteMap.prototype, 'set');
		for (let pass = 0; pass < 5; pass++) {
			await metadata.loadInlineQueryMetadata('orders_by_category');
		}
		const writes = setSpy.mock.calls.length;
		setSpy.mockRestore();

		expect(writes).toBe(0);
		expect(metadata.getTable('orders_by_category')?.error).toContain(
			'Missing filter ID: `category_filter`'
		);
	});
});
