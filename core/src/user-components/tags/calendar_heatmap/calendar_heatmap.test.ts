import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import {
	buildCalendarHeatmapSQL,
	type CalendarHeatmapSQLAttrs
} from './build-calendar-heatmap-sql';
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

function buildAllDialects(attrs: Omit<CalendarHeatmapSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildCalendarHeatmapSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('calendar_heatmap SQL', () => {
	it('Basic Usage (schema example)', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			date: 'date',
			value: 'sum(total_sales)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "DATE", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE ASC"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
		`);
	});

	it('conditional_colors adds extra column', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			date: 'date',
			value: 'sum(total_sales)',
			conditional_colors:
				"case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end"
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS "case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "DATE", sum(total_sales) AS "SUM_TOTAL_SALES", case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS "CASE_WHEN_SUM_TOTAL_SALES_1000_THEN_22C55E_WHEN_SUM_TOTAL_SALES_500_THEN_F59E0B_ELSE_EF4444_END"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE ASC"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`, case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS \`case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS "case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`, case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS \`case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS "case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS "case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales", case when sum(total_sales) > 1000 then '#22c55e' when sum(total_sales) > 500 then '#f59e0b' else '#ef4444' end AS "case_when_sum_total_sales_1000_then_22c55e_when_sum_total_sales_500_then_f59e0b_else_ef4444_end"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			date: 'date',
			value: 'sum(total_sales)',
			date_range: { date: 'date', range: 'last 12 months' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= toDate('2025-01-02') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "DATE", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 WHERE (date >= TO_DATE('2025-01-02') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY DATE ASC"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-01-02' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= CAST('2025-01-02' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY date
			 
			 
			 ORDER BY date ASC"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 WHERE (date >= DATE '2025-01-02' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY date ASC"
		`);
	});

	it('custom order overrides default date ASC', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			date: 'date',
			value: 'sum(total_sales)',
			order: 'sum(total_sales) desc'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS "DATE", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS \`date\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY date
			 
			 
			 ORDER BY sum(total_sales) desc"
			----
			"SELECT date AS "date", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(total_sales) desc"
		`);
	});
});
