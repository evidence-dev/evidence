import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	ensureSessionResolved,
	decodeJwtClaim,
	fetchUserOrganizations,
	verifyOrganizations,
	whoami,
	ensureAuthenticated,
	listOrgs,
	switchOrg,
	generateToken
} from './auth.ts';
import type { StoredCredentials } from './storage.ts';
import type { OutputOptions } from './output.ts';

// whoami now takes OutputOptions; `verbose` forces the human (table) view these
// tests assert on rather than the default machine-readable JSON.
const humanOpts: OutputOptions = {
	format: 'table',
	columns: null,
	limit: null,
	all: false,
	verbose: true,
	interactive: false,
	color: false
};

vi.mock('./storage.ts', () => ({
	saveCredentials: vi.fn(),
	clearCredentials: vi.fn(),
	loadCredentials: vi.fn(),
	loadCredentialsFromFile: vi.fn(),
	saveSessionCache: vi.fn(),
	clearSessionCache: vi.fn()
}));

import {
	saveCredentials,
	saveSessionCache,
	clearSessionCache,
	clearCredentials,
	loadCredentials,
	loadCredentialsFromFile
} from './storage.ts';

let testOrgCounter = 0;

function makeCredentials(overrides: Partial<StoredCredentials> = {}): StoredCredentials {
	return {
		accessToken: 'at_test',
		refreshToken: 'rt_test',
		organizationId: overrides.organizationId ?? `org_${++testOrgCounter}`,
		user: {
			id: 'u1',
			email: 'test@test.com',
			firstName: null,
			lastName: null,
			profilePictureUrl: null
		},
		...overrides
	};
}

describe('ensureSessionResolved', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it('returns immediately if sealedSession already set', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const creds = makeCredentials({ sealedSession: 'existing-session' });

		const result = await ensureSessionResolved(creds);
		expect(result.sealedSession).toBe('existing-session');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('fetches session from /api/cli/session when no cache', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ sealedSession: 'new-session' }), { status: 200 })
		);

		const creds = makeCredentials();
		const result = await ensureSessionResolved(creds);

		expect(result.sealedSession).toBe('new-session');
		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url, opts] = fetchSpy.mock.calls[0];
		expect(url).toContain('/api/cli/session');
		expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
			refreshToken: 'rt_test',
			organizationId: creds.organizationId
		});
	});

	it('uses in-memory cache on second call', async () => {
		const orgId = `org_cache_${++testOrgCounter}`;
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ sealedSession: 'cached-session' }), { status: 200 })
		);

		const creds1 = makeCredentials({ organizationId: orgId });
		await ensureSessionResolved(creds1);

		const creds2 = makeCredentials({ organizationId: orgId });
		const result = await ensureSessionResolved(creds2);

		expect(result.sealedSession).toBe('cached-session');
		expect(fetchSpy).toHaveBeenCalledOnce();
	});

	it('throws helpful error for env var credentials on fetch failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

		const creds = makeCredentials({ fromEnv: true });
		await expect(ensureSessionResolved(creds)).rejects.toThrow('EVIDENCE_AUTH_TOKEN');
	});

	it('clears session cache on env var credential failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

		const creds = makeCredentials({ fromEnv: true });
		try {
			await ensureSessionResolved(creds);
		} catch {
			// expected
		}
		expect(clearSessionCache).toHaveBeenCalled();
	});

	it('logs warning for file-based credentials on fetch failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const creds = makeCredentials({ fromEnv: false });
		const result = await ensureSessionResolved(creds);

		expect(result.sealedSession).toBeUndefined();
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('could not create sealed session')
		);
	});

	it('saves to disk for file-based credentials, not for env var', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ sealedSession: 'sess1' }), { status: 200 })
		);

		// File-based: should save
		const fileCreds = makeCredentials({ fromEnv: false });
		await ensureSessionResolved(fileCreds);
		expect(saveCredentials).toHaveBeenCalledOnce();

		vi.mocked(saveCredentials).mockClear();
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ sealedSession: 'sess2' }), { status: 200 })
		);

		// Env-based: should save to session cache instead
		const envCreds = makeCredentials({ fromEnv: true });
		await ensureSessionResolved(envCreds);
		expect(saveCredentials).not.toHaveBeenCalled();
		expect(saveSessionCache).toHaveBeenCalled();
	});

	it('tracks rotated refresh token from server response', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(
				JSON.stringify({ sealedSession: 'new-sess', refreshToken: 'rt_rotated' }),
				{ status: 200 }
			)
		);

		const creds = makeCredentials({ fromEnv: false });
		const result = await ensureSessionResolved(creds);

		expect(result.refreshToken).toBe('rt_rotated');
		expect(saveCredentials).toHaveBeenCalledWith(
			expect.objectContaining({ refreshToken: 'rt_rotated' })
		);
	});

	it('persists session cache for env var credentials with rotated token', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(
				JSON.stringify({ sealedSession: 'env-sess', refreshToken: 'rt_new' }),
				{ status: 200 }
			)
		);

		const creds = makeCredentials({ fromEnv: true });
		await ensureSessionResolved(creds);

		expect(saveSessionCache).toHaveBeenCalledWith(
			'env-sess',
			'rt_new',
			creds.organizationId
		);
	});
});

