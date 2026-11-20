import { describe, it, expect } from 'vitest';
import { assertParses, queryClickHouse } from '../../../test-utils/ch-parse';
import { buildHistogramSQL, type HistogramSQLAttrs } from './build-histogram-sql';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	SqlServerDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	RedshiftDialect,
	MotherDuckDialect,
	AthenaDialect
} from '../../../sql-dialect';

const dialects = [
	new ClickHouseDialect(),
	new SnowflakeDialect(),
	new BigQueryDialect(),
	new FabricDialect(),
	new SqlServerDialect(),
	new DatabricksDialect(),
	new PostgresDialect(),
	new CubeDialect(),
	new RedshiftDialect(),
	new AthenaDialect(),
	new MotherDuckDialect()
];

function buildAllDialects(attrs: Omit<HistogramSQLAttrs, 'dialect'>) {
	return dialects.map((dialect) => buildHistogramSQL({ ...attrs, dialect })).join('"\n----\n"');
}

describe('histogram SQL', () => {
	it('Basic Usage (schema example)', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'transactions',
			bin_count: 30
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS \`min_val\`,
								max(transactions) AS \`max_val\`,
								ceil(2 * power(count(*), 1.0 / 3)) AS \`rice_bin_count\`
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats.\`min_val\`) / (CASE WHEN stats.\`min_val\` = stats.\`max_val\` THEN 1 ELSE ((stats.\`max_val\` - stats.\`min_val\`) / 30) END)) AS \`bin_index\`,
								stats.\`min_val\` AS \`min_val\`,
								(CASE WHEN stats.\`min_val\` = stats.\`max_val\` THEN 1 ELSE ((stats.\`max_val\` - stats.\`min_val\`) / 30) END) AS \`bin_width\`
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							\`bin_index\`,
							\`min_val\` + \`bin_index\` * \`bin_width\` AS \`bin_start\`,
							\`min_val\` + (\`bin_index\` + 1) * \`bin_width\` AS \`bin_end\`,
							
							count(*) AS \`frequency\`
						FROM binned
						GROUP BY
							\`bin_index\`,
							\`min_val\`,
							\`bin_width\`
						ORDER BY
							\`bin_index\`
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								CEILING(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") * 1.0 / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								CEILING(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") * 1.0 / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS \`min_val\`,
								max(transactions) AS \`max_val\`,
								ceil(2 * power(count(*), 1.0 / 3)) AS \`rice_bin_count\`
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats.\`min_val\`) / (CASE WHEN stats.\`min_val\` = stats.\`max_val\` THEN 1 ELSE ((stats.\`max_val\` - stats.\`min_val\`) / 30) END)) AS \`bin_index\`,
								stats.\`min_val\` AS \`min_val\`,
								(CASE WHEN stats.\`min_val\` = stats.\`max_val\` THEN 1 ELSE ((stats.\`max_val\` - stats.\`min_val\`) / 30) END) AS \`bin_width\`
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							\`bin_index\`,
							\`min_val\` + \`bin_index\` * \`bin_width\` AS \`bin_start\`,
							\`min_val\` + (\`bin_index\` + 1) * \`bin_width\` AS \`bin_end\`,
							
							count(*) AS \`frequency\`
						FROM binned
						GROUP BY
							\`bin_index\`,
							\`min_val\`,
							\`bin_width\`
						ORDER BY
							\`bin_index\`
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") * 1.0 / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") * 1.0 / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM (
							SELECT
								floor((transactions - stats."min_val") * 1.0 / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
							) AS stats
							
						) AS binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") * 1.0 / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") * 1.0 / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
			----
			"
						WITH stats AS (
							SELECT
								min(transactions) AS "min_val",
								max(transactions) AS "max_val",
								ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"
							FROM demo.daily_orders
							
						),
						binned AS (
							SELECT
								floor((transactions - stats."min_val") / (CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") / 30) END)) AS "bin_index",
								stats."min_val" AS "min_val",
								(CASE WHEN stats."min_val" = stats."max_val" THEN 1 ELSE ((stats."max_val" - stats."min_val") / 30) END) AS "bin_width"
							FROM demo.daily_orders
							CROSS JOIN stats
							
						)
						SELECT
							"bin_index",
							"min_val" + "bin_index" * "bin_width" AS "bin_start",
							"min_val" + ("bin_index" + 1) * "bin_width" AS "bin_end",
							
							count(*) AS "frequency"
						FROM binned
						GROUP BY
							"bin_index",
							"min_val",
							"bin_width"
						ORDER BY
							"bin_index"
						
					"
		`);
	});

	it('default bin_count uses rice rule via stats CTE', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'total_sales'
		});
		expect(sql).toContain('ceil(2 * power(count(*), 1.0 / 3)) AS "rice_bin_count"');
		expect(sql).toContain('stats."rice_bin_count"');
	});

	it('explicit bin_width is used inline as the divisor', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'total_sales',
			bin_count: 10,
			bin_width: 100
		});
		// bin_width literal wins over bin_count
		expect(sql).toContain('floor((total_sales - stats."min_val") / 100)');
		expect(sql).toContain('100 AS "bin_width"');
	});

	it('explicit bin_count divides (max - min) inline', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'total_sales',
			bin_count: 10
		});
		expect(sql).toContain('((stats."max_val" - stats."min_val") / 10)');
	});

	it('series column adds grouping + ordering', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'transactions',
			series: 'region',
			bin_count: 20
		});
		expect(sql).toMatch(/GROUP BY[\s\S]*region/);
		expect(sql).toMatch(/ORDER BY[\s\S]*"bin_index",[\s\S]*region/);
	});

	it('where clause injected into stats CTE and binned CTE', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'transactions',
			where: "category = 'Home'",
			bin_count: 20
		});
		// stats CTE + binned CTE per dialect = 2 × 2 = 4 occurrences
		expect(sql.match(/WHERE category = 'Home'/g)).toHaveLength(2 * dialects.length);
	});

	it('where + filterSql combined with parens', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'transactions',
			where: "category = 'Home'",
			filterSql: "region = 'US'",
			bin_count: 20
		});
		expect(sql.match(/WHERE \(category = 'Home'\) AND \(region = 'US'\)/g)).toHaveLength(
			2 * dialects.length
		);
	});

	it('filterSql alone', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'transactions',
			filterSql: "region = 'US'",
			bin_count: 20
		});
		expect(sql.match(/WHERE region = 'US'/g)).toHaveLength(2 * dialects.length);
	});

	it('limit appended when provided', () => {
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'transactions',
			bin_count: 20,
			limit: 500
		});
		expect(sql).toContain('LIMIT 500');
	});

	it('expression value (multiplied) used verbatim in min/max/floor', () => {
		// Histogram's value attribute accepts a SQL expression; ensure it's substituted
		// verbatim into min/max in the stats CTE and the floor() binning expression.
		const sql = buildAllDialects({
			data: 'demo.daily_orders',
			value: 'total_sales * 1.1',
			bin_count: 20
		});
		expect(sql).toContain('min(total_sales * 1.1)');
		expect(sql).toContain('max(total_sales * 1.1)');
		expect(sql).toContain('floor((total_sales * 1.1 - stats."min_val"');
	});

	// Redshift rejects a WITH inside a CTE body; an inline query written with CTEs
	// would land in both `stats` and `binned`, so the query nests derived tables.
	it('nests derived tables instead of CTEs on Redshift', () => {
		const sql = buildHistogramSQL({
			data: '(WITH recent AS (SELECT * FROM demo.daily_orders) SELECT * FROM recent) "__ev_inline_orders"',
			value: 'transactions',
			bin_count: 30,
			dialect: new RedshiftDialect()
		});
		expect(sql).not.toMatch(/^\s*WITH\b/);
		expect(sql).toMatch(/CROSS JOIN \(\s*SELECT\s+min\(transactions\)[\s\S]*\) AS stats/);
		expect(sql).toMatch(/\) AS binned\s+GROUP BY/);
	});

	// int / int truncates on Postgres-family engines: an integer column with a range
	// smaller than bin_count would get bin_width 0 and divide by zero.
	it('forces fractional division where integer division truncates', () => {
		const attrs = {
			data: 'demo.daily_orders',
			value: 'transactions',
			bin_count: 30
		};
		for (const dialect of [new PostgresDialect(), new RedshiftDialect()]) {
			const sql = buildHistogramSQL({ ...attrs, dialect });
			expect(sql).toContain('(stats."max_val" - stats."min_val") * 1.0 / 30');
			expect(sql).toContain('(transactions - stats."min_val") * 1.0 /');
		}
		expect(buildHistogramSQL({ ...attrs, dialect: new ClickHouseDialect() })).not.toContain(
			'* 1.0'
		);
	});
	it.each([7, 0, -5, 0.25])('keeps constant %s observations in one finite bin', (value) => {
		for (const bins of [{ bin_count: 20 }, {}]) {
			const sql = buildHistogramSQL({
				data: `(SELECT arrayJoin([${value}, ${value}, ${value}]) AS value) AS observations`,
				value: 'value',
				...bins
			});
			expect(queryClickHouse(sql).trim().split('\t').map(Number)).toEqual([0, value, value + 1, 3]);
		}
	});

	it('keeps a singleton observation', () => {
		const sql = buildHistogramSQL({
			data: '(SELECT 7 AS value) AS observations',
			value: 'value',
			bin_count: 20
		});
		expect(queryClickHouse(sql).trim().split('\t').map(Number)).toEqual([0, 7, 8, 1]);
	});

	it('keeps series frequencies when filters leave a constant cohort', () => {
		const sql = buildHistogramSQL({
			data: `(SELECT row.1 AS value, row.2 AS cohort FROM (SELECT arrayJoin([(7, 'A'), (7, 'A'), (7, 'B'), (9, 'B')]) AS row)) AS observations`,
			value: 'value',
			series: 'cohort',
			where: 'value < 9',
			filterSql: "cohort IN ('A', 'B')",
			bin_count: 20
		});
		expect(queryClickHouse(sql).trim().split('\n')).toEqual(['0\t7\t8\tA\t2', '0\t7\t8\tB\t1']);
	});

	it('preserves an explicit bin width for constant data', () => {
		const sql = buildHistogramSQL({
			data: '(SELECT arrayJoin([7, 7, 7]) AS value) AS observations',
			value: 'value',
			bin_count: 20,
			bin_width: 0.5
		});
		expect(queryClickHouse(sql).trim().split('\t').map(Number)).toEqual([0, 7, 7.5, 3]);
	});
});
