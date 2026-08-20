import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildChordChartSQL, type ChordChartSQLAttrs } from './build-chord-chart-sql';
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

function buildAllDialects(attrs: Omit<ChordChartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildChordChartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('chord_chart SQL', () => {
	it('Basic Usage', () => {
		const { sql } = buildAllDialects({
			data: 'demo.order_details',
			source: 'category',
			target: 'item_name',
			value: 'sum(quantity)'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "CATEGORY", item_name AS "ITEM_NAME", sum(quantity) AS "SUM_QUANTITY"
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_QUANTITY DESC"
			----
			"SELECT category AS \`category\`, item_name AS \`item_name\`, sum(quantity) AS \`sum_quantity\`
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY category, item_name
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS \`category\`, item_name AS \`item_name\`, sum(quantity) AS \`sum_quantity\`
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY category, item_name
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY category, item_name
			 
			 
			 ORDER BY sum_quantity DESC"
		`);
	});

	it('date_range applies ClickHouse toDate WHERE bounds', () => {
		const { sql } = buildAllDialects({
			data: 'demo.order_details',
			source: 'category',
			target: 'item_name',
			value: 'sum(quantity)',
			date_range: { date: 'date', range: 'last 30 days' },
			anchorDate: new Date(2026, 0, 1)
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 WHERE (date >= toDate('2025-12-03') AND date <= toDate('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "CATEGORY", item_name AS "ITEM_NAME", sum(quantity) AS "SUM_QUANTITY"
			 FROM demo.order_details
			 WHERE (date >= TO_DATE('2025-12-03') AND date <= TO_DATE('2026-01-01'))
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_QUANTITY DESC"
			----
			"SELECT category AS \`category\`, item_name AS \`item_name\`, sum(quantity) AS \`sum_quantity\`
			 FROM demo.order_details
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 WHERE (date >= CAST('2025-12-03' AS DATE) AND date <= CAST('2026-01-01' AS DATE))
			 GROUP BY category, item_name
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS \`category\`, item_name AS \`item_name\`, sum(quantity) AS \`sum_quantity\`
			 FROM demo.order_details
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 WHERE (date >= DATE '2025-12-03' AND date <= DATE '2026-01-01')
			 GROUP BY category, item_name
			 
			 
			 ORDER BY sum_quantity DESC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 WHERE (date >= CAST('2025-12-03' AS TIMESTAMP) AND date <= CAST('2026-01-01' AS TIMESTAMP))
			 GROUP BY category, item_name
			 
			 
			 ORDER BY sum_quantity DESC"
		`);
	});

	it('explicit order overrides default value DESC', () => {
		const { sql } = buildAllDialects({
			data: 'demo.order_details',
			source: 'category',
			target: 'item_name',
			value: 'sum(quantity)',
			order: 'category ASC'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "CATEGORY", item_name AS "ITEM_NAME", sum(quantity) AS "SUM_QUANTITY"
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS \`category\`, item_name AS \`item_name\`, sum(quantity) AS \`sum_quantity\`
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY category, item_name
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS \`category\`, item_name AS \`item_name\`, sum(quantity) AS \`sum_quantity\`
			 FROM demo.order_details
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY category, item_name
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "category", item_name AS "item_name", sum(quantity) AS "sum_quantity"
			 FROM demo.order_details
			 
			 GROUP BY category, item_name
			 
			 
			 ORDER BY category ASC"
		`);
	});
});
