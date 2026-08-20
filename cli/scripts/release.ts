#!/usr/bin/env bun
/**
 * CLI Publish Script
 *
 * Builds binaries and uploads to Vercel Blob under cli/v<VERSION>/. VERSION (in
 * cli/cli/args.ts) is the single source of truth; bump it to publish again.
 * Prereleases skip the `latest` pointer (see isPrerelease below).
 *
 * Auto-loads BLOB_READ_WRITE_TOKEN from studio/.env.
 *
 * Usage:
 *   bun run cli/scripts/release.ts                 # Build all targets + upload
 *   bun run cli/scripts/release.ts --upload-only   # Skip build, just upload existing binaries
 *   bun run cli/scripts/release.ts --local         # Build + upload only for current platform
 *   bun run cli/scripts/release.ts --force         # Overwrite an existing version (recovery)
 *   bun run cli/scripts/release.ts --dev --local   # Dev binary: staging defaults baked in, uploads to v<VERSION>-dev/
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { put } from '@vercel/blob';
import { platform, arch } from 'os';
import semver from 'semver';

// --- Config ---

const ALL_TARGETS = [
	'darwin-arm64',
	'darwin-x64',
	'linux-x64',
	'linux-arm64',
	'windows-x64'
] as const;
const CLI_DIR = join(import.meta.dir, '..');
const DIST_DIR = join(CLI_DIR, 'dist');
const ROOT_DIR = join(CLI_DIR, '..');

// --- Read version from args.ts ---

const argsFile = readFileSync(join(CLI_DIR, 'cli', 'args.ts'), 'utf-8');
const versionMatch = argsFile.match(/VERSION\s*=\s*'([^']+)'/);
if (!versionMatch) {
	console.error('Could not read VERSION from cli/args.ts');
	process.exit(1);
}
const VERSION = versionMatch[1];

if (!semver.valid(VERSION)) {
	console.error(`VERSION in cli/cli/args.ts is not valid semver: "${VERSION}"`);
	process.exit(1);
}

// --- Load BLOB_READ_WRITE_TOKEN ---

function loadTokenFromEnv(): string | undefined {
	const envPath = join(ROOT_DIR, 'studio', '.env');
	if (!existsSync(envPath)) return undefined;
	const content = readFileSync(envPath, 'utf-8');
	const match = content.match(/^BLOB_READ_WRITE_TOKEN="([^"]+)"/m);
	return match?.[1];
}

const token = process.env.BLOB_READ_WRITE_TOKEN || loadTokenFromEnv();
if (!token) {
	console.error('BLOB_READ_WRITE_TOKEN not found.');
	console.error('Set it in studio/.env or pass it as an environment variable.');
	process.exit(1);
}

const uploadOnly = process.argv.includes('--upload-only');
const localOnly = process.argv.includes('--local');
const force = process.argv.includes('--force');
const devBuild = process.argv.includes('--dev');

// Dev build: bake staging QE host into build-defaults.ts before compiling,
// then restore after. Writing the file is more reliable than env var
// propagation through pnpm → SvelteKit → adapter subprocess chains.
const DEV_WORKOS_CLIENT_ID = 'client_01HE8FGYA06M92RD39M3KAR99C'; // staging → fearless-backyard
const DEV_QUERY_ENGINE_HOST = 'https://query-engine-service.mentha.fyi';
const BUILD_DEFAULTS_PATH = join(CLI_DIR, 'cli', 'build-defaults.ts');
const PROD_BUILD_DEFAULTS = readFileSync(BUILD_DEFAULTS_PATH, 'utf-8');
if (devBuild) {
	// build-defaults.ts is read by Bun-compiled code (auth.ts).
	// BUILD_QUERY_ENGINE_HOST is read by vite.config.ts define for Vite-compiled
	// code (run-query.ts). Both must be set for the dev binary to hit staging.
	process.env.BUILD_QUERY_ENGINE_HOST = DEV_QUERY_ENGINE_HOST;
	writeFileSync(
		BUILD_DEFAULTS_PATH,
		`export const DEFAULT_WORKOS_CLIENT_ID = ${JSON.stringify(DEV_WORKOS_CLIENT_ID)};\nexport const DEFAULT_QUERY_ENGINE_HOST = ${JSON.stringify(DEV_QUERY_ENGINE_HOST)};\n`
	);
	console.log(`  Wrote dev defaults to ${BUILD_DEFAULTS_PATH}`);
}

// Prereleases (any SemVer "-" suffix) upload binaries only, never moving `latest`.
const isPrerelease = semver.prerelease(VERSION) !== null;

// Determine which targets to build
function getLocalTarget(): string {
	const p = platform();
	const a = arch();
	if (p === 'darwin' && a === 'arm64') return 'darwin-arm64';
	if (p === 'darwin' && a === 'x64') return 'darwin-x64';
	if (p === 'linux' && a === 'x64') return 'linux-x64';
	if (p === 'linux' && a === 'arm64') return 'linux-arm64';
	if (p === 'win32' && a === 'x64') return 'windows-x64';
	throw new Error(`Unsupported platform: ${p}-${a}`);
}

const targets = localOnly ? [getLocalTarget()] : ALL_TARGETS;
const blobPrefix = devBuild ? `cli/v${VERSION}-dev` : `cli/v${VERSION}`;

console.log(`\nEvidence CLI ${isPrerelease ? 'Prerelease' : 'Release'} v${VERSION}${devBuild ? ' [dev]' : ''}`);
if (localOnly) console.log(`  (local mode: ${targets[0]} only)`);
if (devBuild) console.log(`  (dev build: staging defaults baked in → ${blobPrefix})`);
console.log('='.repeat(40));

// --- Build binaries ---
// Stage binaries outside dist/ because each build wipes dist/

const STAGING_DIR = join(CLI_DIR, '.release-staging');
execSync(`mkdir -p "${STAGING_DIR}"`);

const binaries: Record<string, string> = {};

try {
	for (const target of targets) {
		const isWindows = target.startsWith('windows-');
		const binaryName = `evidence-${target}${isWindows ? '.exe' : ''}`;
		const stagedPath = join(STAGING_DIR, binaryName);

		if (!uploadOnly) {
			console.log(`\nBuilding for ${target}...`);
			const qeEnv = devBuild ? `BUILD_QUERY_ENGINE_HOST=${DEV_QUERY_ENGINE_HOST} ` : '';
			execSync(`${qeEnv}CLI_BUILD_TARGET=${target} pnpm cli:build`, {
				cwd: ROOT_DIR,
				stdio: 'inherit'
			});

			// Move built binary to staging (dist/ gets wiped on next build)
			const defaultBinary = join(DIST_DIR, isWindows ? 'evidence.exe' : 'evidence');
			if (!existsSync(defaultBinary)) {
				console.error(`Build failed: ${defaultBinary} not found`);
				process.exit(1);
			}
			execSync(`mv "${defaultBinary}" "${stagedPath}"`);
			console.log(`  Built: ${stagedPath}`);
		} else {
			if (!existsSync(stagedPath)) {
				console.error(`Binary not found: ${stagedPath}`);
				console.error('Run without --upload-only to build first.');
				process.exit(1);
			}
		}

		binaries[target] = stagedPath;
	}
} finally {
	// Always restore build-defaults.ts (dev build modified it with staging values)
	if (devBuild) {
		writeFileSync(BUILD_DEFAULTS_PATH, PROD_BUILD_DEFAULTS);
		console.log('  Restored build-defaults.ts');
	}
}

// --- Upload to Vercel Blob ---

console.log('\nUploading to Vercel Blob...');

const binaryUrls: Record<string, string> = {};
const binaryChecksums: Record<string, string> = {};

for (const [target, path] of Object.entries(binaries)) {
	const isWindows = target.startsWith('windows-');
	const blobPath = `${blobPrefix}/evidence-${target}${isWindows ? '.exe' : ''}`;
	console.log(`  Uploading ${blobPath}...`);

	const data = readFileSync(path);
	const checksum = createHash('sha256').update(data).digest('hex');
	binaryChecksums[target] = checksum;

	let blob;
	try {
		blob = await put(blobPath, data, {
			access: 'public',
			addRandomSuffix: false,
			// Published versions are immutable — reject if this version already exists.
			allowOverwrite: force,
			token
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`\n✖ Failed to upload ${blobPath}`);
		// Only the duplicate-blob error means "already published"; auth/network/quota
		// errors must not be misreported as an immutable-version collision.
		if (/already exists/i.test(message)) {
			console.error(
				`  v${VERSION} is already published. Versions are immutable — bump VERSION ` +
					`in cli/cli/args.ts, or pass --force to overwrite (recovery only).`
			);
		}
		console.error(message);
		process.exit(1);
	}

	binaryUrls[target] = blob.url;
	console.log(`  ✔ ${blob.url} (sha256:${checksum.slice(0, 12)}…)`);
}

// --- Prerelease: binaries only, leave the `latest` pointer untouched, then stop ---
// Everything below this guard is the stable-release path (moves `latest`).

if (isPrerelease) {
	console.log('\n' + '='.repeat(40));
	console.log('Prerelease published (binaries only — `latest` untouched)!\n');
	console.log(`Version:   v${VERSION}`);
	console.log('\nInstall a binary directly, e.g.:');
	// getLocalTarget() throws on exotic hosts; never crash the summary after a
	// successful upload — just fall back to any published binary.
	let localTarget: string | undefined;
	try {
		localTarget = getLocalTarget();
	} catch {
		/* unsupported platform — fall through to first binary */
	}
	const primary = (localTarget ? binaryUrls[localTarget] : undefined) ?? Object.values(binaryUrls)[0];
	if (primary) {
		console.log(`  curl -fsSL "${primary}" -o evidence && chmod +x evidence && ./evidence --version`);
	}
	console.log('\nBinaries:');
	for (const [target, url] of Object.entries(binaryUrls)) {
		console.log(`  ${target}: ${url}`);
	}
	console.log('');
	process.exit(0);
}

