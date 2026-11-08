import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { executeQuery } from './index';
import type { DuckDBConnectionConfig } from './types';

let directory: string;
let config: DuckDBConnectionConfig;

beforeEach(async () => {
	directory = await mkdtemp(path.join(tmpdir(), 'evidence-duckdb-exec-'));
	config = {
		type: 'duckdb',
		database: path.join(directory, 'analytics.duckdb'),
		projectDir: directory,
		schemas: []
	};
});

afterEach(async () => {
	await rm(directory, { recursive: true, force: true });
});

describe('DuckDB direct query execution', () => {
	it('reuses one in-memory database within a project', async () => {
		const memoryConfig = {
			...config,
			database: ':memory:'
		};

		await executeQuery('CREATE TABLE memory_counter AS SELECT 42 AS value', memoryConfig);

		const results = await Promise.all([
			executeQuery('SELECT value FROM memory_counter', memoryConfig),
			executeQuery('SELECT value FROM memory_counter', memoryConfig)
		]);

		expect(results.map((result) => result.rows)).toEqual([[{ value: 42 }], [{ value: 42 }]]);
	});

	it('isolates in-memory databases belonging to different projects', async () => {
		const secondProject = path.join(directory, 'second-project');
		await mkdir(secondProject, { recursive: true });

		const first = {
			...config,
			database: ':memory:'
		};

		const second = {
			...first,
			projectDir: secondProject
		};

		await Promise.all([
			executeQuery('CREATE TABLE project_identity AS SELECT 101 AS id', first),
			executeQuery('CREATE TABLE project_identity AS SELECT 202 AS id', second)
		]);

		const [firstResult, secondResult] = await Promise.all([
			executeQuery('SELECT id FROM project_identity', first),
			executeQuery('SELECT id FROM project_identity', second)
		]);

		expect(firstResult.rows).toEqual([{ id: 101 }]);
		expect(secondResult.rows).toEqual([{ id: 202 }]);

		await executeQuery('CREATE TABLE only_first_project AS SELECT 1 AS secret', first);

		await expect(executeQuery('SELECT * FROM only_first_project', second)).rejects.toThrow();
	});

	it('executes SQL and returns Evidence-compatible metadata', async () => {
		const result = await executeQuery(
			"SELECT 42::INTEGER AS answer, 'duck'::VARCHAR AS label",
			config
		);

		expect(result.rows).toEqual([{ answer: 42, label: 'duck' }]);

		expect(result.columns).toEqual([
			{
				name: 'answer',
				clickhouseType: 'INTEGER',
				jsType: 'number'
			},
			{
				name: 'label',
				clickhouseType: 'VARCHAR',
				jsType: 'string'
			}
		]);
	});

	it('preserves data across separate connections', async () => {
		await executeQuery('CREATE TABLE flights (id INTEGER, carrier VARCHAR)', config);

		await executeQuery("INSERT INTO flights VALUES (1, 'LOT'), (2, 'Ryanair')", config);

		const result = await executeQuery('SELECT COUNT(*) AS total FROM flights', config);

		expect(result.rows).toEqual([{ total: 2 }]);
	});

	it('preserves integers exceeding JavaScript safe precision', async () => {
		const result = await executeQuery(
			`SELECT
        42::BIGINT AS small_value,
        9007199254740993::BIGINT AS large_value`,
			config
		);

		expect(result.rows).toEqual([
			{
				small_value: 42,
				large_value: '9007199254740993'
			}
		]);
	});

	it('returns ordinary decimal values as numbers', async () => {
		const result = await executeQuery('SELECT 12.50::DECIMAL(10,2) AS price', config);

		expect(result.rows).toEqual([{ price: 12.5 }]);
	});

	it('resolves Parquet paths relative to the Evidence project', async () => {
		const dataDir = path.join(directory, 'data');
		await mkdir(dataDir, { recursive: true });

		const parquetFile = path.join(dataDir, 'relative.parquet');

		await executeQuery(
			`COPY (SELECT 1 AS id, 'POZ' AS airport)
			 TO '${parquetFile.replace(/'/g, "''")}' (FORMAT PARQUET)`,
			config
		);

		const result = await executeQuery(
			"SELECT id, airport FROM read_parquet('data/relative.parquet')",
			config
		);

		expect(result.rows).toEqual([{ id: 1, airport: 'POZ' }]);
	});

	it('escapes apostrophes in the project directory', async () => {
		const projectDir = path.join(directory, "author's project");
		await mkdir(projectDir, { recursive: true });

		config.projectDir = projectDir;

		const result = await executeQuery('SELECT 7 AS value', config);

		expect(result.rows).toEqual([{ value: 7 }]);
	});

	it('reads real Parquet files', async () => {
		const parquetPath = path.join(directory, 'flights.parquet');
		const quotedPath = parquetPath.replace(/'/g, "''");

		await executeQuery(
			`COPY (
        SELECT 1 AS flight_id, 'POZ' AS airport
        UNION ALL
        SELECT 2 AS flight_id, 'WAW' AS airport
      ) TO '${quotedPath}' (FORMAT PARQUET)`,
			config
		);

		const result = await executeQuery(
			`SELECT flight_id, airport
       FROM read_parquet('${quotedPath}')
       ORDER BY flight_id`,
			config
		);

		expect(result.rows).toEqual([
			{ flight_id: 1, airport: 'POZ' },
			{ flight_id: 2, airport: 'WAW' }
		]);
	});

	it('propagates invalid SQL errors', async () => {
		await expect(executeQuery('SELECT * FROM missing_table_12345', config)).rejects.toThrow();

		const recovery = await executeQuery('SELECT 1 AS recovered', config);

		expect(recovery.rows).toEqual([{ recovered: 1 }]);
	});
});
