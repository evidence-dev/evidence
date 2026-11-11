/**
 * Native DuckDB asset loader for the standalone Evidence binary.
 *
 * Kept separate from the adapter's generated entry point so failures in the
 * dynamic loader can be injected and tested without a broken DLL/SO/DYLIB.
 * No test-only environment variable can alter the production loader.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIRECTORY_PREFIX = 'evidence-duckdb-native-';
const OWNED_DIRECTORY = /^evidence-duckdb-native-([0-9]+)-[A-Za-z0-9]{6}$/;

export interface DuckDBNativeLoaderOptions {
	embeddedLibrary: string;
	libraryName: string;
	openLibrary: (libraryPath: string) => unknown | Promise<unknown>;
	/** Defaults are taken from the running process; overrides permit isolated tests. */
	tempRoot?: string;
	platform?: string;
	pid?: number;
	isProcessAlive?: (pid: number) => boolean;
	registerExit?: (cleanup: () => void) => void;
}

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		// EPERM and other errors do not prove that the process is gone.
		return (error as NodeJS.ErrnoException).code !== 'ESRCH';
	}
}

function removeBestEffort(directory: string): void {
	try {
		rmSync(directory, { recursive: true, force: true });
	} catch {
		// On Windows an open DLL may remain locked until process termination.
		// A later invocation retries cleanup; never mask the loader error.
	}
}

/**
 * Return a per-process, idempotent initializer. Failed initialization is
 * retriable; concurrent callers share the same in-flight attempt.
 */
export function createDuckDBNativeLoader({
	embeddedLibrary,
	libraryName,
	openLibrary,
	tempRoot = tmpdir(),
	platform = process.platform,
	pid = process.pid,
	isProcessAlive: checkProcessAlive = isProcessAlive,
	registerExit = (cleanup) => process.once('exit', cleanup)
}: DuckDBNativeLoaderOptions): () => Promise<void> {
	let nativeLibraryHandle: unknown;
	let loading: Promise<void> | undefined;

	async function initialize(): Promise<void> {
		if (platform === 'win32') {
			// Reclaim only our PID-tagged directories from terminated processes.
			for (const entry of readdirSync(tempRoot, { withFileTypes: true })) {
				if (!entry.isDirectory()) continue;
				const match = OWNED_DIRECTORY.exec(entry.name);
				if (!match) continue;

				const ownerPid = Number(match[1]);
				if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0 || ownerPid === pid) continue;
				if (checkProcessAlive(ownerPid)) continue;

				removeBestEffort(join(tempRoot, entry.name));
			}
		}

		const directory = mkdtempSync(join(tempRoot, `${DIRECTORY_PREFIX}${pid}-`));
		const libraryPath = join(directory, libraryName);

		try {
			writeFileSync(libraryPath, readFileSync(embeddedLibrary));
			const handle = await openLibrary(libraryPath);
			if (!handle) throw new Error('DuckDB native loader returned no library handle');

			registerExit(() => removeBestEffort(directory));
			nativeLibraryHandle = handle;
		} catch (error) {
			removeBestEffort(directory);
			throw error;
		}
	}

	return async function preloadDuckDBNative(): Promise<void> {
		if (nativeLibraryHandle) return;
		if (!loading) {
			loading = initialize().catch((error: unknown) => {
				loading = undefined;
				throw error;
			});
		}
		return loading;
	};
}
