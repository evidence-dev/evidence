import { describe, it, expect } from 'vitest';
import {
	parseOrderByColumns,
	resolveOrderByGrains,
	isColumnInSelect,
	extractColumnAlias,
	hasAgg,
	isComplexSqlExpression,
	simplifyOutsideParentheses,
	extractBaseExpression,
	processColumnExpression,
	applyAggregateFilter
} from './sql-expression-utils';
import type { ProcessedColumnExpression } from './sql-expression-utils';
import {
	BigQueryDialect,
	ClickHouseDialect,
	MotherDuckDialect,
	SnowflakeDialect
} from '../../sql-dialect';

describe('parseOrderByColumns', () => {
	const names = (clause: string) => parseOrderByColumns(clause).map((column) => column.name);

	it('should return empty array for empty or null input', () => {
		expect(names('')).toEqual([]);
		expect(names(null as unknown as string)).toEqual([]);
		expect(names(undefined as unknown as string)).toEqual([]);
	});

	it('should extract single column name without direction', () => {
		expect(names('category')).toEqual(['category']);
		expect(names('category_order')).toEqual(['category_order']);
	});

	it('should extract single column name with ASC direction', () => {
		expect(names('category ASC')).toEqual(['category']);
		expect(names('category_order ASC')).toEqual(['category_order']);
	});

	it('should extract single column name with DESC direction', () => {
		expect(names('category DESC')).toEqual(['category']);
		expect(names('category_order DESC')).toEqual(['category_order']);
	});

	it('should extract multiple column names', () => {
		expect(names('category, sum_tx')).toEqual(['category', 'sum_tx']);
		expect(names('category ASC, sum_tx DESC')).toEqual(['category', 'sum_tx']);
	});

	it('should handle quoted column names', () => {
		expect(names('"category_order"')).toEqual(['category_order']);
		expect(names('"category_order" DESC')).toEqual(['category_order']);
		expect(names('`category_order`')).toEqual(['category_order']);
		expect(names('`category_order` ASC')).toEqual(['category_order']);
	});

	// The SELECT list is rebuilt from `expression`, so dropping the quotes here would
	// put an untrusted ORDER BY term back into the query as live SQL.
	it('keeps the quoting on the term itself', () => {
		expect(parseOrderByColumns('"cat"" OR 1=1 --" DESC')).toMatchObject([
			{ expression: '"cat"" OR 1=1 --"', name: 'cat"" OR 1=1 --' }
		]);
	});

	// Splitting on a comma inside a quoted name cut the identifier in half and handed
	// the tail to the SELECT list as raw SQL.
	it('does not split on a comma inside a quoted identifier', () => {
		expect(names('"category, currentDatabase()" ASC')).toEqual(['category, currentDatabase()']);
		expect(names('`a, b` DESC, plain')).toEqual(['a, b', 'plain']);
		expect(names('"a"", b" ASC, other DESC')).toEqual(['a"", b', 'other']);
		// A comma between terms still separates them.
		expect(names('"one", "two"')).toEqual(['one', 'two']);
	});

	it('should handle mixed quoted and unquoted columns', () => {
		expect(names('"category_order", sum_tx')).toEqual(['category_order', 'sum_tx']);
		expect(names('category, "sum_tx" DESC')).toEqual(['category', 'sum_tx']);
	});

	it('should handle complex column expressions', () => {
		expect(names('sum(transactions) DESC')).toEqual(['sum(transactions)']);
		expect(names('count(*) ASC')).toEqual(['count(*)']);
	});

	it('should handle whitespace variations', () => {
		expect(names('  category  ')).toEqual(['category']);
		expect(names('  category  DESC  ')).toEqual(['category']);
		expect(names('category , sum_tx')).toEqual(['category', 'sum_tx']);
	});

	it('should handle case insensitive direction keywords', () => {
		expect(names('category asc')).toEqual(['category']);
		expect(names('category desc')).toEqual(['category']);
		expect(names('category Asc')).toEqual(['category']);
		expect(names('category Desc')).toEqual(['category']);
	});
});

