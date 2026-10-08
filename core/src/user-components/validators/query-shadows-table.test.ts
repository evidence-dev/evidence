import { describe, expect, it } from 'vitest';
import { process } from '../Renderer/MarkdocProcessor/process-markdoc';
import { InlineQueries } from '../common/inline-queries';
import { TableMetadata } from '../../metadata/TableMetadata.svelte';
import type { IColumnMetadata } from '../../metadata/metadata';
import { getTableFromContext, type ValidationContext } from './types';

const table = (name: string, columns: string[]) =>
	new TableMetadata({
		name,
		columns: Object.fromEntries(
			columns.map((c): [string, IColumnMetadata] => [
				c,
				{ name: c, type: 'Int64', jsType: 'number' }
			])
		)
	});

// A loaded warehouse catalog with the same lookup semantics as Metadata.getTable.
const catalog = (tables: TableMetadata[]) =>
	({
		loading: false,
		loadFailed: false,
		tables,
		getTable: (name: string) => tables.find((t) => t.name === name)
	}) as unknown as ValidationContext['metadata'];

// Inline query metadata after loadAll() has DESCRIBEd the page's queries.
const describedQueries = (tables: TableMetadata[]) =>
	({
		initialized: true,
		tables,
		getTable: (name: string) => tables.find((t) => t.name === name)
	}) as unknown as ValidationContext['inlineQueryMetadata'];

const ordersTable = table('orders', ['order_id', 'total']);
const ordersQuery = table('orders', ['month', 'revenue']);

const CHART = `{% bar_chart data="orders" x="month" y="sum(revenue)" title="Revenue" /%}`;

const PAGE = `\`\`\`sql orders
select toStartOfMonth(order_date) as month, sum(total) as revenue from orders group by 1
\`\`\`

${CHART}
`;

const context = (opts: { metadata: TableMetadata[]; queries?: Record<string, string> }) => {
	const inlineQueries = new InlineQueries({ filterContexts: [] });
	for (const [name, sql] of Object.entries(opts.queries ?? {})) inlineQueries.set(name, sql);
	return {
		metadata: catalog(opts.metadata),
		filters: undefined,
		inlineQueries,
		inlineQueryMetadata: describedQueries(opts.queries?.orders ? [ordersQuery] : []),
		trees: undefined
	} satisfies ValidationContext;
};

const blockingErrors = (ctx: ValidationContext, page = PAGE) =>
	process(page, ctx)
		.validationErrors.filter((e) => e.error.level === 'error')
		.map((e) => e.error.message);

describe('a page query named after a warehouse table', () => {
	it('validates the chart against the query, not the table', () => {
		const ctx = context({
			metadata: [ordersTable],
			queries: { orders: 'select 1 as month, 2 as revenue' }
		});
		expect(blockingErrors(ctx)).toEqual([]);
	});

	it('also wins over a schema-qualified table matched by suffix', () => {
		const ctx = context({
			metadata: [table('public.orders', ['order_id', 'total'])],
			queries: { orders: 'select 1 as month, 2 as revenue' }
		});
		expect(blockingErrors(ctx)).toEqual([]);
	});

	it('skips column checks until the query is described, rather than using the table', () => {
		const ctx = {
			...context({ metadata: [ordersTable], queries: { orders: 'select 1' } }),
			inlineQueryMetadata: describedQueries([])
		};
		expect(getTableFromContext('orders', ctx)).toBeUndefined();
		expect(blockingErrors(ctx)).toEqual([]);
	});

	it('still checks columns against the table when no query has that name', () => {
		const ctx = context({ metadata: [ordersTable] });
		expect(getTableFromContext('orders', ctx)).toBe(ordersTable);
		expect(blockingErrors(ctx, CHART)).toEqual([
			'y: Column "revenue" does not exist in table "orders"'
		]);
	});

	it('resolves a SQL file the same way as an inline query', () => {
		const inlineQueries = new InlineQueries({ filterContexts: [] }, undefined, {
			orders: 'select 1 as month'
		});
		const ctx = {
			...context({ metadata: [ordersTable] }),
			inlineQueries,
			inlineQueryMetadata: describedQueries([ordersQuery])
		};
		expect(getTableFromContext('orders', ctx)).toBe(ordersQuery);
	});
});
