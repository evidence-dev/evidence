import { describe, expect, it } from 'vitest';
import { couplerIoConnectionSchema } from './connection-schema';
import { normalizeCredentials } from './credentials';
import { resolveCouplerIoCredentials } from './resolve';

const DATASET_ID = '1654ea41-37bf-48b2-8256-87c5ea3c5a90';
const base = { type: 'coupler-io', token: 't0k', workspace_id: '1042' };

const issue = (input: object) =>
	couplerIoConnectionSchema.safeParse({ ...base, ...input }).error?.issues[0]?.message;

describe('couplerIoConnectionSchema', () => {
	it('applies defaults and accepts a numeric workspace id', () => {
		const parsed = couplerIoConnectionSchema.parse({ ...base, workspace_id: 1042 });
		expect(parsed.workspace_id).toBe('1042');
		expect(parsed.datasets).toEqual({});
		expect(parsed.max_concurrent_requests).toBe(4);
		expect(parsed.api_host).toBeUndefined();
	});

	it('rejects unfilled `evidence init` placeholders', () => {
		expect(issue({ workspace_id: '<workspace-id>' })).toMatch(/unfilled <placeholder>/);
		expect(issue({ datasets: { funnel: '<dataset-id>' } })).toMatch(/unfilled <placeholder>/);
	});

	it('validates workspace and dataset id formats', () => {
		expect(issue({ workspace_id: 'main' })).toMatch(/numeric Coupler.io workspace id/);
		expect(issue({ datasets: { funnel: 'abc' } })).toMatch(/dataset id/);
		expect(issue({ datasets: { funnel: DATASET_ID } })).toBeUndefined();
	});

	it('only accepts an https origin on coupler.io as the API host', () => {
		expect(issue({ api_host: 'https://api.eu.coupler.io/' })).toBeUndefined();
		expect(issue({ api_host: 'https://coupler.io.evil.test' })).toMatch(/coupler\.io/);
		expect(issue({ api_host: 'http://api.coupler.io' })).toMatch(/coupler\.io/);
	});

	it('resolves to execution credentials', async () => {
		const parsed = couplerIoConnectionSchema.parse({
			...base,
			datasets: { funnel: DATASET_ID },
			max_concurrent_requests: 10
		});
		expect(await resolveCouplerIoCredentials(parsed, { cwd: '/' })).toEqual({
			token: 't0k',
			workspaceId: '1042',
			apiHost: 'https://api.coupler.io',
			tables: { funnel: DATASET_ID },
			maxConcurrentRequests: 10
		});
	});
});

describe('normalizeCredentials', () => {
	it('fills defaults for optional fields', () => {
		expect(normalizeCredentials({ token: 't', workspaceId: '9' })).toEqual({
			token: 't',
			workspaceId: '9',
			apiHost: 'https://api.coupler.io',
			tables: {},
			maxConcurrentRequests: 4
		});
	});

	it('fails readably on missing keys or a host outside coupler.io', () => {
		expect(() => normalizeCredentials(null)).toThrow(/missing or invalid/);
		expect(() => normalizeCredentials({ token: 't' })).toThrow(/"workspaceId"/);
		expect(() =>
			normalizeCredentials({ token: 't', workspaceId: '9', apiHost: 'https://evil.test' })
		).toThrow(/apiHost/);
	});
});
