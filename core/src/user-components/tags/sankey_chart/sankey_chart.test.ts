import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildSankeyChartSQL, type SankeyChartSQLAttrs } from './build-sankey-chart-sql';
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

function buildAllDialects(attrs: Omit<SankeyChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildSankeyChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('sankey_chart SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.flows',
			source: 'src',
			target: 'dst',
			value: 'sum(amount)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "SRC", dst AS "DST", sum(amount) AS "SUM_AMOUNT"
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_AMOUNT DESC"
			----
			"SELECT src AS \`src\`, dst AS \`dst\`, sum(amount) AS \`sum_amount\`
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS \`src\`, dst AS \`dst\`, sum(amount) AS \`sum_amount\`
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
		`);
	});

	it('with percent column adds 4th column', () => {
		const { sql } = buildAllDialects({
			data: 'demo.flows',
			source: 'src',
			target: 'dst',
			value: 'sum(amount)',
			percent: 'sum(amount) / sum(total)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount", sum(amount) / sum(total) AS "sum_amount_sum_total"
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "SRC", dst AS "DST", sum(amount) AS "SUM_AMOUNT", sum(amount) / sum(total) AS "SUM_AMOUNT_SUM_TOTAL"
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_AMOUNT DESC"
			----
			"SELECT src AS \`src\`, dst AS \`dst\`, sum(amount) AS \`sum_amount\`, sum(amount) / sum(total) AS \`sum_amount_sum_total\`
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount", sum(amount) / sum(total) AS "sum_amount_sum_total"
			 FROM demo.flows
			 
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS \`src\`, dst AS \`dst\`, sum(amount) AS \`sum_amount\`, sum(amount) / sum(total) AS \`sum_amount_sum_total\`
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount", sum(amount) / sum(total) AS "sum_amount_sum_total"
			 FROM demo.flows
			 
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount", sum(amount) / sum(total) AS "sum_amount_sum_total"
			 FROM demo.flows
			 
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount", sum(amount) / sum(total) AS "sum_amount_sum_total"
			 FROM demo.flows
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.flows',
			source: 'src',
			target: 'dst',
			value: 'sum(amount)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "SRC", dst AS "DST", sum(amount) AS "SUM_AMOUNT"
			 FROM demo.flows
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_AMOUNT DESC"
			----
			"SELECT src AS \`src\`, dst AS \`dst\`, sum(amount) AS \`sum_amount\`
			 FROM demo.flows
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS \`src\`, dst AS \`dst\`, sum(amount) AS \`sum_amount\`
			 FROM demo.flows
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY src, dst
			 
			 
			 ORDER BY sum_amount DESC"
			----
			"SELECT src AS "src", dst AS "dst", sum(amount) AS "sum_amount"
			 FROM demo.flows
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
		`);
	});
});
