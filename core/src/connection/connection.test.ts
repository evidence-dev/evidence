import { describe, it, expect, vi } from 'vitest';
import { connectionFromQueryService, withCatalog } from './query-service-connection';
import { createSingleConnectionRegistry } from './single-connection-registry';
import type { Catalog } from './types';
import { ClickHouseDialect, SnowflakeDialect, type SqlDialect } from '../sql-dialect';
import type { QueryService } from '../user-components/interfaces/query-service';

describe('connectionFromQueryService', () => {
	it('forwards query (args + result) to the underlying QueryService', async () => {
		const result = { rows: [{ a: 1 }], columns: [], error: null };
		const query = vi.fn().mockResolvedValue(result);
		const qs = {
			workspaceId: 'w',
			dialect: new ClickHouseDialect(),
			query
		} as unknown as QueryService;

		const conn = connectionFromQueryService(qs, { id: 'default', type: 'managed' });
		const opts = { noCache: true };

		await expect(conn.query('SELECT 1', opts)).resolves.toBe(result);
		expect(query).toHaveBeenCalledWith('SELECT 1', { ...opts, connectionId: 'default' });
		expect(conn.id).toBe('default');
		expect(conn.type).toBe('managed');
	});

	it('reads dialect live so a later warehouse-mode change is reflected (not snapshotted)', () => {
		let dialect: SqlDialect = new ClickHouseDialect();
		const qs = {
			get dialect() {
				return dialect;
			},
			query: vi.fn()
		} as unknown as QueryService;

		const conn = connectionFromQueryService(qs, { id: 'default', type: 'managed' });
		expect(conn.dialect).toBeInstanceOf(ClickHouseDialect);

		dialect = new SnowflakeDialect();
		expect(conn.dialect).toBeInstanceOf(SnowflakeDialect);
	});
});

describe('connection catalog', () => {
	it('has no catalog until one is attached', () => {
		const qs = {
			workspaceId: 'w',
			connectionType: 'managed',
			dialect: new ClickHouseDialect(),
			query: vi.fn()
		} as unknown as QueryService;
		const conn = connectionFromQueryService(qs, { id: 'default', type: 'managed' });
		expect(conn.catalog).toBeUndefined();
	});

	it('withCatalog attaches the catalog while preserving live dialect/query delegation', () => {
		let dialect: SqlDialect = new ClickHouseDialect();
		const query = vi.fn().mockResolvedValue({ rows: [], columns: [], error: null });
		const qs = {
			workspaceId: 'w',
			connectionType: 'managed',
			get dialect() {
				return dialect;
			},
			query
		} as unknown as QueryService;
		const base = connectionFromQueryService(qs, { id: 'default', type: 'managed' });
		const catalog = { tables: [] } as unknown as Catalog;

		const conn = withCatalog(base, catalog);
		expect(conn.catalog).toBe(catalog);
		expect(conn.id).toBe('default');

		// dialect stays live after attaching the catalog
		expect(conn.dialect).toBeInstanceOf(ClickHouseDialect);
		dialect = new SnowflakeDialect();
		expect(conn.dialect).toBeInstanceOf(SnowflakeDialect);

		// query still delegates
		void conn.query('SELECT 1');
		expect(query).toHaveBeenCalledWith('SELECT 1', { connectionId: 'default' });
	});
});

describe('createSingleConnectionRegistry', () => {
	it('resolves every lookup to the sole connection (specific id, omitted, and unknown)', () => {
		const conn = {
			id: 'default',
			type: 'managed',
			dialect: new ClickHouseDialect(),
			query: vi.fn()
		};
		const registry = createSingleConnectionRegistry(conn);

		expect(registry.default).toBe(conn);
		expect(registry.all).toEqual([conn]);
		expect(registry.get()).toBe(conn);
		expect(registry.get('default')).toBe(conn);
		// Unknown id falls back to the default (the sole connection).
		expect(registry.get('does-not-exist')).toBe(conn);
	});
});
