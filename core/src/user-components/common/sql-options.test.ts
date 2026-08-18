import { describe, it, expect } from 'vitest';
import {
	generateSQLQuery,
	normalizeWhitespace,
	processFilterIds,
	generateGroupingSets,
	generateSubtotalHelperColumns,
	quoteUntrustedIdentifier,
	resolveTableExpressionName
} from './sql-options';
import { processColumnExpression } from './sql-expression-utils';
import type { ProcessedColumnExpression } from './sql-expression-utils';
import type { Filters } from '../../Filters.svelte';
import { InlineQueries } from './inline-queries';
import {
	BigQueryDialect,
	ClickHouseDialect,
	PostgresDialect,
	SnowflakeDialect,
	type SqlDialect
} from '../../sql-dialect';

const dialect = new ClickHouseDialect();

describe('resolveTableExpressionName', () => {
	it('quotes each part of a direct table identifier', () => {
		expect(
			resolveTableExpressionName(
				'demo.orders" UNION ALL SELECT * FROM secrets --',
				undefined,
				dialect
			)
		).toBe('demo."orders"" UNION ALL SELECT * FROM secrets --"');
	});

	it('preserves an inline query expression', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('orders', 'SELECT * FROM demo.daily_orders');

		expect(resolveTableExpressionName('orders', inlineQueries, dialect)).toBe(
			'(SELECT * FROM demo.daily_orders) "__ev_inline_orders"'
		);
	});

	it('preserves lowercase simple identifiers on Snowflake', () => {
		const snowflake = new SnowflakeDialect();

		expect(resolveTableExpressionName('demo.daily_orders', undefined, snowflake)).toBe(
			'demo.daily_orders'
		);
		expect(quoteUntrustedIdentifier('category', snowflake)).toBe('category');
	});

	it('preserves pre-quoted identifier paths', () => {
		expect(resolveTableExpressionName('"my db".orders', undefined, dialect)).toBe(
			'"my db".orders'
		);
		expect(
			resolveTableExpressionName(
				'`project.dataset.table`',
				undefined,
				new BigQueryDialect()
			)
		).toBe('`project.dataset.table`');
	});

	// A value shaped like an already-quoted name used to be trusted on every dialect
	// because `\` was read as an escape. On Postgres it is not, so the identifier ended
	// at that quote and the tail ran.
	it('does not accept a backslash-escaped quote as author quoting on an ANSI dialect', () => {
		const payload = String.raw`"orders\" UNION ALL SELECT name FROM secrets --"`;

		expect(resolveTableExpressionName(payload, undefined, new PostgresDialect())).toBe(
			String.raw`"""orders\"" UNION ALL SELECT name FROM secrets --"""`
		);
		// ClickHouse does read `\` as an escape, so the same value is already one identifier.
		expect(resolveTableExpressionName(payload, undefined, dialect)).toBe(payload);
	});

	// Doubling backslashes everywhere renamed any real table containing one.
	it('leaves a backslash in a real name alone where it is not an escape', () => {
		expect(quoteUntrustedIdentifier(String.raw`my\table`, new PostgresDialect())).toBe(
			String.raw`"my\table"`
		);
		expect(quoteUntrustedIdentifier(String.raw`my\table`, dialect)).toBe(String.raw`"my\\table"`);
	});

	// A padded name resolved fine while it went into the FROM bare, so quoting it
	// verbatim would break variables carrying a stray space.
	it('ignores whitespace around each part of the name', () => {
		expect(resolveTableExpressionName(' demo.daily_orders ', undefined, dialect)).toBe(
			'demo.daily_orders'
		);
		expect(resolveTableExpressionName('demo . daily_orders', undefined, dialect)).toBe(
			'demo.daily_orders'
		);
		expect(resolveTableExpressionName(' "my db".orders ', undefined, dialect)).toBe(
			'"my db".orders'
		);
		// A space inside the name is part of it.
		expect(quoteUntrustedIdentifier('my table', dialect)).toBe('"my table"');
	});
});

