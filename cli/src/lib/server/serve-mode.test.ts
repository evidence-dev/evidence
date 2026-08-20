import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isServeMode, basicAuthConfigured } from '$lib/server/serve-mode';
import { authDisabled, checkBasicAuth } from '$cli/basic-auth';

const ENV_KEYS = [
	'EVIDENCE_SERVE',
	'EVIDENCE_BASIC_USER',
	'EVIDENCE_BASIC_PASSWORD',
	'EVIDENCE_AUTH_DISABLED'
] as const;

function saveEnv() {
	return ENV_KEYS.map((k) => [k, process.env[k]] as const);
}
function restoreEnv(saved: ReturnType<typeof saveEnv>) {
	for (const [k, v] of saved) {
		if (v === undefined) delete process.env[k];
		else process.env[k] = v;
	}
}

function basicHeader(user: string, pass: string): string {
	return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

describe('serve-mode', () => {
	let saved: ReturnType<typeof saveEnv>;
	beforeEach(() => {
		saved = saveEnv();
		for (const k of ENV_KEYS) delete process.env[k];
	});
	afterEach(() => restoreEnv(saved));

	describe('isServeMode / basicAuthConfigured', () => {
		it('is false without env and true with env', () => {
			expect(isServeMode()).toBe(false);
			process.env.EVIDENCE_SERVE = '1';
			expect(isServeMode()).toBe(true);
		});

		it('requires both auth envs', () => {
			expect(basicAuthConfigured()).toBe(false);
			process.env.EVIDENCE_BASIC_USER = 'u';
			expect(basicAuthConfigured()).toBe(false);
			process.env.EVIDENCE_BASIC_PASSWORD = 'p';
			expect(basicAuthConfigured()).toBe(true);
		});
	});

	describe('checkBasicAuth', () => {
		beforeEach(() => {
			process.env.EVIDENCE_BASIC_USER = 'reports';
			process.env.EVIDENCE_BASIC_PASSWORD = 's3cret:with:colons';
		});

		it('accepts correct credentials', () => {
			expect(checkBasicAuth(basicHeader('reports', 's3cret:with:colons'))).toBe(true);
		});

		it('rejects wrong password', () => {
			expect(checkBasicAuth(basicHeader('reports', 'wrong'))).toBe(false);
		});

		it('rejects wrong user', () => {
			expect(checkBasicAuth(basicHeader('admin', 's3cret:with:colons'))).toBe(false);
		});

		it('rejects missing and malformed headers', () => {
			expect(checkBasicAuth(null)).toBe(false);
			expect(checkBasicAuth('')).toBe(false);
			expect(checkBasicAuth('Bearer abc')).toBe(false);
			expect(checkBasicAuth('Basic !!!not-base64!!!')).toBe(false);
			expect(checkBasicAuth(`Basic ${Buffer.from('nocolon').toString('base64')}`)).toBe(false);
		});

		it('passes when env auth is not configured (localhost-exempt installs)', () => {
			// Boot validation is what enforces auth beyond localhost; the check
			// itself only fails closed once credentials exist.
			delete process.env.EVIDENCE_BASIC_PASSWORD;
			expect(checkBasicAuth(basicHeader('reports', 's3cret:with:colons'))).toBe(true);
			delete process.env.EVIDENCE_BASIC_USER;
			expect(checkBasicAuth(null)).toBe(true);
		});

		it('passes everything when EVIDENCE_AUTH_DISABLED is set, even with creds configured', () => {
			process.env.EVIDENCE_AUTH_DISABLED = 'true';
			expect(checkBasicAuth(null)).toBe(true);
			expect(checkBasicAuth(basicHeader('reports', 'wrong'))).toBe(true);
			process.env.EVIDENCE_AUTH_DISABLED = '1';
			expect(checkBasicAuth(null)).toBe(true);
		});
	});

	describe('authDisabled', () => {
		it("accepts only '1' and 'true'", () => {
			expect(authDisabled()).toBe(false);
			process.env.EVIDENCE_AUTH_DISABLED = 'true';
			expect(authDisabled()).toBe(true);
			process.env.EVIDENCE_AUTH_DISABLED = '1';
			expect(authDisabled()).toBe(true);
		});

		it('fails closed on any other value', () => {
			for (const v of ['false', '0', 'yes', 'TRUE', ' ', 'disabled']) {
				process.env.EVIDENCE_AUTH_DISABLED = v;
				expect(authDisabled()).toBe(false);
			}
		});
	});
});
