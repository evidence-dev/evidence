import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
	getPlatformKey,
	windowsAliasPath,
	syncWindowsAlias,
	SUPPORTED_PLATFORMS
} from './upgrade.ts';

describe('getPlatformKey', () => {
	it('maps every platform the release pipeline publishes', () => {
		expect(getPlatformKey('darwin', 'arm64')).toBe('darwin-arm64');
		expect(getPlatformKey('darwin', 'x64')).toBe('darwin-x64');
		expect(getPlatformKey('linux', 'x64')).toBe('linux-x64');
		expect(getPlatformKey('linux', 'arm64')).toBe('linux-arm64');
		expect(getPlatformKey('win32', 'x64')).toBe('windows-x64');
	});

	it('returns null for targets we do not ship', () => {
		expect(getPlatformKey('win32', 'arm64')).toBeNull();
		expect(getPlatformKey('freebsd', 'x64')).toBeNull();
		expect(getPlatformKey('linux', 'ia32')).toBeNull();
	});

	it('only ever returns a key present in SUPPORTED_PLATFORMS', () => {
		const platforms: NodeJS.Platform[] = ['darwin', 'linux', 'win32'];
		for (const p of platforms) {
			for (const a of ['x64', 'arm64']) {
				const key = getPlatformKey(p, a);
				if (key) expect(SUPPORTED_PLATFORMS).toContain(key);
			}
		}
	});
});

describe('windowsAliasPath', () => {
	it('pairs evidence.exe with evd.exe in the same directory', () => {
		expect(windowsAliasPath('C:\\Users\\me\\AppData\\Local\\Evidence\\bin\\evidence.exe')).toBe(
			'C:\\Users\\me\\AppData\\Local\\Evidence\\bin\\evd.exe'
		);
		expect(windowsAliasPath('C:\\Users\\me\\AppData\\Local\\Evidence\\bin\\evd.exe')).toBe(
			'C:\\Users\\me\\AppData\\Local\\Evidence\\bin\\evidence.exe'
		);
	});

	it('is case-insensitive on the file name', () => {
		expect(windowsAliasPath('D:\\tools\\Evidence.EXE')).toBe('D:\\tools\\evd.exe');
	});

	it('returns null for anything else (Unix binaries, renamed copies)', () => {
		expect(windowsAliasPath('/usr/local/bin/evidence')).toBeNull();
		expect(windowsAliasPath('C:\\tools\\evidence-nightly.exe')).toBeNull();
	});
});

describe('syncWindowsAlias', () => {
	// windowsAliasPath uses win32 path semantics; posix paths have no drive but
	// still resolve correctly because win32 accepts forward slashes.
	let dir: string;
	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(async () => {
		dir = await mkdtemp(path.join(tmpdir(), 'evd-upgrade-'));
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(async () => {
		logSpy.mockRestore();
		await rm(dir, { recursive: true, force: true });
	});

	it('copies the current binary over a stale alias', async () => {
		const current = path.join(dir, 'evidence.exe');
		const alias = path.join(dir, 'evd.exe');
		await writeFile(current, 'NEW BINARY v0.9.5');
		await writeFile(alias, 'old binary v0.9.4');

		await syncWindowsAlias(current);

		expect(await readFile(alias, 'utf-8')).toBe('NEW BINARY v0.9.5');
		expect(logSpy.mock.calls.flat().join('\n')).toContain('Updated evd.exe');
	});

	it('is a no-op when the alias already matches', async () => {
		const current = path.join(dir, 'evd.exe');
		const alias = path.join(dir, 'evidence.exe');
		await writeFile(current, 'SAME');
		await writeFile(alias, 'SAME');

		await syncWindowsAlias(current);

		expect(logSpy).not.toHaveBeenCalled();
	});

	it('does nothing when there is no alias to refresh', async () => {
		const current = path.join(dir, 'evidence.exe');
		await writeFile(current, 'ONLY ONE');

		await syncWindowsAlias(current);

		expect(logSpy).not.toHaveBeenCalled();
	});
});