describe('resolveOrderByGrains', () => {
	const clickhouse = new ClickHouseDialect();
	const columns = (dateGrain?: string, value = 'date') => [
		processColumnExpression({ value: 'category', type: 'dimension' }, clickhouse),
		processColumnExpression({ value, type: 'dimension', dateGrain }, clickhouse)
	];

	it('points a grained date term at the expression that is grouped', () => {
		expect(resolveOrderByGrains('date desc', columns('day'), clickhouse)).toBe('"date__day" desc');
		expect(resolveOrderByGrains('DATE', columns('month'), clickhouse)).toBe('"date__month"');
	});

	it('rewrites only the matching term and keeps the rest of the clause', () => {
		expect(resolveOrderByGrains('category asc, date desc', columns('day'), clickhouse)).toBe(
			'category asc, "date__day" desc'
		);
		expect(resolveOrderByGrains('date desc, category asc', columns('day'), clickhouse)).toBe(
			'"date__day" desc, category asc'
		);
	});

	// The parser splits on a comma inside a function call, so a fragment must never be rewritten.
	it('leaves a term alone when it is not a bare identifier', () => {
		const columns = [
			processColumnExpression({ value: 'category', type: 'dimension' }, clickhouse),
			processColumnExpression({ value: 'b', type: 'dimension', dateGrain: 'day' }, clickhouse)
		];
		expect(resolveOrderByGrains('concat(a, b) desc', columns, clickhouse)).toBe(
			'concat(a, b) desc'
		);
	});

	it('leaves a term alone when nothing grains that column', () => {
		expect(resolveOrderByGrains('date desc', columns(), clickhouse)).toBe('date desc');
		expect(resolveOrderByGrains('total desc', columns('day'), clickhouse)).toBe('total desc');
		expect(resolveOrderByGrains('sum(total) desc', columns('day'), clickhouse)).toBe(
			'sum(total) desc'
		);
	});

	it('leaves the term alone when the raw column is a dimension of its own', () => {
		const both = [
			processColumnExpression({ value: 'date', type: 'dimension' }, clickhouse),
			processColumnExpression({ value: 'date', type: 'dimension', dateGrain: 'day' }, clickhouse)
		];
		expect(resolveOrderByGrains('date desc', both, clickhouse)).toBe('date desc');
	});

	// A user-provided alias breaks the `column__grain` convention the match relies on.
	it('leaves a user-aliased date dimension alone', () => {
		const aliased = columns('day', 'date as when_it_happened');
		expect(resolveOrderByGrains('date desc', aliased, clickhouse)).toBe('date desc');
	});

	it('uses the dialect alias casing', () => {
		const snowflake = new SnowflakeDialect();
		const snowflakeColumns = [
			processColumnExpression({ value: 'date', type: 'dimension', dateGrain: 'day' }, snowflake)
		];
		expect(resolveOrderByGrains('date desc', snowflakeColumns, snowflake)).toBe('"DATE__DAY" desc');
	});
});

describe('isColumnInSelect', () => {
	const mockConfigColumns: ProcessedColumnExpression[] = [
		{
			alias: 'category',
			displayAlias: 'Category',
			sqlWithoutAlias: 'category',
			sqlWithAlias: 'category as category',
			sqlWithoutDateFiltersOrAlias: 'category',
			type: 'dimension',
			isComplexExpression: false,
			hasAgg: false,
			hasDateGrain: false,
			hasDateRange: false,
			isTemporalDateGrain: false,
			isTableComparison: false,
			isTableSparkline: false
		},
		{
			alias: 'sum_tx',
			displayAlias: 'Sum Tx',
			sqlWithoutAlias: 'sum(tx)',
			sqlWithAlias: 'sum(tx) as sum_tx',
			sqlWithoutDateFiltersOrAlias: 'sum(tx)',
			type: 'measure',
			isComplexExpression: false,
			hasAgg: true,
			hasDateGrain: false,
			hasDateRange: false,
			isTemporalDateGrain: false,
			isTableComparison: false,
			isTableSparkline: false
		}
	];

	const mockSelectParts = ['category as category', 'sum(tx) as sum_tx'];

	it('should return true for columns that exist in config columns', () => {
		// Test by alias
		expect(isColumnInSelect('category', mockSelectParts, mockConfigColumns)).toBe(true);
		expect(isColumnInSelect('sum_tx', mockSelectParts, mockConfigColumns)).toBe(true);
		// Test by sql expression
		expect(isColumnInSelect('sum(tx)', mockSelectParts, mockConfigColumns)).toBe(true);
	});

	it('should return false for columns that do not exist', () => {
		expect(isColumnInSelect('category_order', mockSelectParts, mockConfigColumns)).toBe(false);
		expect(isColumnInSelect('nonexistent_column', mockSelectParts, mockConfigColumns)).toBe(false);
	});

	it('should return true for columns that exist in select parts string', () => {
		const selectPartsWithInline = ['category as category', 'sum(tx) as sum_tx', 'category_order'];
		expect(isColumnInSelect('category_order', selectPartsWithInline, mockConfigColumns)).toBe(true);
	});

	it('should handle empty arrays', () => {
		// Test with empty config columns - should find in select parts
		expect(isColumnInSelect('category', mockSelectParts, [])).toBe(true);
		expect(isColumnInSelect('nonexistent_column', mockSelectParts, [])).toBe(false);

		// Test with empty select parts - should find in config columns
		expect(isColumnInSelect('category', [], mockConfigColumns)).toBe(true);
		expect(isColumnInSelect('category_order', [], mockConfigColumns)).toBe(false);
	});

	it('should handle complex column expressions in select parts', () => {
		const selectPartsWithComplex = [
			'category as category',
			'sum(tx) as sum_tx',
			'case when category = "Home" then 1 when category = "Electronics" then 2 else 99 end as category_order'
		];
		expect(isColumnInSelect('category_order', selectPartsWithComplex, mockConfigColumns)).toBe(
			true
		);
	});

	it('should be case sensitive for column matching', () => {
		expect(isColumnInSelect('Category', mockSelectParts, mockConfigColumns)).toBe(false);
		expect(isColumnInSelect('CATEGORY', mockSelectParts, mockConfigColumns)).toBe(false);
	});

	it('should handle columns with special characters', () => {
		const configWithSpecial: ProcessedColumnExpression[] = [
			{
				alias: 'user_id',
				displayAlias: 'User ID',
				sqlWithoutAlias: 'user_id',
				sqlWithAlias: 'user_id as user_id',
				sqlWithoutDateFiltersOrAlias: 'user_id',
				type: 'dimension',
				isComplexExpression: false,
				hasAgg: false,
				hasDateGrain: false,
				hasDateRange: false,
				isTemporalDateGrain: false,
				isTableComparison: false,
				isTableSparkline: false
			}
		];
		expect(isColumnInSelect('user_id', mockSelectParts, configWithSpecial)).toBe(true);
	});

	it('should not match partial column names (word boundary matching)', () => {
		const selectParts = ['category_order as category_order'];

		expect(isColumnInSelect('category', selectParts, [])).toBe(false);
		expect(isColumnInSelect('order', selectParts, [])).toBe(false);
		expect(isColumnInSelect('category_order', selectParts, [])).toBe(true);
	});
});

