/**
 * Upgrade command — downloads and replaces the current binary
 */

import { writeFile, rename, unlink, chmod } from 'fs/promises';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { VERSION } from './args.ts';
import { checkVersion, compareVersions } from './version-check.ts';

function getPlatformKey(): string | null {
	const platform = process.platform;
	const arch = process.arch;

	if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64';
	if (platform === 'darwin' && arch === 'x64') return 'darwin-x64';
	if (platform === 'linux' && arch === 'x64') return 'linux-x64';

	return null;
}

export async function upgrade(): Promise<void> {
	console.log(`  Current version: v${VERSION}`);
	console.log('  Checking for updates...\n');

	const result = await checkVersion(true);
	if (!result) {
		console.error('  ✖ Could not check for updates. Please try again later.');
		process.exit(1);
	}

	if (compareVersions(VERSION, result.latest) >= 0) {
		console.log(`  ✔ Already on the latest version (v${VERSION}).`);
		return;
	}

	const platformKey = getPlatformKey();
	if (!platformKey) {
		console.error(`  ✖ Unsupported platform: ${process.platform}-${process.arch}`);
		console.error('    Supported: darwin-arm64, darwin-x64, linux-x64');
		process.exit(1);
	}

	const binaryUrl = result.binaries[platformKey];
	if (!binaryUrl) {
		console.error(`  ✖ No binary available for ${platformKey}.`);
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

		const currentBinary = process.execPath;
		const dir = dirname(currentBinary);
		const tmpPath = join(dir, `.evidence-upgrade-${Date.now()}`);

		// Write to temp file, then atomically replace
		try {
			await writeFile(tmpPath, data, { mode: 0o755 });
		} catch (err: any) {
			if (err?.code === 'EACCES') {
				console.error(`\n  ✖ Permission denied writing to ${dir}`);
				console.error(`    Try: sudo evidence upgrade\n`);
				process.exit(1);
			}
			throw err;
		}
		await rename(currentBinary, `${currentBinary}.old`);

		try {
			await rename(tmpPath, currentBinary);
			await chmod(currentBinary, 0o755);
		} catch (err) {
			// Rollback if rename fails
			await rename(`${currentBinary}.old`, currentBinary).catch(() => {});
			await unlink(tmpPath).catch(() => {});
			throw err;
		}

		// Clean up old binary
		await unlink(`${currentBinary}.old`).catch(() => {});

		console.log(`  ✔ Upgraded to v${result.latest}.`);
		console.log(`    Run \`evidence version\` to confirm.`);
	} catch (err) {
		console.error(`  ✖ Upgrade failed: ${err instanceof Error ? err.message : err}`);
		process.exit(1);
	}
}
