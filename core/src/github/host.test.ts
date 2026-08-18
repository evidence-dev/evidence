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
		expect(normalizeGithubHost('HTTPS://ARKAAN.GHE.COM/')).toBe('arkaan.ghe.com');
		expect(getGithubProvider('arkaan.ghe.com')).toBe('ghe_cloud');
	});

	it('derives the correct REST API base URL', () => {
		expect(getGithubApiBaseUrl('github.com')).toBe('https://api.github.com');
		expect(getGithubApiBaseUrl('arkaan.ghe.com')).toBe('https://api.arkaan.ghe.com');
	});

	it.each([
		'github.company.com',
		'api.arkaan.ghe.com',
		'arkaan.ghe.com:8443',
		'https://arkaan.ghe.com/path',
		'https://user@arkaan.ghe.com',
		'http://arkaan.ghe.com',
		'arkaan.ghe.com.evil.example'
	])('rejects unsupported or unsafe host %s', (host) => {
		expect(() => normalizeGithubHost(host)).toThrow();
	});

	it('encodes web URL path segments', () => {
		expect(buildGithubWebUrl('arkaan.ghe.com', 'acme', 'my repo', 'tree', 'feature/a')).toBe(
			'https://arkaan.ghe.com/acme/my%20repo/tree/feature%2Fa'
		);
	});
});
