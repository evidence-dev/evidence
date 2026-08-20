import { describe, it, expect } from 'vitest';
import { databricksConnectionSchema } from './connection-schema';
import { resolveDatabricksCredentials } from './resolve';

function resolve(config: Record<string, unknown>) {
	return resolveDatabricksCredentials(
		databricksConnectionSchema.parse({
			type: 'databricks',
			host: 'dbc-x.cloud.databricks.com',
			http_path: '/sql/1.0/warehouses/abc123',
			catalog: 'main',
			...config
		})
	);
}

describe('resolveDatabricksCredentials', () => {
	it('maps a PAT connection to token auth with schema defaults', () => {
		expect(resolve({ token: 'dapi123' })).toEqual({
			host: 'dbc-x.cloud.databricks.com',
			httpPath: '/sql/1.0/warehouses/abc123',
			catalog: 'main',
			schema: 'default',
			schemas: [],
			authType: 'token',
			token: 'dapi123'
		});
	});

	it('maps an OAuth connection to oauth auth', () => {
		expect(resolve({ client_id: 'cid', client_secret: 'csecret' })).toMatchObject({
			authType: 'oauth',
			clientId: 'cid',
			clientSecret: 'csecret'
		});
	});

	it('carries catalog, schema, and the schemas allowlist through', () => {
		expect(
			resolve({ token: 'dapi123', catalog: 'analytics', schema: 'sales', schemas: ['sales', 'raw'] })
		).toMatchObject({ catalog: 'analytics', schema: 'sales', schemas: ['sales', 'raw'] });
	});

	it('schema rejects a host containing a protocol', () => {
		expect(() => resolve({ token: 'dapi123', host: 'https://dbc-x.cloud.databricks.com' })).toThrow(
			/hostname only/
		);
	});

	it('schema rejects providing neither token nor client_secret', () => {
		expect(() => resolve({})).toThrow();
	});
});
