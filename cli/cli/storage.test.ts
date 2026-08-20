import { describe, it, expect, afterEach } from 'vitest';
import { loadCredentialsFromEnv } from './storage.ts';

describe('loadCredentialsFromEnv', () => {
	const originalEnv = process.env.EVIDENCE_AUTH_TOKEN;

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.EVIDENCE_AUTH_TOKEN;
		} else {
			process.env.EVIDENCE_AUTH_TOKEN = originalEnv;
		}
	});

	it('returns null when EVIDENCE_AUTH_TOKEN is not set', () => {
		delete process.env.EVIDENCE_AUTH_TOKEN;
		expect(loadCredentialsFromEnv()).toBeNull();
	});

	it('parses a valid base64 token correctly', () => {
		const payload = { refreshToken: 'rt_abc123', organizationId: 'org_456' };
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');

		const result = loadCredentialsFromEnv();
		expect(result).not.toBeNull();
		expect(result!.refreshToken).toBe('rt_abc123');
		expect(result!.organizationId).toBe('org_456');
		expect(result!.fromEnv).toBe(true);
		expect(result!.accessToken).toBe('');
	});

	it('extracts sealedSession from token when present', () => {
		const payload = {
			refreshToken: 'rt_abc123',
			organizationId: 'org_456',
			sealedSession: 'sealed_xyz'
		};
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');

		const result = loadCredentialsFromEnv();
		expect(result).not.toBeNull();
		expect(result!.sealedSession).toBe('sealed_xyz');
	});

	it('returns undefined sealedSession when not in token', () => {
		const payload = { refreshToken: 'rt_abc123', organizationId: 'org_456' };
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');

		const result = loadCredentialsFromEnv();
		expect(result).not.toBeNull();
		expect(result!.sealedSession).toBeUndefined();
	});

	it('returns null for malformed base64', () => {
		process.env.EVIDENCE_AUTH_TOKEN = '!!!not-base64!!!';
		expect(loadCredentialsFromEnv()).toBeNull();
	});

	it('returns null when missing refreshToken', () => {
		const payload = { organizationId: 'org_456' };
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');
		expect(loadCredentialsFromEnv()).toBeNull();
	});

	it('returns null when missing organizationId', () => {
		const payload = { refreshToken: 'rt_abc123' };
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');
		expect(loadCredentialsFromEnv()).toBeNull();
	});

	it('parses APT-only token format correctly', () => {
		const payload = { aptToken: 'apt_abc123', organizationId: 'org_456' };
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');

		const result = loadCredentialsFromEnv();
		expect(result).not.toBeNull();
		expect(result!.aptToken).toBe('apt_abc123');
		expect(result!.organizationId).toBe('org_456');
		expect(result!.refreshToken).toBe('');
		expect(result!.fromEnv).toBe(true);
		expect(result!.accessToken).toBe('');
	});

	it('parses token with both refreshToken and aptToken correctly', () => {
		const payload = {
			refreshToken: 'rt_abc123',
			aptToken: 'apt_def456',
			organizationId: 'org_789'
		};
		process.env.EVIDENCE_AUTH_TOKEN = Buffer.from(JSON.stringify(payload)).toString('base64');

		const result = loadCredentialsFromEnv();
		expect(result).not.toBeNull();
		expect(result!.refreshToken).toBe('rt_abc123');
		expect(result!.aptToken).toBe('apt_def456');
		expect(result!.organizationId).toBe('org_789');
		expect(result!.fromEnv).toBe(true);
	});
});
