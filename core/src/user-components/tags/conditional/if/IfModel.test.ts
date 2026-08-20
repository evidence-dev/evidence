import { describe, expect, it, vi } from 'vitest';
import { ClickHouseDialect } from '../../../../sql-dialect';
import { generateSQLQuery } from '../../../common/sql-options';
import { IfModel } from './IfModel.svelte';
import type { InlineQueries } from '../../../common/inline-queries';

describe('IfModel', () => {
	it('quotes a variable-backed table identifier', () => {
		const model = new IfModel({
			attributes: {
				data: String.raw`demo.orders\" UNION ALL SELECT * FROM secrets --`,
				filters: [],
				condition: 'has_rows'
			},
			validationErrors: [],
			parent: null,
			deps: {
				connection: {
					id: 'default',
					type: 'managed',
					dialect: new ClickHouseDialect(),
					query: vi.fn()
				},
				filterContexts: undefined,
				inlineQueries: undefined,
				projectSettings: undefined,
				defaultRefreshInterval: undefined
			}
		});

		const { sql } = generateSQLQuery(
			model.queryConfig!,
			undefined,
			undefined,
			undefined,
			'sunday',
			new ClickHouseDialect()
		);

		expect(sql).toContain(String.raw`FROM demo."orders\\"" UNION ALL SELECT * FROM secrets --"`);
	});

	// Resolving the inline query here as well as in generateSQLQuery left the second
	// pass quoting an already-expanded subquery, so the If never loaded.
	it('expands an inline query into the FROM clause exactly once', () => {
		const inlineQueries = {
			getInterpolated: (name: string) =>
				name.trim() === 'my_query' ? '(SELECT category FROM orders)' : undefined
		} as unknown as InlineQueries;

		const model = new IfModel({
			attributes: { data: 'my_query', filters: [], condition: 'has_rows' },
			validationErrors: [],
			parent: null,
			deps: {
				connection: {
					id: 'default',
					type: 'managed',
					dialect: new ClickHouseDialect(),
					query: vi.fn()
				},
				filterContexts: undefined,
				inlineQueries,
				projectSettings: undefined,
				defaultRefreshInterval: undefined
			}
		});

		const { sql } = generateSQLQuery(
			model.queryConfig!,
			undefined,
			inlineQueries,
			undefined,
			'sunday',
			new ClickHouseDialect()
		);

		expect(sql).toContain('FROM (SELECT category FROM orders)');
		expect(sql).not.toContain('"(SELECT');
	});
});
