import { describe, expect, it } from 'vitest';
import { ClickHouseDialect, PostgresDialect } from '../../../sql-dialect';
import { buildRepeatQueryConfig, resolveRepeatColumnExpression } from './build-repeat-query-config';
import { generateSQLQuery } from '../../common/sql-options';
import type { InlineQueries } from '../../common/inline-queries';

describe('buildRepeatQueryConfig', () => {
	it('quotes variable-backed table and column identifiers', () => {
		const dialect = new ClickHouseDialect();
		const config = buildRepeatQueryConfig({
			data: 'demo.orders" UNION ALL SELECT * FROM secrets --',
			column: resolveRepeatColumnExpression(
				'{{picker}}',
				() => String.raw`category\" OR 1=1 --`,
				dialect
			),
			filterConditions: undefined,
			where: undefined,
			dialect
		});

		const { sql } = generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect);

		expect(sql).toContain('FROM demo."orders"" UNION ALL SELECT * FROM secrets --"');
		expect(config.columns[0]?.sqlWithAlias).toBe(
			String.raw`"category\\"" OR 1=1 --" AS "value"`
		);
		expect(config.where).toBe(String.raw`"category\\"" OR 1=1 --" IS NOT NULL`);
		expect(config.order).toBe(String.raw`"category\\"" OR 1=1 --" ASC`);
		expect(
			resolveRepeatColumnExpression(
				'{{picker}}',
				() => 'category FROM demo.daily_orders UNION ALL SELECT version() --',
				dialect
			)
		).toBe('"category FROM demo"."daily_orders UNION ALL SELECT version() --"');
		expect(resolveRepeatColumnExpression('{{picker}}', () => 'version()', dialect)).toBe(
			'"version()"'
		);
		expect(resolveRepeatColumnExpression('{{picker}}', () => 'current_user', dialect)).toBe(
			'"current_user"'
		);
	});

	// `column` names a column, so an expression that arrives through a variable is
	// quoted rather than executed — otherwise a URL could read any column of the
	// table via `substring(secret, 1, 4)`. Author-written expressions still work.
	it('quotes a variable that resolves to an expression, but keeps qualified names', () => {
		const dialect = new ClickHouseDialect();
		const expression = buildRepeatQueryConfig({
			data: 'demo.daily_orders',
			column: resolveRepeatColumnExpression(
				'{{picker}}',
				() => 'substring(category, 1, 4)',
				dialect
			),
			filterConditions: undefined,
			where: undefined,
			dialect
		});
		const qualified = buildRepeatQueryConfig({
			data: 'demo.daily_orders',
			column: resolveRepeatColumnExpression('{{picker}}', () => 'daily_orders.category', dialect),
			filterConditions: undefined,
			where: undefined,
			dialect
		});

		expect(expression.columns[0]?.sqlWithAlias).toBe('"substring(category, 1, 4)" AS "value"');
		expect(expression.where).toBe('"substring(category, 1, 4)" IS NOT NULL');
		expect(resolveRepeatColumnExpression('{{picker}}', () => 'unknown(category)', dialect)).toBe(
			'"unknown(category)"'
		);
		expect(
			resolveRepeatColumnExpression(
				'{{picker}}',
				() => "CASE WHEN category = 1 THEN 'known' ELSE 'other' END",
				dialect
			)
		).toBe(String.raw`"CASE WHEN category = 1 THEN 'known' ELSE 'other' END"`);
		expect(
			resolveRepeatColumnExpression('{{picker}}', () => 'extract(year FROM order_date)', dialect)
		).toBe('"extract(year FROM order_date)"');

		// An author wrapping the variable in their own expression is untouched.
		expect(resolveRepeatColumnExpression('upper({{picker}})', () => 'category', dialect)).toBe(
			'upper(category)'
		);
		// Only a variable is quoted. A column the author wrote themselves is not a URL value,
		// so every static expression that worked before still works.
		for (const written of [
			'sum(sales)',
			'daily_orders.category',
			"date_trunc('month', ordered_at)"
		])
			expect(resolveRepeatColumnExpression(written, () => 'unused', dialect)).toBe(written);
		expect(qualified.columns[0]?.sqlWithAlias).toBe('daily_orders.category AS "value"');
		expect(qualified.where).toBe('daily_orders.category IS NOT NULL');
	});

	// A URL-supplied expression could otherwise read a column the page never shows.
	it('does not let a variable expression reach a column outside the page', () => {
		const dialect = new ClickHouseDialect();

		expect(
			resolveRepeatColumnExpression('{{picker}}', () => 'substring(secret_column, 1, 4)', dialect)
		).toBe('"substring(secret_column, 1, 4)"');
		expect(resolveRepeatColumnExpression('{{picker}}', () => 'current_user', dialect)).toBe(
			'"current_user"'
		);
		expect(resolveRepeatColumnExpression('{{picker}}', () => 'session_user', dialect)).toBe(
			'"session_user"'
		);
	});

	// Every one of these evaluates bare on Postgres 17, so leaving any of them off the
	// list hands a URL the warehouse user, database, or clock instead of a column.
	it('quotes every keyword that evaluates without parentheses', () => {
		const dialect = new PostgresDialect();

		for (const keyword of [
			'user',
			'USER',
			' User ',
			'current_catalog',
			'current_date',
			'current_time',
			'current_timestamp',
			'localtime',
			'localtimestamp',
			'current_role',
			'current_schema',
			'system_user'
		])
			expect(resolveRepeatColumnExpression('{{picker}}', () => keyword, dialect)).toBe(
				`"${keyword.trim()}"`
			);
	});

	// Same backslash hole as the table name: on a dialect where `\` is not an escape the
	// value only looked pre-quoted, so it reached the column list as live SQL.
	it('quotes a variable that only looks pre-quoted on an ANSI dialect', () => {
		const postgres = new PostgresDialect();
		const payload = String.raw`"cat\" UNION ALL SELECT 1 --"`;

		expect(resolveRepeatColumnExpression('{{picker}}', () => payload, postgres)).toBe(
			String.raw`"""cat\"" UNION ALL SELECT 1 --"""`
		);
	});

	// The ORDER BY reconciliation used to re-add the term with its quotes stripped,
	// putting the raw payload back into the SELECT list as executable SQL.
	it('never emits the untrusted column unquoted in any clause', () => {
		const dialect = new ClickHouseDialect();

		// The comma cases matter on their own: the ORDER BY terms used to be split on
		// every comma, which cut the quoted name apart and freed the tail.
		for (const payload of [
			"1 union all select 'PWNED'",
			'version()',
			'sleep(3)',
			'category, currentDatabase()',
			"category, 'PWNED'"
		]) {
			const config = buildRepeatQueryConfig({
				data: 'orders',
				column: resolveRepeatColumnExpression('{{picker}}', () => payload, dialect),
				filterConditions: undefined,
				where: undefined,
				dialect
			});
			const { sql } = generateSQLQuery(config, undefined, undefined, undefined, 'sunday', dialect);

			expect(sql).toContain(`"${payload}"`);
			const withoutIdentifier = sql.replaceAll(`"${payload}"`, '');
			// Every piece of the payload has to be gone, not just the whole string —
			// a split term leaves only a fragment behind, which is what got through.
			for (const fragment of payload.split(','))
				expect(withoutIdentifier).not.toContain(fragment.trim());
			// A torn identifier also leaves the quote it was cut from.
			expect(withoutIdentifier.split('"').length % 2).toBe(1);
		}
	});

	// Resolving the inline query here as well as in generateSQLQuery left the second
	// pass quoting an already-expanded subquery, so the Repeat never loaded.
	it('expands an inline query into the FROM clause exactly once', () => {
		const dialect = new ClickHouseDialect();
		const inlineQueries = {
			getInterpolated: (name: string) =>
				name.trim() === 'my_query' ? '(SELECT category FROM orders)' : undefined
		} as unknown as InlineQueries;

		const config = buildRepeatQueryConfig({
			data: 'my_query',
			column: 'category',
			filterConditions: undefined,
			where: undefined,
			dialect
		});
		const { sql } = generateSQLQuery(
			config,
			undefined,
			inlineQueries,
			undefined,
			'sunday',
			dialect
		);

		expect(sql).toContain('FROM (SELECT category FROM orders)');
		expect(sql).not.toContain('"(SELECT');
	});
});
