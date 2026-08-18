import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureSessionResolved, clearSessionCache } from './credentials.server';
import type { StoredCredentials } from './credentials.server';

function makeCredentials(overrides: Partial<StoredCredentials> = {}): StoredCredentials {
	return {
		accessToken: 'at_test',
		refreshToken: 'rt_test',
		organizationId: 'org_123',
		user: { id: 'u1', email: 'test@test.com' },
		...overrides
	};
}

const STUDIO_HOST = 'https://test.evidence.studio';

describe('ensureSessionResolved', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		clearSessionCache();
	});

	it('returns immediately if sealedSession already set', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const creds = makeCredentials({ sealedSession: 'existing' });

		const result = await ensureSessionResolved(creds, STUDIO_HOST);
		expect(result.sealedSession).toBe('existing');
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('fetches and caches session', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ sealedSession: 'new-session' }), { status: 200 })
		);

		const creds = makeCredentials();
		const result = await ensureSessionResolved(creds, STUDIO_HOST);

		expect(result.sealedSession).toBe('new-session');
		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(fetchSpy).toHaveBeenCalledWith(
			`${STUDIO_HOST}/api/cli/session`,
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('cache hit on second call', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(JSON.stringify({ sealedSession: 'cached' }), { status: 200 })
		);

		await ensureSessionResolved(makeCredentials(), STUDIO_HOST);
		const result = await ensureSessionResolved(makeCredentials(), STUDIO_HOST);

		expect(result.sealedSession).toBe('cached');
		expect(fetchSpy).toHaveBeenCalledOnce();
	});

	it('clearSessionCache forces re-fetch', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ sealedSession: 'session1' }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ sealedSession: 'session2' }), { status: 200 })
			);

		await ensureSessionResolved(makeCredentials(), STUDIO_HOST);
		expect(fetchSpy).toHaveBeenCalledOnce();

		clearSessionCache();

		const result = await ensureSessionResolved(makeCredentials(), STUDIO_HOST);
		expect(fetchSpy).toHaveBeenCalledTimes(2);
		expect(result.sealedSession).toBe('session2');
	});

	it('throws helpful error for env var credentials on failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

		const creds = makeCredentials({ fromEnv: true });
		await expect(ensureSessionResolved(creds, STUDIO_HOST)).rejects.toThrow(
			'EVIDENCE_AUTH_TOKEN'
		);
	});

	it('logs warning for file-based credentials on failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const creds = makeCredentials({ fromEnv: false });
		const result = await ensureSessionResolved(creds, STUDIO_HOST);

		expect(result.sealedSession).toBeUndefined();
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('could not create sealed session')
		);
	});

	it('throws when no organizationId', async () => {
		const creds = makeCredentials({ organizationId: null });
		await expect(ensureSessionResolved(creds, STUDIO_HOST)).rejects.toThrow(
			'No organization selected'
		);
	});

	it('tracks rotated refresh token from server response', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(
				JSON.stringify({ sealedSession: 'new-sess', refreshToken: 'rt_rotated' }),
				{ status: 200 }
			)
		);

		const creds = makeCredentials({ fromEnv: false });
		const result = await ensureSessionResolved(creds, STUDIO_HOST);

		expect(result.refreshToken).toBe('rt_rotated');
	});
});
