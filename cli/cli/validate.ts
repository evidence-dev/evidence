/**
 * Validate command - processes all markdown files and reports errors.
 * Like the other data commands, output adapts to where it runs: the human
 * report at an interactive terminal, structured JSON when piped/redirected or
 * run by an agent/CI. `--verbose` forces the human report; `--json`/`--format`
 * forces machine output.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pc, { createColors } from 'picocolors';
import type { Server as ServerType } from '@sveltejs/kit';
import type { SSRManifest } from '@sveltejs/kit';
import { printResult, resolveFormat, type OutputOptions } from './output.ts';

interface ValidateOptions {
	output: OutputOptions;
	/** When set, validate only this page (path/slug/filename) instead of the whole project. */
	path?: string;
}

interface FileError {
	line: number;
	endLine: number;
	severity: string;
	message: string;
	/** Rule id, e.g. "invalid-table" — shown like an ESLint rule name. */
	id?: string;
	component?: string;
}

interface FileResult {
	path: string;
	errors: FileError[];
}

interface ValidateResult {
	valid: boolean;
	fileCount: number;
	errorCount: number;
	warningCount: number;
	mode?: 'warehouse' | 'syntax-only';
	metadataError?: string;
	files: FileResult[];
}

/** Per-call options the endpoint reads off the request URL — scoped to this run
 * (not process-global env), so nothing leaks into a later invocation. */
function buildQuery(pathArg: string | undefined, progress: boolean): string {
	const params = new URLSearchParams();
	if (pathArg) params.set('path', pathArg);
	// Human mode prints progress to stderr; machine output keeps stdout clean.
	if (progress) params.set('progress', '1');
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

async function fetchValidation(pathArg: string | undefined, progress: boolean): Promise<ValidateResult> {
	const query = buildQuery(pathArg, progress);
	// Running from source (`bun cli/index.ts`) has no built server bundle, so
	// load the endpoint through Vite; the compiled binary uses the built server.
	const isSource = path.basename(process.execPath).startsWith('bun');
	const response = isSource
		? await respondViaVite(query)
		: await respondViaBuiltServer(query);

	if (!response.ok) {
		console.error(`  Validation request failed: ${response.status} ${response.statusText}`);
		process.exit(1);
	}

	return response.json();
}

async function respondViaBuiltServer(query: string): Promise<Response> {
	// @ts-ignore
	const manifestModule = await import('../manifest.js');
	const manifest: SSRManifest = manifestModule.default;

	const serverModule = await import('../server/index.js');
	const { Server } = serverModule as { Server: new (manifest: SSRManifest) => ServerType };
	const svelteKitServer = new Server(manifest);
	await svelteKitServer.init({ env: Bun.env as Record<string, string> });

	return svelteKitServer.respond(new Request(`http://localhost/api/validate${query}`), {
		getClientAddress: () => '127.0.0.1'
	});
}

async function respondViaVite(query: string): Promise<Response> {
	const { createServer } = await import('vite');
	const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

	// SvelteKit forces Vite's root to cwd, so we must run from the cli package.
	// But the endpoint resolves the project via EVIDENCE_PROJECT_CWD ?? cwd — so
	// pin it to the current dir before chdir-ing away, or we'd validate the cli
	// package itself when `--project` wasn't passed.
	const originalCwd = process.cwd();
	if (!process.env.EVIDENCE_PROJECT_CWD) process.env.EVIDENCE_PROJECT_CWD = originalCwd;
	process.chdir(cliRoot);

	let vite: Awaited<ReturnType<typeof createServer>> | undefined;
	try {
		vite = await createServer({
			server: { middlewareMode: true },
			appType: 'custom',
			logLevel: 'warn'
		});
		const mod = await vite.ssrLoadModule('/src/routes/api/validate/+server.ts');
		return await mod.GET({ url: new URL(`http://localhost/api/validate${query}`) });
	} finally {
		await vite?.close();
		process.chdir(originalCwd);
	}
}

function plural(n: number, word: string): string {
	return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function printHuman(result: ValidateResult, c: ReturnType<typeof createColors>): void {
	// Compact, grep-friendly: `path:line: severity: message [rule]` — one per line.
	for (const file of result.files) {
		for (const err of file.errors) {
			const isError = err.severity === 'error' || err.severity === 'critical';
			const severity = isError ? c.red('error') : c.yellow('warning');
			const rule = err.id ? ` ${c.dim(`[${err.id}]`)}` : '';
			console.log(`${c.dim(`${file.path}:${err.line}:`)} ${severity}: ${err.message}${rule}`);
		}
	}

	const { errorCount: e, warningCount: w } = result;
	if (e === 0 && w === 0) {
		console.log(c.green('No problems found') + c.dim(` (${plural(result.fileCount, 'file')})`));
	} else {
		const parts: string[] = [];
		if (e) parts.push(c.red(plural(e, 'error')));
		if (w) parts.push(c.yellow(plural(w, 'warning')));
		console.log(`\n${parts.join(', ')}`);
	}

	if (result.mode === 'syntax-only') {
		console.log(
			c.dim(
				'\nnote: syntax-only — table, column, and SQL checks skipped' +
					(result.metadataError ? ` (${result.metadataError})` : '') +
					'\n      run `evidence login` or add a connection.yaml for full validation'
			)
		);
	}
}

export async function validate(options: ValidateOptions): Promise<void> {
	// Same default as every other command: the human report at a terminal,
	// structured output when piped/redirected/agent. --verbose / --json override.
	const human = resolveFormat(options.output, 'structured') === 'table';

	const result = await fetchValidation(options.path, human);

	if (human) {
		// `--no-color`/NO_COLOR force plain; otherwise let picocolors auto-detect
		// the terminal (so a `--verbose` report into a pipe stays uncolored).
		printHuman(result, options.output.color ? pc : createColors(false));
	} else {
		printResult({ kind: 'structured', value: result }, options.output);
	}

	process.exit(result.valid ? 0 : 1);
}
