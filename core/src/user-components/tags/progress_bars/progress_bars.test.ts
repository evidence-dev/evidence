import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildProgressBarsSQL, type ProgressBarsSQLAttrs } from './build-progress-bars-sql';
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

function buildAllDialects(attrs: Omit<ProgressBarsSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildProgressBarsSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('progress_bars SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			dimension: 'region',
			numerator: 'sum(actual)',
			denominator: 'sum(target)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "REGION", sum(actual) AS "SUM_ACTUAL", sum(target) AS "SUM_TARGET"
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS \`region\`, sum(actual) AS \`sum_actual\`, sum(target) AS \`sum_target\`
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY region"
			----
			"SELECT region AS \`region\`, sum(actual) AS \`sum_actual\`, sum(target) AS \`sum_target\`
			 FROM demo.sales
			 
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY ALL"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			dimension: 'region',
			numerator: 'sum(actual)',
			denominator: 'sum(target)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT region AS "REGION", sum(actual) AS "SUM_ACTUAL", sum(target) AS "SUM_TARGET"
			 FROM demo.sales
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL"
			----
			"SELECT region AS \`region\`, sum(actual) AS \`sum_actual\`, sum(target) AS \`sum_target\`
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY region"
			----
			"SELECT region AS \`region\`, sum(actual) AS \`sum_actual\`, sum(target) AS \`sum_target\`
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY region"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL"
		`);
	});

	it('order + limit', () => {
		const { sql } = buildAllDialects({
			data: 'demo.sales',
			dimension: 'region',
			numerator: 'sum(actual)',
			denominator: 'sum(target)',
			order: 'sum(actual) desc',
			limit: 5
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
			----
			"SELECT region AS "REGION", sum(actual) AS "SUM_ACTUAL", sum(target) AS "SUM_TARGET"
			 FROM demo.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
			----
			"SELECT region AS \`region\`, sum(actual) AS \`sum_actual\`, sum(target) AS \`sum_target\`
			 FROM demo.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY region
			 
			 
			 ORDER BY sum(actual) desc OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY"
			----
			"SELECT region AS \`region\`, sum(actual) AS \`sum_actual\`, sum(target) AS \`sum_target\`
			 FROM demo.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY region
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY region
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
			----
			"SELECT region AS "region", sum(actual) AS "sum_actual", sum(target) AS "sum_target"
			 FROM demo.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum(actual) desc LIMIT 5"
		`);
	});
});
