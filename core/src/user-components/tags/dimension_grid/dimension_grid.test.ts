import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildDimensionGridQuery } from './build-dimension-grid-sql';
import { DimensionGridFilter } from './DimensionGridFilter.svelte';
import { ClickHouseDialect } from '../../../sql-dialect';

// dimension_grid embeds a raw CTE with ClickHouse-specific `nullIf` and portable
// window functions (row_number, max OVER ()). Pinned here so a dialect swap
// (nullIf → NULLIF, etc.) shows up as a snapshot mismatch.
describe('dimension_grid SQL', () => {
	it('Basic Usage (no selections, no filters)', () => {
		const sql = buildDimensionGridQuery({
			tableExpression: 'demo.orders',
			dimension: 'category',
			metric: 'count(*)',
			limit: 10
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"WITH ranked AS (
				SELECT
					category AS "dimension_value",
					count(*) AS "metric_value",
					count(*) / nullIf(max(count(*)) OVER (), 0) AS "percent_of_top",
					row_number() OVER (ORDER BY count(*) DESC) AS "rn"
				FROM demo.orders
				WHERE category IS NOT NULL
				GROUP BY category
			)
			SELECT "dimension_value", "metric_value", "percent_of_top"
			FROM ranked
			WHERE "rn" <= 10
			ORDER BY "metric_value" DESC"
		`);
	});

	it('with baseWhereClause', () => {
		const sql = buildDimensionGridQuery({
			tableExpression: 'demo.orders',
			dimension: 'category',
			metric: 'count(*)',
			limit: 10,
			baseWhereClause: "(region = 'US')"
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"WITH ranked AS (
				SELECT
					category AS "dimension_value",
					count(*) AS "metric_value",
					count(*) / nullIf(max(count(*)) OVER (), 0) AS "percent_of_top",
					row_number() OVER (ORDER BY count(*) DESC) AS "rn"
				FROM demo.orders
				WHERE category IS NOT NULL AND (region = 'US')
				GROUP BY category
			)
			SELECT "dimension_value", "metric_value", "percent_of_top"
			FROM ranked
			WHERE "rn" <= 10
			ORDER BY "metric_value" DESC"
		`);
	});

	it('with cross-filter + selections (UNION ALL branch)', () => {
		const sql = buildDimensionGridQuery({
			tableExpression: 'demo.orders',
			dimension: 'category',
			metric: 'count(*)',
			limit: 10,
			crossFilterClause: "(region IN ('US'))",
			selectedValues: ['Home', 'Clothing']
		});
		assertParses(sql);
		expect(sql).toMatchInlineSnapshot(`
			"WITH ranked AS (
				SELECT
					category AS "dimension_value",
					count(*) AS "metric_value",
					count(*) / nullIf(max(count(*)) OVER (), 0) AS "percent_of_top",
					row_number() OVER (ORDER BY count(*) DESC) AS "rn"
				FROM demo.orders
				WHERE category IS NOT NULL AND (region IN ('US'))
				GROUP BY category
			)
			SELECT "dimension_value", "metric_value", "percent_of_top"
			FROM ranked
			WHERE "rn" <= 10
			UNION ALL
			SELECT "dimension_value", "metric_value", "percent_of_top"
			FROM ranked
			WHERE "dimension_value" IN ('Home', 'Clothing')
				AND "rn" > 10
			ORDER BY "metric_value" DESC"
		`);
	});

	it('escapes single-quote in selected values', () => {
		const sql = buildDimensionGridQuery({
			tableExpression: 'demo.orders',
			dimension: 'category',
			metric: 'count(*)',
			limit: 10,
			selectedValues: ["O'Reilly"]
		});
		assertParses(sql);
		expect(sql).toContain("'O\\'Reilly'");
	});
});