// --- Upload version.json ---

// In local mode, merge with existing version.json to preserve other platform URLs
let existingBinaries: Record<string, string> = {};
let existingChecksums: Record<string, string> = {};
let minimumVersion = '0.1.0-alpha';

if (localOnly) {
	try {
		const res = await fetch('https://gaamozau3jchzs3r.public.blob.vercel-storage.com/cli/version.json');
		if (res.ok) {
			const existing = (await res.json()) as {
				binaries?: Record<string, string>;
				checksums?: Record<string, string>;
				minimum?: string;
			};
			existingBinaries = existing.binaries ?? {};
			existingChecksums = existing.checksums ?? {};
			if (existing.minimum) minimumVersion = existing.minimum;
		}
	} catch {
		// First release — no existing version.json
	}
}

const versionJson = {
	latest: VERSION,
	minimum: minimumVersion,
	binaries: { ...existingBinaries, ...binaryUrls },
	checksums: { ...existingChecksums, ...binaryChecksums }
};

console.log('\n  Uploading cli/version.json...');
const versionBlob = await put('cli/version.json', JSON.stringify(versionJson, null, 2), {
	access: 'public',
	addRandomSuffix: false,
		allowOverwrite: true,
	contentType: 'application/json',
	token
});
console.log(`  ✔ ${versionBlob.url}`);

