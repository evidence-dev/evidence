import { describe, it, expect } from 'vitest';
import { clickhouseConnectionSchema } from './connection-schema';
import { resolveClickHouseCredentials } from './resolve';

function resolve(config: Record<string, unknown>) {
	return resolveClickHouseCredentials(
		clickhouseConnectionSchema.parse({ type: 'clickhouse', ...config })
	);
}

describe('resolveClickHouseCredentials', () => {
	it('defaults to TLS on 8443 with the default user and database', () => {
		expect(resolve({ host: 'abc.clickhouse.cloud', password: 'pw' })).toEqual({
			url: 'https://abc.clickhouse.cloud:8443',
			username: 'default',
			password: 'pw',
			accessToken: undefined,
			database: 'default',
			databases: []
		});
	});

	it('carries the databases allowlist through', () => {
		expect(
			resolve({ host: 'h', password: 'pw', databases: ['analytics', 'raw'] }).databases
		).toEqual(['analytics', 'raw']);
	});

	it('secure=false switches to http (e.g. self-hosted on 8123)', () => {
		expect(resolve({ host: 'localhost', port: 8123, secure: false, password: 'pw' }).url).toBe(
			'http://localhost:8123'
		);
	});

	it('carries username and database through', () => {
		expect(
			resolve({ host: 'ch.internal', username: 'alice', database: 'analytics', password: 'pw' })
		).toMatchObject({ url: 'https://ch.internal:8443', username: 'alice', database: 'analytics' });
	});

	it('access_token auth (Cloud JWT) maps to accessToken', () => {
		expect(resolve({ host: 'abc.clickhouse.cloud', access_token: 'jwt' })).toMatchObject({
			username: 'default',
			password: undefined,
			accessToken: 'jwt'
		});
	});

	it('trims whitespace around the host', () => {
		expect(resolve({ host: ' localhost ', password: 'pw' }).url).toBe('https://localhost:8443');
	});

	it('schema rejects a host containing a protocol', () => {
		expect(() => resolve({ host: 'https://abc.clickhouse.cloud', password: 'pw' })).toThrow(
			/hostname only/
		);
	});

	it('schema rejects providing both password and access_token', () => {
		expect(() => resolve({ host: 'h', password: 'pw', access_token: 'jwt' })).toThrow();
	});

	it('schema rejects providing neither password nor access_token', () => {
		expect(() => resolve({ host: 'h' })).toThrow();
	});
});
