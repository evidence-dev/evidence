import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { batchedAsyncGeneratorToArray, TypeFidelity } from '@evidence-dev/db-commons';


const timezoneInsertedQuery = `select
  timestamp with time zone '2024-06-27 00:00:00+00' as timestamp_explicit_utc,
  timestamp with time zone '2024-06-27 02:00:00+02' as timestamp_explicit_berlin,
  timestamp with time zone '2024-06-26 17:00:00-07' as timestamp_explicit_los_angeles,
  timestamp without time zone '2024-06-27 00:00:00' as timestamp_implicit_utc,
  timestamp without time zone '2024-06-27 02:00:00' as timestamp_implicit_berlin,
  timestamp without time zone '2024-06-26 17:00:00' as timestamp_implicit_los_angeles`;

test('query runs', async () => {
	try {
		const { rows: row_generator, columnTypes } = await runQuery(
			"select 100 as number_col, now()::date  as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, true as bool_col",
			{
				host: process.env.POSTGRES_HOST,
				password: process.env.POSTGRES_PASSWORD,
				database: process.env.POSTGRES_DATABASE,
				user: process.env.POSTGRES_USER,
				port: process.env.POSTGRES_PORT,
				ssl: process.env.POSTGRES_SSL
			}
		);
		const rows = await batchedAsyncGeneratorToArray(row_generator);
		assert.instance(rows, Array);
		assert.instance(columnTypes, Array);
		assert.type(rows[0], 'object');
		assert.equal(rows[0].number_col, 100);

		let actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
		let actualColumnNames = columnTypes.map((columnType) => columnType.name);
		let actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);

		let expectedColumnTypes = ['number', 'date', 'date', 'string', 'boolean'];
		let expectedColumnNames = ['number_col', 'date_col', 'timestamp_col', 'string_col', 'bool_col'];
		let expectedTypePrecision = Array(5).fill(TypeFidelity.PRECISE);

		assert.equal(
			true,
			expectedColumnTypes.length === actualColumnTypes.length &&
				expectedColumnTypes.every((value, index) => value === actualColumnTypes[index])
		);
		assert.equal(
			true,
			expectedColumnNames.length === actualColumnNames.length &&
				expectedColumnNames.every((value, index) => value === actualColumnNames[index])
		);
		assert.equal(
			true,
			expectedTypePrecision.length === actualTypePrecisions.length &&
				expectedTypePrecision.every((value, index) => value === actualTypePrecisions[index])
		);
	} catch (e) {
		throw Error(e);
	}
});

test('query batches results properly', async () => {
	try {
		const { rows, expectedRowCount } = await runQuery(
			'select 1 union all select 2 union all select 3 union all select 4 union all select 5',
			{
				host: process.env.POSTGRES_HOST,
				password: process.env.POSTGRES_PASSWORD,
				database: process.env.POSTGRES_DATABASE,
				user: process.env.POSTGRES_USER,
				port: process.env.POSTGRES_PORT,
				ssl: process.env.POSTGRES_SSL
			},
			2
		);

		const arr = [];
		for await (const batch of rows()) {
			arr.push(batch);
		}
		for (const batch of arr.slice(0, -1)) {
			assert.equal(batch.length, 2);
		}
		assert.equal(arr[arr.length - 1].length, 1);
		assert.equal(expectedRowCount, 5);
	} catch (e) {
		throw Error(e);
	}
});

test('timestamps are converted to UTC', async () => {
	const timeZoneQuery = `select
		timestamp_explicit_utc,
		timestamp_explicit_berlin,
		timestamp_explicit_los_angeles,
		timestamp_implicit_utc AT TIME ZONE 'UTC' as timestamp_implicit_utc_converted,
		timestamp_implicit_berlin AT TIME ZONE 'Europe/Berlin' as timestamp_implicit_berlin_converted,
		timestamp_implicit_los_angeles AT TIME ZONE 'America/Los_Angeles' as timestamp_implicit_los_angeles_converted
		from (${timezoneInsertedQuery})`;

	const { rows: row_generator, columnTypes } = await runQuery(timeZoneQuery, {
		host: process.env.POSTGRES_HOST,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DATABASE,
		user: process.env.POSTGRES_USER,
		port: process.env.POSTGRES_PORT,
		ssl: process.env.POSTGRES_SSL
	});
	const rows = await batchedAsyncGeneratorToArray(row_generator);
	const result = rows[0];
	// All these should give the same result
	assert.equal(
		result.timestamp_explicit_utc.getTime(),
		new Date('2024-06-27T00:00:00Z').getTime(),
		'Explicit UTC timestamps should remain the same'
	);
	assert.equal(
		result.timestamp_explicit_berlin.getTime(),
		new Date('2024-06-27T00:00:00Z').getTime(),
		'Explicit Berlin timestamps should be converted to UTC'
	);
	assert.equal(
		result.timestamp_explicit_los_angeles.getTime(),
		new Date('2024-06-27T00:00:00Z').getTime(),
		'Explicit Los Angeles timestamps should be converted to UTC'
	);
	assert.equal(
		result.timestamp_implicit_utc_converted.getTime(),
		new Date('2024-06-27T00:00:00Z').getTime(),
		'Implicit UTC timestamps should be converted to UTC by the user query'
	);
	assert.equal(
		result.timestamp_implicit_berlin_converted.getTime(),
		new Date('2024-06-27T00:00:00Z').getTime(),
		'Implicit Berlin timestamps should be converted to UTC by the user query'
	);
	assert.equal(
		result.timestamp_implicit_los_angeles_converted.getTime(),
		new Date('2024-06-27T00:00:00Z').getTime(),
		'Implicit Los Angeles timestamps should be converted to UTC by the user query'
	);
});




test.run();