describe('extractColumnAlias', () => {
	it('should return the column name when no alias is present', () => {
		expect(extractColumnAlias('category')).toBe('category');
		expect(extractColumnAlias('sum(tx)')).toBe('sum(tx)');
	});

	it('should extract unquoted alias', () => {
		expect(extractColumnAlias('category as cat')).toBe('cat');
		expect(extractColumnAlias('sum(tx) AS total')).toBe('total');
	});

	it('should extract double-quoted alias', () => {
		expect(extractColumnAlias('category as "my category"')).toBe('my category');
		expect(extractColumnAlias('sum(tx) AS "Total Sales"')).toBe('Total Sales');
	});

	it('should extract alias containing apostrophes', () => {
		expect(extractColumnAlias(`category as "aujourd'hui"`)).toBe("aujourd'hui");
		expect(extractColumnAlias(`category as "it's working"`)).toBe("it's working");
	});

	it('should extract single-quoted alias containing double quotes', () => {
		expect(extractColumnAlias(`category as 'say "hello"'`)).toBe('say "hello"');
	});

	it('should extract backtick-quoted alias', () => {
		expect(extractColumnAlias('category as `my column`')).toBe('my column');
	});

	it('should handle empty or invalid input', () => {
		expect(extractColumnAlias('')).toBe('');
		expect(extractColumnAlias(null as unknown as string)).toBe('');
		expect(extractColumnAlias(undefined as unknown as string)).toBe('');
	});

	it('should preserve parentheses content in quoted aliases', () => {
		// French inclusive writing style with parentheses
		expect(extractColumnAlias('sum(total_sales) as `Utilisateur(-trice)s actifs`')).toBe(
			'Utilisateur(-trice)s actifs'
		);
		expect(extractColumnAlias('count(*) as "Active User(s)"')).toBe('Active User(s)');
		expect(extractColumnAlias(`revenue as "Revenue (USD)"`)).toBe('Revenue (USD)');
	});

	it('should preserve nested parentheses in quoted aliases', () => {
		expect(extractColumnAlias('value as "Test (with (nested) parens)"')).toBe(
			'Test (with (nested) parens)'
		);
	});

	it('should preserve parentheses with special characters inside', () => {
		expect(extractColumnAlias('col as "Label (a-z)"')).toBe('Label (a-z)');
		expect(extractColumnAlias('col as "Value ($)"')).toBe('Value ($)');
		expect(extractColumnAlias('col as "Percent (%)"')).toBe('Percent (%)');
	});

	it('should extract alias with parentheses from aggregation expression', () => {
		expect(extractColumnAlias('sum(sales) as "total sales (by month)"')).toBe(
			'total sales (by month)'
		);
		expect(extractColumnAlias('count(distinct user_id) as "Users (Unique)"')).toBe(
			'Users (Unique)'
		);
	});
});

