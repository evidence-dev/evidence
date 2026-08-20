import { describe, it, expect } from 'vitest';
import { buildSparklines } from './build-sparklines';
import type { SparklineContext, SparklineQueryConfig } from './build-sparklines';
import { processColumnExpression } from './sql-expression-utils';
import { generateSQLQuery } from './sql-options';
import { ClickHouseDialect } from '../../sql-dialect';

const dialect = new ClickHouseDialect();

describe('buildSparklines', () => {
	describe('with subtotals=false (GROUP BY ALL)', () => {
		it('should include dimension columns in sparkline GROUP BY', () => {
			// Setup: table with category dimension and sparkline measure
			const dimensionCol = processColumnExpression({
				value: 'category',
				type: 'dimension'
			}, dialect);
			const measureCol = processColumnExpression({
				value: 'sum(total_sales)',
				type: 'measure'
			}, dialect);

			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL', // This is what happens when subtotals=false
				processedColumns: [dimensionCol, measureCol].filter((c) => c !== null)
			};

			const sparklines: SparklineQueryConfig[] = [
				{
					id: 'sum_total_sales_sparkline',
					xColumn: 'toStartOfMonth(date)',
					yColumn: 'sum(total_sales)'
				}
			];

			const result = buildSparklines(sparklines, context, undefined, 'sunday', dialect);

			// The sparkline fragment should be generated
			expect(result.fragments.length).toBe(1);

			const fragmentSQL = result.fragments[0].cteSql;

			// The inner query should GROUP BY both category AND toStartOfMonth(date)
			// Not just toStartOfMonth(date) alone
			expect(fragmentSQL).toContain('GROUP BY');
			expect(fragmentSQL).toContain('category');
			expect(fragmentSQL).toContain('toStartOfMonth(date)');

			// Verify the GROUP BY includes both dimensions in correct order
			// Should have: GROUP BY category, toStartOfMonth(date)
			expect(fragmentSQL).toMatch(/GROUP BY\s+category,\s*toStartOfMonth\(date\)/i);
		});

		it('should include multiple dimension columns in sparkline GROUP BY', () => {
			// Setup: table with multiple dimensions
			const categoryCol = processColumnExpression({
				value: 'category',
				type: 'dimension'
			}, dialect);
			const regionCol = processColumnExpression({
				value: 'region',
				type: 'dimension'
			}, dialect);
			const measureCol = processColumnExpression({
				value: 'sum(total_sales)',
				type: 'measure'
			}, dialect);

			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL',
				processedColumns: [categoryCol, regionCol, measureCol].filter((c) => c !== null)
			};

			const sparklines: SparklineQueryConfig[] = [
				{
					id: 'sum_total_sales_sparkline',
					xColumn: 'toStartOfMonth(date)',
					yColumn: 'sum(total_sales)'
				}
			];

			const result = buildSparklines(sparklines, context, undefined, 'sunday', dialect);

			expect(result.fragments.length).toBe(1);
			const fragmentSQL = result.fragments[0].cteSql;

			// Should include all dimensions in GROUP BY
			expect(fragmentSQL).toContain('category');
			expect(fragmentSQL).toContain('region');
			expect(fragmentSQL).toContain('toStartOfMonth(date)');
		});
	});

	describe('with subtotals=true (GROUPING SETS)', () => {
		it('should extend GROUPING SETS with x-column', () => {
			const dimensionCol = processColumnExpression({
				value: 'category',
				type: 'dimension'
			}, dialect);
			const measureCol = processColumnExpression({
				value: 'sum(total_sales)',
				type: 'measure'
			}, dialect);

			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				// This is what happens when subtotals=true
				groupByClause: 'GROUP BY GROUPING SETS ((category), ())',
				processedColumns: [dimensionCol, measureCol].filter((c) => c !== null)
			};

			const sparklines: SparklineQueryConfig[] = [
				{
					id: 'sum_total_sales_sparkline',
					xColumn: 'toStartOfMonth(date)',
					yColumn: 'sum(total_sales)'
				}
			];

			const result = buildSparklines(sparklines, context, undefined, 'sunday', dialect);

			expect(result.fragments.length).toBe(1);
			const fragmentSQL = result.fragments[0].cteSql;

			// Should use GROUPING SETS with extended sets
			expect(fragmentSQL).toContain('GROUPING SETS');
			expect(fragmentSQL).toContain('category');
			expect(fragmentSQL).toContain('toStartOfMonth(date)');

			// Should have (category, toStartOfMonth(date)) and (toStartOfMonth(date)) sets
			expect(fragmentSQL).toMatch(
				/GROUPING SETS\s*\(\s*\([^)]*category[^)]*toStartOfMonth\(date\)[^)]*\)/i
			);
		});
	});

	describe('without dimensions (single-value components)', () => {
		it('should use inline subqueries for sparklines', () => {
			const measureCol = processColumnExpression({
				value: 'sum(total_sales)',
				type: 'measure'
			}, dialect);

			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL',
				processedColumns: [measureCol].filter((c) => c !== null)
			};

			const sparklines: SparklineQueryConfig[] = [
				{
					id: 'sum_total_sales_sparkline',
					xColumn: 'date',
					yColumn: 'sum(total_sales)'
				}
			];

			const result = buildSparklines(sparklines, context, undefined, 'sunday', dialect);

			// Should generate inline column, not fragment
			expect(result.fragments.length).toBe(0);
			expect(result.inlineColumns.length).toBe(1);
			expect(result.inlineColumns[0]).toContain('arraySort');
			expect(result.inlineColumns[0]).toContain('groupArray');
		});
	});

	describe('Integration test: full SQL generation', () => {
		it('should generate correct SQL for table without subtotals matching the issue scenario', () => {
			// This is the exact scenario from the issue:
			// {% table data="demo.daily_orders" subtotals=false %}
			// {% dimension value="category" /%}
			// {% measure value="sum(total_sales)" viz="sparkline" sparkline_options={ x="date" } /%}
			// {% /table %}

			const dimensionCol = processColumnExpression({
				value: 'category',
				type: 'dimension'
			}, dialect);

			const measureCol = processColumnExpression({
				value: 'sum(total_sales)',
				type: 'measure'
			}, dialect);

			const config = {
				tableExpressionName: 'demo.daily_orders',
				columns: [dimensionCol, measureCol].filter((c) => c !== null),
				subtotals: false, // KEY: subtotals=false
				sparklines: [
					{
						id: 'sum_total_sales_sparkline',
						xColumn: 'toStartOfMonth(date)',
						yColumn: 'sum(total_sales)'
					}
				],
				hasDimensions: true,
				hasMeasures: true
			};

			const result = generateSQLQuery(
				config,
				/* filterContexts */ undefined,
				/* inlineQueries */ undefined,
				/* anchorDate */ undefined,
				/* firstDayOfWeek */ 'sunday',
				dialect
			);

			// The sparkline fragment should be included
			expect(result.sql).toContain('sparkline_1_fragment');

			// The fix: the inner query should GROUP BY category, toStartOfMonth(date)
			// NOT just toStartOfMonth(date) (which was the bug)
			expect(result.sql).toContain('GROUP BY category, toStartOfMonth(date)');
		});
	});

	describe('full SQL output', () => {
		const sparkline: SparklineQueryConfig = {
			id: 'sum_total_sales_sparkline',
			xColumn: 'toStartOfMonth(date)',
			yColumn: 'sum(total_sales)'
		};

		it('GROUP BY ALL with one dimension column', () => {
			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL',
				processedColumns: [
					processColumnExpression({ value: 'category', type: 'dimension' }),
					processColumnExpression({ value: 'sum(total_sales)', type: 'measure' })
				]
			};
			const result = buildSparklines([sparkline], context);

			expect(result.fragments).toHaveLength(1);
			expect(result.fragments[0].alias).toMatchInlineSnapshot(`"sparkline_1_fragment"`);
			expect(result.fragments[0].cteSql).toMatchInlineSnapshot(`
				"SELECT category, arraySort(x -> x.1, groupArray((x_val, y_val))) as "sum_total_sales_sparkline"
				 FROM (SELECT category AS "category", toStartOfMonth(date) as x_val, sum(total_sales) as y_val
				 FROM demo.daily_orders
				 
				 GROUP BY category, toStartOfMonth(date)) as "__ev_spark_src"
				 GROUP BY category"
			`);
			expect(result.fragments[0].joinSql).toMatchInlineSnapshot(
				`"LEFT JOIN sparkline_1_fragment ON main_query."category" <=> sparkline_1_fragment."category""`
			);
			expect(result.fragments[0].calculationColumns).toMatchInlineSnapshot(`
				[
				  "sparkline_1_fragment."sum_total_sales_sparkline"",
				]
			`);
			expect(result.inlineColumns).toMatchInlineSnapshot(`[]`);
		});

		it('GROUP BY ALL with two dimension columns', () => {
			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL',
				processedColumns: [
					processColumnExpression({ value: 'category', type: 'dimension' }),
					processColumnExpression({ value: 'region', type: 'dimension' }),
					processColumnExpression({ value: 'sum(total_sales)', type: 'measure' })
				]
			};
			const result = buildSparklines([sparkline], context);

			expect(result.fragments).toHaveLength(1);
			expect(result.fragments[0].cteSql).toMatchInlineSnapshot(`
				"SELECT category, region, arraySort(x -> x.1, groupArray((x_val, y_val))) as "sum_total_sales_sparkline"
				 FROM (SELECT category AS "category", region AS "region", toStartOfMonth(date) as x_val, sum(total_sales) as y_val
				 FROM demo.daily_orders
				 
				 GROUP BY category, region, toStartOfMonth(date)) as "__ev_spark_src"
				 GROUP BY category, region"
			`);
		});

		it('GROUPING SETS with one dimension column (subtotals=true)', () => {
			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY GROUPING SETS ((category), ())',
				processedColumns: [
					processColumnExpression({ value: 'category', type: 'dimension' }),
					processColumnExpression({ value: 'sum(total_sales)', type: 'measure' })
				]
			};
			const result = buildSparklines([sparkline], context);

			expect(result.fragments).toHaveLength(1);
			expect(result.fragments[0].cteSql).toMatchInlineSnapshot(`
				"SELECT category, arraySort(x -> x.1, groupArray((x_val, y_val))) as "sum_total_sales_sparkline"
				 FROM (SELECT category AS "category", toStartOfMonth(date) as x_val, sum(total_sales) as y_val
				 FROM demo.daily_orders
				 
				 GROUP BY GROUPING SETS ((category, toStartOfMonth(date)), (toStartOfMonth(date)))) as "__ev_spark_src"
				 GROUP BY category"
			`);
			expect(result.fragments[0].joinSql).toMatchInlineSnapshot(
				`"LEFT JOIN sparkline_1_fragment ON main_query."category" <=> sparkline_1_fragment."category""`
			);
		});

		it('inline subquery when there are no dimensions (single-value)', () => {
			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL',
				processedColumns: [processColumnExpression({ value: 'sum(total_sales)', type: 'measure' })]
			};
			const result = buildSparklines(
				[{ id: 'sum_total_sales_sparkline', xColumn: 'date', yColumn: 'sum(total_sales)' }],
				context
			);

			expect(result.fragments).toEqual([]);
			expect(result.inlineColumns).toMatchInlineSnapshot(`
				[
				  "(
						SELECT arraySort(x -> x.1, groupArray((x_val, y_val)))
						FROM (
							SELECT date as x_val, sum(total_sales) as y_val
							FROM demo.daily_orders
							
							GROUP BY x_val
							ORDER BY x_val
						) as "__ev_spark_src"
					) as "sum_total_sales_sparkline"",
				]
			`);
		});

		it('embeds filterSql and userWhere into the inner WHERE of the fragment', () => {
			const context: SparklineContext = {
				tableExpression: 'demo.daily_orders',
				whereClause: '',
				groupByClause: 'GROUP BY ALL',
				processedColumns: [
					processColumnExpression({ value: 'category', type: 'dimension' }),
					processColumnExpression({ value: 'sum(total_sales)', type: 'measure' })
				],
				filterSql: 'tenant_id = 7',
				userWhere: "region = 'EU'"
			};
			const result = buildSparklines([sparkline], context);

			expect(result.fragments).toHaveLength(1);
			expect(result.fragments[0].cteSql).toMatchInlineSnapshot(`
				"SELECT category, arraySort(x -> x.1, groupArray((x_val, y_val))) as "sum_total_sales_sparkline"
				 FROM (SELECT category AS "category", toStartOfMonth(date) as x_val, sum(total_sales) as y_val
				 FROM demo.daily_orders
				 WHERE (tenant_id = 7) AND (region = 'EU')
				 GROUP BY category, toStartOfMonth(date)) as "__ev_spark_src"
				 GROUP BY category"
			`);
		});
	});
});
