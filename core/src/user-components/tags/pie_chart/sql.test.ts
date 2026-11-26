import { describe, it, expect } from 'vitest';
import { sqlFixture } from '../../../test-utils/component-sql';
import { SnowflakeDialect } from '../../../sql-dialect';
import { pieChartSql, type PieChartSqlProps } from './sql';

function sql(props: Partial<PieChartSqlProps>, fixture = sqlFixture()) {
	return fixture.render(pieChartSql.queries(props as PieChartSqlProps, fixture.env, undefined));
}

describe('pie_chart sql', () => {
	it('issues nothing without a table', () => {
		expect(pieChartSql.queries({} as PieChartSqlProps, sqlFixture().env, undefined)).toEqual([]);
	});

	it('basic', () => {
		expect(sql({ data: 'csql.sales', category: 'region', value: 'sum(amount)' }))
			.toMatchInlineSnapshot(`
				"-- data
				SELECT region AS "region", sum(amount) AS "sum_amount"
				 FROM csql.sales
				 
				 GROUP BY ALL
				 
				 
				 ORDER BY sum_amount DESC"
			`);
	});

	it('where, having, order, qualify, limit and date_range', () => {
		expect(
			sql({
				data: 'csql.sales',
				category: 'product',
				value: 'sum(amount)',
				where: 'quantity > 2',
				having: 'sum(amount) > 1000',
				order: 'product asc',
				qualify: 'true',
				limit: 4,
				date_range: { range: 'last 6 months', date: 'order_date' }
			})
		).toMatchInlineSnapshot(`
			"-- data
			SELECT product AS "product", sum(amount) AS "sum_amount"
			 FROM csql.sales
			 WHERE (quantity > 2) AND (order_date >= toDate('2025-12-31') AND order_date <= toDate('2026-06-30'))
			 GROUP BY ALL
			 HAVING (sum(amount) > 1000)
			 QUALIFY true
			 ORDER BY product asc LIMIT 4"
		`);
	});

	it('filters and inputs, with and without values', () => {
		const fixture = sqlFixture({
			dropdowns: {
				region_dd: { value: 'North', column: 'region' },
				cat_pick: 'Hardware',
				col_pick: undefined
			},
			textInputs: { min_amount: '100', no_default: undefined }
		});
		expect(
			sql(
				{
					data: 'csql.sales',
					category: '{{col_pick}}',
					value: 'sum(amount)',
					filters: ['region_dd'],
					where: 'category = {{cat_pick}} and amount > {{min_amount}} and product = {{no_default}}'
				},
				fixture
			)
		).toMatchInlineSnapshot(`
			"-- data
			SELECT , sum(amount) AS "sum_amount"
			 FROM csql.sales
			 WHERE (region='North') AND (category = 'Hardware' and amount > 100 and product = )
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
		`);
	});

	it('tooltip_fields add columns', () => {
		expect(
			sql({
				data: 'csql.sales',
				category: 'region',
				value: 'sum(amount)',
				tooltip_fields: [
					{ value: 'count(*)', label: 'Orders' },
					{ value: 'avg(amount)', label: 'Avg', fmt: 'usd' }
				]
			} as Partial<PieChartSqlProps>)
		).toMatchInlineSnapshot(`
			"-- data
			SELECT region AS "region", sum(amount) AS "sum_amount", count(*) AS "count", avg(amount) AS "avg_amount"
			 FROM csql.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC"
		`);
	});

	it('inline query as data', () => {
		const fixture = sqlFixture({
			inlineQueries: {
				top_regions: 'select region, sum(amount) as total from csql.sales group by region'
			}
		});
		expect(sql({ data: 'top_regions', category: 'region', value: 'sum(total)' }, fixture))
			.toMatchInlineSnapshot(`
				"-- data
				SELECT region AS "region", sum(total) AS "sum_total"
				 FROM (select region, sum(amount) as total from csql.sales group by region) "__ev_inline_top_regions"
				 
				 GROUP BY ALL
				 
				 
				 ORDER BY sum_total DESC"
			`);
	});

	it('metric with a view dimension, a raw column, and a derived metric', () => {
		const fixture = sqlFixture({ dropdowns: { region_dd: { value: 'East', column: 'region' } } });
		expect(
			[
				sql({ metric: 'revenue', category: 'product_line' }, fixture),
				sql({ metric: 'web_revenue', category: 'channel', filters: ['region_dd'] }, fixture),
				sql(
					{ metric: 'margin', category: 'region', date_range: { range: 'last 12 months' } },
					fixture
				)
			].join('\n\n')
		).toMatchInlineSnapshot(`
			"-- data
			SELECT category AS "category", sum(amount) AS "sum_amount"
			 FROM csql.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount DESC

			-- data
			SELECT channel AS "channel", sum(amount) FILTER (WHERE (channel = 'Web')) AS "sum_amount_filter_where_channel_web"
			 FROM csql.sales
			 WHERE (region='East')
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount_filter_where_channel_web DESC

			-- data
			SELECT region AS "region", (sum(amount)) - sum(cost) AS "sum_amount_sum_cost"
			 FROM csql.sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY sum_amount_sum_cost DESC"
		`);
	});

	it('an unknown metric issues nothing', () => {
		expect(sql({ metric: 'nope', category: 'region' })).toMatchInlineSnapshot(`""`);
	});

	it('quotes per dialect', () => {
		expect(
			sql(
				{ data: 'sales', category: 'region', value: 'sum(amount)' },
				sqlFixture({ dialect: new SnowflakeDialect() })
			)
		).toMatchInlineSnapshot(`
			"-- data
			SELECT region AS "REGION", sum(amount) AS "SUM_AMOUNT"
			 FROM sales
			 
			 GROUP BY ALL
			 
			 
			 ORDER BY SUM_AMOUNT DESC"
		`);
	});
});