// Every data-driven component funnels attrs.data into generateSQLQuery, so the
// quoting has to happen there — guarding individual call sites left ~38 unguarded.
describe('generateSQLQuery table expression', () => {
	it('quotes an untrusted table identifier from any component', () => {
		const { sql } = generateSQLQuery(
			{
				tableExpressionName: 'demo.orders" UNION ALL SELECT * FROM secrets --',
				columns: [processColumnExpression({ value: 'total' }, dialect)],
				filterIds: []
			},
			undefined,
			undefined,
			undefined,
			'sunday',
			dialect
		);

		expect(sql).toContain('FROM demo."orders"" UNION ALL SELECT * FROM secrets --"');
		expect(sql).not.toContain('FROM demo.orders" UNION');
	});

	it('leaves an inline query expression unquoted', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('orders', 'SELECT 1 AS total');

		const { sql } = generateSQLQuery(
			{
				tableExpressionName: 'orders',
				columns: [processColumnExpression({ value: 'total' }, dialect)],
				filterIds: []
			},
			undefined,
			inlineQueries,
			undefined,
			'sunday',
			dialect
		);

		expect(sql).toContain('FROM (SELECT 1 AS total) "__ev_inline_orders"');
	});
});

describe('normalizeWhitespace', () => {
	it('should collapse multiple spaces outside string literals', () => {
		const input = "SELECT *  FROM   table";
		const expected = "SELECT * FROM table";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should preserve multiple spaces inside single-quoted string literals', () => {
		const input = "WHERE name = 'hello  world'";
		const expected = "WHERE name = 'hello  world'";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should handle escaped quotes inside string literals', () => {
		const input = "WHERE name = 'it''s  a  test'";
		const expected = "WHERE name = 'it''s  a  test'";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should handle multiple string literals', () => {
		const input = "SELECT *  FROM t  WHERE a = 'one  two'  AND b = 'three  four'";
		const expected = "SELECT * FROM t WHERE a = 'one  two' AND b = 'three  four'";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should handle tabs in SQL', () => {
		const input = "SELECT\t\t*\tFROM\ttable";
		const expected = "SELECT * FROM table";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should preserve tabs inside string literals', () => {
		const input = "WHERE name = 'hello\t\tworld'";
		expect(normalizeWhitespace(input)).toBe(input);
	});

	it('should handle real-world organization name with double spaces', () => {
		const input = "WHERE organization_name  IN  ('ASEQ ( 000081-121 -  CCINTL - Conestoga College )')";
		const expected = "WHERE organization_name IN ('ASEQ ( 000081-121 -  CCINTL - Conestoga College )')";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should handle empty string', () => {
		expect(normalizeWhitespace('')).toBe('');
	});

	it('should handle string with no quotes', () => {
		const input = "SELECT  *   FROM   table  WHERE  a = 1";
		const expected = "SELECT * FROM table WHERE a = 1";
		expect(normalizeWhitespace(input)).toBe(expected);
	});

	it('should handle string that starts and ends with quotes', () => {
		const input = "'hello  world'";
		expect(normalizeWhitespace(input)).toBe("'hello  world'");
	});

	it('should handle adjacent string literals', () => {
		const input = "'one  two'  ||  'three  four'";
		const expected = "'one  two' || 'three  four'";
		expect(normalizeWhitespace(input)).toBe(expected);
	});
});

