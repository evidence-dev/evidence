import { describe, expect, it } from 'vitest';
import Markdoc from '@markdoc/markdoc';
import {
	extractDataReferences,
	extractInlineQueryDefinitions,
	extractPartialReferences,
	extractSqlTableReferences
} from './extract';

const tokenizer = new Markdoc.Tokenizer({ allowComments: true, allowIndentation: true });

function parseMarkdown(md: string) {
	return Markdoc.parse(tokenizer.tokenize(md));
}

describe('extractDataReferences', () => {
	it('extracts data attribute from a tag', () => {
		const ast = parseMarkdown('{% big_value data="orders" value="sum(total)" /%}');
		const refs = extractDataReferences(ast);
		expect(refs).toHaveLength(1);
		expect(refs[0].tableName).toBe('orders');
		expect(refs[0].component).toBe('big_value');
		expect(refs[0].isDynamic).toBe(false);
		expect(refs[0].attributes).toHaveProperty('value', 'sum(total)');
	});

	it('extracts multiple data references', () => {
		const ast = parseMarkdown(`
{% big_value data="orders" value="count(*)" /%}
{% bar_chart data="customers" x="name" y="revenue" /%}
		`);
		const refs = extractDataReferences(ast);
		expect(refs).toHaveLength(2);
		expect(refs.map((r) => r.tableName)).toEqual(['orders', 'customers']);
	});

	it('marks dynamic references with variables', () => {
		const ast = parseMarkdown('{% bar_chart data="{{my_dropdown}}" x="date" y="total" /%}');
		const refs = extractDataReferences(ast);
		expect(refs).toHaveLength(1);
		expect(refs[0].isDynamic).toBe(true);
		expect(refs[0].tableName).toBe('{{my_dropdown}}');
	});

	it('skips tags without data attribute', () => {
		const ast = parseMarkdown('{% alert title="Warning" %}Something{% /alert %}');
		const refs = extractDataReferences(ast);
		expect(refs).toHaveLength(0);
	});

	it('captures key display attributes', () => {
		const ast = parseMarkdown(
			'{% line_chart data="sales" x="date" y="revenue" title="Revenue Over Time" /%}'
		);
		const refs = extractDataReferences(ast);
		expect(refs[0].attributes).toEqual({
			title: 'Revenue Over Time',
			x: 'date',
			y: 'revenue'
		});
	});
});

describe('extractInlineQueryDefinitions', () => {
	it('extracts named SQL fences', () => {
		const ast = parseMarkdown(
			'```sql monthly_orders\nSELECT * FROM orders GROUP BY month\n```'
		);
		const defs = extractInlineQueryDefinitions(ast);
		expect(defs).toHaveLength(1);
		expect(defs[0].name).toBe('monthly_orders');
		expect(defs[0].sql).toContain('SELECT * FROM orders');
	});

	it('skips unnamed SQL fences', () => {
		const ast = parseMarkdown('```sql\nSELECT 1\n```');
		const defs = extractInlineQueryDefinitions(ast);
		expect(defs).toHaveLength(0);
	});

	it('skips non-SQL fences', () => {
		const ast = parseMarkdown('```javascript\nconsole.log("hi")\n```');
		const defs = extractInlineQueryDefinitions(ast);
		expect(defs).toHaveLength(0);
	});

	it('extracts multiple inline queries', () => {
		const ast = parseMarkdown(
			'```sql q1\nSELECT 1\n```\n\n```sql q2\nSELECT 2\n```'
		);
		const defs = extractInlineQueryDefinitions(ast);
		expect(defs).toHaveLength(2);
		expect(defs.map((d) => d.name)).toEqual(['q1', 'q2']);
	});
});

describe('extractPartialReferences', () => {
	it('extracts partial file references', () => {
		const ast = parseMarkdown('{% partial file="shared/header.md" /%}');
		const refs = extractPartialReferences(ast);
		expect(refs).toHaveLength(1);
		expect(refs[0].file).toBe('shared/header.md');
	});

	it('extracts multiple partial references', () => {
		const ast = parseMarkdown(
			'{% partial file="header.md" /%}\n\nSome content\n\n{% partial file="footer.md" /%}'
		);
		const refs = extractPartialReferences(ast);
		expect(refs).toHaveLength(2);
		expect(refs.map((r) => r.file)).toEqual(['header.md', 'footer.md']);
	});

	it('returns empty for pages without partials', () => {
		const ast = parseMarkdown('# Hello\n\nSome content');
		const refs = extractPartialReferences(ast);
		expect(refs).toHaveLength(0);
	});
});

