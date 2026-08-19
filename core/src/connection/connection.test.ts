import { describe, it, expect, vi } from 'vitest';
import { connectionFromQueryService } from './query-service-connection';
import { createSingleConnectionRegistry } from './single-connection-registry';
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
		expect(query).toHaveBeenCalledWith('SELECT 1', opts);
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
