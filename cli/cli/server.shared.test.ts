import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import {
	describeFetchFailure,
	hasConnectionYaml,
	warnIfStudioUnreachable,
	describeDevMode
} from './server.shared.ts';

let projectDir: string;
let previousCwd: string | undefined;

beforeEach(async () => {
	projectDir = await mkdtemp(path.join(tmpdir(), 'evd-server-shared-'));
	previousCwd = process.env.EVIDENCE_PROJECT_CWD;
	process.env.EVIDENCE_PROJECT_CWD = projectDir;
});

afterEach(async () => {
	if (previousCwd === undefined) delete process.env.EVIDENCE_PROJECT_CWD;
	else process.env.EVIDENCE_PROJECT_CWD = previousCwd;
	await rm(projectDir, { recursive: true, force: true });
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('describeFetchFailure', () => {
	it('names a timeout with the budget that was exceeded', () => {
		const err = new Error('aborted');
		err.name = 'AbortError';
		expect(describeFetchFailure(err, 10_000)).toBe('timed out after 10s');
	});

	it('recognises DNS, refused, and certificate failures by errno code', () => {
		expect(describeFetchFailure(Object.assign(new Error('x'), { code: 'ENOTFOUND' }), 1)).toBe(
			'DNS lookup failed'
		);
		expect(describeFetchFailure(Object.assign(new Error('x'), { code: 'ECONNREFUSED' }), 1)).toBe(
			'connection refused'
		);
		expect(
			describeFetchFailure(Object.assign(new Error('x'), { code: 'ConnectionRefused' }), 1)
		).toBe('connection refused');
		expect(
			describeFetchFailure(
				Object.assign(new Error('x'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE_CERT' }),
				1
			)
		).toBe('certificate error (UNABLE_TO_VERIFY_LEAF_SIGNATURE_CERT)');
	});

	it('reads the code from err.cause, where undici puts it', () => {
		const err = new Error('fetch failed', {
			cause: Object.assign(new Error(), { code: 'EAI_AGAIN' })
		});
		expect(describeFetchFailure(err, 1)).toBe('DNS lookup failed');
	});

	it('falls back to the message, then to a generic label', () => {
		expect(describeFetchFailure(new Error('boom'), 1)).toBe('boom');
		expect(describeFetchFailure('not an error', 1)).toBe('unknown error');
	});
});

describe('warnIfStudioUnreachable', () => {
	it('makes no network call and prints nothing when connection.yaml exists', async () => {
		await writeFile(path.join(projectDir, 'connection.yaml'), 'type: cube\nhost: localhost\n');
		expect(hasConnectionYaml()).toBe(true);

		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await warnIfStudioUnreachable();

		expect(fetchSpy).not.toHaveBeenCalled();
		expect(errSpy).not.toHaveBeenCalled();
	});

	it('warns with the failure reason but does not exit when Studio is unreachable', async () => {
		expect(hasConnectionYaml()).toBe(false);

		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue(Object.assign(new Error('fetch failed'), { code: 'ENOTFOUND' }))
		);
		const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
			throw new Error('exit called');
		}) as never);
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await warnIfStudioUnreachable();

		expect(exitSpy).not.toHaveBeenCalled();
		const output = errSpy.mock.calls.map((c) => c.join(' ')).join('\n');
		expect(output).toContain('Could not reach Evidence Studio');
		expect(output).toContain('DNS lookup failed');
		expect(output).toContain('connection.yaml');
		expect(output).toContain('HTTPS_PROXY');
	});

	it('stays silent when Studio responds OK', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok', { status: 200 })));
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await warnIfStudioUnreachable();

		expect(errSpy).not.toHaveBeenCalled();
	});
});

describe('describeDevMode', () => {
	it('reports the direct connector type and that no login is needed', async () => {
		await writeFile(path.join(projectDir, 'connection.yaml'), 'type: cube\nhost: localhost\n');
		const line = await describeDevMode();
		expect(line).toContain('direct connector (cube)');
		expect(line).toContain('no Evidence Studio login required');
	});

	it('still identifies direct mode when connection.yaml is malformed', async () => {
		await writeFile(path.join(projectDir, 'connection.yaml'), 'type: [not, valid\n');
		const line = await describeDevMode();
		expect(line).toContain('direct connector (connection.yaml)');
	});

	it('reports managed mode without a connection.yaml', async () => {
		const line = await describeDevMode();
		expect(line).toContain('Evidence Warehouse (managed)');
	});
});