describe('hasAgg', () => {
	it('detects SUM', () => {
		expect(hasAgg('sum(sales)')).toBe(true);
	});

	it('detects case-insensitive AVG', () => {
		expect(hasAgg('AvG(sales)')).toBe(true);
	});

	it('detects COUNT(*)', () => {
		expect(hasAgg('count(*)')).toBe(true);
	});

	it('detects MIN, MAX, MEDIAN', () => {
		expect(hasAgg('min(sales)')).toBe(true);
		expect(hasAgg('max(sales)')).toBe(true);
		expect(hasAgg('median(sales)')).toBe(true);
	});

	it('detects ClickHouse quantile functions', () => {
		expect(hasAgg('quantile(0.95)(sales)')).toBe(true);
		expect(hasAgg('quantileTDigest(0.5)(latency)')).toBe(true);
	});

	it('detects STRING_AGG, GROUP_CONCAT, ARRAY_AGG', () => {
		expect(hasAgg('string_agg(name, ",")')).toBe(true);
		expect(hasAgg('group_concat(name)')).toBe(true);
		expect(hasAgg('array_agg(id)')).toBe(true);
	});

	it('ignores aggregation functions inside an alias', () => {
		expect(hasAgg('sales as sum_total')).toBe(false);
		expect(hasAgg('sales AS count_value')).toBe(false);
	});

	it('detects aggregation in the base of an aliased expression', () => {
		expect(hasAgg('sum(sales) as total')).toBe(true);
	});

	it('returns false for plain columns', () => {
		expect(hasAgg('category')).toBe(false);
		expect(hasAgg('sales')).toBe(false);
	});

	it('returns false for empty/non-string input', () => {
		expect(hasAgg('')).toBe(false);
		expect(hasAgg(null as unknown as string)).toBe(false);
		expect(hasAgg(undefined as unknown as string)).toBe(false);
	});

	it('does not match function names without parens', () => {
		expect(hasAgg('sum sales')).toBe(false);
	});

	it('does not match substrings of unrelated tokens', () => {
		expect(hasAgg('summary_count')).toBe(false);
		expect(hasAgg('count_of_sales')).toBe(false);
	});

	describe('dialect-specific aggregations', () => {
		it('detects ClickHouse -If combinators without a dialect context', () => {
			expect(hasAgg("sumIf(total_sales, category = 'Electronics')")).toBe(true);
			expect(
				hasAgg(
					"sumIf(total_sales, category = 'Electronics') / nullif(sumIf(total_sales, category = 'Clothing'), 0)"
				)
			).toBe(true);
			// The whole family, matching the ClickHouse dialect set — one of these missing is a
			// false "not an aggregate", which shows up as a bogus editor warning.
			for (const expr of ['avgIf(x, c)', 'minIf(x, c)', 'maxIf(x, c)', 'anyIf(x, c)'])
				expect(hasAgg(expr), expr).toBe(true);
			// A column that merely starts with the name is not a call.
			expect(hasAgg('sumif_total')).toBe(false);
		});

		it('detects BigQuery COUNTIF when given the BigQuery dialect', () => {
			// Without dialect, the permissive fallback list also includes COUNTIF.
			expect(hasAgg('countif(build_success)')).toBe(true);
			// With dialect explicitly, behaviour matches.
			expect(hasAgg('countif(build_success)', new BigQueryDialect())).toBe(true);
			// Aliased form (the original repro: "countif(x) as successful").
			expect(hasAgg('countif(build_success) as successful', new BigQueryDialect())).toBe(true);
		});

		it('detects other BigQuery-only aggs', () => {
			const bq = new BigQueryDialect();
			expect(hasAgg('logical_and(is_active)', bq)).toBe(true);
			expect(hasAgg('approx_count_distinct(user_id)', bq)).toBe(true);
			expect(hasAgg('approx_quantiles(latency, 100)', bq)).toBe(true);
			expect(hasAgg('any_value(name)', bq)).toBe(true);
		});

		it('respects the dialect: a name absent from the dialect set is not an agg', () => {
			// LOGICAL_AND is BQ-only; ClickHouse has no such aggregation. With the
			// CH dialect provided, hasAgg correctly reports false. (The fallback
			// permissive list is only consulted when no dialect is passed.)
			expect(hasAgg('logical_and(x)', new ClickHouseDialect())).toBe(false);
			expect(hasAgg('logical_and(x)', new BigQueryDialect())).toBe(true);
		});
	});
});

