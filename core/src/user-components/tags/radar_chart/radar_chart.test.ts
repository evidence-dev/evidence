import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildRadarChartSQL, type RadarChartSQLAttrs } from './build-radar-chart-sql';
import {
	SnowflakeDialect,
	ClickHouseDialect,
	BigQueryDialect,
	FabricDialect,
	DatabricksDialect,
	PostgresDialect,
	CubeDialect
} from '../../../sql-dialect';

const dialects = [
	new ClickHouseDialect(),
	new SnowflakeDialect(),
	new BigQueryDialect(),
	new FabricDialect(),
	new DatabricksDialect(),
	new PostgresDialect(),
	new CubeDialect()
];

function buildAllDialects(attrs: Omit<RadarChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildRadarChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('radar_chart SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			category: 'category',
			value: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category"
		`);
	});

	it('series grouping adds a series column', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			category: 'category',
			series: 'year(date)',
			value: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", year(date) AS "year_date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "CATEGORY", year(date) AS "YEAR_DATE", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS \`category\`, year(date) AS \`year_date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", year(date) AS "year_date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, year(date)"
			----
			"SELECT category AS \`category\`, year(date) AS \`year_date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL"
			----
			"SELECT category AS "category", year(date) AS "year_date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, year(date)"
			----
			"SELECT category AS "category", year(date) AS "year_date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category, year(date)"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			category: 'category',
			value: 'sum(total_sales)',
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
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY category"
		`);
	});
});
