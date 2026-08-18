import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildTreemapSQL, type TreemapSQLAttrs } from './build-treemap-sql';
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

function buildAllDialects(attrs: Omit<TreemapSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildTreemapSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('treemap SQL', () => {
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
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_TOTAL_SALES DESC"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales DESC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY sum_total_sales DESC"
		`);
	});

	it('group adds a parent grouping column', () => {
		const { sql } = buildAllDialects({
			data: 'demo.order_details',
			group: 'category',
			category: 'item_name',
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

	it('explicit order overrides default value DESC', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			category: 'category',
			value: 'sum(total_sales)',
			order: 'category ASC'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "CATEGORY", sum(total_sales) AS "SUM_TOTAL_SALES"
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS \`category\`, sum(total_sales) AS \`sum_total_sales\`
			 FROM demo.daily_orders
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category ASC"
			----
			"SELECT category AS "category", sum(total_sales) AS "sum_total_sales"
			 FROM demo.daily_orders
			 
			 GROUP BY category
			 
			 
			 ORDER BY category ASC"
		`);
	});
});