// --- Upload install.sh ---

const installScript = readFileSync(join(CLI_DIR, 'scripts', 'install.sh'));
console.log('  Uploading cli/install.sh...');
const installBlob = await put('cli/install.sh', installScript, {
	access: 'public',
	addRandomSuffix: false,
		allowOverwrite: true,
	contentType: 'text/plain',
	token
});
console.log(`  ✔ ${installBlob.url}`);

const installPs1 = readFileSync(join(CLI_DIR, 'scripts', 'install.ps1'));
console.log('  Uploading cli/install.ps1...');
const installPs1Blob = await put('cli/install.ps1', installPs1, {
	access: 'public',
	addRandomSuffix: false,
	allowOverwrite: true,
	contentType: 'text/plain',
	token
});
console.log(`  ✔ ${installPs1Blob.url}`);

// --- Summary ---

console.log('\n' + '='.repeat(40));
console.log('Release complete!\n');
console.log(`Version:   v${VERSION}`);
console.log(`Install (Unix):  curl -fsSL ${installBlob.url} | sh`);
console.log(`Install (Win):   irm ${installPs1Blob.url} | iex`);
console.log(`Manifest:  ${versionBlob.url}`);
console.log('\nBinaries:');
for (const [target, url] of Object.entries(binaryUrls)) {
	console.log(`  ${target}: ${url}`);
}
console.log('');
