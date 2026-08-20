import { describe, it, expect } from 'vitest';
import { buildBigQueryClientOptions } from './client-options';
import { normalizeCredentials, type BigQueryCredentials } from './credentials';

const sa = {
	client_email: 'svc@proj.iam.gserviceaccount.com',
	private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
	project_id: 'my-proj'
};

describe('buildBigQueryClientOptions', () => {
	it('passes projectId + credentials and omits location when unset', () => {
		const credentials: BigQueryCredentials = {
			authType: 'service_account_json',
			projectId: 'my-proj',
			serviceAccountJson: sa
		};
		const opts = buildBigQueryClientOptions(credentials);
		expect(opts.projectId).toBe('my-proj');
		expect(opts.credentials).toEqual({
			client_email: sa.client_email,
			private_key: sa.private_key
		});
		expect('location' in opts).toBe(false);
	});

	it('includes location when provided', () => {
		const opts = buildBigQueryClientOptions({
			authType: 'service_account_json',
			projectId: 'my-proj',
			serviceAccountJson: sa,
			location: 'US'
		});
		expect(opts.location).toBe('US');
	});
});

describe('normalizeCredentials', () => {
	it('returns a fully-typed credentials object for valid input', () => {
		const normalized = normalizeCredentials({
			projectId: 'my-proj',
			serviceAccountJson: sa,
			location: 'EU',
			defaultDataset: 'analytics'
		});
		expect(normalized.authType).toBe('service_account_json');
		expect(normalized.projectId).toBe('my-proj');
		expect(normalized.location).toBe('EU');
		expect(normalized.defaultDataset).toBe('analytics');
		expect(normalized.serviceAccountJson.client_email).toBe(sa.client_email);
	});

	it('throws when projectId is missing', () => {
		expect(() => normalizeCredentials({ serviceAccountJson: sa })).toThrow(/projectId/);
	});

	it('throws when serviceAccountJson is missing', () => {
		expect(() => normalizeCredentials({ projectId: 'p' })).toThrow(/serviceAccountJson/);
	});

	it('throws when service account is missing client_email or private_key', () => {
		expect(() =>
			normalizeCredentials({
				projectId: 'p',
				serviceAccountJson: { private_key: 'k' }
			})
		).toThrow(/client_email/);
		expect(() =>
			normalizeCredentials({
				projectId: 'p',
				serviceAccountJson: { client_email: 'e' }
			})
		).toThrow(/private_key/);
	});

	it('throws a readable error when credentials are null', () => {
		expect(() => normalizeCredentials(null)).toThrow(/missing or invalid/);
		expect(() => normalizeCredentials(undefined)).toThrow(/missing or invalid/);
	});
});