describe('isComplexSqlExpression', () => {
	it('returns false for plain column names', () => {
		expect(isComplexSqlExpression('category')).toBe(false);
		expect(isComplexSqlExpression('order_date')).toBe(false);
	});

	it('returns true for expressions containing parentheses', () => {
		expect(isComplexSqlExpression('sum(sales)')).toBe(true);
	});

	it('returns true for CASE expressions', () => {
		expect(isComplexSqlExpression('case when x = 1 then a else b end')).toBe(true);
	});

	it('returns true for arithmetic operators', () => {
		expect(isComplexSqlExpression('a + b')).toBe(true);
		expect(isComplexSqlExpression('a - b')).toBe(true);
		expect(isComplexSqlExpression('a * b')).toBe(true);
		expect(isComplexSqlExpression('a / b')).toBe(true);
	});

	it('returns true for string concatenation', () => {
		expect(isComplexSqlExpression("first_name || ' ' || last_name")).toBe(true);
	});

	it('does not match arithmetic without spaces', () => {
		expect(isComplexSqlExpression('a+b')).toBe(false);
	});

	it('returns false for empty input', () => {
		expect(isComplexSqlExpression('')).toBe(false);
		expect(isComplexSqlExpression(undefined as unknown as string)).toBe(false);
	});
});

describe('simplifyOutsideParentheses', () => {
	it('replaces inner parenthesized content with spaces while preserving the parens', () => {
		expect(simplifyOutsideParentheses('sum(sales)')).toBe('sum(     )');
	});

	it('preserves outer text verbatim', () => {
		expect(simplifyOutsideParentheses('sum(sales) as total')).toBe('sum(     ) as total');
	});

	it('handles nested parentheses (parens are preserved at every depth)', () => {
		expect(simplifyOutsideParentheses('coalesce(sum(a), 0)')).toBe('coalesce(   ( )   )');
	});

	it('returns input unchanged when there are no parentheses', () => {
		expect(simplifyOutsideParentheses('order_date')).toBe('order_date');
	});

	it('returns empty for empty input', () => {
		expect(simplifyOutsideParentheses('')).toBe('');
	});
});

describe('extractBaseExpression', () => {
	it('returns the column unchanged when there is no alias', () => {
		expect(extractBaseExpression('order_date')).toBe('order_date');
		expect(extractBaseExpression('sum(sales)')).toBe('sum(sales)');
	});

	it('strips an unquoted alias', () => {
		expect(extractBaseExpression('sum(sales) as total')).toBe('sum(sales)');
		expect(extractBaseExpression('category AS cat')).toBe('category');
	});

	it('strips a quoted alias', () => {
		expect(extractBaseExpression('sum(sales) as "Total Sales"')).toBe('sum(sales)');
	});

	it('does not strip "as" appearing inside parentheses', () => {
		expect(extractBaseExpression('cast(x as integer)')).toBe('cast(x as integer)');
	});

	it('handles complex nested expressions with alias', () => {
		expect(extractBaseExpression('(sum(a) - sum(b)) / nullif(sum(b), 0) as ratio')).toBe(
			'(sum(a) - sum(b)) / nullif(sum(b), 0)'
		);
	});
});

