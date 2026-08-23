import { describe, it, expect } from 'vitest';
import { createMultiConnectionRegistry, unknownConnection } from './multi-connection-registry';
import { ClickHouseDialect, SnowflakeDialect } from '../sql-dialect';
import type { Connection } from './types';

const conn = (id: string, type = 'managed'): Connection => ({
	id,
	type,
	dialect: type === 'snowflake' ? new SnowflakeDialect() : new ClickHouseDialect(),
	query: async () => ({ rows: [], columns: [], error: null })
});

describe('createMultiConnectionRegistry', () => {
	const evidence = conn('default');
	const warehouse = conn('analytics', 'snowflake');
	const registry = createMultiConnectionRegistry([evidence, warehouse], 'default');

	it('exposes all connections and the default', () => {
		expect(registry.all).toEqual([evidence, warehouse]);
		expect(registry.default).toBe(evidence);
	});

	it('resolves an omitted id to the default', () => {
		expect(registry.get()).toBe(evidence);
		expect(registry.get(undefined)).toBe(evidence);
	});

	it('resolves a known id to that connection', () => {
		expect(registry.get('default')).toBe(evidence);
		expect(registry.get('analytics')).toBe(warehouse);
	});

	it('resolves an UNKNOWN id to an error stand-in, never the default', () => {
		const unknown = registry.get('typo');
		expect(unknown).not.toBe(evidence);
		expect(unknown.id).toBe('typo');
		expect(unknown.type).toBe('unknown');
	});

	it('falls back to the first connection when defaultId is not present', () => {
		const r = createMultiConnectionRegistry([warehouse], 'missing');
		expect(r.default).toBe(warehouse);
		expect(r.get()).toBe(warehouse);
	});

	it('throws when constructed with no connections', () => {
		expect(() => createMultiConnectionRegistry([], 'default')).toThrow();
	});
});

describe('unknownConnection', () => {
	it('returns an error result instead of querying a warehouse', async () => {
		const c = unknownConnection('ghost');
		const result = await c.query('select 1');
		expect(result.error).toContain('ghost');
		expect(result.rows).toEqual([]);
	});
});
