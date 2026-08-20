/**
 * Version check with local caching
 * Fetches version.json from Vercel Blob and caches for 12 hours
 */

import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import semver from 'semver';
import { VERSION } from './args.ts';

const EVD_DIR = join(homedir(), '.evd');
const CACHE_FILE = join(EVD_DIR, 'version-cache.json');
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const VERSION_URL =
	'https://gaamozau3jchzs3r.public.blob.vercel-storage.com/cli/version.json';

export interface VersionInfo {
	latest: string;
	minimum: string;
	binaries: Record<string, string>;
	checksums?: Record<string, string>;
}

export interface VersionCheckResult {
	latest: string;
	minimum: string;
	updateAvailable: boolean;
	updateRequired: boolean;
	binaries: Record<string, string>;
	checksums?: Record<string, string>;
}

interface CachedVersion {
	latest: string;
	minimum: string;
	binaries: Record<string, string>;
	checksums?: Record<string, string>;
	checkedAt: number;
}

async function ensureDir(): Promise<void> {
	try {
		await mkdir(EVD_DIR, { recursive: true, mode: 0o700 });
	} catch {
		// Directory might already exist
	}
}

async function readCache(): Promise<CachedVersion | null> {
	try {
		const data = await readFile(CACHE_FILE, 'utf-8');
		const cached = JSON.parse(data) as CachedVersion;
		if (
			typeof cached?.latest !== 'string' ||
			typeof cached?.minimum !== 'string' ||
			typeof cached?.binaries !== 'object' ||
			Date.now() - cached.checkedAt >= CACHE_TTL_MS
		) {
			return null;
		}
		return cached;
	} catch {
		return null;
	}
}

async function writeCache(info: VersionInfo): Promise<void> {
	await ensureDir();
	const cached: CachedVersion = {
		latest: info.latest,
		minimum: info.minimum,
		binaries: info.binaries,
		checksums: info.checksums,
		checkedAt: Date.now()
	};
	try {
		await writeFile(CACHE_FILE, JSON.stringify(cached, null, 2), {
			encoding: 'utf-8',
			mode: 0o600
		});
	} catch {
		// Non-critical — continue without caching
	}
}

async function fetchVersionInfo(): Promise<VersionInfo | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const res = await fetch(VERSION_URL, { signal: controller.signal });
		clearTimeout(timeout);
		if (!res.ok) return null;
		const info = (await res.json()) as VersionInfo;
		if (typeof info?.latest !== 'string' || typeof info?.minimum !== 'string' || typeof info?.binaries !== 'object') {
			return null;
		}
		return info;
	} catch {
		return null;
	}
}

/**
 * Compare two semver-like version strings.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 * Handles pre-release tags: alpha < beta < rc < release.
 */
// Full SemVer ordering (prereleases sort below their release, build metadata ignored).
// semver.compare requires valid input; coerce loosely and fall back to lexical so a
// malformed remote version can never throw during a routine update check.
export function compareVersions(a: string, b: string): number {
	if (semver.valid(a) && semver.valid(b)) return semver.compare(a, b);
	return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * Check if an update is available or required.
 * Returns null if version info couldn't be fetched (network error, etc.)
 */
export async function checkVersion(force = false): Promise<VersionCheckResult | null> {
	// Try cache first (skipped when force=true, e.g. explicit `evidence upgrade`)
	const cached = force ? null : await readCache();
	if (cached) {
		return {
			latest: cached.latest,
			minimum: cached.minimum,
			updateAvailable: compareVersions(VERSION, cached.latest) < 0,
			updateRequired: compareVersions(VERSION, cached.minimum) < 0,
			binaries: cached.binaries,
			checksums: cached.checksums
		};
	}

	// Fetch from network
	const info = await fetchVersionInfo();
	if (!info) return null;

	// Cache for next time
	await writeCache(info);

	return {
		latest: info.latest,
		minimum: info.minimum,
		updateAvailable: compareVersions(VERSION, info.latest) < 0,
		updateRequired: compareVersions(VERSION, info.minimum) < 0,
		binaries: info.binaries,
		checksums: info.checksums
	};
}

/**
 * Run a startup version check. Prints warnings/errors but doesn't block on network.
 */
export async function startupVersionCheck(): Promise<void> {
	const result = await checkVersion();
	if (!result) return;

	if (result.updateRequired) {
		console.error(`\n  ✖ Evidence CLI v${VERSION} is no longer supported.`);
		console.error(`    Minimum required version: v${result.minimum}`);
		console.error(`    Run \`evidence upgrade\` to update.\n`);
		process.exit(1);
	}

	if (result.updateAvailable) {
		console.error(`\n  ↑ Evidence CLI v${result.latest} is available (current: v${VERSION}).`);
		console.error(`    Run \`evidence upgrade\` to update.\n`);
	}
}