describe('processColumnExpression', () => {
	it('processes a plain dimension column', () => {
		const result = processColumnExpression({ value: 'category', type: 'dimension' });
		expect(result.sqlWithAlias).toBe('category AS "category"');
		expect(result.sqlWithoutAlias).toBe('category');
		expect(result.sqlWithoutDateFiltersOrAlias).toBe('category');
		expect(result.alias).toBe('category');
		expect(result.hasAgg).toBe(false);
		expect(result.isComplexExpression).toBe(false);
		expect(result.hasDateGrain).toBe(false);
		expect(result.hasDateRange).toBe(false);
		expect(result.isUserProvidedAlias).toBe(false);
	});

	// A measure-level date_range on a ClickHouse conditional aggregate: the whole point is
	// that the date predicate lands inside the -If condition, so the query actually runs.
	it('date-ranges a ClickHouse -If measure without emitting FILTER', () => {
		const result = processColumnExpression(
			{
				value: "sumIf(value, stage = 'Website Visits')",
				type: 'measure',
				dateRange: { range: 'last 30 days', date: 'period' },
				anchorDate: new Date('2026-02-02T00:00:00')
			},
			new ClickHouseDialect()
		);
		expect(result.sqlWithoutAlias).toBe(
			"sumIf(value, (stage = 'Website Visits') AND (period >= toDate('2026-01-04') AND period <= toDate('2026-02-02')))"
		);
		expect(result.sqlWithoutAlias).not.toContain('FILTER');
	});

	it('returns safe empties for a nullish value instead of throwing', () => {
		// An unquoted aggregate (`y=sum(x)`) resolves to undefined via Markdoc; the
		// Snowflake dialect would otherwise crash on `undefined.toUpperCase()`.
		const sf = new SnowflakeDialect();
		const result = processColumnExpression(
			{ value: undefined as unknown as string, type: 'measure' },
			sf
		);
		expect(result.alias).toBe('');
		expect(result.sqlWithAlias).toBe('');
		expect(result.sqlWithoutAlias).toBe('');
		expect(result.displayAlias).toBe('');
		expect(result.hasAgg).toBe(false);
	});

	it('preserves a user-provided alias', () => {
		const result = processColumnExpression({
			value: 'sum(sales) as total_sales',
			type: 'measure'
		});
		expect(result.sqlWithAlias).toBe('sum(sales) AS "total_sales"');
		expect(result.alias).toBe('total_sales');
		expect(result.sqlWithoutAlias).toBe('sum(sales)');
		expect(result.hasAgg).toBe(true);
		expect(result.isComplexExpression).toBe(true);
		expect(result.isUserProvidedAlias).toBe(true);
	});

	it('applies date grain transformation to the SQL', () => {
		const result = processColumnExpression({
			value: 'order_date',
			type: 'dimension',
			dateGrain: 'month'
		});
		expect(result.sqlWithAlias).toBe('toStartOfMonth(order_date) AS "order_date__month"');
		expect(result.sqlWithoutAlias).toBe('toStartOfMonth(order_date)');
		expect(result.sqlWithoutDateFiltersOrAlias).toBe('toStartOfMonth(order_date)');
		expect(result.alias).toBe('order_date__month');
		expect(result.hasDateGrain).toBe(true);
		expect(result.dateGrain).toBe('month');
		expect(result.isTemporalDateGrain).toBe(true);
	});

	it('uses week mode 0 for sunday-first when applying week grain', () => {
		const result = processColumnExpression({
			value: 'order_date',
			type: 'dimension',
			dateGrain: 'week',
			firstDayOfWeek: 'sunday'
		});
		expect(result.sqlWithoutAlias).toBe('toStartOfWeek(order_date, 0)');
	});

	it('uses week mode 5 for monday-first when applying week grain', () => {
		const result = processColumnExpression({
			value: 'order_date',
			type: 'dimension',
			dateGrain: 'week',
			firstDayOfWeek: 'monday'
		});
		expect(result.sqlWithoutAlias).toBe('toStartOfWeek(order_date, 5)');
	});

	it('pushes the date predicate into the aggregate for measures with a date range', () => {
		// Local-time anchor so date-fns formatting is deterministic across TZs
		const result = processColumnExpression({
			value: 'sum(sales)',
			type: 'measure',
			dateRange: { range: 'last 7 days', date: 'order_date' },
			anchorDate: new Date(2026, 3, 27)
		});
		expect(result.sqlWithoutAlias).toBe(
			"sum(sales) FILTER (WHERE order_date >= toDate('2026-04-21') AND order_date <= toDate('2026-04-27'))"
		);
		expect(result.sqlWithoutDateFiltersOrAlias).toBe('sum(sales)');
		expect(result.sqlWithAlias).toBe(
			"sum(sales) FILTER (WHERE order_date >= toDate('2026-04-21') AND order_date <= toDate('2026-04-27')) AS \"sum_sales__l7d\""
		);
		expect(result.alias).toBe('sum_sales__l7d');
		expect(result.hasDateRange).toBe(true);
	});

	it('throws when a date range filter is requested without an anchor date', () => {
		expect(() =>
			processColumnExpression({
				value: 'sum(sales)',
				type: 'measure',
				dateRange: { range: 'last 7 days', date: 'order_date' }
			})
		).toThrow(/Unable to apply date range filter/);
	});

	it('throws when a date range filter is requested without a date column', () => {
		expect(() =>
			processColumnExpression({
				value: 'sum(sales)',
				type: 'measure',
				dateRange: { range: 'last 7 days' },
				anchorDate: new Date(2026, 3, 27)
			})
		).toThrow(/requires a date column/);
	});

	it('skips the date predicate for an "all time" date range', () => {
		const result = processColumnExpression({
			value: 'sum(sales)',
			type: 'measure',
			dateRange: { range: 'all time', date: 'order_date' },
			anchorDate: new Date(2026, 3, 27)
		});
		expect(result.sqlWithoutAlias).toBe('sum(sales)');
		expect(result.hasDateRange).toBe(false);
	});

	it('generates a comparison alias for table-level comparisons', () => {
		const result = processColumnExpression({
			value: 'sum(sales)',
			type: 'comparison',
			isTableComparison: true,
			comparisonType: 'prior year'
		});
		expect(result.alias).toBe('__ev_sum_sales_prior_year_comparison');
		expect(result.sqlWithAlias).toBe('sum(sales) AS "__ev_sum_sales_prior_year_comparison"');
		expect(result.isTableComparison).toBe(true);
	});

	it('generates a sparkline alias for table-level sparklines', () => {
		const result = processColumnExpression({
			value: 'sum(sales)',
			type: 'comparison',
			isTableSparkline: true
		});
		expect(result.alias).toBe('__ev_sparkline_sum_sales');
		expect(result.sqlWithAlias).toBe('sum(sales) AS "__ev_sparkline_sum_sales"');
		expect(result.isTableSparkline).toBe(true);
	});

	describe('applyAggregateFilter', () => {
		const ch = new ClickHouseDialect();
		const sf = new SnowflakeDialect();
		const cond = "d >= toDate('2025-01-01')";

		it('uses FILTER clause on ClickHouse (supports FILTER)', () => {
			expect(applyAggregateFilter('sum(x)', cond, ch)).toBe(`sum(x) FILTER (WHERE ${cond})`);
		});

		it('uses CASE WHEN on Snowflake (no FILTER support)', () => {
			expect(applyAggregateFilter('sum(x)', cond, sf)).toBe(`sum(CASE WHEN ${cond} THEN x END)`);
		});

		it('rewrites count(*) with CASE WHEN on Snowflake', () => {
			expect(applyAggregateFilter('count(*)', cond, sf)).toBe(
				`count(CASE WHEN ${cond} THEN 1 END)`
			);
		});

		it('preserves DISTINCT when rewriting on Snowflake', () => {
			expect(applyAggregateFilter('count(distinct order_id)', cond, sf)).toBe(
				`count(distinct CASE WHEN ${cond} THEN order_id END)`
			);
		});

		it('distributes FILTER across every aggregate in a compound expression (ClickHouse)', () => {
			expect(applyAggregateFilter('sum(a) / nullif(sum(b), 0)', cond, ch)).toBe(
				`sum(a) FILTER (WHERE ${cond}) / nullif(sum(b) FILTER (WHERE ${cond}), 0)`
			);
		});

		it('distributes CASE WHEN across every aggregate in a compound expression (Snowflake)', () => {
			expect(applyAggregateFilter('sum(a) / nullif(sum(b), 0)', cond, sf)).toBe(
				`sum(CASE WHEN ${cond} THEN a END) / nullif(sum(CASE WHEN ${cond} THEN b END), 0)`
			);
		});

		it('wraps each top-level argument of a multi-arg aggregate (Snowflake)', () => {
			expect(applyAggregateFilter('corr(x, y)', cond, sf)).toBe(
				`corr(CASE WHEN ${cond} THEN x END, CASE WHEN ${cond} THEN y END)`
			);
		});

		it('falls back to wrapping the whole expression when there is no aggregate', () => {
			expect(applyAggregateFilter('revenue', cond, ch)).toBe(`CASE WHEN ${cond} THEN revenue END`);
		});

		// ClickHouse builds FILTER out of the -If combinator, so filtering an -If aggregate
		// asks for sumIfIf and is rejected ("Nested identical combinator 'If' is not
		// supported"). The predicate has to go into the aggregate's own condition.
		it('folds the predicate into a ClickHouse -If aggregate instead of using FILTER', () => {
			expect(applyAggregateFilter("sumIf(v, s = 'a')", cond, ch)).toBe(
				`sumIf(v, (s = 'a') AND (${cond}))`
			);
		});

		it('folds into every -If aggregate of a compound expression (ClickHouse)', () => {
			expect(applyAggregateFilter("sumIf(a, s = 'x') / nullif(sumIf(b, s = 'y'), 0)", cond, ch)).toBe(
				`sumIf(a, (s = 'x') AND (${cond})) / nullif(sumIf(b, (s = 'y') AND (${cond})), 0)`
			);
		});

		it('folds into the single argument of countIf (ClickHouse)', () => {
			expect(applyAggregateFilter("countIf(s = 'a')", cond, ch)).toBe(
				`countIf((s = 'a') AND (${cond}))`
			);
		});

		it('still uses FILTER for ordinary ClickHouse aggregates', () => {
			expect(applyAggregateFilter("sum(v) + sumIf(v, s = 'a')", cond, ch)).toBe(
				`sum(v) FILTER (WHERE ${cond}) + sumIf(v, (s = 'a') AND (${cond}))`
			);
		});

		// count_if on Databricks/DuckDB is an ordinary aggregate, not a combinator.
		it('does not fold a lookalike name on a dialect without -If combinators', () => {
			const md = new MotherDuckDialect();
			expect(applyAggregateFilter('count_if(s)', cond, md)).toBe(
				`count_if(s) FILTER (WHERE ${cond})`
			);
		});

		it('does not rewrite a non-aggregate function call (ClickHouse)', () => {
			expect(applyAggregateFilter('nullif(sum(a), 0) + sum(b)', cond, ch)).toBe(
				`nullif(sum(a) FILTER (WHERE ${cond}), 0) + sum(b) FILTER (WHERE ${cond})`
			);
		});

		it('does not rewrite a non-aggregate function call (Snowflake)', () => {
			expect(applyAggregateFilter('nullif(sum(a), 0) + sum(b)', cond, sf)).toBe(
				`nullif(sum(CASE WHEN ${cond} THEN a END), 0) + sum(CASE WHEN ${cond} THEN b END)`
			);
		});

		it('respects dialect-specific aggregate sets (Snowflake COUNT_IF)', () => {
			expect(applyAggregateFilter('count_if(x > 0)', cond, sf)).toBe(
				`count_if(CASE WHEN ${cond} THEN x > 0 END)`
			);
		});

		it('handles groupArray with tuple args on ClickHouse without type error', () => {
			const result = applyAggregateFilter('groupArray((location_name, amount, count))', cond, ch);
			expect(result).toBe(`groupArray((location_name, amount, count)) FILTER (WHERE ${cond})`);
		});
	});

	it('escapes embedded double quotes in the alias', () => {
		const result = processColumnExpression({
			value: 'sum(sales) as "weird"name"',
			type: 'measure'
		});
		// User-provided alias is extracted as `weird` (terminated at first inner quote);
		// the alias is then quoted with embedded quotes doubled.
		expect(result.alias).toBe('weird');
		expect(result.sqlWithAlias).toBe('sum(sales) AS "weird"');
	});

	it('distributes the date_range predicate across each aggregate in a compound measure', () => {
		const result = processColumnExpression({
			value: 'sum(cp1) / nullif(sum(revenue), 0) as cp1_margin',
			type: 'measure',
			dateRange: { range: 'last 7 days', date: 'order_date' },
			anchorDate: new Date(2026, 3, 27)
		});
		expect(result.sqlWithoutAlias).toMatchInlineSnapshot(
			`"sum(cp1) FILTER (WHERE order_date >= toDate('2026-04-21') AND order_date <= toDate('2026-04-27')) / nullif(sum(revenue) FILTER (WHERE order_date >= toDate('2026-04-21') AND order_date <= toDate('2026-04-27')), 0)"`
		);
		expect(result.alias).toBe('cp1_margin');
	});

	it('emits a measure with date_range on the Snowflake dialect without a FILTER clause', () => {
		// Snowflake does not support `agg(...) FILTER (WHERE ...)` — the
		// generated SQL must not contain that clause.
		const result = processColumnExpression(
			{
				value: 'sum(sales)',
				type: 'measure',
				dateRange: { range: 'last 7 days', date: 'order_date' },
				anchorDate: new Date(2026, 3, 27)
			},
			new SnowflakeDialect()
		);
		expect(result.sqlWithoutAlias).not.toContain('FILTER (WHERE');
		expect(result.sqlWithoutAlias).toMatchInlineSnapshot(
			`"sum(CASE WHEN order_date >= TO_DATE('2026-04-21') AND order_date <= TO_DATE('2026-04-27') THEN sales END)"`
		);
	});

	it('emits a Snowflake compound ratio measure with date_range', () => {
		const result = processColumnExpression(
			{
				value: 'sum(cp1) / nullif(sum(revenue), 0)',
				type: 'measure',
				dateRange: { range: 'last 7 days', date: 'order_date' },
				anchorDate: new Date(2026, 3, 27)
			},
			new SnowflakeDialect()
		);
		expect(result.sqlWithoutAlias).not.toContain('FILTER (WHERE');
		expect(result.sqlWithoutAlias).toMatchInlineSnapshot(
			`"sum(CASE WHEN order_date >= TO_DATE('2026-04-21') AND order_date <= TO_DATE('2026-04-27') THEN cp1 END) / nullif(sum(CASE WHEN order_date >= TO_DATE('2026-04-21') AND order_date <= TO_DATE('2026-04-27') THEN revenue END), 0)"`
		);
	});
});
