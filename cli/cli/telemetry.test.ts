import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lstat, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	detectAgent,
	detectConnector,
	isCI,
	isSandbox,
	isTelemetryDisabled,
	readProjectTelemetryId,
	type TelemetryContext
} from './telemetry.ts';

const CI_VARS = [
	'CI',
	'GITHUB_ACTIONS',
	'GITLAB_CI',
	'CIRCLECI',
	'BUILDKITE',
	'TF_BUILD',
	'JENKINS_URL'
];

describe('isCI', () => {
	it('is false with no CI vars set', () => {
		expect(isCI({})).toBe(false);
	});

	it('treats CI=true / CI=1 as CI', () => {
		expect(isCI({ CI: 'true' })).toBe(true);
		expect(isCI({ CI: '1' })).toBe(true);
	});

	it('does not treat CI=false or CI=0 as CI', () => {
		expect(isCI({ CI: 'false' })).toBe(false);
		expect(isCI({ CI: '0' })).toBe(false);
	});

	it('detects provider-specific vars even when CI is unset', () => {
		for (const k of CI_VARS.slice(1)) {
			expect(isCI({ [k]: 'x' })).toBe(true);
		}
	});
});

describe('isTelemetryDisabled', () => {
	it('is false with neither var set', () => {
		expect(isTelemetryDisabled({})).toBe(false);
	});

	it('opts out on EVIDENCE_TELEMETRY_DISABLED or DO_NOT_TRACK', () => {
		expect(isTelemetryDisabled({ EVIDENCE_TELEMETRY_DISABLED: '1' })).toBe(true);
		expect(isTelemetryDisabled({ DO_NOT_TRACK: '1' })).toBe(true);
	});

	it('ignores falsy values so an unset-looking var does not opt out', () => {
		for (const value of ['', '0', 'false']) {
			expect(isTelemetryDisabled({ DO_NOT_TRACK: value })).toBe(false);
		}
	});
});

describe('detectAgent', () => {
	it('recognises the markers each coding agent exports', () => {
		expect(detectAgent({ CURSOR_AGENT: '1' })).toBe('cursor');
		expect(detectAgent({ CLAUDECODE: '1' })).toBe('claude-code');
		expect(detectAgent({ CODEX_SANDBOX: 'seatbelt' })).toBe('codex');
		expect(detectAgent({ GEMINI_CLI: '1' })).toBe('gemini');
	});

	it('is null for a plain terminal, including non-TTY scripts', () => {
		expect(detectAgent({})).toBeNull();
		expect(detectAgent({ TERM: 'xterm', SHELL: '/bin/zsh' })).toBeNull();
	});
});

describe('project detection', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'evd-telemetry-'));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	it('connector is null outside a project, managed with only a config, direct with connection.yaml', async () => {
		expect(detectConnector(dir)).toBeNull();
		await writeFile(join(dir, 'evidence.config.yaml'), 'project:\n  name: x\n');
		expect(detectConnector(dir)).toBe('managed');
		await writeFile(join(dir, 'connection.yaml'), 'type: postgres\n');
		expect(detectConnector(dir)).toBe('direct');
	});

	it('reads telemetry.id from evidence.config.yaml', async () => {
		await writeFile(
			join(dir, 'evidence.config.yaml'),
			'project:\n  name: x\n  evidence: "0.9.3"\ntelemetry:\n  id: "abc-123"\n'
		);
		expect(await readProjectTelemetryId(dir)).toBe('abc-123');
	});

	it('returns null when the id is missing, malformed, or the config is broken', async () => {
		expect(await readProjectTelemetryId(dir)).toBeNull();
		await writeFile(join(dir, 'evidence.config.yaml'), 'project:\n  name: x\n');
		expect(await readProjectTelemetryId(dir)).toBeNull();
		await writeFile(join(dir, 'evidence.config.yaml'), 'telemetry:\n  id: 12345\n');
		expect(await readProjectTelemetryId(dir)).toBeNull();
		await writeFile(join(dir, 'evidence.config.yaml'), `telemetry:\n  id: "${'x'.repeat(65)}"\n`);
		expect(await readProjectTelemetryId(dir)).toBeNull();
		await writeFile(join(dir, 'evidence.config.yaml'), 'project: [broken');
		expect(await readProjectTelemetryId(dir)).toBeNull();
	});
});

describe('isSandbox', () => {
	const base: TelemetryContext = {
		connector: 'direct',
		logged_in: false,
		project_id: null,
		agent: null,
		tty: true,
		runtime: 'bare',
		instance_id: 'i'
	};

	it('only a freshly minted id inside an agent or container counts as a sandbox', () => {
		expect(isSandbox(base, true)).toBe(false);
		expect(isSandbox({ ...base, agent: 'cursor' }, true)).toBe(true);
		expect(isSandbox({ ...base, runtime: 'docker' }, true)).toBe(true);
	});

	it('an existing machine id is never a sandbox, even when driven by an agent', () => {
		expect(isSandbox({ ...base, agent: 'cursor' }, false)).toBe(false);
		expect(isSandbox({ ...base, runtime: 'docker' }, false)).toBe(false);
	});
});

