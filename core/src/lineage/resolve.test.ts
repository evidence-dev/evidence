import { describe, expect, it } from 'vitest';
import { resolveReference, resolveAllReferences, type ResolutionContext } from './resolve';

function ctx(overrides: Partial<ResolutionContext> = {}): ResolutionContext {
	return {
		inlineQueries: new Map(),
		sqlFiles: new Map(),
		sourceNames: new Set(),
		modelNames: new Set(),
		...overrides
	};
}

describe('resolveReference', () => {
	it('resolves a direct source name', () => {
		const result = resolveReference('orders', ctx({ sourceNames: new Set(['orders']) }));
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toEqual(['orders']);
	});

	it('resolves a direct model name', () => {
		const result = resolveReference('monthly_summary', ctx({ modelNames: new Set(['monthly_summary']) }));
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('model');
	});

	it('resolves through an inline query to a source', () => {
		const result = resolveReference(
			'my_query',
			ctx({
				inlineQueries: new Map([['my_query', 'SELECT * FROM orders']]),
				sourceNames: new Set(['orders'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toEqual(['my_query', 'orders']);
	});

	it('resolves through a .sql file to a source', () => {
		const result = resolveReference(
			'queries/revenue',
			ctx({
				sqlFiles: new Map([['queries/revenue', 'SELECT * FROM sales']]),
				sourceNames: new Set(['sales'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toEqual(['queries/revenue', 'sales']);
	});

	it('resolves a from-root reference against the bare stored path', () => {
		const result = resolveReference(
			'/queries/revenue',
			ctx({
				sqlFiles: new Map([['queries/revenue', 'SELECT * FROM sales']]),
				sourceNames: new Set(['sales'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toEqual(['queries/revenue', 'sales']);
	});

	it('resolves a from-root template reference reached through a sql file', () => {
		const result = resolveReference(
			'queries/top',
			ctx({
				sqlFiles: new Map([
					['queries/top', 'SELECT * FROM {{/queries/base}}'],
					['queries/base', 'SELECT * FROM raw_orders']
				]),
				sourceNames: new Set(['raw_orders'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.chain).toEqual(['queries/top', 'queries/base', 'raw_orders']);
	});

	it('resolves through inline query → template → source', () => {
		const result = resolveReference(
			'top_query',
			ctx({
				inlineQueries: new Map([
					['top_query', 'SELECT * FROM {{base_query}}'],
					['base_query', 'SELECT * FROM raw_orders']
				]),
				sourceNames: new Set(['raw_orders'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toEqual(['top_query', 'base_query', 'raw_orders']);
	});

	it('resolves through inline query → .sql file → source', () => {
		const result = resolveReference(
			'my_query',
			ctx({
				inlineQueries: new Map([['my_query', 'SELECT * FROM {{sql_file}}']]),
				sqlFiles: new Map([['sql_file', 'SELECT * FROM warehouse_table']]),
				sourceNames: new Set(['warehouse_table'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toEqual(['my_query', 'sql_file', 'warehouse_table']);
	});

	it('returns unresolved when name matches nothing', () => {
		const result = resolveReference('nonexistent', ctx());
		expect(result.status).toBe('unresolved');
		expect(result.type).toBe('unknown');
	});

	it('handles circular references without infinite loop', () => {
		const result = resolveReference(
			'a',
			ctx({
				inlineQueries: new Map([
					['a', 'SELECT * FROM {{b}}'],
					['b', 'SELECT * FROM {{a}}']
				])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('inline_query');
	});

	it('does not contaminate chain with failed dependency walks', () => {
		const result = resolveReference(
			'my_query',
			ctx({
				inlineQueries: new Map([
					['my_query', 'SELECT * FROM unknown_table JOIN real_source ON 1=1']
				]),
				sourceNames: new Set(['real_source'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.chain).toEqual(['my_query', 'real_source']);
		expect(result.chain).not.toContain('unknown_table');
	});

	it('resolves inline query that references a CTE (not a real table)', () => {
		const result = resolveReference(
			'my_query',
			ctx({
				inlineQueries: new Map([
					['my_query', 'WITH staging AS (SELECT * FROM orders) SELECT * FROM staging']
				]),
				sourceNames: new Set(['orders'])
			})
		);
		expect(result.status).toBe('resolved');
		expect(result.type).toBe('source');
		expect(result.chain).toContain('orders');
	});
});

describe('resolveAllReferences', () => {
	it('resolves a mix of types', () => {
		const results = resolveAllReferences(
			['orders', '{{my_var}}', 'nonexistent'],
			ctx({ sourceNames: new Set(['orders']) })
		);
		expect(results).toHaveLength(3);
		expect(results[0].status).toBe('resolved');
		expect(results[1].status).toBe('dynamic');
		expect(results[2].status).toBe('unresolved');
	});

	it('correctly identifies dynamic references', () => {
		const results = resolveAllReferences(
			['{{dropdown.selected}}'],
			ctx()
		);
		expect(results[0].status).toBe('dynamic');
		expect(results[0].type).toBe('unknown');
	});
});
