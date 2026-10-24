import { describe, expect, it } from 'vitest';
import { Metadata } from './Metadata.svelte';
import { REDSHIFT_CURRENT_SCHEMA_SQL } from './redshift-catalog';
import type { AnyRowType, QueryResult } from '../user-components/interfaces/query-service';

const ok = (rows: unknown[]): QueryResult<never> =>
	({ rows, columns: [], error: null }) as unknown as QueryResult<never>;
const failed = (error: string): QueryResult<never> =>
	({ rows: [], columns: [], error }) as unknown as QueryResult<never>;

// Routes each catalog statement to a scripted result by what it reads, and records
// the SQL so the test can assert on the statements actually sent to the warehouse.
class RoutingQueryService {
	readonly workspaceId = 'org1';
	readonly dialect = { caseInsensitiveIdentifiers: true } as never;
	readonly sent: string[] = [];

	constructor(
		private readonly results: {
			currentSchema: QueryResult<never>;
			columns: QueryResult<never>;
			tables: QueryResult<never>;
		}
	) {}

	query<T extends AnyRowType>(sql: string): Promise<QueryResult<T>> {
		this.sent.push(sql);
		const r = this.results;
		const result =
			sql === REDSHIFT_CURRENT_SCHEMA_SQL
				? r.currentSchema
				: sql.includes('FROM svv_columns')
					? r.columns
					: sql.includes('FROM svv_tables')
						? r.tables
						: failed(`unexpected catalog statement: ${sql}`);
		return Promise.resolve(result as unknown as QueryResult<T>);
	}
}

const columnRows = [
	{ table_schema: 'analytics', table_name: 'orders', column_name: 'id', column_type: 'integer' },
	{
		table_schema: 'analytics',
		table_name: 'orders',
		column_name: 'placed_at',
		column_type: 'timestamp without time zone'
	},
	{
		table_schema: 'analytics',
		table_name: 'daily_orders',
		column_name: 'day',
		column_type: 'date'
	},
	{
		table_schema: 'spectrum',
		table_name: 'events',
		column_name: 'payload',
		column_type: 'character varying'
	},
	// Internal backing table Redshift creates for the `daily_orders` materialized view.
	{
		table_schema: 'analytics',
		table_name: 'mv_tbl__daily_orders__0',
		column_name: 'day',
		column_type: 'date'
	}
];

const tableRows = [
	{ table_schema: 'analytics', table_name: 'orders', table_type: 'BASE TABLE' },
	{ table_schema: 'analytics', table_name: 'daily_orders', table_type: 'VIEW' },
	{ table_schema: 'analytics', table_name: 'mv_tbl__daily_orders__0', table_type: 'BASE TABLE' },
	{ table_schema: 'spectrum', table_name: 'events', table_type: 'EXTERNAL TABLE' }
];

async function load(qs: RoutingQueryService) {
	const m = new Metadata(qs as never, {
		warehouseMode: 'redshift',
		schemaAllowlist: ['analytics', 'spectrum'],
		warehouseConfigured: true
	});
	await m.load();
	return m;
}

const names = (m: Metadata) => m.tables.map((t) => t.name).sort();

describe('Redshift catalog loader', () => {
	it('never calls current_schema() inside a statement that reads an SVV view', async () => {
		const qs = new RoutingQueryService({
			currentSchema: ok([{ current_schema: 'analytics' }]),
			columns: ok(columnRows),
			tables: ok(tableRows)
		});
		await load(qs);

		const svvStatements = qs.sent.filter((s) => s.includes('svv_'));
		expect(svvStatements).toHaveLength(2);
		for (const sql of svvStatements) expect(sql).not.toContain('current_schema');

		// The probe itself is table-less so it runs on the leader node.
		const probe = qs.sent.find((s) => s.includes('current_schema'));
		expect(probe).toBe(REDSHIFT_CURRENT_SCHEMA_SQL);
		expect(probe).not.toMatch(/\bFROM\b/i);
	});

	it('unqualifies tables in the current schema and qualifies the rest', async () => {
		const qs = new RoutingQueryService({
			currentSchema: ok([{ current_schema: 'analytics' }]),
			columns: ok(columnRows),
			tables: ok(tableRows)
		});
		const m = await load(qs);

		expect(names(m)).toEqual(['daily_orders', 'orders', 'spectrum.events']);
		expect(m.getTable('orders')?.columns.map((c) => c.name)).toEqual(['id', 'placed_at']);
		expect(m.getTable('daily_orders')?.tableType).toBe('model');
		expect(m.getTable('orders')?.tableType).toBe('table');
		expect(m.getTable('spectrum.events')?.tableType).toBe('table');
	});

	it("hides materialized views' internal mv_tbl__ backing tables", async () => {
		const qs = new RoutingQueryService({
			currentSchema: ok([{ current_schema: 'analytics' }]),
			columns: ok(columnRows),
			tables: ok(tableRows)
		});
		const m = await load(qs);

		expect(names(m).some((n) => n.includes('mv_tbl__'))).toBe(false);
	});

	it('always qualifies external tables because search_path does not cover external schemas', async () => {
		const qs = new RoutingQueryService({
			currentSchema: ok([{ current_schema: 'spectrum' }]),
			columns: ok(columnRows),
			tables: ok(tableRows)
		});
		const m = await load(qs);

		expect(names(m)).toEqual(['analytics.daily_orders', 'analytics.orders', 'spectrum.events']);
	});

	it('falls back to fully-qualified names when the current_schema probe fails', async () => {
		const qs = new RoutingQueryService({
			currentSchema: failed('leader node unavailable'),
			columns: ok(columnRows),
			tables: ok(tableRows)
		});
		const m = await load(qs);

		expect(names(m)).toEqual(['analytics.daily_orders', 'analytics.orders', 'spectrum.events']);
		expect(m.getTable('analytics.daily_orders')?.tableType).toBe('model');
		expect(m.loadFailed).toBe(false);
	});
});
