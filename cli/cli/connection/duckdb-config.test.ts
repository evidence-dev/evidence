import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadConnectionConfig } from './load-config';
import { listTablesSql } from './index';

let projectDir: string;

beforeEach(async () => {
	projectDir = await mkdtemp(path.join(tmpdir(), 'evidence-duckdb-'));
});

afterEach(async () => {
	await rm(projectDir, { recursive: true, force: true });
});

async function writeYaml(content: string): Promise<void> {
	await writeFile(path.join(projectDir, 'connection.yaml'), content);
}

describe('DuckDB connection.yaml', () => {
	it('loads the default in-memory database', async () => {
		await writeYaml('type: duckdb\n');

		expect(await loadConnectionConfig(projectDir)).toEqual({
			type: 'duckdb',
			database: ':memory:',
			schemas: []
		});
	});

	it('resolves relative paths against the project directory', async () => {
		await writeYaml(
			'type: duckdb\ndatabase: ./data/analytics.duckdb\nschemas: [main, analytics]\n'
		);

		expect(await loadConnectionConfig(projectDir)).toEqual({
			type: 'duckdb',
			database: path.join(projectDir, 'data', 'analytics.duckdb'),
			schemas: ['main', 'analytics']
		});
	});

	it('preserves absolute paths', async () => {
		const database = path.join(tmpdir(), 'existing.duckdb');

		await writeYaml(`type: duckdb\ndatabase: ${JSON.stringify(database)}\n`);

		expect(await loadConnectionConfig(projectDir)).toEqual({
			type: 'duckdb',
			database,
			schemas: []
		});
	});

	it('rejects an empty database path', async () => {
		await writeYaml('type: duckdb\ndatabase: "   "\n');

		await expect(loadConnectionConfig(projectDir)).rejects.toThrow(/connection\.yaml: database:/);
	});

	it('rejects empty schema names', async () => {
		await writeYaml('type: duckdb\nschemas: [main, "  "]\n');

		await expect(loadConnectionConfig(projectDir)).rejects.toThrow(/connection\.yaml: schemas\.1:/);
	});

	it('interpolates environment variables', async () => {
		const variable = 'EVIDENCE_DUCKDB_TEST_DATABASE';
		const previous = process.env[variable];

		try {
			process.env[variable] = './data/from-env.duckdb';
			await writeYaml('type: duckdb\ndatabase: ${EVIDENCE_DUCKDB_TEST_DATABASE}\n');

			expect(await loadConnectionConfig(projectDir)).toEqual({
				type: 'duckdb',
				database: path.join(projectDir, 'data', 'from-env.duckdb'),
				schemas: []
			});
		} finally {
			if (previous === undefined) {
				delete process.env[variable];
			} else {
				process.env[variable] = previous;
			}
		}
	});
});

describe('DuckDB catalog SQL', () => {
	it('lists non-system tables without an allowlist', () => {
		const sql = listTablesSql({
			type: 'duckdb',
			database: ':memory:',
			schemas: []
		});

		expect(sql).toContain('information_schema.tables');
		expect(sql).toContain("table_schema NOT IN ('information_schema', 'pg_catalog')");
	});

	it('restricts the catalog to selected schemas', () => {
		const sql = listTablesSql({
			type: 'duckdb',
			database: ':memory:',
			schemas: ['main', 'analytics']
		});

		expect(sql).toContain("table_schema IN ('main', 'analytics')");
	});

	it('escapes single quotes in schema names', () => {
		const sql = listTablesSql({
			type: 'duckdb',
			database: ':memory:',
			schemas: ["sales'archive"]
		});

		expect(sql).toContain("table_schema IN ('sales''archive')");
	});
});