describe('generateSQLQuery', () => {
	it('should apply limit normally', () => {
		const config = {
			tableExpressionName: 'demo.order_details',
			columns: [
				processColumnExpression({ value: 'date' }, dialect),
				processColumnExpression({ value: 'sum(quantity)' }, dialect),
				processColumnExpression({ value: 'order_id' }, dialect)
			].filter((c) => c !== null),
			order: 'date, order_id',
			limit: 2000
		};

		const result = generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect);

		expect(result.sql).toContain('LIMIT 2000');
		expect(result.sql).not.toContain('WITH');
		expect(result.sql).not.toContain('CROSS JOIN');
	});

	it('should use direct table name when no inline queries context is provided', () => {
		const config = {
			tableExpressionName: 'orders',
			columns: [processColumnExpression({ value: 'category' }, dialect)].filter((c) => c !== null)
		};

		const result = generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect);

		expect(result.sql).toContain('FROM orders');
		expect(result.error).toBeUndefined();
	});

	it('should resolve inline query references when inlineQueries context is provided', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('my_query', 'SELECT * FROM demo.daily_orders');

		const config = {
			tableExpressionName: 'my_query',
			columns: [processColumnExpression({ value: 'category' }, dialect)].filter((c) => c !== null)
		};

		const result = generateSQLQuery(config, undefined, inlineQueries, undefined, 'sunday', dialect);

		expect(result.sql).toContain('FROM (SELECT * FROM demo.daily_orders) "__ev_inline_my_query"');
		expect(result.sql).not.toContain('FROM my_query');
		expect(result.error).toBeUndefined();
	});

	it('should fall back to raw table name when inline query name is not registered', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('other_query', 'SELECT 1');

		const config = {
			tableExpressionName: 'orders',
			columns: [processColumnExpression({ value: 'category' }, dialect)].filter((c) => c !== null)
		};

		const result = generateSQLQuery(config, undefined, inlineQueries, undefined, 'sunday', dialect);

		expect(result.sql).toContain('FROM orders');
		expect(result.error).toBeUndefined();
	});

	it('preserves a pre-resolved table expression when the component opts in', () => {
		expect(resolveTableExpressionName('(SELECT version())', undefined, dialect)).toBe(
			'"(SELECT version())"'
		);
		const config = {
			tableExpressionName: '(SELECT *, upper(category) AS c FROM demo.daily_orders)',
			tableExpressionIsSql: true,
			columns: [processColumnExpression({ value: 'category' }, dialect)].filter(
				(c) => c !== null
			)
		};

		const result = generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect);

		expect(result.sql).toContain(
			'FROM (SELECT *, upper(category) AS c FROM demo.daily_orders)'
		);
	});

	// Without the opt-in, a `data` value that resolves to a subquery is just an
	// untrusted string — a URL-bound variable could otherwise pick the FROM table.
	it('quotes a subquery-shaped table expression when the component has not opted in', () => {
		const config = {
			tableExpressionName: "(SELECT 'HACKED' AS category FROM secrets)",
			columns: [processColumnExpression({ value: 'category' }, dialect)].filter((c) => c !== null)
		};

		const result = generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect);

		expect(result.sql).toContain(`FROM "(SELECT 'HACKED' AS category FROM secrets)"`);
		expect(result.sql).not.toContain('FROM (SELECT');
	});

	it('should strip trailing semicolons from inline query SQL', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('my_query', 'SELECT * FROM orders;');

		const config = {
			tableExpressionName: 'my_query',
			columns: [processColumnExpression({ value: 'id' }, dialect)].filter((c) => c !== null)
		};

		const result = generateSQLQuery(config, undefined, inlineQueries, undefined, 'sunday', dialect);

		expect(result.sql).toContain('FROM (SELECT * FROM orders) "__ev_inline_my_query"');
		expect(result.sql).not.toContain(';');
	});
});

