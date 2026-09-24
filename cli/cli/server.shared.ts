/**
 * Helpers shared between the production server (server.ts) and the
 * dev-mode server (server.dev.ts).
 */

import { exec } from 'child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';

// A first TLS handshake through a corporate proxy routinely exceeds the old 3s budget.
const STUDIO_PROBE_TIMEOUT_MS = 10_000;

export type StudioProbeResult = { ok: true } | { ok: false; reason: string };

// connection.yaml projects never touch the managed engine, so Studio reachability is irrelevant.
export function hasConnectionYaml(): boolean {
	const cwd = process.env.EVIDENCE_PROJECT_CWD || process.cwd();
	return existsSync(path.join(cwd, 'connection.yaml'));
}

/** One-line summary of where `dev` will send queries, printed under "Ready at". */
export async function describeDevMode(): Promise<string> {
	if (!hasConnectionYaml()) {
		return 'Evidence Warehouse (managed) — run `evidence login` if you have not yet';
	}
	const cwd = process.env.EVIDENCE_PROJECT_CWD || process.cwd();
	let type = 'connection.yaml';
	try {
		// Only `type`: a missing secret must not stop the server from starting.
		const raw = yaml.load(await readFile(path.join(cwd, 'connection.yaml'), 'utf-8'));
		const declared = (raw as { type?: unknown } | null)?.type;
		if (typeof declared === 'string' && declared) type = declared;
	} catch {
		/* malformed YAML is reported at query time */
	}
	return `direct connector (${type}) — no Evidence Studio login required`;
}

export function describeFetchFailure(err: unknown, timeoutMs: number): string {
	if (err instanceof Error) {
		if (err.name === 'AbortError' || err.name === 'TimeoutError') {
			return `timed out after ${Math.round(timeoutMs / 1000)}s`;
		}
		const code =
			(err as NodeJS.ErrnoException).code ?? (err.cause as NodeJS.ErrnoException | undefined)?.code;
		if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'DNS lookup failed';
		// The shipped binary runs on Bun, whose fetch uses its own codes instead of errnos.
		if (code === 'ECONNREFUSED' || code === 'ConnectionRefused') return 'connection refused';
		if (code === 'ECONNRESET' || code === 'ConnectionClosed') return 'connection reset';
		if (typeof code === 'string' && code.includes('CERT')) return `certificate error (${code})`;
		if (err.message) return err.message;
	}
	return 'unknown error';
}

export async function checkStudioServer(): Promise<StudioProbeResult> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), STUDIO_PROBE_TIMEOUT_MS);
	try {
		const response = await fetch(`${STUDIO_HOST}/health`, {
			method: 'GET',
			signal: controller.signal
		});
		if (response.ok) return { ok: true };
		return { ok: false, reason: `HTTP ${response.status}` };
	} catch (err) {
		return { ok: false, reason: describeFetchFailure(err, STUDIO_PROBE_TIMEOUT_MS) };
	} finally {
		clearTimeout(timeoutId);
	}
}

// Never exits: pages render offline, only warehouse queries need Studio.
export async function warnIfStudioUnreachable(): Promise<void> {
	if (hasConnectionYaml()) return;

	const probe = await checkStudioServer();
	if (probe.ok) return;

	console.error(`  ⚠ Could not reach Evidence Studio at ${STUDIO_HOST} (${probe.reason}).`);
	console.error('');
	console.error('    Pages will render, but queries against the Evidence Warehouse will fail');
	console.error('    until the connection is restored.');
	console.error('');
	console.error('    To query your own database instead, add a connection.yaml — no Studio');
	console.error('    connection is needed for direct connectors.');
	console.error('    If you are behind a corporate proxy, set HTTPS_PROXY.');
	console.error('');
}

export function openBrowser(url: string): void {
	const platform = process.platform;

	let command: string;
	if (platform === 'darwin') {
		command = `open "${url}"`;
	} else if (platform === 'win32') {
		command = `start "${url}"`;
	} else {
		command = `xdg-open "${url}"`;
	}

	exec(command, () => {
		// Silently fail if browser can't open
	});
}
