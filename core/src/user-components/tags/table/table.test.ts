import { describe, it, expect } from 'vitest';
import { assertParses, assertRuns, queryClickHouse } from '../../../test-utils/ch-parse';
import { buildTableSQL, type TableSQLAttrs } from './build-table-sql';
import { processColumnExpression } from '../../common/sql-expression-utils';
import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect,
	type SqlDialect
} from '../../../sql-dialect';

const dialects = [
	new ClickHouseDialect(),
	new SnowflakeDialect(),
	new BigQueryDialect(),
	new FabricDialect(),
	new DatabricksDialect(),
	new PostgresDialect(),
	new CubeDialect(),
	new MotherDuckDialect()
];

type AttrsFor = (dialect: SqlDialect) => Omit<TableSQLAttrs, 'dialect'>;

function buildAllDialects(
	input: Omit<TableSQLAttrs, 'dialect' | 'unifiedColumns'> & {
		unifiedColumns:
			| UnifiedColumnDefinition[]
			| ((dialect: SqlDialect) => UnifiedColumnDefinition[]);
	}
) {
	const factory: AttrsFor = (dialect) => {
		const cols =
			typeof input.unifiedColumns === 'function'
				? input.unifiedColumns(dialect)
				: input.unifiedColumns;
		return { ...input, unifiedColumns: cols };
	};
	const sql = dialects
		.map((dialect) => {
			const { sql, error } = buildTableSQL({ ...factory(dialect), dialect });
			// A dialect that can't express the query returns an error instead of SQL.
			return error ? `ERROR: ${error}` : sql;
		})
		.join('"\n----\n"');
	return { sql };
}

// Minimal builders that mimic what DimensionModel/MeasureModel/PivotModel
// produce at runtime. Schema examples all use child components; here we
// construct the equivalent UnifiedColumnDefinition directly for tests.
function dim(value: string, date_grain?: string) {
	return (dialect: SqlDialect): UnifiedColumnDefinition => {
		const p = processColumnExpression({ value, type: 'dimension', dateGrain: date_grain }, dialect);
		return {
			type: 'dimension',
			processedColumnExpression: p,
			sqlWithAlias: p.sqlWithAlias,
			alias: p.alias,
			columnIdForRendering: p.alias,
			sqlWithoutAlias: p.sqlWithoutAlias,
			isComplexExpression: p.isComplexExpression,
			date_grain,
			isTemporalDateGrain: p.isTemporalDateGrain
		};
	};
}

function measure(value: string) {
	return (dialect: SqlDialect): UnifiedColumnDefinition => {
		const p = processColumnExpression({ value, type: 'measure' }, dialect);
		return {
			type: 'measure',
			processedColumnExpression: p,
			sqlWithAlias: p.sqlWithAlias,
			alias: p.alias,
			columnIdForRendering: p.alias,
			sqlWithoutAlias: p.sqlWithoutAlias,
			isComplexExpression: p.isComplexExpression,
			align: 'right'
		};
	};
}

function pivot(value: string, date_grain?: string) {
	return (dialect: SqlDialect): UnifiedColumnDefinition => {
		const p = processColumnExpression({ value, type: 'pivot', dateGrain: date_grain }, dialect);
		return {
			type: 'pivot',
			processedColumnExpression: p,
			sqlWithAlias: p.sqlWithAlias,
			alias: p.alias,
			columnIdForRendering: p.alias,
			sqlWithoutAlias: p.sqlWithoutAlias,
			isComplexExpression: p.isComplexExpression,
			date_grain,
			isTemporalDateGrain: p.isTemporalDateGrain
		};
	};
}

