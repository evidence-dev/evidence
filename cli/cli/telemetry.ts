import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import { lstat, mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import yaml from 'js-yaml';
import { VERSION } from './args.ts';

const STUDIO_HOST = process.env.PUBLIC_STUDIO_HOST || 'https://evidence.studio';
const EVENT_URL = `${STUDIO_HOST}/api/cli/event`;
export const TELEMETRY_DOCS_URL = 'https://docs.evidence.studio/cli#telemetry';

const EVD_DIR = join(homedir(), '.evd');
const MACHINE_ID_FILE = join(EVD_DIR, 'machine-id');
const CREDENTIALS_FILE = join(EVD_DIR, 'credentials.json');
const PREFERENCE_FILE = join(EVD_DIR, 'telemetry.json');

const TIMEOUT_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function isCI(env: NodeJS.ProcessEnv = process.env): boolean {
	if (env.CI && env.CI !== 'false' && env.CI !== '0') return true;
	return Boolean(
		env.GITHUB_ACTIONS ||
		env.GITLAB_CI ||
		env.CIRCLECI ||
		env.BUILDKITE ||
		env.TF_BUILD ||
		env.JENKINS_URL
	);
}

/** `DO_NOT_TRACK` is the cross-tool convention (consoledonottrack.com). */
export function isTelemetryDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
	return [env.EVIDENCE_TELEMETRY_DISABLED, env.DO_NOT_TRACK].some(
		(v) => v !== undefined && v !== '' && v !== 'false' && v !== '0'
	);
}

export type Agent = 'cursor' | 'claude-code' | 'codex' | 'gemini';

// Env markers each coding agent exports to the shells it spawns; extend as new agents appear.
const AGENT_MARKERS: [Agent, string][] = [
	['cursor', 'CURSOR_AGENT'],
	['claude-code', 'CLAUDECODE'],
	['codex', 'CODEX_SANDBOX'],
	['gemini', 'GEMINI_CLI']
];

export function detectAgent(env: NodeJS.ProcessEnv = process.env): Agent | null {
	for (const [agent, marker] of AGENT_MARKERS) {
		if (env[marker]) return agent;
	}
	return null;
}

export type Runtime = 'docker' | 'bare';

export function detectRuntime(): Runtime {
	return existsSync('/.dockerenv') || existsSync('/run/.containerenv') ? 'docker' : 'bare';
}

export type Connector = 'direct' | 'managed';

/** Which query path a project uses; null when cwd isn't an Evidence project. */
export function detectConnector(projectRoot: string): Connector | null {
	if (existsSync(join(projectRoot, 'connection.yaml'))) return 'direct';
	if (existsSync(join(projectRoot, 'evidence.config.yaml'))) return 'managed';
	return null;
}

// Not loadProjectConfig(): a broken config must neither stop telemetry nor surface errors here.
export async function readProjectTelemetryId(projectRoot: string): Promise<string | null> {
	try {
		const raw = await readFile(join(projectRoot, 'evidence.config.yaml'), 'utf-8');
		const parsed = yaml.load(raw) as { telemetry?: { id?: unknown } } | null;
		const id = parsed?.telemetry?.id;
		return typeof id === 'string' && id.length > 0 && id.length <= 64 ? id : null;
	} catch {
		return null;
	}
}

export type MachineIdSource = 'home' | 'tmp';

export interface MachineId {
	id: string | null;
	created: boolean;
	source: MachineIdSource | null;
}

let cachedMachineId: MachineId | null = null;

// Agent sandboxes (Codex/Claude seatbelt) block writes to $HOME but allow $TMPDIR; without this
// fallback one developer's session shows up as a new "user" on every command.
function tmpMachineIdDir(): string {
	const uid = typeof process.getuid === 'function' ? process.getuid() : 'u';
	return join(tmpdir(), `evd-${uid}`);
}

const UUID_RE = /^[0-9a-f-]{32,36}$/i;

// $TMPDIR may be shared with other local users, so nothing here follows a symlink or trusts a
// path it did not create: lstat (not stat), ownership check, and exclusive-create writes.
function ownedByUs(stats: { uid: number }): boolean {
	return typeof process.getuid !== 'function' || stats.uid === process.getuid();
}

async function readOrCreateId(
	dir: string,
	file: string
): Promise<{ id: string; created: boolean } | null> {
	try {
		const stats = await lstat(file);
		if (!stats.isFile() || !ownedByUs(stats)) return null;
		const existing = (await readFile(file, 'utf-8')).trim();
		if (UUID_RE.test(existing)) return { id: existing, created: false };
		return null;
	} catch {
		// not created yet
	}
	const id = randomUUID();
	try {
		await mkdir(dir, { recursive: true, mode: 0o700 });
		const dirStats = await lstat(dir);
		if (!dirStats.isDirectory() || !ownedByUs(dirStats)) return null;
		await writeFile(file, id, { encoding: 'utf-8', mode: 0o600, flag: 'wx' });
		return { id, created: true };
	} catch {
		return null;
	}
}

