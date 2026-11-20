import { describe, it, expect } from 'vitest';
import {
	columnsFromDescribe,
	couplerIoDuckType,
	expandTableCommand,
	findTableNames,
	findTableRefs,
	inferColumns,
	slugifyTableName,
	typedViewSql,
	viewColumnsFromApi,
	withTableCte
} from './sql';

describe('couplerIoDuckType', () => {
	it('maps API column schemas to DuckDB types', () => {
		expect(couplerIoDuckType({ type: 'integer' })).toBe('BIGINT');
		expect(couplerIoDuckType({ type: 'number' })).toBe('DOUBLE');
		expect(couplerIoDuckType({ type: 'boolean' })).toBe('BOOLEAN');
		expect(couplerIoDuckType({ type: 'string', format: 'date' })).toBe('DATE');
		expect(couplerIoDuckType({ type: 'string', format: 'date-time' })).toBe('TIMESTAMP');
		expect(couplerIoDuckType({ type: 'integer', format: 'date' })).toBe('BIGINT');
		expect(couplerIoDuckType({ type: 'string' })).toBe('VARCHAR');
		expect(couplerIoDuckType(undefined)).toBe('VARCHAR');
	});
});

describe('typedViewSql', () => {
	it('casts non-text columns to their API type and passes text through', () => {
		const sql = typedViewSql(
			viewColumnsFromApi([
				{ dbName: 'Dimension: Source', schema: { type: 'string' } },
				{ dbName: 'revenue', schema: { type: 'number' } },
				{ dbName: 'month', schema: { type: 'string', format: 'date' } },
				{ dbName: 'started_at', schema: { type: 'string', format: 'date-time' } },
				{ key: 'no_db_name' }
			])
		);
		expect(sql).toBe(
			'SELECT "Dimension: Source", TRY_CAST("revenue" AS DOUBLE) AS "revenue", ' +
				'TRY_CAST("month" AS DATE) AS "month", TRY_CAST("started_at" AS TIMESTAMP) AS "started_at" FROM data'
		);
	});

	it('falls back to SELECT * without a column schema', () => {
		expect(typedViewSql([])).toBe('SELECT * FROM data');
	});

	it('quotes identifiers containing quotes', () => {
		expect(typedViewSql([{ name: 'a"b', duckType: 'BIGINT' }])).toBe(
			'SELECT TRY_CAST("a""b" AS BIGINT) AS "a""b" FROM data'
		);
	});
});

describe('findTableRefs', () => {
	const tables = ['funnel', 'Revenue'];

	it('finds tables after FROM and JOIN, case-insensitively', () => {
		expect(findTableRefs('select * from FUNNEL', tables).refs).toEqual(['funnel']);
		expect(findTableRefs('select * from x join revenue r on true', tables).refs).toEqual([
			'Revenue'
		]);
		expect(findTableRefs('select * from "funnel" f', tables).refs).toEqual(['funnel']);
	});

	it('finds tables inside subqueries and CTEs', () => {
		expect(
			findTableRefs('with a as (select * from funnel) select * from (select * from a) t', tables)
				.refs
		).toEqual(['funnel']);
	});

	it('reports every distinct table read', () => {
		expect(findTableRefs('select * from funnel join revenue using (id)', tables).refs).toEqual([
			'funnel',
			'Revenue'
		]);
	});

	it('ignores strings, comments, columns, qualified names, and table functions', () => {
		expect(findTableRefs("select 'from funnel' as s", tables).refs).toEqual([]);
		expect(findTableRefs('select 1 -- from funnel', tables).refs).toEqual([]);
		expect(findTableRefs('select 1 /* from funnel */', tables).refs).toEqual([]);
		expect(findTableRefs('select funnel from t', tables).refs).toEqual([]);
		expect(findTableRefs('select * from other.funnel', tables).refs).toEqual([]);
		expect(findTableRefs('select * from funnel.t', tables).refs).toEqual([]);
		expect(findTableRefs('select * from funnel(1)', tables).refs).toEqual([]);
	});

	it('finds tables in a comma-separated FROM list', () => {
		expect(
			findTableRefs('select * from calendar c, funnel f where c.d = f.d', tables).refs
		).toEqual(['funnel']);
		expect(findTableRefs('select * from funnel, "revenue"', tables).refs).toEqual([
			'funnel',
			'Revenue'
		]);
		expect(findTableRefs('select * from a join b on a.x = b.x, funnel', tables).refs).toEqual([
			'funnel'
		]);
		expect(
			findTableRefs('select * from (select a, b from x), funnel where y in (1, 2)', tables).refs
		).toEqual(['funnel']);
	});

	it('ignores commas outside a FROM list', () => {
		expect(findTableRefs('select a, funnel from t', tables).refs).toEqual([]);
		expect(findTableRefs('select * from t where x in (a, funnel)', tables).refs).toEqual([]);
		expect(findTableRefs('select * from t group by a, funnel', tables).refs).toEqual([]);
		expect(findTableRefs('select * from t order by a, funnel', tables).refs).toEqual([]);
		expect(findTableRefs('select * from t join u using (a, funnel)', tables).refs).toEqual([]);
		expect(findTableRefs('select coalesce(a, funnel) from t', tables).refs).toEqual([]);
	});

	it('ignores names the statement defines as its own CTE', () => {
		expect(findTableRefs('with funnel as (select 1) select * from funnel', tables).refs).toEqual(
			[]
		);
		expect(
			findTableRefs('with a as (select 1), funnel as (select 2) select * from funnel', tables).refs
		).toEqual([]);
		expect(
			findTableRefs('with funnel as materialized (select 1) select * from funnel', tables).refs
		).toEqual([]);
		expect(
			findTableRefs('with funnel as not materialized (select 1) select * from funnel', tables).refs
		).toEqual([]);
		expect(
			findTableRefs('with funnel(a, b) as (select 1, 2) select * from funnel', tables).refs
		).toEqual([]);
		expect(
			findTableRefs('with recursive "funnel" as (select 1) select * from funnel', tables).refs
		).toEqual([]);
	});

	it('does not mistake casts or aliases for CTE definitions', () => {
		expect(findTableRefs('select cast(x as varchar) as funnel from funnel', tables).refs).toEqual([
			'funnel'
		]);
	});
});

