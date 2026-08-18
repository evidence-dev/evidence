import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildPolarChartSQL, type PolarChartSQLAttrs } from './build-polar-chart-sql';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect,
	MotherDuckDialect
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

function buildAllDialects(attrs: Omit<PolarChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildPolarChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('polar_chart SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			category: 'region',
			value: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY region"
			----
			"SELECT region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY ALL"
		`);
	});

	it('with series', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			category: 'region',
			value: 'sum(total_sales)',
			series: 'category'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT region AS "region", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "REGION", category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS \`region\`, category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "region", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY region, category"
			----
			"SELECT region AS \`region\`, category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "region", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY region, category"
			----
			"SELECT region AS "region", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY region, category"
			----
			"SELECT region AS "region", category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 
			 GROUP BY ALL"
		`);
	});

	it('no default ORDER BY (polar emits only when explicit)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			category: 'region',
			value: 'sum(total_sales)'
		});
		expect(sql).not.toMatch(/ORDER BY/);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			category: 'region',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT region AS "REGION", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.sales
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY region"
			----
			"SELECT region AS \`region\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(total_sales) AS "sum_total_sales"
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
		`);
	});
});