// `id` is null when it can't be persisted anywhere: a per-process id would make every run a new "user".
export async function getMachineId(): Promise<MachineId> {
	if (cachedMachineId) return cachedMachineId;
	const home = await readOrCreateId(EVD_DIR, MACHINE_ID_FILE);
	if (home) return (cachedMachineId = { ...home, source: 'home' });
	const tmpDir = tmpMachineIdDir();
	const tmp = await readOrCreateId(tmpDir, join(tmpDir, 'machine-id'));
	if (tmp) return (cachedMachineId = { ...tmp, source: 'tmp' });
	return (cachedMachineId = { id: null, created: false, source: null });
}

interface TelemetryPreference {
	enabled: boolean;
}

async function readPreference(): Promise<TelemetryPreference | null> {
	try {
		const parsed = JSON.parse(await readFile(PREFERENCE_FILE, 'utf-8'));
		return typeof parsed?.enabled === 'boolean' ? { enabled: parsed.enabled } : null;
	} catch {
		return null;
	}
}

export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
	await mkdir(EVD_DIR, { recursive: true, mode: 0o700 });
	await writeFile(PREFERENCE_FILE, JSON.stringify({ enabled }), { encoding: 'utf-8', mode: 0o600 });
}

export type TelemetryStatus = {
	enabled: boolean;
	reason: 'env' | 'ci' | 'preference' | 'default';
};

export async function getTelemetryStatus(): Promise<TelemetryStatus> {
	if (isTelemetryDisabled()) return { enabled: false, reason: 'env' };
	if (isCI()) return { enabled: false, reason: 'ci' };
	const pref = await readPreference();
	if (pref && !pref.enabled) return { enabled: false, reason: 'preference' };
	return { enabled: true, reason: 'default' };
}

const instanceId = randomUUID();
const startedAt = Date.now();

export interface TelemetryContext {
	connector: Connector | null;
	logged_in: boolean;
	project_id: string | null;
	agent: Agent | null;
	tty: boolean;
	runtime: Runtime;
	instance_id: string;
}

let cachedContext: TelemetryContext | null = null;

export async function getContext(): Promise<TelemetryContext> {
	if (cachedContext) return cachedContext;
	const projectRoot = process.env.EVIDENCE_PROJECT_CWD || process.cwd();
	cachedContext = {
		connector: detectConnector(projectRoot),
		logged_in: Boolean(process.env.EVIDENCE_AUTH_TOKEN) || existsSync(CREDENTIALS_FILE),
		project_id: await readProjectTelemetryId(projectRoot),
		agent: detectAgent(),
		tty: Boolean(process.stdin.isTTY),
		runtime: detectRuntime(),
		instance_id: instanceId
	};
	return cachedContext;
}

// A machine id minted inside an agent sandbox or container is throwaway; the server keeps it personless.
export function isSandbox(ctx: TelemetryContext, machineIdCreated: boolean): boolean {
	return machineIdCreated && (ctx.agent !== null || ctx.runtime === 'docker');
}

export function firstRunNotice(): string {
	return (
		'\n  Evidence collects anonymous usage data to improve the CLI.\n' +
		`  What is sent: ${TELEMETRY_DOCS_URL}\n` +
		'  Opt out:      evidence telemetry disable\n'
	);
}

export async function track(
	event: string,
	properties: Record<string, unknown> = {}
): Promise<void> {
	if (isCI() || isTelemetryDisabled()) return;
	try {
		const pref = await readPreference();
		if (pref && !pref.enabled) return;

		const [machine, ctx] = await Promise.all([getMachineId(), getContext()]);

		// Only a human at a terminal can act on the notice; servers and agents would just spam logs.
		if (machine.created && ctx.tty && process.stderr.isTTY) {
			console.error(firstRunNotice());
		}

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
		await fetch(EVENT_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				event,
				machineId: machine.id,
				properties: {
					version: VERSION,
					os: process.platform,
					arch: process.arch,
					...ctx,
					first_run: machine.created,
					id_source: machine.source,
					sandbox: isSandbox(ctx, machine.created),
					...properties
				}
			}),
			signal: controller.signal
		}).catch(() => {});
		clearTimeout(timeout);
	} catch {
		// telemetry must never throw
	}
}

// Startup-only events make a stable server vanish and a crash-looping one look popular.
export function startServeHeartbeat(): void {
	const timer = setInterval(() => {
		void track('serve_heartbeat', {
			uptime_hours: Math.round((Date.now() - startedAt) / 36e5)
		});
	}, HEARTBEAT_INTERVAL_MS);
	// Never keep the process alive on telemetry's account.
	timer.unref();
}
