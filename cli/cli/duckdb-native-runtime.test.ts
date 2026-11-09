import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDuckDBNativeLoader, type DuckDBNativeLoaderOptions } from './duckdb-native-runtime';

let sandbox: string;
let embeddedLibrary: string;
let exitCallbacks: Array<() => void>;

beforeEach(() => {
	sandbox = mkdtempSync(join(tmpdir(), 'evidence-native-runtime-test-'));
	embeddedLibrary = join(sandbox, 'embedded-library.bin');
	writeFileSync(embeddedLibrary, 'duckdb-native-test-fixture');
	exitCallbacks = [];
});

afterEach(() => {
	rmSync(sandbox, { recursive: true, force: true });
});

function nativeDirectories(): string[] {
	return readdirSync(sandbox).filter((name) => name.startsWith('evidence-duckdb-native-'));
}

function createLoader(
	openLibrary: DuckDBNativeLoaderOptions['openLibrary'],
	overrides: Partial<DuckDBNativeLoaderOptions> = {}
): () => Promise<void> {
	return createDuckDBNativeLoader({
		embeddedLibrary,
		libraryName: process.platform === 'win32' ? 'duckdb.dll' : 'libduckdb.so',
		tempRoot: sandbox,
		platform: process.platform,
		openLibrary,
		registerExit: (callback) => exitCallbacks.push(callback),
		...overrides
	});
}

describe('DuckDB native runtime fault injection', () => {
	it('preserves a dlopen error, removes the extracted file, and registers no exit callback', async () => {
		const originalError = new Error('mock dlopen failed: invalid native library');
		const openLibrary = vi.fn((libraryPath: string) => {
			expect(readFileSync(libraryPath, 'utf8')).toBe('duckdb-native-test-fixture');
			throw originalError;
		});
		const preload = createLoader(openLibrary);

		await expect(preload()).rejects.toBe(originalError);
		expect(openLibrary).toHaveBeenCalledOnce();
		expect(nativeDirectories()).toEqual([]);
		expect(exitCallbacks).toEqual([]);
	});

	it('retries within the same process after dlopen fails', async () => {
		const originalError = new Error('simulated transient dlopen failure');
		let attempt = 0;
		const openLibrary = vi.fn(() => {
			attempt += 1;
			if (attempt === 1) throw originalError;
			return { native: true };
		});
		const preload = createLoader(openLibrary);

		await expect(preload()).rejects.toBe(originalError);
		expect(nativeDirectories()).toEqual([]);

		await expect(preload()).resolves.toBeUndefined();
		await expect(preload()).resolves.toBeUndefined();
		expect(openLibrary).toHaveBeenCalledTimes(2);
		expect(nativeDirectories()).toHaveLength(1);
		expect(exitCallbacks).toHaveLength(1);

		exitCallbacks[0]();
		expect(nativeDirectories()).toEqual([]);
	});

	it('does not leave extracted files when the embedded library cannot be read', async () => {
		const openLibrary = vi.fn(() => ({ native: true }));
		const preload = createLoader(openLibrary, {
			embeddedLibrary: join(sandbox, 'missing-library.bin')
		});

		await expect(preload()).rejects.toThrow();
		expect(openLibrary).not.toHaveBeenCalled();
		expect(nativeDirectories()).toEqual([]);
	});

	it('rejects an empty dlopen handle and supports a later retry', async () => {
		const openLibrary = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce({ native: true });
		const preload = createLoader(openLibrary);

		await expect(preload()).rejects.toThrow(/no library handle/);
		expect(nativeDirectories()).toEqual([]);

		await expect(preload()).resolves.toBeUndefined();
		expect(openLibrary).toHaveBeenCalledTimes(2);
	});

	it('shares a single in-flight dlopen across concurrent callers', async () => {
		let finishOpen!: (handle: object) => void;
		const opening = new Promise<object>((resolve) => {
			finishOpen = resolve;
		});
		const openLibrary = vi.fn(() => opening);
		const preload = createLoader(openLibrary);

		const callers = Array.from({ length: 24 }, () => preload());
		expect(openLibrary).toHaveBeenCalledOnce();

		finishOpen({ native: true });
		await Promise.all(callers);
		await preload();

		expect(openLibrary).toHaveBeenCalledOnce();
		expect(exitCallbacks).toHaveLength(1);
		exitCallbacks[0]();
		expect(nativeDirectories()).toEqual([]);
	});

	it('reclaims only obsolete PID-owned directories on Windows', async () => {
		const stale = mkdtempSync(join(sandbox, 'evidence-duckdb-native-24680-'));
		const active = mkdtempSync(join(sandbox, 'evidence-duckdb-native-13579-'));
		const samePid = mkdtempSync(join(sandbox, 'evidence-duckdb-native-444-'));
		const unrelated = join(sandbox, 'evidence-duckdb-native-legacy');
		mkdirSync(unrelated);

		const isProcessAlive = vi.fn((pid: number) => pid === 13579);
		const preload = createLoader(() => ({ native: true }), {
			platform: 'win32',
			pid: 444,
			isProcessAlive
		});

		await preload();
		expect(existsSync(stale)).toBe(false);
		expect(existsSync(active)).toBe(true);
		expect(existsSync(samePid)).toBe(true);
		expect(existsSync(unrelated)).toBe(true);
		expect(isProcessAlive).toHaveBeenCalledWith(24680);
		expect(isProcessAlive).toHaveBeenCalledWith(13579);
		expect(isProcessAlive).not.toHaveBeenCalledWith(444);

		expect(exitCallbacks).toHaveLength(1);
		exitCallbacks[0]();
	});
});
