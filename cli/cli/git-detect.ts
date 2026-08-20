/**
 * Read-only git introspection used by `launch`/`link` to auto-detect the
 * external GitHub repo, branch, and the project's path within the repo. Every
 * helper is best-effort: a missing git, missing remote, or non-repo cwd returns
 * null rather than throwing, so callers can fall back to prompts/flags.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import {
	GITHUB_DOT_COM_HOST,
	isGithubEnterpriseCloudHost,
	normalizeGithubHost
} from '@evidence/core/github/host';

const exec = promisify(execFile);

export async function isGitRepo(cwd: string): Promise<boolean> {
	return (await git(cwd, ['rev-parse', '--is-inside-work-tree'])) === 'true';
}

async function git(cwd: string, args: string[]): Promise<string | null> {
	try {
		const { stdout } = await exec('git', args, { cwd });
		return stdout.trim();
	} catch {
		return null;
	}
}

export interface RepoOwnerName {
	host: string;
	owner: string;
	repo: string;
}

/**
 * Parse a GitHub remote URL into owner/repo. Handles the three common forms:
 *   git@github.com:owner/repo.git
 *   https://github.com/owner/repo(.git)
 *   ssh://git@github.com/owner/repo.git
 * Returns null for non-GitHub or unrecognized remotes.
 */
export function parseGitRemote(url: string | null | undefined): RepoOwnerName | null {
	if (!url) return null;
	const trimmed = url.trim();

	// scp-like syntax: git@github.com:owner/repo.git
	const scp = trimmed.match(/^[^@]+@([^:]+):(.+?)(?:\.git)?$/);
	if (scp) {
		const host = parseSupportedHost(scp[1]);
		const repo = splitOwnerRepo(scp[2]);
		return host && repo ? { host, ...repo } : null;
	}

	// URL syntax: https://github.com/owner/repo(.git) or ssh://git@github.com/owner/repo.git
	try {
		const u = new URL(trimmed);
		const host = parseSupportedHost(u.hostname);
		if (!host) return null;
		const cleaned = u.pathname.replace(/^\/+/, '').replace(/\.git$/, '');
		const repo = splitOwnerRepo(cleaned);
		return repo ? { host, ...repo } : null;
	} catch {
		return null;
	}
}

function parseSupportedHost(value: string): string | null {
	try {
		const host = normalizeGithubHost(value);
		return host === GITHUB_DOT_COM_HOST || isGithubEnterpriseCloudHost(host) ? host : null;
	} catch {
		return null;
	}
}

function splitOwnerRepo(pathPart: string): Omit<RepoOwnerName, 'host'> | null {
	const parts = pathPart
		.replace(/\.git$/, '')
		.split('/')
		.filter(Boolean);
	if (parts.length < 2) return null;
	// owner/repo are the last two segments (handles enterprise nested paths defensively).
	const repo = parts[parts.length - 1];
	const owner = parts[parts.length - 2];
	if (!owner || !repo) return null;
	return { owner, repo };
}

export async function detectGitRoot(cwd: string): Promise<string | null> {
	return git(cwd, ['rev-parse', '--show-toplevel']);
}

export async function detectRepoOwnerName(cwd: string): Promise<RepoOwnerName | null> {
	const url = await git(cwd, ['config', '--get', 'remote.origin.url']);
	return parseGitRemote(url);
}

export async function detectCurrentBranch(cwd: string): Promise<string | null> {
	const branch = await git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
	return branch && branch !== 'HEAD' ? branch : null;
}

/** The remote's default branch (origin/HEAD), falling back to the current branch. */
export async function detectDefaultBranch(cwd: string): Promise<string | null> {
	const ref = await git(cwd, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
	if (ref) return ref.replace(/^origin\//, '');
	return detectCurrentBranch(cwd);
}

/**
 * The Evidence project root relative to the git root, as a POSIX path.
 * '' means the project sits at the repo root. Returns null if cwd isn't in a
 * git repo.
 */
export async function detectRootPath(cwd: string, projectRoot: string): Promise<string | null> {
	const gitRoot = await detectGitRoot(cwd);
	if (!gitRoot) return null;
	const rel = path.relative(gitRoot, projectRoot);
	if (rel.startsWith('..')) return null;
	return rel.split(path.sep).join('/');
}

export async function detectHeadSha(cwd: string): Promise<string | null> {
	return git(cwd, ['rev-parse', 'HEAD']);
}
