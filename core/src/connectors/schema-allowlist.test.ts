import { describe, it, expect } from 'vitest';
import { schemaAllowlist } from './schema-allowlist';

describe('schemaAllowlist', () => {
	it('uses BigQuery datasets', () => {
		expect(schemaAllowlist('bigquery', { datasets: ['a', 'b'] })).toEqual(['a', 'b']);
	});

	it('uses ClickHouse databases', () => {
		expect(schemaAllowlist('clickhouse', { databases: ['db'] })).toEqual(['db']);
	});

	it.each(['fabric', 'databricks', 'motherduck'] as const)('uses %s schemas as-is', (mode) => {
		expect(schemaAllowlist(mode, { schema: 'main', schemas: ['a', 'b'] })).toEqual(['a', 'b']);
		expect(schemaAllowlist(mode, { schema: 'main' })).toEqual([]);
	});

	it.each(['postgres', 'cube'] as const)('falls back to the default schema for %s', (mode) => {
		expect(schemaAllowlist(mode, { schema: 'public', schemas: [] })).toEqual(['public']);
		expect(schemaAllowlist(mode, { schema: 'public', schemas: ['a', 'b'] })).toEqual(['a', 'b']);
	});

	it('leaves Snowflake and managed unscoped', () => {
		expect(schemaAllowlist('snowflake', { schema: 'PROD', schemas: ['PROD'] })).toEqual([]);
		expect(schemaAllowlist('managed', { schemas: ['x'] })).toEqual([]);
	});
});
