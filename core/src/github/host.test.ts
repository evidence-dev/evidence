import { describe, expect, it } from 'vitest';
import {
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
});
