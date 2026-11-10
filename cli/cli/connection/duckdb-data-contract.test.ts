/**
 * Native DuckDB -> Evidence result contract.
 *
 * These tests intentionally go through the production direct connector, not
 * only the driver. They protect precision, metadata and JSON API semantics.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { executeQuery } from './index';
import type { DuckDBConnectionConfig } from './types';

let projectDir: string;
let config: DuckDBConnectionConfig;

beforeEach(async () => {
	projectDir = await mkdtemp(path.join(tmpdir(), 'evidence-duckdb-contract-'));
	config = {
		type: 'duckdb',
		database: ':memory:',
		projectDir,
		schemas: []
	};
});

afterEach(async () => {
	await rm(projectDir, { recursive: true, force: true });
});

describe('DuckDB -> Evidence data quality contract', () => {
	it('maps integer, decimal, boolean, text and null metadata', async () => {
		const { rows, columns } = await executeQuery(
			`SELECT
				42::INTEGER AS integer_value,
				12.50::DECIMAL(10,2) AS decimal_value,
				TRUE::BOOLEAN AS flag,
				'Gdańsk 🦆'::VARCHAR AS caption,
				NULL::INTEGER AS missing`,
			config
		);

		expect(columns.map(({ name, jsType }) => [name, jsType])).toEqual([
			['integer_value', 'number'],
			['decimal_value', 'number'],
			['flag', 'boolean'],
			['caption', 'string'],
			['missing', 'number']
		]);
		expect(rows).toEqual([
			{
				integer_value: 42,
				decimal_value: 12.5,
				flag: true,
				caption: 'Gdańsk 🦆',
				missing: null
			}
		]);
		expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
	});

	it('keeps exact wide integers and high-precision decimals as strings', async () => {
		const { rows, columns } = await executeQuery(
			`SELECT
				42::BIGINT AS safe_bigint,
				9007199254740993::BIGINT AS unsafe_bigint,
				-9007199254740993::BIGINT AS negative_unsafe,
				18446744073709551615::UBIGINT AS max_ubigint,
				170141183460469231731687303715884105727::HUGEINT AS max_hugeint,
				123456789012345678901234567890.12345::DECIMAL(38,5) AS precise_amount,
				-12.50::DECIMAL(10,2) AS ordinary_amount`,
			config
		);

		expect(rows).toEqual([
			{
				safe_bigint: 42,
				unsafe_bigint: '9007199254740993',
				negative_unsafe: '-9007199254740993',
				max_ubigint: '18446744073709551615',
				max_hugeint: '170141183460469231731687303715884105727',
				precise_amount: '123456789012345678901234567890.12345',
				ordinary_amount: -12.5
			}
		]);
		expect(columns.map((column) => column.jsType)).toEqual(Array(7).fill('number'));
		expect(JSON.stringify(rows)).toContain('170141183460469231731687303715884105727');
	});

	it('normalizes dates and timestamps without shifting wall-clock time', async () => {
		const { rows, columns } = await executeQuery(
			`SELECT
				DATE '2024-02-29' AS calendar_day,
				TIMESTAMP '2024-03-31 01:30:00' AS local_timestamp,
				TIMESTAMPTZ '2024-03-31 01:30:00+01:00' AS utc_instant,
				TIME '13:45:12' AS clock_time,
				NULL::TIMESTAMP AS missing_timestamp`,
			config
		);

		expect(columns.map(({ name, jsType }) => [name, jsType])).toEqual([
			['calendar_day', 'date'],
			['local_timestamp', 'date'],
			['utc_instant', 'date'],
			['clock_time', 'date'],
			['missing_timestamp', 'date']
		]);
		expect(rows).toEqual([
			{
				calendar_day: '2024-02-29',
				local_timestamp: '2024-03-31 01:30:00',
				utc_instant: '2024-03-31 00:30:00',
				clock_time: '13:45:12',
				missing_timestamp: null
			}
		]);
	});

	it('exposes nested lists and structs as JSON-safe object values', async () => {
		const { rows, columns } = await executeQuery(
			`SELECT
				[1, NULL, 3]::INTEGER[] AS numbers,
				{'airport': 'POZ', 'flights': 12} AS details,
				[{'id': 1, 'label': 'LOT'}, {'id': 2, 'label': 'KLM'}] AS legs,
				NULL::INTEGER[] AS missing_list`,
			config
		);

		expect(columns.map(({ name, jsType }) => [name, jsType])).toEqual([
			['numbers', 'object'],
			['details', 'object'],
			['legs', 'object'],
			['missing_list', 'object']
		]);
		expect(rows).toEqual([
			{
				numbers: [1, null, 3],
				details: { airport: 'POZ', flights: 12 },
				legs: [
					{ id: 1, label: 'LOT' },
					{ id: 2, label: 'KLM' }
				],
				missing_list: null
			}
		]);
		expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
	});

	it('reports native interval and map JSON shapes accurately', async () => {
		const { rows, columns } = await executeQuery(
			`SELECT
				INTERVAL '2 days 3 hours' AS duration,
				MAP(['a', 'b'], [1, 2]) AS counts,
				'{"active":true}'::JSON AS raw_json,
				NULL::INTERVAL AS missing_duration`,
			config
		);

		expect(columns.map(({ name, jsType }) => [name, jsType])).toEqual([
			['duration', 'object'],
			['counts', 'object'],
			['raw_json', 'string'],
			['missing_duration', 'object']
		]);
		expect(rows).toEqual([
			{
				duration: { months: 0, days: 2, micros: '10800000000' },
				counts: [
					{ key: 'a', value: 1 },
					{ key: 'b', value: 2 }
				],
				raw_json: '{"active":true}',
				missing_duration: null
			}
		]);
		expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
	});

	it('preserves column metadata for empty results', async () => {
		const result = await executeQuery(
			`SELECT
				1::INTEGER AS id,
				DATE '2024-01-01' AS day,
				['duck']::VARCHAR[] AS labels
			 WHERE FALSE`,
			config
		);

		expect(result.rows).toEqual([]);
		expect(result.columns.map(({ name, jsType }) => [name, jsType])).toEqual([
			['id', 'number'],
			['day', 'date'],
			['labels', 'object']
		]);
	});

	it('does not reuse explicit alias suffixes when deduplicating columns', async () => {
		const result = await executeQuery(
			'SELECT 1 AS id, 2 AS id, 3 AS id_2, NULL::INTEGER AS id',
			config
		);

		expect(result.columns.map((column) => column.name)).toEqual(['id', 'id_3', 'id_2', 'id_4']);
		expect(result.rows).toEqual([{ id: 1, id_3: 2, id_2: 3, id_4: null }]);
		expect(JSON.parse(JSON.stringify(result.rows))).toEqual(result.rows);
	});

	it('retains unique output names for empty duplicate-alias results', async () => {
		const result = await executeQuery(
			'SELECT 1::INTEGER AS answer, 2::INTEGER AS answer WHERE FALSE',
			config
		);

		expect(result.rows).toEqual([]);
		expect(result.columns.map((column) => column.name)).toEqual(['answer', 'answer_2']);
	});

	it('does not silently lose values when columns share an alias', async () => {
		const result = await executeQuery(
			'SELECT 1 AS duplicate, 2 AS duplicate, 3 AS duplicate',
			config
		);

		expect(result.columns.map((column) => column.name)).toEqual([
			'duplicate',
			'duplicate_2',
			'duplicate_3'
		]);
		expect(result.rows).toEqual([{ duplicate: 1, duplicate_2: 2, duplicate_3: 3 }]);
	});
});
