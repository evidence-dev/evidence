import { describe, expect, it } from 'vitest';
import {
	buildGithubAppInstallUrl,
	buildGithubWebUrl,
	getGithubApiBaseUrl,
	getGithubProvider,
	normalizeGithubHost
} from './host';

describe('GitHub hosts', () => {
	it('normalizes GitHub.com and GHE.com hosts', () => {
		expect(normalizeGithubHost(undefined)).toBe('github.com');
		expect(normalizeGithubHost('HTTPS://OCTOCORP.GHE.COM/')).toBe('octocorp.ghe.com');
		expect(getGithubProvider('octocorp.ghe.com')).toBe('ghe_cloud');
	});

	it('derives the correct REST API base URL', () => {
		expect(getGithubApiBaseUrl('github.com')).toBe('https://api.github.com');
		expect(getGithubApiBaseUrl('octocorp.ghe.com')).toBe('https://api.octocorp.ghe.com');
	});

	it.each([
		'github.company.com',
		'api.octocorp.ghe.com',
		'octocorp.ghe.com:8443',
		'https://octocorp.ghe.com/path',
		'https://user@octocorp.ghe.com',
		'http://octocorp.ghe.com',
		'octocorp.ghe.com.evil.example'
	])('rejects unsupported or unsafe host %s', (host) => {
		expect(() => normalizeGithubHost(host)).toThrow();
	});

	it('encodes web URL path segments', () => {
		expect(buildGithubWebUrl('octocorp.ghe.com', 'acme', 'my repo', 'tree', 'feature/a')).toBe(
			'https://octocorp.ghe.com/acme/my%20repo/tree/feature%2Fa'
		);
	});

	it('owner-scopes App install URLs on GHE.com only', () => {
		expect(
			buildGithubAppInstallUrl('octocorp.ghe.com', 'octocorp', 'evidence-studio-1a2b', 'st&1')
		).toBe(
			'https://octocorp.ghe.com/apps/octocorp/evidence-studio-1a2b/installations/new?state=st%261'
		);
		expect(buildGithubAppInstallUrl('github.com', 'octocorp', 'evidence-studio', 'org_1')).toBe(
			'https://github.com/apps/evidence-studio/installations/new?state=org_1'
		);
	});
});