describe('generateSQLQuery (full output)', () => {
	it('basic SELECT with dimension and measure groups by all', () => {
		const config = {
			tableExpressionName: 'orders',
			columns: [
				processColumnExpression({ value: 'category', type: 'dimension' as const }),
				processColumnExpression({ value: 'sum(amount)', type: 'measure' as const })
			]
		};
		const { sql } = generateSQLQuery(config, undefined, undefined);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(amount) AS "sum_amount"
			 FROM orders
			 
			 GROUP BY ALL"
		`);
	});

	it('adds WHERE from where + filterSql + date_range', () => {
		const config = {
			tableExpressionName: 'orders',
			columns: [
				processColumnExpression({ value: 'category', type: 'dimension' as const }),
				processColumnExpression({ value: 'sum(amount)', type: 'measure' as const })
			],
			where: 'amount > 0',
			filterSql: 'tenant_id = 7',
			date_range: { range: '2025-01-01 to 2025-03-31', date: 'order_date' }
		};
		const { sql } = generateSQLQuery(config, undefined, undefined, new Date(2026, 3, 27), 'sunday');
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(amount) AS "sum_amount"
			 FROM orders
			 WHERE (tenant_id = 7) AND (amount > 0) AND (order_date >= toDate('2025-01-01') AND order_date <= toDate('2025-03-31'))
			 GROUP BY ALL"
		`);
	});

	it('adds HAVING and ORDER BY with limit', () => {
		const config = {
			tableExpressionName: 'orders',
			columns: [
				processColumnExpression({ value: 'category', type: 'dimension' as const }),
				processColumnExpression({ value: 'sum(amount)', type: 'measure' as const })
			],
			having: 'sum(amount) > 100',
			order: 'sum_amount desc',
			limit: 10
		};
		const { sql } = generateSQLQuery(config, undefined, undefined);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(amount) AS "sum_amount"
			 FROM orders
			 
			 GROUP BY ALL
			 HAVING (sum(amount) > 100)
			 
			 ORDER BY sum_amount desc LIMIT 10"
		`);
	});

	it('aggregates ORDER BY columns missing from a grouped SELECT', () => {
		const config = {
			tableExpressionName: 'orders',
			columns: [
				processColumnExpression({ value: 'category', type: 'dimension' as const }),
				processColumnExpression({ value: 'sum(amount)', type: 'measure' as const })
			],
			order: 'priority asc'
		};
		const { sql } = generateSQLQuery(config, undefined, undefined);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(amount) AS "sum_amount", MIN(priority) AS "priority"
			 FROM orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY priority asc"
		`);

		const postgres = new PostgresDialect();
		const postgresConfig = {
			...config,
			columns: [
				processColumnExpression({ value: 'category', type: 'dimension' }, postgres),
				processColumnExpression({ value: 'sum(amount)', type: 'measure' }, postgres)
			]
		};
		const postgresSql = generateSQLQuery(
			postgresConfig,
			undefined,
			undefined,
			undefined,
			'sunday',
			postgres
		).sql;
		expect(postgresSql).toContain(
			'SELECT category AS "category", sum(amount) AS "sum_amount", MIN(priority) AS "priority"'
		);
		expect(postgresSql).toContain('GROUP BY category');
		expect(postgresSql).toContain('ORDER BY priority asc');
	});

	// ANY_VALUE would let the same query come back in a different order each run.
	it('sorts each group by its own best value in the requested direction', () => {
		const columns = [
			processColumnExpression({ value: 'category', type: 'dimension' as const }),
			processColumnExpression({ value: 'sum(amount)', type: 'measure' as const })
		];
		const descending = generateSQLQuery(
			{ tableExpressionName: 'orders', columns, order: 'priority desc' },
			undefined,
			undefined
		).sql;
		expect(descending).toContain('MAX(priority) AS "priority"');
		expect(descending).toContain('ORDER BY priority desc');
	});

	it('emits GROUPING SETS when subtotals are enabled', () => {
		const dimension = processColumnExpression({ value: 'category', type: 'dimension' as const });
		const measure = processColumnExpression({ value: 'sum(amount)', type: 'measure' as const });
		const groupingSets = generateGroupingSets([dimension, measure]);
		const subtotalHelperColumns = generateSubtotalHelperColumns([dimension, measure]);

		const config = {
			tableExpressionName: 'orders',
			columns: [dimension, measure],
			subtotals: true,
			groupingSets,
			subtotalHelperColumns
		};
		const { sql } = generateSQLQuery(config, undefined, undefined);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(amount) AS "sum_amount", GROUPING(category) AS "__ev_grouping_category", CASE WHEN GROUPING(category) = 1 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
			 WHEN (CASE WHEN GROUPING(category) = 1 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) = 1 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS "__ev_render_type"
			 FROM orders
			 
			 GROUP BY GROUPING SETS ((category), ())"
		`);
	});

	it('paginates with subquery when both limit and page_size are provided', () => {
		const config = {
			tableExpressionName: 'orders',
			columns: [
				processColumnExpression({ value: 'category', type: 'dimension' as const }),
				processColumnExpression({ value: 'sum(amount)', type: 'measure' as const })
			],
			limit: 1000,
			page_size: 25,
			offset: 50
		};
		const { sql } = generateSQLQuery(config, undefined, undefined);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT * FROM (SELECT category AS "category", sum(amount) AS "sum_amount"
			 FROM orders
			 
			 GROUP BY ALL
			 
			 
			 
			 LIMIT 1000) AS evidence_paged LIMIT 25 OFFSET 50"
		`);
	});
});

