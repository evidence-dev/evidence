import { describe, it, expect } from 'vitest';
import { parseGitRemote } from './git-detect.ts';

describe('parseGitRemote', () => {
	it('parses scp-style ssh remotes', () => {
		expect(parseGitRemote('git@github.com:acme/reports.git')).toEqual({
			host: 'github.com',
			owner: 'acme',
			repo: 'reports'
		});
		expect(parseGitRemote('git@github.com:acme/reports')).toEqual({
			host: 'github.com',
			owner: 'acme',
			repo: 'reports'
		});
	});

	it('parses https remotes with and without .git', () => {
		expect(parseGitRemote('https://github.com/acme/reports.git')).toEqual({
			host: 'github.com',
			owner: 'acme',
			repo: 'reports'
		});
		expect(parseGitRemote('https://github.com/acme/reports')).toEqual({
			host: 'github.com',
			owner: 'acme',
			repo: 'reports'
		});
	});

	it('parses ssh:// URLs', () => {
		expect(parseGitRemote('ssh://git@github.com/acme/reports.git')).toEqual({
			host: 'github.com',
			owner: 'acme',
			repo: 'reports'
		});
	});

	it('returns null for non-GitHub hosts', () => {
		expect(parseGitRemote('git@gitlab.com:acme/reports.git')).toBeNull();
		expect(parseGitRemote('https://bitbucket.org/acme/reports.git')).toBeNull();
	});

	it('returns null for empty / malformed input', () => {
		expect(parseGitRemote(null)).toBeNull();
		expect(parseGitRemote(undefined)).toBeNull();
		expect(parseGitRemote('')).toBeNull();
		expect(parseGitRemote('not a url')).toBeNull();
		expect(parseGitRemote('https://github.com/acme')).toBeNull();
	});

	it('handles a trailing slash on https remotes', () => {
		expect(parseGitRemote('https://github.com/acme/reports/')).toEqual({
			host: 'github.com',
			owner: 'acme',
			repo: 'reports'
		});
	});

	it('parses GitHub Enterprise Cloud remotes', () => {
		expect(parseGitRemote('https://arkaan.ghe.com/acme/reports.git')).toEqual({
			host: 'arkaan.ghe.com',
			owner: 'acme',
			repo: 'reports'
		});
		expect(parseGitRemote('arkaan@arkaan.ghe.com:acme/reports.git')).toEqual({
			host: 'arkaan.ghe.com',
			owner: 'acme',
			repo: 'reports'
		});
		expect(parseGitRemote('ssh://arkaan@arkaan.ghe.com/acme/reports.git')).toEqual({
			host: 'arkaan.ghe.com',
			owner: 'acme',
			repo: 'reports'
		});
	});

	it('rejects self-hosted and lookalike enterprise hosts', () => {
		expect(parseGitRemote('git@github.company.com:acme/reports.git')).toBeNull();
		expect(parseGitRemote('https://arkaan.ghe.com.evil.test/acme/reports.git')).toBeNull();
	});
});