describe('decodeJwtClaim', () => {
	function makeJwt(payload: Record<string, unknown>): string {
		const part = (obj: Record<string, unknown>) =>
			Buffer.from(JSON.stringify(obj)).toString('base64url');
		return `${part({ alg: 'none' })}.${part(payload)}.sig`;
	}

	it('extracts a string claim from the payload', () => {
		expect(decodeJwtClaim(makeJwt({ sid: 'session_123' }), 'sid')).toBe('session_123');
	});

	it('returns undefined when the claim is absent', () => {
		expect(decodeJwtClaim(makeJwt({ sub: 'u1' }), 'sid')).toBeUndefined();
	});

	it('returns undefined when the claim is not a string', () => {
		expect(decodeJwtClaim(makeJwt({ sid: 42 }), 'sid')).toBeUndefined();
	});

	it('returns undefined for a malformed token', () => {
		expect(decodeJwtClaim('not-a-jwt', 'sid')).toBeUndefined();
		expect(decodeJwtClaim('', 'sid')).toBeUndefined();
	});
});

describe('fetchUserOrganizations', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it('returns ok with orgs and rotated token on 200', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(
				JSON.stringify({ organizations: [{ id: 'org_1', name: 'Acme' }], refreshToken: 'rt_new' }),
				{ status: 200 }
			)
		);

		const result = await fetchUserOrganizations('rt_old');
		expect(result.status).toBe('ok');
		expect(result.organizations).toEqual([{ id: 'org_1', name: 'Acme' }]);
		expect(result.refreshToken).toBe('rt_new');
	});

	it('returns unauthorized on 401 (expired/revoked refresh token)', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 401 }));

		const result = await fetchUserOrganizations('rt_dead');
		expect(result.status).toBe('unauthorized');
		expect(result.organizations).toEqual([]);
	});

	it('returns unauthorized on 403', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 403 }));
		expect((await fetchUserOrganizations('rt')).status).toBe('unauthorized');
	});

	it('returns network-error on a 5xx server hiccup', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('boom', { status: 500 }));

		const result = await fetchUserOrganizations('rt');
		expect(result.status).toBe('network-error');
		expect(result.organizations).toEqual([]);
	});

	it('returns network-error when fetch throws', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));
		expect((await fetchUserOrganizations('rt')).status).toBe('network-error');
	});
});

