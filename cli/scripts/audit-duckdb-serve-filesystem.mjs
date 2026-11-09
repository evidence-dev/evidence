/**
 * Diagnostic-only audit of the local DuckDB HTTP filesystem boundary.
 * Does not touch real user files and does not fail CI when an in-project write
 * is permitted. It reports observations so we can choose an explicit policy.
 *
 * Run after pnpm cli:build:
 *   node cli/scripts/audit-duckdb-serve-filesystem.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const binary = resolve('cli', 'dist', process.platform === 'win32' ? 'evidence.exe' : 'evidence');
const root = mkdtempSync(join(tmpdir(), 'evidence-duckdb-security-audit-'));
const project = join(root, 'report');
const env = {
	...process.env,
	TMPDIR: root,
	TMP: root,
	TEMP: root,
	EVIDENCE_TELEMETRY_DISABLED: '1',
	EVIDENCE_AUTH_DISABLED: '0',
	EVIDENCE_BASIC_USER: '',
	EVIDENCE_BASIC_PASSWORD: ''
};
delete env.LD_LIBRARY_PATH;
delete env.LD_PRELOAD;

const sqlPath = (filePath) => filePath.replace(/\\/g, '/').replace(/'/g, "''");
let server;
let serverLogs = '';

async function query(endpoint, sql) {
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sql }),
		signal: AbortSignal.timeout(10000)
	});
	let payload;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}
	return { ok: response.ok, status: response.status, payload };
}

try {
	execFileSync(binary, ['init', project, '--warehouse', 'duckdb'], {
		env,
		timeout: 30000,
		stdio: 'pipe'
	});
	const dataDir = join(project, 'data');
	mkdirSync(dataDir, { recursive: true });

	const allowedCsv = join(dataDir, 'safe.csv');
	writeFileSync(allowedCsv, 'airport,flights\nPOZ,12\n');

	const outsideSecret = join(root, 'outside-secret.txt');
	const marker = 'AUDIT_SECRET_OUTSIDE_PROJECT';
	writeFileSync(outsideSecret, marker);

	const listener = createServer();
	listener.listen(0, '127.0.0.1');
	await once(listener, 'listening');
	const port = listener.address().port;
	await new Promise((resolveClose) => listener.close(resolveClose));

	server = spawn(binary, ['serve', '--host', '127.0.0.1', '--port', String(port), '--no-open'], {
		cwd: project,
		env,
		stdio: ['ignore', 'pipe', 'pipe']
	});
	for (const stream of [server.stdout, server.stderr]) {
		stream.on('data', (chunk) => {
			serverLogs = (serverLogs + String(chunk)).slice(-5000);
		});
	}

	const endpoint = `http://127.0.0.1:${port}/api/query`;
	let ready = false;
	for (let attempt = 0; attempt < 80; attempt++) {
		if (server.exitCode !== null) {
			throw new Error(`Serve exited before becoming ready:\n${serverLogs}`);
		}
		try {
			const result = await query(endpoint, 'SELECT 1 AS ready');
			if (result.ok && result.payload?.rows?.[0]?.ready === 1) {
				ready = true;
				break;
			}
		} catch {
			// Startup can take a moment on slower systems.
		}
		await delay(250);
	}
	assert.ok(ready, `Serve did not become ready:\n${serverLogs}`);

	const allowedRead = await query(
		endpoint,
		`SELECT airport, flights FROM read_csv_auto('${sqlPath(allowedCsv)}')`
	);
	assert.ok(allowedRead.ok, 'In-project CSV must remain readable');

	console.log('=== IN-PROJECT FILE WRITE ===');
	const writtenCsv = join(dataDir, 'audit-generated.csv');
	const writeResult = await query(
		endpoint,
		`COPY (SELECT 42 AS id) TO '${sqlPath(writtenCsv)}' (FORMAT CSV, HEADER)`
	);
	const writeSucceeded =
		writeResult.ok && existsSync(writtenCsv) && readFileSync(writtenCsv, 'utf8').includes('42');
	console.log(writeSucceeded ? 'IN_PROJECT_WRITE_ALLOWED' : 'IN_PROJECT_WRITE_DENIED');
	console.log(`Write HTTP status: ${writeResult.status}`);

	console.log('=== SYMLINK ESCAPE READ ===');
	const symlinkFile = join(dataDir, 'outside-link.txt');
	let symlinkAvailable = true;
	try {
		symlinkSync(outsideSecret, symlinkFile, 'file');
	} catch (error) {
		symlinkAvailable = false;
		console.log(`SYMLINK_AUDIT_UNAVAILABLE: ${error.code ?? 'unknown'}`);
	}

	if (symlinkAvailable) {
		const result = await query(
			endpoint,
			`SELECT content FROM read_text('${sqlPath(symlinkFile)}')`
		);
		const escaped =
			result.ok && JSON.stringify(result.payload?.rows ?? []).includes(marker);
		console.log(escaped ? 'SYMLINK_ESCAPE_READ_ALLOWED' : 'SYMLINK_ESCAPE_READ_DENIED');
		console.log(`Symlink HTTP status: ${result.status}`);
	}

	console.log('FILESYSTEM_SECURITY_AUDIT_COMPLETE');
} catch (error) {
	console.error('FILESYSTEM_SECURITY_AUDIT_FAILED');
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
