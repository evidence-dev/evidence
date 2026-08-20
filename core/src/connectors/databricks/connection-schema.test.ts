import { describe, it, expect } from 'vitest';
import { databricksConnectionSchema } from './connection-schema';

describe('databricksConnectionSchema', () => {
	const valid = {
		type: 'databricks' as const,
		host: 'dbc-a1b2c3d4-e5f6.cloud.databricks.com',
		http_path: '/sql/1.0/warehouses/abc123',
		catalog: 'main',
		token: 'dapi1234567890'
	};

	it('applies connection defaults', () => {
		const parsed = databricksConnectionSchema.parse(valid);
		expect(parsed.schema).toBe('default');
		expect(parsed.schemas).toEqual([]);
		expect(parsed.sessionVariableMappings).toEqual([]);
	});

	it('trims the host and rejects a host that includes a scheme', () => {
		expect(
			databricksConnectionSchema.parse({
				...valid,
				host: '  dbc-x.cloud.databricks.com  '
			}).host
		).toBe('dbc-x.cloud.databricks.com');

		expect(
			databricksConnectionSchema.safeParse({
				...valid,
				host: 'https://dbc-x.cloud.databricks.com'
			}).success
		).toBe(false);
	});

	it('accepts Azure and rejects non-Databricks hosts (SSRF guard)', () => {
		expect(
			databricksConnectionSchema.safeParse({
				...valid,
				host: 'adb-1234567890.1.azuredatabricks.net'
			}).success
		).toBe(true);
		expect(
			databricksConnectionSchema.safeParse({ ...valid, host: 'internal.corp.net' }).success
		).toBe(false);
	});

	it('requires exactly one secret (token XOR client_secret)', () => {
		// neither
		expect(
			databricksConnectionSchema.safeParse({
				type: 'databricks',
				host: valid.host,
				http_path: valid.http_path,
				catalog: 'main'
			}).success
		).toBe(false);

		// both
		expect(
			databricksConnectionSchema.safeParse({
				...valid,
				client_id: 'cid',
				client_secret: 'csecret'
			}).success
		).toBe(false);

		// just token
		expect(databricksConnectionSchema.safeParse(valid).success).toBe(true);

		// OAuth: client_id + client_secret, no token
		const { token: _t, ...noToken } = valid;
		expect(
			databricksConnectionSchema.safeParse({
				...noToken,
				client_id: 'cid',
				client_secret: 'csecret'
			}).success
		).toBe(true);
	});

	it('rejects a client_secret without a client_id', () => {
		const { token: _t, ...noToken } = valid;
		expect(
			databricksConnectionSchema.safeParse({ ...noToken, client_secret: 'csecret' }).success
		).toBe(false);
	});

	it('rejects session variable names that are not plain SQL identifiers', () => {
		// The runtime DECLARE guard enforces the same pattern — reject on save so a
		// bad name doesn't silently break every query.
		expect(
			databricksConnectionSchema.safeParse({
				...valid,
				sessionVariableMappings: [
					{ databricksVariable: 'my-variable', evidenceVariable: 'user.email' }
				]
			}).success
		).toBe(false);

		expect(
			databricksConnectionSchema.safeParse({
				...valid,
				sessionVariableMappings: [
					{ databricksVariable: 'app_user_email', evidenceVariable: 'user.email' }
				]
			}).success
		).toBe(true);
	});
});
