/**
 * Upgrade command — downloads and replaces the current binary
 */

import { writeFile, readFile, rename, unlink, chmod, copyFile, access, stat } from 'fs/promises';
import { createHash } from 'crypto';
import { basename, dirname, join, win32 } from 'path';
import { VERSION } from './args.ts';
import { checkVersion, compareVersions } from './version-check.ts';

const INSTALL_SH_URL = 'https://evidence.studio/install.sh';
const INSTALL_PS1_URL = 'https://evidence.studio/install.ps1';

export const SUPPORTED_PLATFORMS = [
	'darwin-arm64',
	'darwin-x64',
	'linux-x64',
	'linux-arm64',
	'windows-x64'
] as const;

export function getPlatformKey(
	platform: NodeJS.Platform = process.platform,
	arch: string = process.arch
): (typeof SUPPORTED_PLATFORMS)[number] | null {
	if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64';
	if (platform === 'darwin' && arch === 'x64') return 'darwin-x64';
	if (platform === 'linux' && arch === 'x64') return 'linux-x64';
	if (platform === 'linux' && arch === 'arm64') return 'linux-arm64';
	if (platform === 'win32' && arch === 'x64') return 'windows-x64';
	return null;
}

// install.ps1 copies (not symlinks) the binary to evidence.exe and evd.exe.
export function windowsAliasPath(currentBinary: string): string | null {
	const name = win32.basename(currentBinary);
	const lower = name.toLowerCase();
	const alias = lower === 'evidence.exe' ? 'evd.exe' : lower === 'evd.exe' ? 'evidence.exe' : null;
	if (!alias) return null;
	return currentBinary.slice(0, currentBinary.length - name.length) + alias;
}

async function exists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function sha256File(path: string): Promise<string> {
	return createHash('sha256')
		.update(await readFile(path))
		.digest('hex');
}

// Also runs on the "already latest" path so an alias that was in use last time gets retried.
export async function syncWindowsAlias(currentBinary: string): Promise<void> {
	const alias = windowsAliasPath(currentBinary);
	if (!alias || !(await exists(alias))) return;

	try {
		const [current, other] = await Promise.all([stat(currentBinary), stat(alias)]);
		if (
			current.size === other.size &&
			(await sha256File(currentBinary)) === (await sha256File(alias))
		) {
			return;
		}
	} catch {
		/* unreadable alias — attempt the copy */
	}

	try {
		await copyFile(currentBinary, alias);
		console.log(`  ✔ Updated ${basename(alias)} to match.`);
	} catch {
		console.log(
			`  ⚠ Could not update ${basename(alias)} (in use?). Close it and re-run \`evidence upgrade\`.`
		);
	}
}

function printInstallerFallback(): void {
	console.error('    You can also reinstall the latest version directly:');
	console.error(`      Windows:      irm ${INSTALL_PS1_URL} | iex`);
	console.error(`      macOS/Linux:  curl -fsSL ${INSTALL_SH_URL} | sh`);
}

export async function upgrade(): Promise<void> {
	console.log(`  Current version: v${VERSION}`);

	const platformKey = getPlatformKey();
	if (!platformKey) {
		console.error(`  ✖ Unsupported platform: ${process.platform}-${process.arch}`);
		console.error(`    Supported: ${SUPPORTED_PLATFORMS.join(', ')}`);
		process.exit(1);
	}

	const isWindows = process.platform === 'win32';
	const currentBinary = process.execPath;
	const dir = dirname(currentBinary);
	const backupPath = `${currentBinary}.old`;

	// Windows can't delete a running exe, so the last upgrade's backup is still here.
	await unlink(backupPath).catch(() => {});

	console.log('  Checking for updates...\n');

	const result = await checkVersion(true);
	if (!result) {
		console.error('  ✖ Could not check for updates.');
		console.error(
			'    The version manifest could not be fetched (network timeout, DNS, or proxy).'
		);
		console.error('');
		console.error('    If you are behind a corporate proxy, set HTTPS_PROXY and retry.');
		printInstallerFallback();
		process.exit(1);
	}

	if (compareVersions(VERSION, result.latest) >= 0) {
		console.log(`  ✔ Already on the latest version (v${VERSION}).`);
		if (isWindows) await syncWindowsAlias(currentBinary);
		return;
	}

	const binaryUrl = result.binaries[platformKey];
	if (!binaryUrl) {
		console.error(`  ✖ No binary available for ${platformKey}.`);
		printInstallerFallback();
		process.exit(1);
	}

	try {
		const res = await fetch(binaryUrl);
		if (!res.ok) {
			throw new Error(`Download failed: ${res.status} ${res.statusText}`);
		}

		const contentLength = Number(res.headers.get('content-length') || 0);
		const chunks: Uint8Array[] = [];
		let received = 0;

		const reader = res.body?.getReader();
		if (!reader) {
			throw new Error('Download failed: no response body');
		}

		const label = `  Downloading v${result.latest} for ${platformKey}...`;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			received += value.length;
			if (contentLength > 0) {
				const pct = Math.round((received / contentLength) * 100);
				process.stdout.write(`\r${label} ${pct}%`);
			}
		}
		if (contentLength > 0) {
			process.stdout.write('\n');
		} else {
			console.log(label);
		}

		const data = new Uint8Array(received);
		let offset = 0;
		for (const chunk of chunks) {
			data.set(chunk, offset);
			offset += chunk.length;
		}

		// Verify checksum if available
		const expectedHash = result.checksums?.[platformKey];
		if (expectedHash) {
			const actualHash = createHash('sha256').update(data).digest('hex');
			if (actualHash !== expectedHash) {
				console.error(`  ✖ Checksum mismatch — download may be corrupted.`);
				console.error(`    Expected: ${expectedHash}`);
				console.error(`    Got:      ${actualHash}`);
				process.exit(1);
			}
		}

		const tmpPath = join(dir, `.evidence-upgrade-${Date.now()}${isWindows ? '.exe' : ''}`);

		// Rename-swap works on Windows too: a running exe can be renamed, just not written or deleted.
		try {
			await writeFile(tmpPath, data, { mode: 0o755 });
		} catch (err) {
			const code = (err as NodeJS.ErrnoException | undefined)?.code;
			if (code === 'EACCES' || code === 'EPERM') {
				console.error(`\n  ✖ Permission denied writing to ${dir}`);
				console.error(
					isWindows
						? `    Try again from an elevated (Administrator) terminal.\n`
						: `    Try: sudo evidence upgrade\n`
				);
				process.exit(1);
			}
			throw err;
		}
		await rename(currentBinary, backupPath);

		try {
			await rename(tmpPath, currentBinary);
			if (!isWindows) await chmod(currentBinary, 0o755);
		} catch (err) {
			// Rollback if rename fails
			await rename(backupPath, currentBinary).catch(() => {});
			await unlink(tmpPath).catch(() => {});
			throw err;
		}

		await unlink(backupPath).catch(() => {});

		console.log(`  ✔ Upgraded to v${result.latest}.`);
		if (isWindows) await syncWindowsAlias(currentBinary);
		console.log(`    Run \`evidence version\` to confirm.`);
	} catch (err) {
		console.error(`  ✖ Upgrade failed: ${err instanceof Error ? err.message : err}`);
		printInstallerFallback();
		process.exit(1);
	}
}
