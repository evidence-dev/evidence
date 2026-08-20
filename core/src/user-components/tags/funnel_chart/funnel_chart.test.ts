import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildFunnelChartSQL, type FunnelChartSQLAttrs } from './build-funnel-chart-sql';
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

function buildAllDialects(attrs: Omit<FunnelChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildFunnelChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('funnel_chart SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.funnel',
			category: 'stage',
			value: 'sum(users)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "STAGE", sum(users) AS "SUM_USERS"
			 FROM demo.funnel
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_USERS DESC"
			----
			"SELECT stage AS \`stage\`, sum(users) AS \`sum_users\`
			 FROM demo.funnel
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 
			 GROUP BY stage
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS \`stage\`, sum(users) AS \`sum_users\`
			 FROM demo.funnel
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 
			 GROUP BY stage
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 
			 GROUP BY stage
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.funnel',
			category: 'stage',
			value: 'sum(users)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "STAGE", sum(users) AS "SUM_USERS"
			 FROM demo.funnel
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_USERS DESC"
			----
			"SELECT stage AS \`stage\`, sum(users) AS \`sum_users\`
			 FROM demo.funnel
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY stage
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS \`stage\`, sum(users) AS \`sum_users\`
			 FROM demo.funnel
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY stage
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY stage
			 
			 
			 ORDER BY sum_users DESC"
			----
			"SELECT stage AS "stage", sum(users) AS "sum_users"
			 FROM demo.funnel
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_users DESC"
		`);
	});
});