describe('extractSqlTableReferences', () => {
	it('extracts FROM table reference', () => {
		const refs = extractSqlTableReferences('SELECT * FROM orders');
		expect(refs).toHaveLength(1);
		expect(refs[0]).toEqual({ name: 'orders', isTemplate: false });
	});

	it('extracts JOIN table reference', () => {
		const refs = extractSqlTableReferences(
			'SELECT * FROM orders JOIN customers ON orders.customer_id = customers.id'
		);
		expect(refs).toHaveLength(2);
		expect(refs.map((r) => r.name)).toEqual(['orders', 'customers']);
	});

	it('extracts template references', () => {
		const refs = extractSqlTableReferences('SELECT * FROM {{my_query}} WHERE x > 1');
		expect(refs).toHaveLength(1);
		expect(refs[0]).toEqual({ name: 'my_query', isTemplate: true });
	});

	it('extracts a path template reference, keeping the "from root" leading slash', () => {
		const refs = extractSqlTableReferences('SELECT * FROM {{/queries/orders}}');
		expect(refs).toEqual([{ name: '/queries/orders', isTemplate: true }]);
	});

	it('extracts supported path template reference forms', () => {
		const references = [
			'{{ /queries/orders }}',
			'{{ "/queries/orders" }}',
			"{{ '/queries/orders' }}",
			'{{/queries/monthly-orders}}',
			'{{/queries/q4-reports/orders}}',
			'{{ /queries/orders | orders }}'
		].map((reference) => extractSqlTableReferences(`SELECT * FROM ${reference}`));

		expect(references).toEqual([
			[{ name: '/queries/orders', isTemplate: true }],
			[{ name: '/queries/orders', isTemplate: true }],
			[{ name: '/queries/orders', isTemplate: true }],
			[{ name: '/queries/monthly-orders', isTemplate: true }],
			[{ name: '/queries/q4-reports/orders', isTemplate: true }],
			[{ name: '/queries/orders', isTemplate: true }]
		]);
	});

	// The interpolator splits on the last dot and resolves the head as a filter,
	// so `{{/queries/q4.totals}}` errors "Missing filter ID `/queries/q4`" and
	// never reads the file. Extracting it would expose an unreachable query.
	it('ignores a dotted path, which the interpolator never resolves to a file', () => {
		const refs = extractSqlTableReferences('SELECT * FROM {{/queries/q4.totals}}');
		expect(refs.filter((r) => r.isTemplate)).toEqual([]);
	});

	// A quote on one side only is not a quoted reference; treating it as one
	// would invent a dependency the renderer never resolves.
	it('ignores a mismatched quote pair', () => {
		const refs = extractSqlTableReferences(`SELECT * FROM {{ "/queries/orders' }}`);
		expect(refs.filter((r) => r.isTemplate)).toEqual([]);
	});

	it('extracts a nested path template reference without a leading slash', () => {
		const refs = extractSqlTableReferences('SELECT * FROM {{reports/q4/totals}}');
		expect(refs).toEqual([{ name: 'reports/q4/totals', isTemplate: true }]);
	});

	// Filters and frontmatter variables are interpolated too, but they are not
	// table references and must not become lineage dependencies.
	it('ignores filter and frontmatter-variable interpolations', () => {
		const refs = extractSqlTableReferences(
			'SELECT * FROM t WHERE a = {{my_filter.value}} AND b = {{ $my_var }} AND c = {{ f.value }}'
		);
		expect(refs.filter((r) => r.isTemplate)).toEqual([]);
	});

	it('excludes CTE aliases', () => {
		const refs = extractSqlTableReferences(`
			WITH staging AS (SELECT * FROM raw_orders)
			SELECT * FROM staging
		`);
		expect(refs).toHaveLength(1);
		expect(refs[0].name).toBe('raw_orders');
	});

	it('excludes multiple CTE aliases', () => {
		const refs = extractSqlTableReferences(`
			WITH
				cte1 AS (SELECT * FROM table_a),
				cte2 AS (SELECT * FROM table_b)
			SELECT * FROM cte1 JOIN cte2 ON cte1.id = cte2.id
		`);
		expect(refs).toHaveLength(2);
		expect(refs.map((r) => r.name)).toEqual(['table_a', 'table_b']);
	});

	it('handles schema-qualified table names', () => {
		const refs = extractSqlTableReferences('SELECT * FROM demo.daily_orders');
		expect(refs).toHaveLength(1);
		expect(refs[0].name).toBe('demo.daily_orders');
	});

	it('handles mixed templates and table refs', () => {
		const refs = extractSqlTableReferences(
			'SELECT * FROM {{inline_query}} JOIN dim_customers ON id = customer_id'
		);
		expect(refs).toHaveLength(2);
		expect(refs[0]).toEqual({ name: 'inline_query', isTemplate: true });
		expect(refs[1]).toEqual({ name: 'dim_customers', isTemplate: false });
	});

	it('deduplicates references', () => {
		const refs = extractSqlTableReferences(
			'SELECT * FROM orders UNION ALL SELECT * FROM orders'
		);
		expect(refs).toHaveLength(1);
	});

	it('skips subquery SELECT keyword', () => {
		const refs = extractSqlTableReferences('SELECT * FROM (SELECT * FROM orders) sub');
		const names = refs.map((r) => r.name);
		expect(names).not.toContain('select');
		expect(names).not.toContain('SELECT');
		expect(names).toContain('orders');
	});
});
