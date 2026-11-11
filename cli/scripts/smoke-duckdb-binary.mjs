import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { DuckDBInstance } from '@duckdb/node-api';

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

	// Seed a Parquet fixture while the trusted CLI still has file access.
	const parquetFile = join(project, 'data', 'inside.parquet')
		.replace(/\\/g, '/')
		.replace(/'/g, "''");
	const seedInstance = await DuckDBInstance.create(':memory:');
	const seedConnection = await seedInstance.connect();
	try {
		await seedConnection.runAndReadAll(
			`COPY (SELECT 1 AS flight_id, 'POZ' AS airport) TO '${parquetFile}' (FORMAT PARQUET)`
		);
	} finally {
		seedConnection.closeSync();
		seedInstance.closeSync();
	}
	writeFileSync(join(root, 'outside-secret.txt'), 'outside-project-private-data');
	console.log('CLI_DUCKDB_OK');

	console.log('=== NATIVE CLEANUP ===');

	const remainingNativeDirs = () =>
		readdirSync(root).filter((name) => name.startsWith('evidence-duckdb-native-'));

	let previousNativeDirs = remainingNativeDirs();

	for (let attempt = 1; attempt <= 5; attempt++) {
		assert.deepEqual(query('SELECT 42 AS answer'), [{ answer: 42 }]);

		const currentNativeDirs = remainingNativeDirs();

		if (process.platform === 'win32') {
			// The current DLL may remain locked until process termination.
			assert.ok(
				currentNativeDirs.length <= 1,
				`Native directories accumulated after run ${attempt}`
			);

			assert.ok(
				previousNativeDirs.every((name) => !currentNativeDirs.includes(name)),
				`Stale native directories were not reclaimed after run ${attempt}`
			);
		} else {
			assert.deepEqual(currentNativeDirs, [], `Native library leftovers after run ${attempt}`);
		}

		previousNativeDirs = currentNativeDirs;
		console.log(`Native cleanup ${attempt}/5: OK`);
	}

	console.log('NATIVE_CLEANUP_OK');

	console.log('=== NATIVE TEMP FAILURE ===');

	// Force native extraction to fail without changing the embedded DLL.
	// This probes failure reporting and verifies that the next CLI run still works.
	const unavailableTemp = join(root, 'missing-native-temp-root');
	const invalidEnv = {
		...env,
		TMPDIR: unavailableTemp,
		TMP: unavailableTemp,
		TEMP: unavailableTemp
	};
	const failedQuery = spawnSync(
		binary,
		['--project', project, 'query', 'SELECT 42 AS answer', '--format', 'json'],
		{ env: invalidEnv, encoding: 'utf8', timeout: 30000 }
	);

	assert.equal(failedQuery.error, undefined, 'CLI process could not be started');
	assert.ok(
		failedQuery.status !== null && failedQuery.status !== 0,
		'CLI must fail when its native temporary directory is unavailable'
	);
	assert.match(
		`${failedQuery.stderr ?? ''}\n${failedQuery.stdout ?? ''}`,
		/ENOENT|ENOTDIR|no such file or directory|not a directory/i,
		'CLI should report the native temporary directory failure'
	);
	assert.deepEqual(query('SELECT 42 AS answer'), [{ answer: 42 }]);
	console.log('NATIVE_TEMP_FAILURE_RECOVERY_OK');

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

	console.log('=== DUCKDB DATA CONTRACT ===');
	const dataContractSql =
		'SELECT 9007199254740993::BIGINT AS large_id, ' +
		'123456789012345678901234567890.12345::DECIMAL(38,5) AS exact_amount, ' +
		"DATE '2024-02-29' AS event_day, [1, NULL, 3]::INTEGER[] AS codes, " +
		"{'airport': 'POZ'} AS details, NULL::INTEGER AS missing";
	const expectedDataRow = {
		large_id: '9007199254740993',
		exact_amount: '123456789012345678901234567890.12345',
		event_day: '2024-02-29',
		codes: [1, null, 3],
		details: { airport: 'POZ' },
		missing: null
	};

	// Validate both paths exposed to end users, not just the in-process driver.
	assert.deepEqual(query(dataContractSql), [expectedDataRow]);
	const dataContractResponse = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sql: dataContractSql }),
		signal: AbortSignal.timeout(10000)
	});
	assert.equal(dataContractResponse.status, 200, 'Native HTTP data contract should succeed');
	const dataContractResult = await dataContractResponse.json();
	assert.deepEqual(dataContractResult.rows, [expectedDataRow]);
	assert.deepEqual(
		dataContractResult.columns.map(({ name, jsType }) => [name, jsType]),
		[
			['large_id', 'number'],
			['exact_amount', 'number'],
			['event_day', 'date'],
			['codes', 'object'],
			['details', 'object'],
			['missing', 'number']
		]
	);

	const duplicated = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sql: 'SELECT 1 AS id, 2 AS id, 3 AS id' }),
		signal: AbortSignal.timeout(10000)
	});
	assert.equal(duplicated.status, 200, 'Duplicate alias SQL should succeed');
	const duplicateResult = await duplicated.json();
	assert.deepEqual(duplicateResult.rows, [{ id: 1, id_2: 2, id_3: 3 }]);
	assert.deepEqual(
		duplicateResult.columns.map(({ name }) => name),
		['id', 'id_2', 'id_3']
	);
	console.log('DUCKDB_DATA_CONTRACT_OK');

	console.log('=== SQL HTTP SECURITY ===');
	const requestCases = [
		{
			name: 'cross-origin',
			status: 403,
			headers: { Origin: 'https://attacker.example' },
			body: JSON.stringify({ sql })
		},
		{
			name: 'cross-site-metadata',
			status: 403,
			headers: { 'Sec-Fetch-Site': 'cross-site' },
			body: JSON.stringify({ sql })
		},
		{
			name: 'unsupported-media-type',
			// SvelteKit's own CSRF gate may return 403 before our 415.
			status: [403, 415],
			headers: { 'Content-Type': 'text/plain' },
			body: JSON.stringify({ sql })
		},
		{
			name: 'malformed-json',
			status: 400,
			headers: {},
			body: '{malformed'
		},
		{
			name: 'oversized-payload',
			status: 413,
			headers: {},
			body: JSON.stringify({ sql: 'x'.repeat(256 * 1024) })
		}
	];
	for (const testCase of requestCases) {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...testCase.headers },
			body: testCase.body,
			signal: AbortSignal.timeout(5000)
		});
		const allowedStatuses = Array.isArray(testCase.status) ? testCase.status : [testCase.status];
		assert.ok(
			allowedStatuses.includes(response.status),
			`${testCase.name}: expected HTTP ${allowedStatuses.join(' or ')}, got ${response.status}`
		);
	}
	console.log('SQL_HTTP_SECURITY_OK');

	console.log('=== DUCKDB SERVE FILESYSTEM SECURITY ===');
	const allowedParquet = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			sql: "SELECT flight_id, airport FROM read_parquet('data/inside.parquet')"
		}),
		signal: AbortSignal.timeout(10000)
	});
	assert.equal(allowedParquet.status, 200, 'Project Parquet should remain readable');
	assert.deepEqual((await allowedParquet.json()).rows, [{ flight_id: 1, airport: 'POZ' }]);

	async function expectSQLDenied(name, statement) {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sql: statement }),
			signal: AbortSignal.timeout(10000)
		});
		assert.ok(!response.ok, `${name} must be rejected (got HTTP ${response.status})`);
		const result = await response.json();
		assert.ok(result.error, `${name} should report a query error`);
	}

	const outsideSecret = join(root, 'outside-secret.txt').replace(/\\/g, '/').replace(/'/g, "''");
	const outsideWrite = join(root, 'outside-write.csv').replace(/\\/g, '/').replace(/'/g, "''");
	await expectSQLDenied('Outside project file read', `SELECT * FROM read_text('${outsideSecret}')`);
	await expectSQLDenied('Unlock configuration', 'SET lock_configuration = false');
	await expectSQLDenied('Re-enable external access', 'SET enable_external_access = true');
	await expectSQLDenied(
		'Outside project file write',
		`COPY (SELECT 1 AS id) TO '${outsideWrite}' (HEADER, DELIMITER ',')`
	);
	assert.equal(existsSync(join(root, 'outside-write.csv')), false);
	console.log('DUCKDB_SERVE_FS_ISOLATION_OK');

	console.log('=== CONCURRENT HTTP QUERIES ===');
	const concurrentRequests = 12;
	await Promise.all(
		Array.from({ length: concurrentRequests }, async (_, index) => {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sql }),
				signal: AbortSignal.timeout(20000)
			});
			const result = await response.json();
			assert.ok(
				response.ok,
				`Concurrent query ${index + 1}: HTTP ${response.status}: ${JSON.stringify(result)}`
			);
			assert.deepEqual(result.rows, expected, `Concurrent query ${index + 1}`);
		})
	);
	console.log('CONCURRENT_HTTP_DUCKDB_OK');
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
