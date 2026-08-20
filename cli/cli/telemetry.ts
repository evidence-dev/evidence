import { homedir } from 'os';
import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { VERSION } from './args.ts';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';
const EVENT_URL = `${STUDIO_HOST}/api/cli/event`;

const EVD_DIR = join(homedir(), '.evd');
const MACHINE_ID_FILE = join(EVD_DIR, 'machine-id');

const TIMEOUT_MS = 1500;

export function isCI(): boolean {
	const e = process.env;
	if (e.CI && e.CI !== 'false' && e.CI !== '0') return true;
	return Boolean(
		e.GITHUB_ACTIONS || e.GITLAB_CI || e.CIRCLECI || e.BUILDKITE || e.TF_BUILD || e.JENKINS_URL
	);
}

/** `DO_NOT_TRACK` is the cross-tool convention (consoledonottrack.com). */
export function isTelemetryDisabled(): boolean {
	const e = process.env;
	return [e.EVIDENCE_TELEMETRY_DISABLED, e.DO_NOT_TRACK].some(
		(v) => v !== undefined && v !== '' && v !== 'false' && v !== '0'
	);
}

let cachedId: string | null = null;

export async function getMachineId(): Promise<string> {
	if (cachedId) return cachedId;
	try {
		const existing = (await readFile(MACHINE_ID_FILE, 'utf-8')).trim();
		if (existing) return (cachedId = existing);
	} catch {
		// not created yet
	}
	const id = randomUUID();
	try {
		await mkdir(EVD_DIR, { recursive: true, mode: 0o700 });
		await writeFile(MACHINE_ID_FILE, id, { encoding: 'utf-8', mode: 0o600 });
	} catch {
		// non-fatal — fall back to an ephemeral id
	}
	return (cachedId = id);
}

export async function track(
	event: string,
	properties: Record<string, unknown> = {}
): Promise<void> {
	if (isCI() || isTelemetryDisabled()) return;
	try {
		const machineId = await getMachineId();
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
		await fetch(EVENT_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				event,
				machineId,
				properties: { version: VERSION, os: process.platform, arch: process.arch, ...properties }
			}),
			signal: controller.signal
		}).catch(() => {});
		clearTimeout(timeout);
	} catch {
		// telemetry must never throw
	}
}
