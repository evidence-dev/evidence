import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBInstance } from '@duckdb/node-api';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { duckDBServeConfiguration, lockDownDuckDBInstance } from './duckdb-security';
import type { DuckDBCredentials } from '@evidence/core/connectors/duckdb/credentials';

let root: string;
let project: string;

beforeEach(async () => {
	root = await mkdtemp(path.join(tmpdir(), 'evidence-duckdb-sec-'));
	project = path.join(root, 'report');
	await mkdir(project);
});

afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('DuckDB serve security configuration', () => {

	it('allows project CSV but denies outside files and locked setting changes', async () => {
		const dataDir = path.join(project, 'data');
		await mkdir(dataDir);
		await writeFile(path.join(dataDir, 'flights.csv'), 'airport,flights\nPOZ,12\n');
		const secret = path.join(root, 'outside-secret.txt');
		await writeFile(secret, 'not-for-http');

		const config: DuckDBCredentials = {
			database: ':memory:',
			projectDir: project,
			schemas: []
		};

		const instance = await DuckDBInstance.create(':memory:', duckDBServeConfiguration(config));
		await lockDownDuckDBInstance(instance, config);
		const connection = await instance.connect();
		try {
			// Vitest runs from the CLI repository; use an absolute in-project
			// path here. The standalone serve smoke test covers relative paths.
			const allowedCsv = path.join(dataDir, 'flights.csv').replace(/'/g, "''");
			const rows = await connection.runAndReadAll(
				`SELECT * FROM read_csv_auto('${allowedCsv}')`
			);
			expect(rows.getRowObjectsJson()).toEqual([{ airport: 'POZ', flights: '12' }]);

			await expect(
				connection.runAndReadAll(`SELECT * FROM read_text('${secret.replace(/'/g, "''")}')`)
			).rejects.toThrow();

			await expect(
				connection.runAndReadAll('SET enable_external_access = true')
			).rejects.toThrow();

			await expect(connection.runAndReadAll('SET lock_configuration = false')).rejects.toThrow();

			await expect(
				connection.runAndReadAll(`COPY (SELECT 1 AS id) TO '${path
					.join(root, 'outside.csv')
					.replace(/'/g, "''")}' (HEADER, DELIMITER ',')`)
			).rejects.toThrow();
		} finally {
			connection.closeSync();
			instance.closeSync();
		}
	});
});
