import { describe, expect, it } from 'vitest';
import Markdoc from '@markdoc/markdoc';
import {
	extractDataReferences,
	extractInlineQueryDefinitions,
	extractSqlTableReferences,
	extractPartialReferences,
	resolveReference,
	resolveAllReferences,
	type ResolutionContext
} from './index';

const tokenizer = new Markdoc.Tokenizer({ allowComments: true, allowIndentation: true });

function parse(md: string) {
	return Markdoc.parse(tokenizer.tokenize(md));
}

function ctx(overrides: Partial<ResolutionContext> = {}): ResolutionContext {
	return {
		inlineQueries: new Map(),
		sqlFiles: new Map(),
		sourceNames: new Set(),
		modelNames: new Set(),
		...overrides
	};
}

describe('Full lineage pipeline', () => {
	describe('Component → direct table reference', () => {
		it('resolves data="orders" to a source', () => {
			const ast = parse('{% big_value data="orders" value="count(*)" /%}');
			const refs = extractDataReferences(ast);
			expect(refs).toHaveLength(1);
			expect(refs[0].tableName).toBe('orders');
			expect(refs[0].line).toBe(1);

			const resolution = resolveReference('orders', ctx({ sourceNames: new Set(['orders']) }));
			expect(resolution.status).toBe('resolved');
			expect(resolution.type).toBe('source');
			expect(resolution.chain).toEqual(['orders']);
		});
	});

	describe('Component → inline query → table', () => {
		it('resolves data="my_query" through inline query to source', () => {
			const md = `\`\`\`sql my_query
SELECT * FROM orders WHERE status = 'active'
\`\`\`

{% big_value data="my_query" value="count(*)" /%}`;

			const ast = parse(md);
			const dataRefs = extractDataReferences(ast);
			const inlineQueries = extractInlineQueryDefinitions(ast);

			expect(dataRefs).toHaveLength(1);
			expect(dataRefs[0].tableName).toBe('my_query');
			expect(inlineQueries).toHaveLength(1);
			expect(inlineQueries[0].name).toBe('my_query');

			// Resolve through inline query
			const context = ctx({
				inlineQueries: new Map([['my_query', "SELECT * FROM orders WHERE status = 'active'"]]),
				sourceNames: new Set(['orders'])
			});

			const resolution = resolveReference('my_query', context);
			expect(resolution.status).toBe('resolved');
			expect(resolution.type).toBe('source');
			expect(resolution.chain).toEqual(['my_query', 'orders']);
		});

		it('extracts table references from inline query SQL', () => {
			const sql = "SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id";
			const tableRefs = extractSqlTableReferences(sql);
			expect(tableRefs.map((r) => r.name)).toEqual(['orders', 'customers']);
		});
	});

	describe('Component → .sql file → table', () => {
		it('resolves data="queries/revenue" through sql file to source', () => {
			const context = ctx({
				sqlFiles: new Map([['queries/revenue', 'SELECT * FROM sales GROUP BY month']]),
				sourceNames: new Set(['sales'])
			});

			const resolution = resolveReference('queries/revenue', context);
			expect(resolution.status).toBe('resolved');
			expect(resolution.type).toBe('source');
			expect(resolution.chain).toEqual(['queries/revenue', 'sales']);
		});
	});

	describe('Component → inline query → .sql file → table', () => {
		it('resolves through multiple hops', () => {
			const context = ctx({
				inlineQueries: new Map([['top_query', 'SELECT * FROM {{base_query}}']]),
				sqlFiles: new Map([['base_query', 'SELECT * FROM raw_orders']]),
				sourceNames: new Set(['raw_orders'])
			});

			const resolution = resolveReference('top_query', context);
			expect(resolution.status).toBe('resolved');
			expect(resolution.type).toBe('source');
			expect(resolution.chain).toEqual(['top_query', 'base_query', 'raw_orders']);
		});
	});

	describe('Model → table references', () => {
		it('extracts table references from model SQL', () => {
			const modelSql = `
				WITH monthly AS (
					SELECT date_trunc('month', date) as month, sum(total) as revenue
					FROM orders
					GROUP BY 1
				)
				SELECT * FROM monthly JOIN targets ON monthly.month = targets.month
			`;
			const refs = extractSqlTableReferences(modelSql);
			const names = refs.map((r) => r.name);
			expect(names).toContain('orders');
			expect(names).toContain('targets');
			expect(names).not.toContain('monthly'); // CTE alias excluded
		});

		it('resolves model table references to sources', () => {
			const modelSql = 'SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id';
			const refs = extractSqlTableReferences(modelSql);

			const context = ctx({ sourceNames: new Set(['orders', 'customers']) });

			for (const ref of refs) {
				const resolution = resolveReference(ref.name, context);
				expect(resolution.status).toBe('resolved');
				expect(resolution.type).toBe('source');
			}
		});
	});

	describe('SQL file → table references', () => {
		it('extracts table references from .sql file content', () => {
			const sqlContent = `
				SELECT o.id, o.total, c.name
				FROM orders o
				JOIN customers c ON o.customer_id = c.id
				WHERE o.status = 'complete'
			`;
			const refs = extractSqlTableReferences(sqlContent);
			expect(refs.map((r) => r.name)).toEqual(['orders', 'customers']);
		});
	});

	describe('Template references in SQL', () => {
		it('extracts {{template}} references from inline query SQL', () => {
			const sql = 'SELECT * FROM {{base_data}} WHERE category = {{selected_cat}}';
			const refs = extractSqlTableReferences(sql);
			const templates = refs.filter((r) => r.isTemplate);
			expect(templates.map((r) => r.name)).toContain('base_data');
			expect(templates.map((r) => r.name)).toContain('selected_cat');
		});

		it('resolves template refs through the chain', () => {
			const context = ctx({
				inlineQueries: new Map([
					['filtered', 'SELECT * FROM {{raw_data}}'],
					['raw_data', 'SELECT * FROM warehouse_table']
				]),
				sourceNames: new Set(['warehouse_table'])
			});

			const resolution = resolveReference('filtered', context);
			expect(resolution.status).toBe('resolved');
			expect(resolution.chain).toEqual(['filtered', 'raw_data', 'warehouse_table']);
		});
	});

	describe('CTE handling in SQL', () => {
		it('excludes CTE aliases from table references', () => {
			const sql = `
				WITH
					stg_orders AS (SELECT * FROM raw_orders),
					stg_customers AS (SELECT * FROM raw_customers)
				SELECT * FROM stg_orders JOIN stg_customers ON stg_orders.cid = stg_customers.id
			`;
			const refs = extractSqlTableReferences(sql);
			const names = refs.map((r) => r.name);
			expect(names).toContain('raw_orders');
			expect(names).toContain('raw_customers');
			expect(names).not.toContain('stg_orders');
			expect(names).not.toContain('stg_customers');
		});
	});

	describe('Dynamic/variable references', () => {
		it('marks data={{variable}} as dynamic', () => {
			const ast = parse('{% bar_chart data="{{my_dropdown}}" x="date" y="total" /%}');
			const refs = extractDataReferences(ast);
			expect(refs[0].isDynamic).toBe(true);

			const resolutions = resolveAllReferences(['{{my_dropdown}}'], ctx());
			expect(resolutions[0].status).toBe('dynamic');
		});
	});

	describe('Unresolved references', () => {
		it('marks references to nonexistent tables as unresolved', () => {
			const resolution = resolveReference('nonexistent_table', ctx({
				sourceNames: new Set(['orders'])
			}));
			expect(resolution.status).toBe('unresolved');
			expect(resolution.type).toBe('unknown');
		});
	});

	describe('Partial references', () => {
		it('extracts partial file references', () => {
			const ast = parse('{% partial file="shared/filters.md" /%}');
			const refs = extractPartialReferences(ast);
			expect(refs).toHaveLength(1);
			expect(refs[0].file).toBe('shared/filters.md');
		});
	});

	describe('Circular reference protection', () => {
		it('does not infinite loop on circular inline query references', () => {
			const context = ctx({
				inlineQueries: new Map([
					['a', 'SELECT * FROM {{b}}'],
					['b', 'SELECT * FROM {{a}}']
				])
			});
			const resolution = resolveReference('a', context);
			// Should complete without hanging
			expect(resolution.status).toBe('resolved');
			expect(resolution.type).toBe('inline_query');
		});
	});

	describe('Mixed page with multiple reference types', () => {
		it('extracts all reference types from a complex page', () => {
			const md = `---
title: Dashboard
---

\`\`\`sql monthly_orders
SELECT date_trunc('month', date) as month, count(*) as orders
FROM orders
GROUP BY 1
\`\`\`

{% big_value data="orders" value="count(*)" title="Total Orders" /%}

{% line_chart data="monthly_orders" x="month" y="orders" /%}

{% partial file="shared/footer.md" /%}
`;
			const ast = parse(md);

			const dataRefs = extractDataReferences(ast);
			expect(dataRefs).toHaveLength(2);
			expect(dataRefs.map((r) => r.tableName)).toEqual(['orders', 'monthly_orders']);

			const inlineQueries = extractInlineQueryDefinitions(ast);
			expect(inlineQueries).toHaveLength(1);
			expect(inlineQueries[0].name).toBe('monthly_orders');

			const partials = extractPartialReferences(ast);
			expect(partials).toHaveLength(1);
			expect(partials[0].file).toBe('shared/footer.md');

			// Resolve all data refs
			const context = ctx({
				inlineQueries: new Map([
					['monthly_orders', "SELECT date_trunc('month', date) as month, count(*) as orders FROM orders GROUP BY 1"]
				]),
				sourceNames: new Set(['orders'])
			});

			const resolutions = resolveAllReferences(
				dataRefs.map((r) => r.tableName),
				context
			);

			// "orders" resolves directly
			expect(resolutions[0].status).toBe('resolved');
			expect(resolutions[0].chain).toEqual(['orders']);

			// "monthly_orders" resolves through inline query to orders
			expect(resolutions[1].status).toBe('resolved');
			expect(resolutions[1].chain).toEqual(['monthly_orders', 'orders']);

			// Inline query SQL references orders
			const inlineQueryTableRefs = extractSqlTableReferences(inlineQueries[0].sql);
			expect(inlineQueryTableRefs.map((r) => r.name)).toContain('orders');
		});
	});

	describe('Model downstream lineage', () => {
		it('traces table → model → page component', () => {
			// Model references a source table
			const modelSql = 'SELECT * FROM orders GROUP BY month';
			const modelTableRefs = extractSqlTableReferences(modelSql);
			expect(modelTableRefs.map((r) => r.name)).toContain('orders');

			// Page references the model
			const ast = parse('{% data_table data="monthly_summary" /%}');
			const dataRefs = extractDataReferences(ast);
			expect(dataRefs[0].tableName).toBe('monthly_summary');

			// Resolution: monthly_summary is a model that references orders
			const context = ctx({
				modelNames: new Set(['monthly_summary']),
				sourceNames: new Set(['orders'])
			});

			const resolution = resolveReference('monthly_summary', context);
			expect(resolution.status).toBe('resolved');
			expect(resolution.type).toBe('model');

			// The model's SQL references orders (separate lineage entry)
			const ordersResolution = resolveReference('orders', context);
			expect(ordersResolution.status).toBe('resolved');
			expect(ordersResolution.type).toBe('source');
		});
	});
});