describe('findTableNames', () => {
	it('reports every table read, including ones no dataset serves', () => {
		expect(findTableNames('select * from data')).toEqual(['data']);
		expect(findTableRefs('select * from funnel join data using (id)', ['funnel'])).toEqual({
			refs: ['funnel'],
			unknown: ['data']
		});
	});

	it('ignores FROM inside function calls', () => {
		expect(findTableNames('select extract(year from d) from funnel')).toEqual(['funnel']);
		expect(findTableNames("select trim(both ' ' from name), substring(s from 2) from t")).toEqual([
			't'
		]);
	});

	it('still reads tables in subqueries and CTE bodies', () => {
		expect(
			findTableNames(
				'with a as (select * from funnel) select * from a where x in (select y from b)'
			)
		).toEqual(['funnel', 'b']);
		expect(findTableNames('select * from ((select * from funnel)) t')).toEqual(['funnel']);
	});

	it('skips string literals, table functions, LATERAL, and FROM-less statements', () => {
		expect(findTableNames("select * from 'file.csv' t")).toEqual([]);
		expect(findTableNames('select * from range(10) r, lateral (select 1) l')).toEqual([]);
		expect(findTableNames('select * from funnel f join lateral unnest(f.xs) u on true')).toEqual([
			'funnel'
		]);
		expect(findTableNames('select 1')).toEqual([]);
	});
});

describe('expandTableCommand', () => {
	it('turns DESCRIBE/SUMMARIZE of a table into a query', () => {
		expect(expandTableCommand('SUMMARIZE funnel')).toBe('SUMMARIZE SELECT * FROM funnel');
		expect(expandTableCommand('describe "My table";')).toBe('describe SELECT * FROM "My table";');
	});

	it('expands the command where it opens a subquery, as in the row-limit wrapper', () => {
		const wrapped = 'SELECT * FROM (SUMMARIZE funnel\n) AS __ev_limit_wrap LIMIT 1000';
		const expanded = expandTableCommand(wrapped);
		expect(expanded).toBe(
			'SELECT * FROM (SUMMARIZE SELECT * FROM funnel\n) AS __ev_limit_wrap LIMIT 1000'
		);
		expect(findTableNames(expanded)).toEqual(['funnel']);
		expect(withTableCte(expanded, 'funnel', 'SELECT 1 FROM data')).toBe(
			`WITH "funnel" AS MATERIALIZED (SELECT 1 FROM data) ${expanded}`
		);
	});

	it('leaves queries and other statements alone', () => {
		expect(expandTableCommand('DESCRIBE SELECT 1')).toBe('DESCRIBE SELECT 1');
		expect(expandTableCommand('SUMMARIZE (select * from funnel)')).toBe(
			'SUMMARIZE (select * from funnel)'
		);
		expect(expandTableCommand('select * from funnel')).toBe('select * from funnel');
	});
});