describe('processFilterIds', () => {
	const makeFilters = (entries: Record<string, string>): Filters => {
		const map = new Map<string, { sql: string }>();
		for (const [k, v] of Object.entries(entries)) {
			map.set(k, { sql: v });
		}
		return {
			has: (id: string) => map.has(id),
			get: (id: string) => map.get(id)
		} as unknown as Filters;
	};

	it('returns undefined when no filterIds are passed', () => {
		expect(processFilterIds(undefined as unknown as unknown[], [])).toBeUndefined();
	});

	it('returns undefined when filterIds resolve to nothing', () => {
		expect(processFilterIds(['unknown'], [makeFilters({})])).toBeUndefined();
	});

	it('joins resolved SQL with AND', () => {
		const ctx = makeFilters({ a: "country = 'US'", b: 'amount > 0' });
		expect(processFilterIds(['a', 'b'], [ctx])).toBe("country = 'US' AND amount > 0");
	});

	it('skips ids that do not match any context', () => {
		const ctx = makeFilters({ a: "country = 'US'" });
		expect(processFilterIds(['a', 'missing'], [ctx])).toBe("country = 'US'");
	});

	it('searches across multiple filter contexts', () => {
		const ctx1 = makeFilters({ a: "country = 'US'" });
		const ctx2 = makeFilters({ b: 'amount > 0' });
		expect(processFilterIds(['a', 'b'], [ctx1, ctx2])).toBe("country = 'US' AND amount > 0");
	});

	it('ignores non-string ids', () => {
		const ctx = makeFilters({ a: "country = 'US'" });
		expect(processFilterIds([123, null, 'a'], [ctx])).toBe("country = 'US'");
	});
});

describe('generateGroupingSets', () => {
	const dim = (value: string): ProcessedColumnExpression =>
		processColumnExpression({ value, type: 'dimension' });
	const piv = (value: string): ProcessedColumnExpression =>
		processColumnExpression({ value, type: 'pivot' });
	const measure = (value: string): ProcessedColumnExpression =>
		processColumnExpression({ value, type: 'measure' });

	it('returns just () when there are no dims or pivots', () => {
		expect(generateGroupingSets([measure('sum(amount)')])).toBe('()');
	});

	it('emits dimension hierarchy for a single dimension', () => {
		expect(generateGroupingSets([dim('category'), measure('sum(amount)')])).toBe(
			'(category), ()'
		);
	});

	it('emits dimension hierarchy for two dimensions', () => {
		expect(generateGroupingSets([dim('region'), dim('category'), measure('sum(amount)')])).toBe(
			'(region, category), (region), ()'
		);
	});

	it('emits pivot-only sets', () => {
		expect(generateGroupingSets([piv('product'), measure('sum(amount)')])).toBe('(product), ()');
	});

	it('emits combined dimension x pivot grouping sets', () => {
		expect(
			generateGroupingSets([dim('category'), piv('product'), measure('sum(amount)')])
		).toBe('(category, product), (category), (product), ()');
	});
});