describe('verifyOrganizations', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	function bodyOf(call: unknown[]): Record<string, unknown> {
		return JSON.parse((call[1] as RequestInit).body as string);
	}

	it('verifies via the APT without submitting the refresh token', async () => {
		const spy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ organizations: [{ id: 'org_1', name: 'Acme' }] }), {
					status: 200
				})
			);

		const result = await verifyOrganizations(makeCredentials({ aptToken: 'apt_1' }));
		expect(result.status).toBe('ok');
		expect(spy).toHaveBeenCalledTimes(1);
		expect(bodyOf(spy.mock.calls[0])).toMatchObject({ refreshToken: '', aptToken: 'apt_1' });
	});

	it('falls back to the refresh token when the APT is rejected', async () => {
		const spy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(new Response('nope', { status: 401 }))
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ organizations: [], refreshToken: 'rt_new' }), {
					status: 200
				})
			);

		const result = await verifyOrganizations(makeCredentials({ aptToken: 'apt_dead' }));
		expect(result.status).toBe('ok');
		expect(result.refreshToken).toBe('rt_new');
		expect(spy).toHaveBeenCalledTimes(2);
		expect(bodyOf(spy.mock.calls[1])).toMatchObject({ refreshToken: 'rt_test' });
	});

	it('uses the refresh token directly when no APT is stored', async () => {
		const spy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ organizations: [] }), { status: 200 })
			);

		await verifyOrganizations(makeCredentials());
		expect(spy).toHaveBeenCalledTimes(1);
		expect(bodyOf(spy.mock.calls[0])).toMatchObject({ refreshToken: 'rt_test' });
	});

	it('reports unauthorized without a fallback when the APT is rejected and no refresh token exists', async () => {
		const spy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(new Response('nope', { status: 401 }));

		const result = await verifyOrganizations(
			makeCredentials({ aptToken: 'apt_dead', refreshToken: '' })
		);
		expect(result.status).toBe('unauthorized');
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe('whoami', () => {
	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	const output = () => logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');

	it('reports not logged in when there are no credentials', async () => {
		vi.mocked(loadCredentials).mockResolvedValueOnce(null);
		await whoami(humanOpts);
		expect(output()).toContain('Not logged in');
	});

	it('declares the session expired (not the cached identity) on a rejected token', async () => {
		vi.mocked(loadCredentials).mockResolvedValueOnce(
			makeCredentials({
				fromEnv: false,
				user: {
					id: 'u1',
					email: 'jane@acme.com',
					firstName: 'Jane',
					lastName: 'Doe',
					profilePictureUrl: null
				}
			})
		);
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 401 }));

		await whoami(humanOpts);

		const out = output();
		expect(out).toContain('session expired');
		expect(out).toContain('evidence login');
		// Must NOT present the cached name/org as if the session were usable.
		expect(out).not.toContain('Organization:');
		expect(saveCredentials).not.toHaveBeenCalled();
	});

	it('shows cached identity as unverified when Studio is unreachable', async () => {
		vi.mocked(loadCredentials).mockResolvedValueOnce(
			makeCredentials({
				fromEnv: false,
				user: {
					id: 'u1',
					email: 'jane@acme.com',
					firstName: 'Jane',
					lastName: null,
					profilePictureUrl: null
				}
			})
		);
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));

		await whoami(humanOpts);

		const out = output();
		expect(out).toContain('jane@acme.com');
		expect(out).toContain('could not verify');
		expect(out).not.toContain('session expired');
	});

	it('prints identity and org and persists a rotated token when valid', async () => {
		const orgId = `org_who_${++testOrgCounter}`;
		vi.mocked(loadCredentials).mockResolvedValueOnce(
			makeCredentials({
				fromEnv: false,
				organizationId: orgId,
				user: {
					id: 'u1',
					email: 'jane@acme.com',
					firstName: 'Jane',
					lastName: 'Doe',
					profilePictureUrl: null
				}
			})
		);
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(
				JSON.stringify({ organizations: [{ id: orgId, name: 'Acme' }], refreshToken: 'rt_rotated' }),
				{ status: 200 }
			)
		);

		await whoami(humanOpts);

		const out = output();
		expect(out).toContain('jane@acme.com');
		expect(out).toContain('Jane Doe');
		expect(out).toContain('Organization: Acme');
		expect(saveCredentials).toHaveBeenCalledWith(
			expect.objectContaining({ refreshToken: 'rt_rotated' })
		);
	});
});

