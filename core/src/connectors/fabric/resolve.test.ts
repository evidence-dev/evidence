import { describe, it, expect } from 'vitest';
import { fabricConnectionSchema } from './connection-schema';
import { resolveFabricCredentials } from './resolve';

function resolve(config: Record<string, unknown>) {
	return resolveFabricCredentials(fabricConnectionSchema.parse({ type: 'fabric', ...config }));
}

const valid = {
	server: 'abc.datawarehouse.fabric.microsoft.com',
	database: 'analytics',
	tenantId: 't',
	clientId: 'c',
	clientSecret: 's'
};

describe('resolveFabricCredentials', () => {
	it('narrows a valid service-principal config to the credential shape', () => {
		expect(resolve(valid)).toEqual({
			server: 'abc.datawarehouse.fabric.microsoft.com',
			database: 'analytics',
			tenantId: 't',
			clientId: 'c',
			clientSecret: 's',
			// Schema fields default in via the schema (dbo / empty allowlist).
			defaultSchema: 'dbo',
			schemas: []
		});
	});

	it('forwards the defaultSchema and schemas allowlist through', () => {
		expect(resolve({ ...valid, defaultSchema: 'sales', schemas: ['sales', 'raw'] })).toMatchObject({
			defaultSchema: 'sales',
			schemas: ['sales', 'raw']
		});
	});

	it('trims whitespace around the server host', () => {
		expect(resolve({ ...valid, server: '  abc.datawarehouse.fabric.microsoft.com  ' }).server).toBe(
			'abc.datawarehouse.fabric.microsoft.com'
		);
	});

	it('schema rejects a server given as a URL', () => {
		expect(() => resolve({ ...valid, server: 'https://abc.datawarehouse.fabric.microsoft.com' })).toThrow(
			/URL/
		);
	});

	it('schema rejects a non-Fabric host (blind-SSRF guard)', () => {
		expect(() => resolve({ ...valid, server: 'internal.example.com' })).toThrow(
			/Microsoft Fabric SQL endpoint/
		);
	});

	it('schema accepts sovereign-cloud endpoints (.us / .cn)', () => {
		expect(resolve({ ...valid, server: 'abc.datawarehouse.fabric.microsoft.us' }).server).toBe(
			'abc.datawarehouse.fabric.microsoft.us'
		);
	});

	it('rejects a config missing clientSecret', () => {
		const { clientSecret: _omit, ...noSecret } = valid;
		expect(() => resolve(noSecret)).toThrow(/clientSecret/);
	});
});