describe('machine id and preference files', () => {
	let home: string;
	const ENV_VARS = ['HOME', ...CI_VARS, 'EVIDENCE_TELEMETRY_DISABLED', 'DO_NOT_TRACK'];
	let saved: Record<string, string | undefined>;

	beforeEach(async () => {
		saved = Object.fromEntries(ENV_VARS.map((k) => [k, process.env[k]]));
		// The suite itself runs in CI; the status assertions need a clean env.
		for (const k of ENV_VARS) delete process.env[k];
		home = await mkdtemp(join(tmpdir(), 'evd-home-'));
		process.env.HOME = home;
		vi.resetModules();
	});

	afterEach(async () => {
		for (const k of ENV_VARS) {
			if (saved[k] === undefined) delete process.env[k];
			else process.env[k] = saved[k];
		}
		await rm(home, { recursive: true, force: true });
	});

	it('creates the id once and reuses it across processes', async () => {
		const first = await (await import('./telemetry.ts')).getMachineId();
		expect(first.created).toBe(true);
		expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
		expect((await readFile(join(home, '.evd', 'machine-id'), 'utf-8')).trim()).toBe(first.id);

		vi.resetModules();
		const second = await (await import('./telemetry.ts')).getMachineId();
		expect(second).toEqual({ id: first.id, created: false, source: 'home' });
	});

	it('falls back to a stable id in TMPDIR when the home dir is not writable', async () => {
		// A regular file where ~/.evd should be makes mkdir fail.
		await writeFile(join(home, '.evd'), 'not a directory');
		const tmp = await mkdtemp(join(tmpdir(), 'evd-tmp-'));
		const savedTmp = process.env.TMPDIR;
		process.env.TMPDIR = tmp;
		try {
			const first = await (await import('./telemetry.ts')).getMachineId();
			expect(first.source).toBe('tmp');
			expect(first.created).toBe(true);
			expect(first.id).toMatch(/^[0-9a-f-]{36}$/);

			vi.resetModules();
			const second = await (await import('./telemetry.ts')).getMachineId();
			expect(second).toEqual({ id: first.id, created: false, source: 'tmp' });

			// Private directory, not a bare file in a shared tmp.
			const dir = await lstat(join(tmp, `evd-${process.getuid?.() ?? 'u'}`));
			expect(dir.isDirectory()).toBe(true);
			expect(dir.mode & 0o777).toBe(0o700);
		} finally {
			if (savedTmp === undefined) delete process.env.TMPDIR;
			else process.env.TMPDIR = savedTmp;
			await rm(tmp, { recursive: true, force: true });
		}
	});

	it('refuses a planted symlink or non-id content at the tmp fallback path', async () => {
		await writeFile(join(home, '.evd'), 'not a directory');
		const tmp = await mkdtemp(join(tmpdir(), 'evd-tmp-'));
		const savedTmp = process.env.TMPDIR;
		process.env.TMPDIR = tmp;
		const evdDir = join(tmp, `evd-${process.getuid?.() ?? 'u'}`);
		try {
			// Another local user pre-creates our path as a symlink to a file they want us to clobber.
			await mkdir(evdDir, { recursive: true });
			const victim = join(tmp, 'victim');
			await writeFile(victim, 'important');
			await symlink(victim, join(evdDir, 'machine-id'));
			expect(await (await import('./telemetry.ts')).getMachineId()).toEqual({
				id: null,
				created: false,
				source: null
			});
			expect(await readFile(victim, 'utf-8')).toBe('important');

			// Planted garbage is not adopted as an identity either.
			await rm(join(evdDir, 'machine-id'));
			await writeFile(join(evdDir, 'machine-id'), 'attacker-chosen-id');
			vi.resetModules();
			expect((await (await import('./telemetry.ts')).getMachineId()).id).toBeNull();
		} finally {
			if (savedTmp === undefined) delete process.env.TMPDIR;
			else process.env.TMPDIR = savedTmp;
			await rm(tmp, { recursive: true, force: true });
		}
	});

	it('returns null instead of a throwaway id when nothing is writable', async () => {
		await writeFile(join(home, '.evd'), 'not a directory');
		const savedTmp = process.env.TMPDIR;
		process.env.TMPDIR = join(home, '.evd');
		try {
			const result = await (await import('./telemetry.ts')).getMachineId();
			expect(result).toEqual({ id: null, created: false, source: null });
		} finally {
			if (savedTmp === undefined) delete process.env.TMPDIR;
			else process.env.TMPDIR = savedTmp;
		}
	});

	it('serve heartbeat fires daily with uptime and the shared context', async () => {
		// track() does real file I/O before fetching, so only the interval and clock are faked.
		vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
		const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		vi.stubGlobal('fetch', fetchMock);
		try {
			const mod = await import('./telemetry.ts');
			mod.startServeHeartbeat();
			expect(fetchMock).not.toHaveBeenCalled();

			vi.advanceTimersByTime(24 * 60 * 60 * 1000);
			await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
			const body = JSON.parse(fetchMock.mock.calls[0][1].body);
			expect(body.event).toBe('serve_heartbeat');
			expect(body.properties.uptime_hours).toBe(24);
			expect(body.properties.instance_id).toMatch(/^[0-9a-f-]{36}$/);

			vi.advanceTimersByTime(24 * 60 * 60 * 1000);
			await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
			expect(JSON.parse(fetchMock.mock.calls[1][1].body).properties.uptime_hours).toBe(48);
		} finally {
			vi.unstubAllGlobals();
			vi.useRealTimers();
		}
	});

	it('the preference file switches telemetry off and reports why', async () => {
		const mod = await import('./telemetry.ts');
		await mkdir(join(home, '.evd'), { recursive: true });
		await mod.setTelemetryEnabled(false);
		expect(await mod.getTelemetryStatus()).toEqual({ enabled: false, reason: 'preference' });
		await mod.setTelemetryEnabled(true);
		expect((await mod.getTelemetryStatus()).enabled).toBe(true);
	});
});