// The value is JSON from a URL param, so both halves are hostile: the value lands in a string
// literal, the key lands where a column name goes and escaping cannot help there.
describe('DimensionGridFilter rejects hostile URL state', () => {
	const VALUE_PAYLOAD = String.raw`x\' UNION ALL SELECT 1 --`;
	const KEY_PAYLOAD = '1=1 OR (SELECT 1)=1';

	function makeFilter(value: unknown, attributes: Record<string, unknown> = {}) {
		return new DimensionGridFilter(
			{ id: 'grid', userComponentName: 'dimension_grid', attributes } as never,
			{
				url: new URL(`https://example.com/p?grid=${encodeURIComponent(JSON.stringify(value))}`),
				updateUrl: undefined,
				projectSettings: undefined,
				dialect: new ClickHouseDialect()
			}
		);
	}

	it('escapes selected values for the dialect', () => {
		const filter = makeFilter({ category: VALUE_PAYLOAD }, { _dimensionColumns: ['category'] });
		expect(filter.sql).toBe(String.raw`category = 'x\\\' UNION ALL SELECT 1 --'`);
		expect(filter.templateValues.category).toBe(String.raw`'x\\\' UNION ALL SELECT 1 --'`);
	});

	it('drops a dimension the grid never detected', () => {
		const filter = makeFilter(
			{ [KEY_PAYLOAD]: 'x', category: 'Books' },
			{ _dimensionColumns: ['category'] }
		);
		expect(filter.sql).toBe("category = 'Books'");
		expect(filter.templateValues.selected).toEqual({ category: 'Books' });
		expect(filter.templateValues[KEY_PAYLOAD]).toBeUndefined();
		expect(filter.templateValues.literal).toBe('category: Books');
	});

	it('quotes an injected dimension when no columns are declared yet, so it cannot carry SQL', () => {
		const filter = makeFilter({ [KEY_PAYLOAD]: 'x' });
		expect(filter.sql).toBe(`"${KEY_PAYLOAD}" = 'x'`);
		assertParses(`SELECT * FROM t WHERE ${filter.sql}`);
	});

	it('leaves a plain column name bare when no columns are declared yet', () => {
		// Quoting here would break case-folding warehouses, and a bare identifier carries no SQL.
		expect(makeFilter({ category: 'Books' }).sql).toBe("category = 'Books'");
	});

	it('drops a key containing a backslash, which identifier quoting cannot neutralise', () => {
		expect(makeFilter({ 'a\\': 'x' }).sql).toBeUndefined();
	});

	it('renders a column the same way before and after detection completes', () => {
		// Detection runs in an effect, so SSR sees no declared columns and the browser does. A
		// name that needs quoting must not come out bare on one side and quoted on the other.
		const beforeDetection = makeFilter({ 'Order Status': 'Shipped' });
		const afterDetection = makeFilter(
			{ 'Order Status': 'Shipped' },
			{ _dimensionColumns: ['Order Status'] }
		);
		expect(afterDetection.sql).toBe(beforeDetection.sql);
		expect(afterDetection.sql).toBe(`"Order Status" = 'Shipped'`);
	});

	it('accepts a non-string selection instead of throwing', () => {
		// The value is JSON from the URL, so a number is one keystroke away.
		expect(makeFilter({ category: [1, 2] }).sql).toBe("category IN ('1', '2')");
		expect(
			buildDimensionGridQuery({
				tableExpression: 'demo.orders',
				dimension: 'category',
				metric: 'count(*)',
				limit: 10,
				selectedValues: [1 as unknown as string],
				dialect: new ClickHouseDialect()
			})
		).toContain("IN ('1')");
	});

	it('escapes selected values threaded into the top-N query', () => {
		const sql = buildDimensionGridQuery({
			tableExpression: 'demo.orders',
			dimension: 'category',
			metric: 'count(*)',
			limit: 10,
			selectedValues: [VALUE_PAYLOAD],
			dialect: new ClickHouseDialect()
		});
		expect(sql).toContain(String.raw`IN ('x\\\' UNION ALL SELECT 1 --')`);
		assertParses(sql);
	});
});