// Mimics DimensionModel's hidden image/logo/link helper column (hide=true): a
// non-grouped value wrapped in the dialect's any-value aggregate so it can ride
// alongside the GROUP BY without being a grouping key. Routed through the dialect
// seam exactly like DimensionModel does.
function hiddenAnyValueDim(value: string) {
	return (dialect: SqlDialect): UnifiedColumnDefinition => {
		const p = processColumnExpression(
			{ value: `${dialect.anyValue(value)} AS __img_${value}`, type: 'measure' },
			dialect
		);
		return {
			type: 'measure',
			processedColumnExpression: p,
			sqlWithAlias: p.sqlWithAlias,
			alias: p.alias,
			columnIdForRendering: p.alias,
			sqlWithoutAlias: p.sqlWithoutAlias,
			isComplexExpression: p.isComplexExpression,
			hide: true,
			align: 'left'
		};
	};
}

type ColFactory =
	| ReturnType<typeof dim>
	| ReturnType<typeof measure>
	| ReturnType<typeof pivot>
	| ReturnType<typeof hiddenAnyValueDim>;
function cols(...factories: ColFactory[]): (dialect: SqlDialect) => UnifiedColumnDefinition[] {
	return (dialect) => factories.map((f) => f(dialect));
}

describe('table SQL', () => {
	it('Plain table (no dims/measures → SELECT *)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: []
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
		`);
	});

	it('Basic Usage (dimension + pivot + measure)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), pivot('date', 'year'), measure('sum(total_sales)'))
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", toStartOfYear(date) AS "date__year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", DATE_TRUNC('YEAR', date) AS "DATE__YEAR", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, DATE_TRUNC(date, YEAR) AS \`date__year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", DATETRUNC(year, date) AS "date__year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, DATETRUNC(year, date)"
			----
			"SELECT category AS \`category\`, DATE_TRUNC('YEAR', date) AS \`date__year\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", DATE_TRUNC('year', date) AS "date__year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, DATE_TRUNC('year', date)"
			----
			"SELECT category AS "category", DATE_TRUNC('year', date) AS "date__year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, DATE_TRUNC('year', date)"
			----
			"SELECT category AS "category", DATE_TRUNC('year', date) AS "date__year", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
		`);
	});

	it('Calculated Measures (aliased expression)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(
				dim('category'),
				measure('sum(total_sales) / sum(transactions) as avg_price')
			)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) / sum(transactions) AS "avg_price"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) / sum(transactions) AS "avg_price"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, sum(total_sales) / sum(transactions) AS \`avg_price\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) / sum(transactions) AS "avg_price"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) / sum(transactions) AS \`avg_price\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) / sum(transactions) AS "avg_price"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) / sum(transactions) AS "avg_price"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) / sum(transactions) AS "avg_price"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
		`);
	});

	// Table SQL always classifies through a dialect (processColumnExpression defaults to
	// ClickHouse), so this covers the primary path only; the dialect-less fallback list is
	// regressed by the SUMIF tests in sql-expression-utils.test.ts.
	it('keeps ClickHouse conditional aggregate expressions in model-backed tables', () => {
		const dialect = new ClickHouseDialect();
		const expression =
			"sumIf(total_sales, category = 'Electronics') / nullif(sumIf(total_sales, category = 'Clothing'), 0)";
		const sql = buildTableSQL({
			data: 'funnel_metrics',
			unifiedColumns: [measure(expression)(dialect)],
			subtotals: true,
			dialect
		}).sql;

		assertParses(sql);
		expect(sql).toContain(`${expression} AS "`);
		expect(sql.startsWith('SELECT sumif_')).toBe(false);
	});

	it('Custom Grouping (CASE dimension)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(
				dim(
					"case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end as group"
				),
				dim('category'),
				measure('sum(total_sales)')
			)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS "group", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS "group", category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS \`group\`, category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS "group", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end, category"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS \`group\`, category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS "group", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end, category"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS "group", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end, category"
			----
			"SELECT case when category in ('Home','Clothing') then 'Home & Clothing' else 'Other' end AS "group", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
		`);
	});

	it('Subtotals enabled → GROUPING SETS', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), dim('region'), measure('sum(total_sales)')),
			subtotals: true
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(region) AS "__ev_grouping_region", CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
			----
			"SELECT category AS "CATEGORY", region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES", GROUPING(category) AS "__ev_grouping_CATEGORY", GROUPING(region) AS "__ev_grouping_REGION", CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`, GROUPING(category) AS \`__ev_grouping_category\`, GROUPING(region) AS \`__ev_grouping_region\`, CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS \`__ev_subtotal_level\`, CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS \`__ev_render_type\`
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(region) AS "__ev_grouping_region", CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`, GROUPING(category) AS \`__ev_grouping_category\`, GROUPING(region) AS \`__ev_grouping_region\`, CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS \`__ev_subtotal_level\`, CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS \`__ev_render_type\`
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(region) AS "__ev_grouping_region", CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
			----
			"ERROR: Subtotals aren't supported on cube connections — remove subtotals=true from this component."
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(region) AS "__ev_grouping_region", CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END AS "__ev_subtotal_level", CASE
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) IS NULL THEN 'cell_data'
			 WHEN (CASE WHEN GROUPING(category) + GROUPING(region) = 2 AND 0 = 0 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(region) = 1 THEN 1 WHEN GROUPING(category) = 1 AND GROUPING(region) = 1 THEN 0 ELSE NULL END) = 0 THEN 'row_total'
			 ELSE 'row_subtotal'
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, region), (category), ())"
		`);
	});

	it('Subtotals with dimension + date pivot uses bare-identifier GROUPING', () => {
		// Regression: createGroupingExpr used to wrap simple identifiers in
		// quotes ("category"), while the SELECT helpers + GROUP BY GROUPING SETS
		// used the bare form (category). On Snowflake, `category` folds to
		// CATEGORY at parse time and `"category"` is a distinct (lowercase)
		// identifier, so the render_type CASE referenced an identifier that
		// didn't exist — "invalid identifier '\"category\"'". Both forms must
		// match throughout the SQL.
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), pivot('date', 'day'), measure('sum(total_sales)')),
			subtotals: true
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", toStartOfDay(date) AS "date__day", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(toStartOfDay(date)) AS "__ev_grouping_date__day", CASE WHEN GROUPING(category) = 1 AND GROUPING(toStartOfDay(date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(toStartOfDay(date)) = 1 THEN 1 ELSE NULL END AS "__ev_subtotal_level", CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(toStartOfDay(date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(toStartOfDay(date)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(toStartOfDay(date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(toStartOfDay(date)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(toStartOfDay(date)) = 1 THEN 'column_total'
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
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, toStartOfDay(date)), (category), (toStartOfDay(date)), ())"
			----
			"SELECT category AS "CATEGORY", DATE_TRUNC('DAY', date) AS "DATE__DAY", sum(total_sales) AS "SUM_TOTAL_SALES", GROUPING(category) AS "__ev_grouping_CATEGORY", GROUPING(DATE_TRUNC('DAY', date)) AS "__ev_grouping_DATE__DAY", CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 1 ELSE NULL END AS "__ev_subtotal_level", CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 'column_total'
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
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, DATE_TRUNC('DAY', date)), (category), (DATE_TRUNC('DAY', date)), ())"
			----
			"SELECT category AS \`category\`, DATE_TRUNC(date, DAY) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`, GROUPING(category) AS \`__ev_grouping_category\`, GROUPING(DATE_TRUNC(date, DAY)) AS \`__ev_grouping_date__day\`, CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 1 ELSE NULL END AS \`__ev_subtotal_level\`, CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(DATE_TRUNC(date, DAY)) = 1 THEN 'column_total'
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
			 END AS \`__ev_render_type\`
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, DATE_TRUNC(date, DAY)), (category), (DATE_TRUNC(date, DAY)), ())"
			----
			"SELECT category AS "category", DATETRUNC(day, date) AS "date__day", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(DATETRUNC(day, date)) AS "__ev_grouping_date__day", CASE WHEN GROUPING(category) = 1 AND GROUPING(DATETRUNC(day, date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATETRUNC(day, date)) = 1 THEN 1 ELSE NULL END AS "__ev_subtotal_level", CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATETRUNC(day, date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATETRUNC(day, date)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATETRUNC(day, date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATETRUNC(day, date)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(DATETRUNC(day, date)) = 1 THEN 'column_total'
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
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, DATETRUNC(day, date)), (category), (DATETRUNC(day, date)), ())"
			----
			"SELECT category AS \`category\`, DATE_TRUNC('DAY', date) AS \`date__day\`, sum(total_sales) AS \`sum_total_sales\`, GROUPING(category) AS \`__ev_grouping_category\`, GROUPING(DATE_TRUNC('DAY', date)) AS \`__ev_grouping_date__day\`, CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 1 ELSE NULL END AS \`__ev_subtotal_level\`, CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(DATE_TRUNC('DAY', date)) = 1 THEN 'column_total'
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
			 END AS \`__ev_render_type\`
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, DATE_TRUNC('DAY', date)), (category), (DATE_TRUNC('DAY', date)), ())"
			----
			"SELECT category AS "category", DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(DATE_TRUNC('day', date)) AS "__ev_grouping_date__day", CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 1 ELSE NULL END AS "__ev_subtotal_level", CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(DATE_TRUNC('day', date)) = 1 THEN 'column_total'
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
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, DATE_TRUNC('day', date)), (category), (DATE_TRUNC('day', date)), ())"
			----
			"ERROR: Subtotals aren't supported on cube connections — remove subtotals=true from this component."
			----
			"SELECT category AS "category", DATE_TRUNC('day', date) AS "date__day", sum(total_sales) AS "sum_total_sales", GROUPING(category) AS "__ev_grouping_category", GROUPING(DATE_TRUNC('day', date)) AS "__ev_grouping_date__day", CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 1 ELSE NULL END AS "__ev_subtotal_level", CASE
			 /* Detail rows have no subtotal level */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 1 ELSE NULL END) IS NULL THEN 'cell_data'

			 /* Grand totals (level 0) */
			 WHEN (CASE WHEN GROUPING(category) = 1 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 0 WHEN GROUPING(category) = 1 THEN 0 WHEN GROUPING(category) = 0 AND GROUPING(DATE_TRUNC('day', date)) = 1 THEN 1 ELSE NULL END) = 0 THEN
			 CASE
			 /* If all dimensions are NULL, it's a row total */
									WHEN GROUPING(category) = 1 THEN 'row_total'
									/* If all pivots are NULL, it's a column total */
			 WHEN GROUPING(DATE_TRUNC('day', date)) = 1 THEN 'column_total'
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
			 END AS "__ev_render_type"
			 FROM demo.daily_orders
			 
			 GROUP BY GROUPING SETS ((category, DATE_TRUNC('day', date)), (category), (DATE_TRUNC('day', date)), ())"
		`);
	});

	it('sorts a grained date dimension by the grouped expression, not the raw column', () => {
		const dialect = new ClickHouseDialect();
		const { sql } = buildTableSQL({
			data: 'demo.daily_orders',
			unifiedColumns: cols(
				dim('category'),
				dim('date', 'day'),
				measure('sum(total_sales)')
			)(dialect),
			order: 'date desc, category asc',
			dialect
		});
		expect(sql).toContain('GROUP BY ALL');
		expect(sql).toContain('ORDER BY "date__day" desc, category asc');
		assertRuns(sql);
	});

	it('aggregates a subtotal sort key that is outside the grouping sets', () => {
		const dialect = new ClickHouseDialect();
		const { sql } = buildTableSQL({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), dim('region'), measure('sum(total_sales)'))(dialect),
			order: 'unit_price desc',
			subtotals: true,
			dialect
		});
		expect(sql).toContain('MAX(unit_price) AS "unit_price"');
		expect(sql).toContain('GROUP BY GROUPING SETS ((category, region), (category), ())');
		assertRuns(sql);
	});

	// ORDER BY re-evaluates an expression rather than reading the alias, so wrapping one
	// would add a column nothing sorts by on a query the warehouse rejects either way.
	it('leaves a subtotal sort key alone when it is not a bare identifier', () => {
		const dialect = new ClickHouseDialect();
		const { sql } = buildTableSQL({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), measure('sum(total_sales)'))(dialect),
			order: 'lower(region) desc',
			subtotals: true,
			dialect
		});
		expect(sql).toContain(', lower(region)');
		expect(sql).not.toContain('any(lower(region))');
	});

	it('Pagination (page_size + offset)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), measure('sum(total_sales)')),
			page_size: 25,
			offset: 50
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 25 OFFSET 50"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 25 OFFSET 50"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 25 OFFSET 50"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category ORDER BY (SELECT NULL) OFFSET 50 ROWS FETCH NEXT 25 ROWS ONLY"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 25 OFFSET 50"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category LIMIT 25 OFFSET 50"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category LIMIT 25 OFFSET 50"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 25 OFFSET 50"
		`);
	});

	it('Search term + columns produces ILIKE predicates', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), measure('sum(total_sales)')),
			search: { term: 'shoes', columns: ['category'] }
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 HAVING ((CAST("category" AS Nullable(String)) ILIKE '%shoes%'))"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 HAVING ((CAST("CATEGORY" AS VARCHAR) ILIKE '%shoes%'))"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 HAVING ((LOWER(CAST(\`category\` AS STRING)) LIKE LOWER('%shoes%')))"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 HAVING ((LOWER(CAST("category" AS VARCHAR(MAX))) LIKE LOWER('%shoes%')))"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 HAVING ((CAST(\`category\` AS STRING) ILIKE '%shoes%'))"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 HAVING ((CAST("category" AS TEXT) ILIKE '%shoes%'))"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 HAVING ((LOWER(CAST("category" AS TEXT)) LIKE LOWER('%shoes%')))"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 HAVING ((CAST("category" AS VARCHAR) ILIKE '%shoes%'))"
		`);
	});

	it('date_range filters main query', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), measure('sum(total_sales)')),
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
		`);
	});

	it('groups Decimal measures by a date grain on the ranged ClickHouse column', () => {
		const dialect = new ClickHouseDialect();
		const { sql } = buildTableSQL({
			data: `(
				SELECT *
				FROM VALUES(
					'day Date, location_name String, first_of_month_billing Decimal64(2)',
					('2025-12-03', 'Austin', 1306.25),
					('2026-01-01', 'Austin', 2081.50),
					('2025-12-03', 'Boston', 1406.75),
					('2026-01-01', 'Boston', 1194.95)
				)
			)`,
			dataIsSql: true,
			unifiedColumns: cols(
				dim('day', 'month'),
				dim('location_name'),
				measure('sum(first_of_month_billing)')
			)(dialect),
			date_range: { date: 'day', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1),
			order: 'day desc',
			dialect
		});

		expect(sql).toContain('GROUP BY ALL');
		expect(sql).toContain('ORDER BY "day__month" desc');
		expect(queryClickHouse(sql).trim().split('\n').sort()).toEqual([
			'2025-12-01\tAustin\t1306.25',
			'2025-12-01\tBoston\t1406.75',
			'2026-01-01\tAustin\t2081.5',
			'2026-01-01\tBoston\t1194.95'
		]);
	});

	// Regression: BQ-only aggregations (countif, logical_and, etc.) used to be
	// misclassified as non-aggregating because hasAgg's hardcoded list didn't
	// know about them. The measure was then emitted as a bare alias in SELECT
	// and added to GROUPING SETS as if it were a dimension, producing
	// "Unrecognized name: successful" at query time. hasAgg now consults the
	// dialect's aggregationFunctions set.
	it('classifies BQ-only aggregations (countif) as measures, not dimensions', () => {
		const { sql } = buildAllDialects({
			data: 'demo.builds',
			unifiedColumns: cols(
				dim('timestamp', 'year'),
				measure('countif(build_success) as successful')
			),
			subtotals: true
		});
		assertParses(sql.split('"\n----')[0]);
		// BQ snapshot: GROUPING SETS must contain only the dimension expression
		// (DATE_TRUNC(timestamp, YEAR)), not `successful`.
		const bqSql = sql.split('"\n----\n"')[2];
		expect(bqSql).toContain('countif(build_success) AS `successful`');
		expect(bqSql).toMatch(/GROUP BY GROUPING SETS \(\(DATE_TRUNC\(timestamp, YEAR\)\), \(\)\)/);
		expect(bqSql).not.toMatch(/GROUPING\(successful\)/);
	});

	// Regression: a hidden helper column (e.g. a dimension's `image`/`link` URL, or
	// a `hide=true` dimension) is wrapped in an any-value aggregate so it rides
	// alongside the GROUP BY. This was hardcoded to ClickHouse's `any(...)`, which
	// is invalid on Snowflake (no `ANY` aggregate) and BigQuery — it must go through
	// the dialect's `anyValue` seam: ANY_VALUE on Snowflake/BigQuery, MAX on Fabric.
	it('wraps hidden helper columns via the dialect any-value aggregate', () => {
		const { sql } = buildAllDialects({
			data: 'demo.products',
			unifiedColumns: cols(dim('category'), measure('sum(total)'), hiddenAnyValueDim('image_url'))
		});
		assertParses(sql.split('"\n----')[0]);

		const [chSql, snowSql, bqSql, fabricSql] = sql.split('"\n----\n"');

		// ClickHouse keeps `any(...)`.
		expect(chSql).toContain('any(image_url)');

		// Snowflake: ANY_VALUE, never a bare ANY(...) which Snowflake has no aggregate for.
		expect(snowSql).toContain('ANY_VALUE(image_url)');
		expect(snowSql).not.toMatch(/\bany\(image_url\)/i);

		// BigQuery: ANY_VALUE.
		expect(bqSql).toContain('ANY_VALUE(image_url)');

		// Fabric (T-SQL): MAX, and the helper is recognised as an aggregate so it is
		// NOT added to the explicit GROUP BY (which lists only the grouped dimension).
		expect(fabricSql).toContain('MAX(image_url)');
		expect(fabricSql).toMatch(/GROUP BY category$/m);
		expect(fabricSql).not.toContain('GROUP BY category, MAX(image_url)');
	});

	it('SnowflakeDialect.anyValue emits ANY_VALUE', () => {
		expect(new SnowflakeDialect().anyValue('x')).toBe('ANY_VALUE(x)');
		expect(new ClickHouseDialect().anyValue('x')).toBe('any(x)');
		expect(new BigQueryDialect().anyValue('x')).toBe('ANY_VALUE(x)');
		expect(new FabricDialect().anyValue('x')).toBe('MAX(x)');
	});

	it('limit disables subtotals even when subtotals=true', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			unifiedColumns: cols(dim('category'), dim('region'), measure('sum(total_sales)')),
			subtotals: true,
			limit: 10
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 10"
			----
			"SELECT category AS "CATEGORY", region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 10"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 10"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY"
			----
			"SELECT category AS \`category\`, region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 10"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region LIMIT 10"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, region LIMIT 10"
			----
			"SELECT category AS "category", region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL LIMIT 10"
		`);
	});
});

// TableModel is the only component that hands generateSQLQuery built SQL instead
// of a table name, so the wrapper has to survive while a plain `data` stays quoted.
describe('table pre-resolved table expression', () => {
	const dialect = new ClickHouseDialect();

	it('keeps a row_conditional_colors wrapper intact', () => {
		const { sql } = buildTableSQL({
			data: `(SELECT *, 'red' AS __row_conditional_colors FROM demo.daily_orders)`,
			dataIsSql: true,
			unifiedColumns: [],
			dialect
		});

		expect(sql).toContain(
			`FROM (SELECT *, 'red' AS __row_conditional_colors FROM demo.daily_orders)`
		);
	});

	it('quotes the same shape when the table name is just data', () => {
		const { sql } = buildTableSQL({
			data: `(SELECT 'HACKED' AS x FROM secrets)`,
			unifiedColumns: [],
			dialect
		});

		expect(sql).toContain(`FROM "(SELECT 'HACKED' AS x FROM secrets)"`);
	});
});
