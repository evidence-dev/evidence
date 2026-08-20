import { describe, it, expect } from 'vitest';
import { assertParses, queryClickHouse } from '../../../test-utils/ch-parse';
import { buildImageSQL, buildImageSQLConfig, type ImageSQLAttrs } from './build-image-sql';
import { generateSQLQuery } from '../../common/sql-options';
import { InlineQueries } from '../../common/inline-queries';
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

function buildAllDialects(attrs: Omit<ImageSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildImageSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('image SQL', () => {
	it('single column defaults to one row', () => {
		const { sql } = buildAllDialects({
			data: 'products',
			column: 'image_url'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT image_url AS "image_url"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "IMAGE_URL"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS \`image_url\`
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url"
			 FROM products ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT image_url AS \`image_url\`
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url"
			 FROM products LIMIT 1"
		`);
	});

	it('dark and description columns are selected alongside the url column', () => {
		const { sql } = buildAllDialects({
			data: 'products',
			column: 'image_url',
			dark_column: 'dark_image_url',
			description_column: 'product_name'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT image_url AS "image_url", dark_image_url AS "dark_image_url", product_name AS "product_name"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "IMAGE_URL", dark_image_url AS "DARK_IMAGE_URL", product_name AS "PRODUCT_NAME"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS \`image_url\`, dark_image_url AS \`dark_image_url\`, product_name AS \`product_name\`
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url", dark_image_url AS "dark_image_url", product_name AS "product_name"
			 FROM products ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT image_url AS \`image_url\`, dark_image_url AS \`dark_image_url\`, product_name AS \`product_name\`
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url", dark_image_url AS "dark_image_url", product_name AS "product_name"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url", dark_image_url AS "dark_image_url", product_name AS "product_name"
			 FROM products LIMIT 1"
		`);
	});

	it('deduplicates when dark_column matches column', () => {
		const { sql } = buildAllDialects({
			data: 'products',
			column: 'image_url',
			dark_column: 'image_url'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT image_url AS "image_url"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "IMAGE_URL"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS \`image_url\`
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url"
			 FROM products ORDER BY (SELECT NULL) OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT image_url AS \`image_url\`
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url"
			 FROM products LIMIT 1"
			----
			"SELECT image_url AS "image_url"
			 FROM products LIMIT 1"
		`);
	});

	// Regression: GROUP BY re-hashes rows and loses the source query's ORDER BY,
	// so a filtered image showed an arbitrary row instead of the first one.
	it('preserves the source query ORDER BY under a filter (executes on ClickHouse)', () => {
		const dialect = new ClickHouseDialect();
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set(
			'products',
			`select product, image_url from (
				select 'Widget' as product, 'url_w' as image_url, 1 as ord union all
				select 'Gadget', 'url_g', 2
			) order by ord`
		);
		const { sql } = generateSQLQuery(
			buildImageSQLConfig({
				data: 'products',
				column: 'image_url',
				where: "product in ('Widget', 'Gadget')",
				dialect
			}),
			undefined,
			inlineQueries,
			undefined,
			'sunday',
			dialect
		);
		expect(sql).not.toMatch(/GROUP BY/i);
		expect(queryClickHouse(sql).trim()).toBe('url_w');
	});

	it('where and order pick which row supplies the image', () => {
		const { sql } = buildAllDialects({
			data: 'products',
			column: 'image_url',
			where: "category = 'Electronics'",
			order: 'sales desc'
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT image_url AS "image_url", sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc LIMIT 1"
			----
			"SELECT image_url AS "IMAGE_URL", sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc LIMIT 1"
			----
			"SELECT image_url AS \`image_url\`, sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc LIMIT 1"
			----
			"SELECT image_url AS "image_url", sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
			----
			"SELECT image_url AS \`image_url\`, sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc LIMIT 1"
			----
			"SELECT image_url AS "image_url", sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc LIMIT 1"
			----
			"SELECT image_url AS "image_url", sales
			 FROM products
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY sales desc LIMIT 1"
		`);
	});
});
