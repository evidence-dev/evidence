import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const binary = resolve('cli', 'dist', process.platform === 'win32' ? 'evidence.exe' : 'evidence');

const root = mkdtempSync(join(tmpdir(), 'evidence-duckdb-smoke-'));
const project = join(root, 'report');

const env = {
	...process.env,
	TMPDIR: root,
	TMP: root,
	TEMP: root,
	EVIDENCE_TELEMETRY_DISABLED: '1'
};

delete env.LD_LIBRARY_PATH;
delete env.LD_PRELOAD;

function run(...args) {
	return execFileSync(binary, args, {
		encoding: 'utf8',
		env,
		timeout: 30000
	}).trim();
}

function query(sql) {
	return JSON.parse(run('--project', project, 'query', sql, '--format', 'json'));
}

let server;
let serverLogs = '';

try {
	console.log('=== VERSION ===');
	console.log(run('version'));

	console.log('=== INIT ===');
	run('init', project, '--warehouse', 'duckdb');

	mkdirSync(join(project, 'data'));

	writeFileSync(join(project, 'data', 'flights.csv'), 'airport,flights\nPOZ,12\nWAW,24\n');

	console.log('=== NATIVE SQL ===');
	assert.deepEqual(query('SELECT 42 AS answer'), [{ answer: 42 }]);

	console.log('=== CSV ===');
	const sql =
		"SELECT airport, flights FROM read_csv_auto('data/flights.csv') " + 'ORDER BY airport';

	const expected = [
		{ airport: 'POZ', flights: 12 },
		{ airport: 'WAW', flights: 24 }
	];

	assert.deepEqual(query(sql), expected);
	console.log('CLI_DUCKDB_OK');

	console.log('=== NATIVE CLEANUP ===');

	const remainingNativeDirs = () =>
		readdirSync(root).filter((name) => name.startsWith('evidence-duckdb-native-'));

	for (let attempt = 1; attempt <= 5; attempt++) {
		assert.deepEqual(query('SELECT 42 AS answer'), [{ answer: 42 }]);

		assert.deepEqual(remainingNativeDirs(), [], `Native library leftovers after run ${attempt}`);

		console.log(`Native cleanup ${attempt}/5: OK`);
	}

	console.log('NATIVE_CLEANUP_OK');

	console.log('=== HTTP SERVER ===');

	const listener = createServer();
	listener.listen(0, '127.0.0.1');
	await once(listener, 'listening');

	const port = listener.address().port;
	await new Promise((accept) => listener.close(accept));

	server = spawn(binary, ['serve', '--host', '127.0.0.1', '--port', String(port), '--no-open'], {
		cwd: project,
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});

	for (const stream of [server.stdout, server.stderr]) {
		stream.on('data', (data) => {
			serverLogs = (serverLogs + String(data)).slice(-8000);
		});
	}

	const endpoint = `http://127.0.0.1:${port}/api/query`;
	let succeeded = false;

	for (let attempt = 0; attempt < 100; attempt++) {
		if (server.exitCode !== null) {
			throw new Error(`Server exited early:\n${serverLogs}`);
		}

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sql }),
				signal: AbortSignal.timeout(2000)
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();
			assert.deepEqual(result.rows, expected);

			succeeded = true;
			break;
		} catch (error) {
			if (attempt === 99) throw error;
			await delay(300);
		}
	}

	assert.ok(succeeded);
	console.log('SERVER_DUCKDB_OK');
	console.log('ALL_DUCKDB_BINARY_SMOKE_TESTS_OK');
} catch (error) {
	console.error('SMOKE_TEST_FAILED');
	console.error(serverLogs);
	throw error;
} finally {
	if (server && server.exitCode === null) {
		server.kill();
		await Promise.race([
			once(server, 'exit').catch(() => {}),
			delay(5000, undefined, { ref: false })
		]);
	}

	rmSync(root, { recursive: true, force: true });
}
