import { describe, it, expect } from 'vitest';
import { assertParses } from '../../../test-utils/ch-parse';
import { buildCustomEchartSQL, type CustomEchartSQLAttrs } from './build-custom-echart-sql';
import { buildCustomEchartOptions } from './build-custom-echart-options';
import { parseCustomEchartConfig } from './parse-custom-echart-config';
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

function buildAllDialects(attrs: Omit<CustomEchartSQLAttrs, 'dialect'>) {
	const sql = dialects
		.map((dialect) => buildCustomEchartSQL({ ...attrs, dialect }).sql)
		.join('"\n----\n"');
	return { sql };
}

describe('custom_echart SQL', () => {
	it('selects all columns from the data source', () => {
		const { sql } = buildAllDialects({ data: 'demo.daily_orders' });
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
			----
			"SELECT *
			 FROM demo.daily_orders"
		`);
	});

	it('applies where, order and limit', () => {
		const { sql } = buildAllDialects({
			data: 'demo.daily_orders',
			where: "category = 'Electronics'",
			order: 'date',
			limit: 100
		});
		assertParses(sql.split('"\n----')[0]);
		expect(sql).toMatchInlineSnapshot(`
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date LIMIT 100"
			----
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date LIMIT 100"
			----
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date LIMIT 100"
			----
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY"
			----
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date LIMIT 100"
			----
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date LIMIT 100"
			----
			"SELECT *
			 FROM demo.daily_orders
			 WHERE (category = 'Electronics')
			 
			 
			 
			 ORDER BY date LIMIT 100"
		`);
	});
});

describe('buildCustomEchartOptions', () => {
	const rows = [
		{ date: '2024-01-01', sales: 10 },
		{ date: '2024-01-02', sales: 20 }
	];
	const columns = ['date', 'sales'];

	const DEFAULT_GRID = { left: 8, right: 16, top: 16, bottom: 24, containLabel: true };

	it('injects query rows as the first dataset with column dimensions', () => {
		const options = buildCustomEchartOptions(
			{ series: [{ type: 'bar', encode: { x: 'date', y: 'sales' } }] },
			rows,
			columns
		);

		expect(options.dataset).toEqual([{ dimensions: columns, source: rows }]);
		expect(options.series).toEqual([{ type: 'bar', encode: { x: 'date', y: 'sales' } }]);
	});

	it('preserves user keys on the first dataset but query rows always win as source', () => {
		const options = buildCustomEchartOptions(
			{
				dataset: {
					dimensions: ['sales', 'date'],
					source: [['stale', 1]],
					sourceHeader: false
				}
			},
			rows,
			columns
		);

		expect(options.dataset).toEqual([
			{ dimensions: ['sales', 'date'], sourceHeader: false, source: rows }
		]);
	});

	it('keeps additional datasets so transforms can reference the query data', () => {
		const transform = {
			transform: { type: 'sort', config: { dimension: 'sales', order: 'desc' } }
		};
		const options = buildCustomEchartOptions({ dataset: [{}, transform] }, rows, columns);

		expect(options.dataset).toEqual([{ dimensions: columns, source: rows }, transform]);
	});

	it('passes all other config keys through untouched', () => {
		const config = {
			xAxis: { type: 'time' },
			yAxis: {},
			tooltip: { trigger: 'axis' },
			color: ['#ff0000'],
			series: [{ type: 'line', encode: { x: 'date', y: 'sales' } }]
		};
		const options = buildCustomEchartOptions(config, rows, columns);

		expect(options).toMatchObject(config);
	});

	it('applies a default grid when none is provided', () => {
		const options = buildCustomEchartOptions({ series: [] }, rows, columns);
		expect(options.grid).toEqual(DEFAULT_GRID);
	});

	it('merges user grid keys on top of defaults', () => {
		const options = buildCustomEchartOptions({ grid: { top: 60, bottom: 50 } }, rows, columns);
		expect(options.grid).toEqual({
			...DEFAULT_GRID,
			top: 60,
			bottom: 50
		});
	});

	it('lets the author opt out of containLabel', () => {
		const options = buildCustomEchartOptions({ grid: { containLabel: false } }, rows, columns);
		expect(options.grid).toMatchObject({ containLabel: false });
	});

	it('passes an array grid through untouched (multi-grid layouts)', () => {
		const userGrid = [
			{ left: '5%', right: '55%' },
			{ left: '55%', right: '5%' }
		];
		const options = buildCustomEchartOptions({ grid: userGrid }, rows, columns);
		expect(options.grid).toEqual(userGrid);
	});

	describe('host tooltip defaults', () => {
		it('leaves the tooltip untouched when no host CSS is supplied (sandbox path)', () => {
			const options = buildCustomEchartOptions({ tooltip: { trigger: 'axis' } }, rows, columns);
			expect(options.tooltip).toEqual({ trigger: 'axis' });
		});

		it('does not add a tooltip the author never declared', () => {
			const options = buildCustomEchartOptions({ series: [] }, rows, columns, {
				hostTooltipExtraCssText: ''
			});
			expect('tooltip' in options).toBe(false);
		});

		it('body-appends an authored tooltip on the host path', () => {
			const options = buildCustomEchartOptions({ tooltip: { trigger: 'axis' } }, rows, columns, {
				hostTooltipExtraCssText: ''
			});
			expect(options.tooltip).toEqual({ trigger: 'axis', appendToBody: true });
		});

		it('lets the author opt out of appendToBody', () => {
			const options = buildCustomEchartOptions(
				{ tooltip: { trigger: 'item', appendToBody: false } },
				rows,
				columns,
				{ hostTooltipExtraCssText: '' }
			);
			expect(options.tooltip).toMatchObject({ appendToBody: false });
		});

		it('appends the host CSS after the author extraCssText so elevation wins', () => {
			const options = buildCustomEchartOptions(
				{ tooltip: { extraCssText: 'padding: 0;' } },
				rows,
				columns,
				{ hostTooltipExtraCssText: 'z-index: 10000001;' }
			);
			expect(options.tooltip).toMatchObject({
				appendToBody: true,
				extraCssText: 'padding: 0; z-index: 10000001;'
			});
		});

		it('passes array tooltips through untouched', () => {
			const tooltips = [{ trigger: 'axis' }, { trigger: 'item' }];
			const options = buildCustomEchartOptions({ tooltip: tooltips }, rows, columns, {
				hostTooltipExtraCssText: ''
			});
			expect(options.tooltip).toEqual(tooltips);
		});
	});
});

describe('parseCustomEchartConfig', () => {
	it('parses strict JSON', () => {
		expect(parseCustomEchartConfig('{"series": []}')).toEqual({ config: { series: [] } });
	});

	it('parses JSON5 (comments, trailing commas, unquoted keys, single quotes)', () => {
		const source = `{
			// comment
			series: [{type: 'bar'},],
		}`;
		expect(parseCustomEchartConfig(source)).toEqual({
			config: { series: [{ type: 'bar' }] }
		});
	});

	it('returns a parse error with position info for invalid input', () => {
		const result = parseCustomEchartConfig('{ "series": [ }');
		expect(result.config).toBeUndefined();
		expect(result.error).toMatch(/\d/);
	});

	it('rejects non-object roots and empty input', () => {
		expect(parseCustomEchartConfig('[1, 2]').error).toContain('must be a JSON object');
		expect(parseCustomEchartConfig('"hi"').error).toContain('must be a JSON object');
		expect(parseCustomEchartConfig('').error).toContain('tag body');
		expect(parseCustomEchartConfig(undefined).error).toContain('tag body');
	});
});
