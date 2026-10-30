import { describe, it, expect } from 'vitest';
import { Metadata } from './Metadata.svelte';
import { arrowToJsType } from './metadata';
import type { QueryResult } from '../user-components/interfaces/query-service';

// The provider path must never touch the query service — its introspection
// SQL is warehouse-specific and the engine can't run it.
class NeverCalledQueryService {
	readonly workspaceId = 'org1';
	readonly dialect = { caseInsensitiveIdentifiers: false } as never;
	query(): Promise<QueryResult<never>> {
		throw new Error('query() must not be called when a catalogProvider is set');
	}
}

describe('Metadata catalogProvider (engine-backed catalog)', () => {
	it('loads tables and maps arrow column types from the provider', async () => {
		const m = new Metadata(new NeverCalledQueryService() as never, {
			// Any warehouse mode would run introspection SQL — the provider wins.
			warehouseMode: 'postgres',
			catalogProvider: () => async () => [
				{
					name: 'ANALYTICS.PUBLIC.ORDERS',
					columns: [
						{ name: 'id', type: 'Int64' },
						{ name: 'amount', type: 'Float64' },
						{ name: 'label', type: 'Utf8' },
						{ name: 'created_at', type: 'Timestamp(Nanosecond, None)' },
						{ name: 'tags', type: 'List(Utf8)' }
					]
				},
				{ name: 'PUBLIC.ITEMS', columns: [{ name: 'id', type: 'Utf8' }] }
			]
		});

		await m.load();

		const orders = m.getTable('ANALYTICS.PUBLIC.ORDERS');
		expect(orders).toBeDefined();
		expect(orders?.name).toBe('ANALYTICS.PUBLIC.ORDERS');
		const columns = Object.values(orders?.toJSON().columns ?? {});
		expect(columns.map((c) => c.jsType)).toEqual(['number', 'number', 'string', 'date', 'object']);
		expect(m.getTable('PUBLIC.ITEMS')).toBeDefined();
		expect(m.loadFailed).toBe(false);
		// A successful provider load must clear the loading state — the schema
		// panel reads it for its skeleton.
		expect(m.loading).toBe(false);
	});

	it('an empty catalog loads clean (no tables, no failure)', async () => {
		const m = new Metadata(new NeverCalledQueryService() as never, {
			catalogProvider: () => async () => []
		});
		await m.load();
		expect(m.loadFailed).toBe(false);
		expect([...m.tables.keys()]).toEqual([]);
	});

	it('a provider failure sets loadFailed and throws', async () => {
		const m = new Metadata(new NeverCalledQueryService() as never, {
			catalogProvider: () => async () => {
				throw new Error('catalog fetch failed (502)');
			}
		});
		await expect(m.load()).rejects.toThrow('502');
		expect(m.loadFailed).toBe(true);
	});
});

describe('arrowToJsType', () => {
	it('maps the arrow families', () => {
		expect(arrowToJsType('Utf8')).toBe('string');
		expect(arrowToJsType('LargeUtf8')).toBe('string');
		expect(arrowToJsType('Boolean')).toBe('boolean');
		expect(arrowToJsType('Int64')).toBe('number');
		expect(arrowToJsType('UInt8')).toBe('number');
		expect(arrowToJsType('Float64')).toBe('number');
		expect(arrowToJsType('Decimal(18, 2)')).toBe('number');
		expect(arrowToJsType('Date32')).toBe('date');
		expect(arrowToJsType('Timestamp(Nanosecond, None)')).toBe('date');
		expect(arrowToJsType('Time64(Us)')).toBe('date');
		expect(arrowToJsType('List(Utf8)')).toBe('object');
		expect(arrowToJsType('Struct<a: Utf8>')).toBe('object');
		expect(arrowToJsType('Dictionary(Int32, Utf8)')).toBe('string');
		expect(arrowToJsType('Something New')).toBe('unknown');
	});
});
