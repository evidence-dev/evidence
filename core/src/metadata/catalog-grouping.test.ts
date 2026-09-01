import { describe, expect, it } from 'vitest';
import { Metadata } from './Metadata.svelte';
import type { AnyRowType, QueryResult } from '../user-components/interfaces/query-service';
import type { WarehouseMode } from '../connectors/warehouse-mode';

// Returns a scripted result per call, in call order. Every loader issues its
// columns query first, so index 0 is always the big payload.
class ScriptedQueryService {
	readonly workspaceId = 'org1';
	readonly dialect = { caseInsensitiveIdentifiers: false } as never;
	#script: QueryResult<never>[];
	#calls = 0;

	constructor(script: QueryResult<never>[]) {
		this.#script = script;
	}

	query<T extends AnyRowType>(): Promise<QueryResult<T>> {
		const result = this.#script[this.#calls++] ?? ({ rows: [], columns: [], error: null } as never);
		return Promise.resolve(result as unknown as QueryResult<T>);
	}
}

const result = (rows: unknown[]): QueryResult<never> =>
	({ rows, columns: [], error: null }) as unknown as QueryResult<never>;

const TABLES = 150;
const COLUMNS_PER_TABLE = 8;
const ROW_COUNT = TABLES * COLUMNS_PER_TABLE;

// Half the tables are views so the managed loader's second grouping pass runs too.
const isView = (i: number) => i % 2 === 1;
const tableName = (i: number) => `schema_a.table_${i}`;

/**
 * Counts how many times a loader reads the grouping key off a row. A single
 * pass reads it once per row; a `filter()` inside a loop over table names reads
 * it once per (table x row). Deterministic, so the bound below can't flake the
 * way a wall-clock assertion would.
 */
type Counter = { reads: number };

const standardRows = (counter: Counter) =>
	Array.from({ length: ROW_COUNT }, (_, n) => {
		const name = tableName(Math.floor(n / COLUMNS_PER_TABLE));
		return {
			get tableName() {
				counter.reads++;
				return name;
			},
			columnName: `col_${n % COLUMNS_PER_TABLE}`,
			columnType: 'String',
			// Postgres derives its model set from relkind; 'v' marks a view.
			relKind: isView(Math.floor(n / COLUMNS_PER_TABLE)) ? 'v' : 'r'
		};
	});

// BigQuery keys on a composite of two columns, so it reads twice per comparison.
const bigQueryRows = (counter: Counter) =>
	Array.from({ length: ROW_COUNT }, (_, n) => {
		const table = `table_${Math.floor(n / COLUMNS_PER_TABLE)}`;
		return {
			get table_schema() {
				counter.reads++;
				return 'schema_a';
			},
			get table_name() {
				counter.reads++;
				return table;
			},
			column_name: `col_${n % COLUMNS_PER_TABLE}`,
			data_type: 'STRING'
		};
	});

const viewNameRows = () =>
	Array.from({ length: TABLES }, (_, i) => i)
		.filter(isView)
		.map((i) => ({ name: tableName(i) }));

const bigQueryViewRows = () =>
	Array.from({ length: TABLES }, (_, i) => i)
		.filter(isView)
		.map((i) => ({ table_schema: 'schema_a', table_name: `table_${i}` }));

type Case = {
	mode: WarehouseMode;
	/** Reads the key costs per row for a single pass — 1 normally, 2 for BigQuery's composite key. */
	keyReadsPerRow: number;
	rows: (counter: Counter) => unknown[];
	/** Results for the loader's queries after the columns query. */
	trailing: QueryResult<never>[];
	/** Postgres/Cube qualify only non-default schemas, so they need an allowlist to match. */
	allowlist?: string[];
};

const CASES: Case[] = [
	// The managed catalog fires columns, then views, then models.
	{
		mode: 'managed',
		keyReadsPerRow: 1,
		rows: standardRows,
		trailing: [result(viewNameRows()), result([])]
	},
	{ mode: 'snowflake', keyReadsPerRow: 1, rows: standardRows, trailing: [result(viewNameRows())] },
	{ mode: 'fabric', keyReadsPerRow: 1, rows: standardRows, trailing: [result(viewNameRows())] },
	{ mode: 'databricks', keyReadsPerRow: 1, rows: standardRows, trailing: [result(viewNameRows())] },
	{ mode: 'motherduck', keyReadsPerRow: 1, rows: standardRows, trailing: [result(viewNameRows())] },
	{ mode: 'postgres', keyReadsPerRow: 1, rows: standardRows, trailing: [] },
	{ mode: 'cube', keyReadsPerRow: 1, rows: standardRows, trailing: [] },
	// Already single-pass — the control that proves the bound measures the right thing.
	{ mode: 'clickhouse', keyReadsPerRow: 1, rows: standardRows, trailing: [result(viewNameRows())] },
	{
		mode: 'bigquery',
		keyReadsPerRow: 2,
		rows: bigQueryRows,
		trailing: [result(bigQueryViewRows())],
		allowlist: ['schema_a']
	}
];

describe('catalog grouping is linear in the number of column rows', () => {
	it.each(CASES)('$mode', async ({ mode, keyReadsPerRow, rows, trailing, allowlist }) => {
		const counter: Counter = { reads: 0 };
		const qs = new ScriptedQueryService([result(rows(counter)), ...trailing]);
		const m = new Metadata(qs as never, {
			warehouseMode: mode,
			schemaAllowlist: allowlist ?? ['schema_a'],
			warehouseConfigured: true
		});

		await m.load();

		// Correctness: every table is grouped, with all of its columns, in order.
		expect(m.tables).toHaveLength(TABLES);
		const first = m.getTable(mode === 'bigquery' ? 'schema_a.table_0' : tableName(0));
		expect(first).toBeDefined();
		expect(first!.columns.map((c) => c.name)).toEqual(
			Array.from({ length: COLUMNS_PER_TABLE }, (_, i) => `col_${i}`)
		);

		// A quadratic grouping pass costs TABLES x ROW_COUNT reads; a single pass
		// costs ROW_COUNT. The slack absorbs the separate pass that collects the
		// distinct table names.
		expect(counter.reads).toBeLessThanOrEqual(ROW_COUNT * keyReadsPerRow * 4);
	});
});
