import { describe, expect, it } from 'vitest';
import { Metadata } from './Metadata.svelte';
import {
	COUPLER_IO_COLUMNS_SQL,
	COUPLER_IO_TABLES_SQL,
	isCouplerIoCatalogSql
} from './coupler-io-catalog';
import type { AnyRowType, QueryResult } from '../user-components/interfaces/query-service';

const result = (rows: unknown[], error: string | null = null): QueryResult<never> =>
	({ rows, columns: [], error }) as unknown as QueryResult<never>;

// Answers the columns sentinel the way the Coupler.io executor does, and records
// every statement so the test can assert nothing else reaches the connector.
class CatalogQueryService {
	readonly workspaceId = 'org1';
	readonly dialect = { caseInsensitiveIdentifiers: true } as never;
	readonly sent: string[] = [];

	constructor(private readonly columns: QueryResult<never>) {}

	query<T extends AnyRowType>(sql: string): Promise<QueryResult<T>> {
		this.sent.push(sql);
		const r = sql === COUPLER_IO_COLUMNS_SQL ? this.columns : result([], `unexpected: ${sql}`);
		return Promise.resolve(r as unknown as QueryResult<T>);
	}
}

async function load(qs: CatalogQueryService) {
	const m = new Metadata(qs as never, { warehouseMode: 'coupler-io', warehouseConfigured: true });
	await m.load();
	return m;
}

describe('isCouplerIoCatalogSql', () => {
	it('recognizes the catalog sentinels', () => {
		expect(isCouplerIoCatalogSql(COUPLER_IO_TABLES_SQL)).toBe('tables');
		expect(isCouplerIoCatalogSql(`${COUPLER_IO_COLUMNS_SQL} -- no cache`)).toBe('columns');
		expect(isCouplerIoCatalogSql('select 1')).toBeNull();
	});
});

describe('Coupler.io catalog loader', () => {
	it('builds one table per dataset from the columns sentinel alone', async () => {
		const qs = new CatalogQueryService(
			result([
				{ tableName: 'ppc', columnName: 'Dimension: Source', columnType: 'VARCHAR' },
				{ tableName: 'ppc', columnName: 'Dimension: Report date', columnType: 'DATE' },
				{ tableName: 'funnel', columnName: 'mrr_new', columnType: 'DOUBLE' }
			])
		);
		const m = await load(qs);

		expect(qs.sent).toEqual([COUPLER_IO_COLUMNS_SQL]);
		expect(m.tables.map((t) => t.name).sort()).toEqual(['funnel', 'ppc']);
		expect(m.getTable('ppc')?.columns.map((c) => [c.name, c.jsType])).toEqual([
			['Dimension: Source', 'string'],
			['Dimension: Report date', 'date']
		]);
		expect(m.getTable('funnel')?.tableType).toBe('table');
	});

	it('surfaces a catalog error instead of an empty schema', async () => {
		const qs = new CatalogQueryService(result([], 'Coupler.io: API token is missing or invalid.'));
		await expect(load(qs)).rejects.toThrow(/Coupler.io metadata/);
	});
});