describe('ensureAuthenticated', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	it('throws (does not start a server) on an expired token when non-interactive', async () => {
		const originalTTY = process.stdin.isTTY;
		Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
		try {
			vi.mocked(loadCredentials).mockResolvedValueOnce(makeCredentials({ fromEnv: false }));
			vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 401 }));

			await expect(ensureAuthenticated()).rejects.toThrow('Session expired');
			// Stale sealed session is dropped...
			expect(clearSessionCache).toHaveBeenCalled();
			// ...but credentials are LEFT in place: deleting them would route the next
			// non-interactive run into the no-creds branch and surprise-open a browser.
			expect(clearCredentials).not.toHaveBeenCalled();
		} finally {
			Object.defineProperty(process.stdin, 'isTTY', { value: originalTTY, configurable: true });
		}
	});

	it('throws (does not open a browser) with no credentials when non-interactive', async () => {
		const originalTTY = process.stdin.isTTY;
		Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
		try {
			vi.mocked(loadCredentials).mockResolvedValueOnce(null);
			const fetchSpy = vi.spyOn(globalThis, 'fetch');

			await expect(ensureAuthenticated()).rejects.toThrow('Not logged in');
			// Must not attempt any network/login flow.
			expect(fetchSpy).not.toHaveBeenCalled();
		} finally {
			Object.defineProperty(process.stdin, 'isTTY', { value: originalTTY, configurable: true });
		}
	});

	it('throws a token-specific message for an expired EVIDENCE_AUTH_TOKEN', async () => {
		vi.mocked(loadCredentials).mockResolvedValueOnce(makeCredentials({ fromEnv: true }));
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 401 }));

		await expect(ensureAuthenticated()).rejects.toThrow('EVIDENCE_AUTH_TOKEN');
	});

	it('proceeds with cached credentials when Studio is unreachable', async () => {
		const creds = makeCredentials({ fromEnv: false, sealedSession: 'cached-sess' });
		vi.mocked(loadCredentials).mockResolvedValueOnce(creds);
		// Org fetch fails (network), but cached sealedSession lets dev proceed offline.
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('offline'));
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await ensureAuthenticated();
		expect(result.sealedSession).toBe('cached-sess');
		expect(clearCredentials).not.toHaveBeenCalled();
	});

	it('persists the rotated token and resolves the session when valid', async () => {
		const creds = makeCredentials({ fromEnv: false, sealedSession: 'cached-sess' });
		vi.mocked(loadCredentials).mockResolvedValueOnce(creds);
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ organizations: [], refreshToken: 'rt_rotated' }), { status: 200 })
		);

		const result = await ensureAuthenticated();
		expect(saveCredentials).toHaveBeenCalledWith(
			expect.objectContaining({ refreshToken: 'rt_rotated' })
		);
		// Cached sealedSession is reused (no extra /api/cli/session round-trip).
		expect(result.sealedSession).toBe('cached-sess');
	});
});

describe('org commands on an expired token', () => {
	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	const output = () => logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');

	it('listOrgs reports session expired instead of "No organizations found"', async () => {
		vi.mocked(loadCredentials).mockResolvedValueOnce(makeCredentials({ fromEnv: false }));
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 401 }));

		await listOrgs();

		const out = output();
		expect(out).toContain('Session expired');
		expect(out).not.toContain('No organizations found');
	});

	it('switchOrg reports session expired instead of "Organization not found"', async () => {
		vi.mocked(loadCredentials).mockResolvedValueOnce(makeCredentials({ fromEnv: false }));
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('nope', { status: 401 }));

		await switchOrg('Acme');

		const out = output();
		expect(out).toContain('Session expired');
		expect(out).not.toContain('Organization not found');
	});

	it('generateToken refuses to emit a token built from a dead refresh token', async () => {
		vi.mocked(loadCredentialsFromFile).mockResolvedValueOnce(makeCredentials({ fromEnv: false }));
		// Both the /api/cli/session POST and the org fetch return 401.
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 401 }));

		await generateToken();

		const out = output();
		expect(out).toContain('Session expired');
		expect(out).not.toContain('EVIDENCE_AUTH_TOKEN=');
	});
});