describe('withTableCte', () => {
	const view = 'SELECT 1 AS x FROM data';

	it('adds a WITH clause', () => {
		expect(withTableCte('select * from funnel', 'funnel', view)).toBe(
			'WITH "funnel" AS MATERIALIZED (SELECT 1 AS x FROM data) select * from funnel'
		);
	});

	it('keeps leading comments in place', () => {
		expect(withTableCte('-- c\nselect 1', 't', view)).toBe(
			'-- c\nWITH "t" AS MATERIALIZED (SELECT 1 AS x FROM data) select 1'
		);
	});

	it('merges into an existing WITH / WITH RECURSIVE', () => {
		expect(withTableCte('with a as (select 1) select * from a', 't', view)).toBe(
			'with "t" AS MATERIALIZED (SELECT 1 AS x FROM data), a as (select 1) select * from a'
		);
		expect(withTableCte('WITH RECURSIVE a as (select 1) select 1', 't', view)).toBe(
			'WITH RECURSIVE "t" AS MATERIALIZED (SELECT 1 AS x FROM data), a as (select 1) select 1'
		);
	});

	it('puts the CTE after DESCRIBE', () => {
		expect(withTableCte('DESCRIBE select * from t', 't', view)).toBe(
			'DESCRIBE WITH "t" AS MATERIALIZED (SELECT 1 AS x FROM data) select * from t'
		);
	});
});

describe('inferColumns', () => {
	it('types columns from their non-null values', () => {
		const cols = inferColumns([
			{
				a: null,
				b: 'x',
				c: '2025-01-01T00:00:00.000Z',
				d: true,
				e: [1],
				f: null,
				g: 31,
				h: '2025-01-01',
				i: '2025-01-01'
			},
			{ a: 1.5, b: 'y', c: null, d: false, e: null, f: null, g: 30, h: null, i: 'n/a' }
		]);
		expect(cols.map((c) => [c.name, c.clickhouseType, c.jsType])).toEqual([
			['a', 'DOUBLE', 'number'],
			['b', 'VARCHAR', 'string'],
			['c', 'TIMESTAMP', 'date'],
			['d', 'BOOLEAN', 'boolean'],
			['e', 'JSON_OBJECT', 'object'],
			['f', 'UNKNOWN', 'unknown'],
			['g', 'BIGINT', 'number'],
			['h', 'DATE', 'date'],
			// One non-date value keeps the column text.
			['i', 'VARCHAR', 'string']
		]);
	});

	it('takes dataset column types for text columns it knows by name', () => {
		const known = new Map([
			['period_key', 'VARCHAR'],
			['day', 'DATE']
		]);
		const cols = inferColumns(
			[{ period_key: '2025-01-01', day: '2025-01-01', alias: '2025-01-01', n: 3 }],
			known
		);
		expect(cols.map((c) => [c.name, c.clickhouseType])).toEqual([
			['period_key', 'VARCHAR'],
			['day', 'DATE'],
			['alias', 'DATE'],
			['n', 'BIGINT']
		]);
	});

	it('returns no columns for no rows', () => {
		expect(inferColumns([])).toEqual([]);
	});
});

describe('columnsFromDescribe', () => {
	it('maps DESCRIBE rows to columns', () => {
		expect(
			columnsFromDescribe([
				{ column_name: 'm', column_type: 'DATE', null: 'YES' },
				{ column_name: 'n', column_type: 'BIGINT', null: 'NO' }
			])
		).toEqual([
			{ name: 'm', clickhouseType: 'DATE', jsType: 'date', nullable: true },
			{
				name: 'n',
				clickhouseType: 'BIGINT',
				jsType: 'number',
				nullable: false
			}
		]);
	});
});

describe('slugifyTableName', () => {
	it('derives SQL-friendly names', () => {
		expect(slugifyTableName('Monthly product funnel')).toBe('monthly_product_funnel');
		expect(slugifyTableName('Landing Pages (GA4 + GSC)')).toBe('landing_pages_ga4_gsc');
		expect(slugifyTableName('2024 sales')).toBe('_2024_sales');
		expect(slugifyTableName('!!!')).toBe('dataset');
		expect(slugifyTableName('Données clients')).toBe('donnees_clients');
		expect(slugifyTableName('Ventas – España')).toBe('ventas_espana');
	});
});