describe('generateSubtotalHelperColumns', () => {
	const dim = (value: string): ProcessedColumnExpression =>
		processColumnExpression({ value, type: 'dimension' });
	const piv = (value: string): ProcessedColumnExpression =>
		processColumnExpression({ value, type: 'pivot' });
	const measure = (value: string): ProcessedColumnExpression =>
		processColumnExpression({ value, type: 'measure' });

	it('emits grouping/subtotal_level/render_type for a single dimension', () => {
		expect(generateSubtotalHelperColumns([dim('category'), measure('sum(amount)')]))
			.toMatchInlineSnapshot(`
				"GROUPING(category) AS "__ev_grouping_category", CASE WHEN GROUPING(category) = 1 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
				 WHEN (CASE WHEN GROUPING(category) = 1 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
				 WHEN (CASE WHEN GROUPING(category) = 1 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
				 ELSE 'row_subtotal'
				 END AS "__ev_render_type""
			`);
	});

	it('emits grouping/subtotal_level/render_type for a single pivot', () => {
		expect(generateSubtotalHelperColumns([piv('product'), measure('sum(amount)')]))
			.toMatchInlineSnapshot(`
				"GROUPING(product) AS "__ev_grouping_product", CASE WHEN GROUPING(product) = 1 THEN 1 WHEN GROUPING(product) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
				 WHEN (CASE WHEN GROUPING(product) = 1 THEN 1 WHEN GROUPING(product) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
				 WHEN (CASE WHEN GROUPING(product) = 1 THEN 1 WHEN GROUPING(product) = 1 THEN 0 ELSE NULL END) = 0 THEN 'column_total'
				 ELSE 'column_subtotal'
				 END AS "__ev_render_type""
			`);
	});

	it('emits combined grouping for dimensions + pivots', () => {
		expect(
			generateSubtotalHelperColumns([dim('category'), piv('product'), measure('sum(amount)')])
		).toMatchInlineSnapshot(`
			"GROUPING(category) AS "__ev_grouping_category", GROUPING(product) AS "__ev_grouping_product", CASE WHEN GROUPING(category) = 1 AND GROUPING(product) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(product) = 1 THEN 1 ELSE NULL END AS "__ev_subtotal_level", CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(product) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(product) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(product) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(product) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(product) = 1 THEN 'column_total'
			 /* Otherwise it's a row total (fallback) */
									ELSE 'row_total'
								END

							/* Other subtotal levels */
							ELSE
								CASE
									/* If any dimension is NULL, it's a row subtotal */
			 WHEN GROUPING(category) = 1 THEN 'row_subtotal'
			 /* Otherwise it must be a column subtotal */
			 ELSE 'column_subtotal'
			 END
			 END AS "__ev_render_type""
		`);
	});
});

// Any viewer types into the search box, and on a backslash-honouring warehouse a trailing `\`
// would close the LIKE pattern's literal early.
describe('generateSQLQuery search term escaping', () => {
	const PAYLOAD = String.raw`x\' UNION ALL SELECT 1 --`;

	function searchSql(d: SqlDialect) {
		const config = {
			tableExpressionName: 'orders',
			columns: [processColumnExpression({ value: 'category' }, d)].filter((c) => c !== null),
			search: { term: PAYLOAD, columns: ['category'] }
		};
		return generateSQLQuery(config, undefined, undefined, undefined, 'sunday', d).sql;
	}

	it('doubles backslashes on ClickHouse so the pattern literal cannot be closed early', () => {
		expect(searchSql(new ClickHouseDialect())).toContain(
			String.raw`%x\\\' UNION ALL SELECT 1 --%`
		);
	});

	it('leaves backslashes alone on Postgres, where they are ordinary characters', () => {
		expect(searchSql(new PostgresDialect())).toContain(String.raw`%x\'' UNION ALL SELECT 1 --%`);
	});
});

describe('generateSQLQuery ORDER BY on a grained date dimension', () => {
	function orderClause(extra: { skipGroupBy?: boolean } = {}) {
		const config = {
			tableExpressionName: 'orders',
			columns: [
				processColumnExpression({ value: 'date', type: 'dimension', dateGrain: 'day' }, dialect),
				processColumnExpression({ value: 'sum(total)', type: 'measure' }, dialect)
			].filter((c) => c !== null),
			order: 'date desc',
			...extra
		};
		return generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect).sql;
	}

	it('sorts by the grouped expression', () => {
		expect(orderClause()).toContain('ORDER BY "date__day" desc');
	});

	// A row lookup never groups, so the raw column is still a legal — and different — sort key.
	it('leaves the raw column alone when the query skips GROUP BY', () => {
		const sql = orderClause({ skipGroupBy: true });
		expect(sql).toContain('ORDER BY date desc');
		expect(sql).not.toContain('GROUP BY');
	});
});
