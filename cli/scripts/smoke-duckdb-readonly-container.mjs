/**
 * Linux-only: verify the documented local candidate image with a read-only
 * project bind mount. Requires Docker, curl-free Node 22, and a built CLI.
 *
 * This is an OS/container-permission test, not proof of arbitrary SQL safety.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

if (process.platform !== 'linux') {
	throw new Error('Read-only container smoke test requires Linux');
}

const binary = resolve('cli/dist/evidence');
const dockerfile = resolve('docs/examples/duckdb-serve-candidate.Dockerfile');
const workspace = mkdtempSync(join(tmpdir(), 'evidence-duckdb-container-'));
const project = join(workspace, 'report');
const context = join(workspace, 'image');
const imageName = `evidence-duckdb-ci:${process.pid}`;
const containerName = `evidence-duckdb-ci-${process.pid}`;
const auth = `Basic ${Buffer.from('reports:ci-test-password').toString('base64')}`;

let containerId;

function docker(...args) {
	return execFileSync('docker', args, { encoding: 'utf8', timeout: 180000 }).trim();
}

async function sqlRequest(endpoint, sql, authorized = true) {
	return fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(authorized ? { Authorization: auth } : {})
		},
		body: JSON.stringify({ sql }),
		signal: AbortSignal.timeout(5000)
	});
}

try {
	assert.ok(existsSync(binary), 'Build cli/dist/evidence before the container smoke test');
	mkdirSync(context);

	// mkdtemp is 0700 by default; the non-root container user must be able to
	// traverse the isolated fixture directory.
	chmodSync(workspace, 0o755);

	execFileSync(binary, ['init', project, '--warehouse', 'duckdb'], {
		timeout: 30000,
		env: { ...process.env, EVIDENCE_TELEMETRY_DISABLED: '1' },
		stdio: 'pipe'
	});
	chmodSync(project, 0o755);

	const dataDir = join(project, 'data');
	mkdirSync(dataDir, { recursive: true });
	writeFileSync(join(dataDir, 'flights.csv'), 'airport,flights\nPOZ,12\n');

	copyFileSync(binary, join(context, 'evidence'));
	copyFileSync(dockerfile, join(context, 'Dockerfile'));

	console.log('=== BUILD READ-ONLY CONTAINER CANDIDATE ===');
	execFileSync('docker', ['build', '--tag', imageName, context], {
		stdio: 'inherit',
		timeout: 240000
	});

	console.log('=== START READ-ONLY PROJECT ===');
	containerId = docker(
		'run',
		'--detach',
		'--rm',
		'--name',
		containerName,
		'--read-only',
		'--cap-drop=ALL',
		'--security-opt',
		'no-new-privileges',
		'--pids-limit=128',
		'--memory=2g',
		'--cpus=2',
		'--tmpfs',
		'/tmp:rw,nosuid,nodev,size=512m,mode=1777',
		'--mount',
		`type=bind,src=${project},dst=/project,readonly`,
		'--publish',
		'127.0.0.1::3000',
		'--env',
		'EVIDENCE_TELEMETRY_DISABLED=1',
		'--env',
		'EVIDENCE_BASIC_USER=reports',
		'--env',
		'EVIDENCE_BASIC_PASSWORD=ci-test-password',
		imageName
	);

	const address = docker('port', containerId, '3000/tcp');
	const port = /127\.0\.0\.1:(\d+)/.exec(address)?.[1];
	assert.ok(port, `Unexpected Docker port: ${address}`);
	const endpoint = `http://127.0.0.1:${port}/api/query`;

	let ready = false;
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			const response = await sqlRequest(endpoint, 'SELECT 42 AS answer');
			if (response.ok && (await response.json()).rows?.[0]?.answer === 42) {
				ready = true;
				break;
			}
		} catch {
			// Docker may not have started the CLI yet.
		}
		await delay(300);
	}
	assert.ok(ready, 'Container failed to answer authorized SQL in time');

	console.log('=== AUTH AND CSV ===');
	const unauthorized = await sqlRequest(endpoint, 'SELECT 1 AS answer', false);
	assert.equal(unauthorized.status, 401, 'Unauthenticated SQL must be denied');

	const read = await sqlRequest(
		endpoint,
		"SELECT airport, flights FROM read_csv_auto('data/flights.csv')"
	);
	assert.equal(read.status, 200, 'Expected authorized project-local CSV read');
	assert.deepEqual((await read.json()).rows, [{ airport: 'POZ', flights: 12 }]);

	console.log('=== OS-ENFORCED READ-ONLY PROJECT ===');
	const written = join(dataDir, 'must-not-exist.csv');
	const attemptedWrite = await sqlRequest(
		endpoint,
		"COPY (SELECT 1 AS id) TO 'data/must-not-exist.csv' (FORMAT CSV, HEADER)"
	);
	assert.ok(!attemptedWrite.ok, 'OS read-only project mount must reject COPY TO');
	assert.ok(!existsSync(written), 'Denied write must not create a project file');
	console.log('READ_ONLY_CONTAINER_FS_DENIED_OK');
	console.log('READ_ONLY_CONTAINER_SMOKE_OK');
} catch (error) {
	if (containerId) {
		try {
			console.error('=== CONTAINER LOGS ===');
			console.error(docker('logs', containerId).slice(-7000));
		} catch {
			// Preserve original error.
		}
	}
	throw error;
} finally {
	if (containerId) {
		try {
			docker('stop', '--time', '5', containerId);
		} catch {
			// Best effort, preserve original failure.
		}
	}
	try {
		docker('image', 'rm', '--force', imageName);
	} catch {
		// Best effort; CI runners are ephemeral.
	}
	rmSync(workspace, { recursive: true, force: true });
}
