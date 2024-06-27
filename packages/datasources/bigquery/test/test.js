import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity, batchedAsyncGeneratorToArray } from '@evidence-dev/db-commons';
import 'dotenv/config';

test('query runs', async () => {
	const { rows: row_generator, columnTypes } = await runQuery(
		`select 
			INTERVAL 5 DAY AS interval_col,
			NUMERIC '123456' as numeric_col,
			BIGNUMERIC '1234567890123456789012345678' as bignumeric_col,
			'hello!' as string_col,
			B"abc" as bytes_col,
			123456 as int_col,
			123456.789 as float_col,
			true as bool_col,
			DATE '2021-01-01' as date_col,
			TIME '12:34:56' as time_col,
			TIMESTAMP '2021-01-01 12:34:56' as timestamp_col,
			DATETIME '2021-01-01 12:34:56' as datetime_col
			`,
		{
			project_id: process.env.BIGQUERY_PROJECT_ID,
			client_email: process.env.BIGQUERY_CLIENT_EMAIL,
			private_key: process.env.BIGQUERY_PRIVATE_KEY
		}
	);
	const rows = await batchedAsyncGeneratorToArray(row_generator);

	assert.instance(rows, Array);
	assert.instance(columnTypes, Array);
	assert.type(rows[0], 'object');

	const result = rows[0];

	assert.equal(result.int_col, 123456, 'INT types should be converted to JS Numbers');
	assert.equal(result.float_col, 123456.789, 'FLOAT types should be converted to JS Numbers');
	assert.equal(result.bool_col, true, 'BOOL types should be converted to JS Booleans');
	assert.equal(result.string_col, 'hello!', 'STRING types should be converted to JS Strings');
	assert.equal(result.bytes_col, 'YWJj', 'BYTES types should be converted to base64 strings');
	assert.equal(
		result.date_col.getTime(),
		new Date('2021-01-01').getTime(),
		'DATE types should be converted to JS Date objects'
	);
	assert.equal(result.time_col, '12:34:56', 'TIME types should be converted to strings');
	assert.equal(
		result.timestamp_col.getTime(),
		new Date('2021-01-01T12:34:56.000Z').getTime(),
		'TIMESTAMP types should be converted to JS Date objects'
	);
	assert.equal(
		result.datetime_col.getTime(),
		new Date('2021-01-01T12:34:56.000Z').getTime(),
		'DATETIME types should be converted to JS Date objects'
	);
	assert.equal(result.interval_col, '0-0 5 0:0:0', 'INTERVAL types should be converted to strings');
	assert.equal(result.numeric_col, 123456, 'NUMERIC types should be converted to JS Numbers');
	assert.equal(
		result.bignumeric_col,
		1.2345678901234569e27,
		'BIGNUMERIC types should be converted to JS Numbers'
	);

	const actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
	const actualColumnNames = columnTypes.map((columnType) => columnType.name);

	const expectedColumnTypes = [
		'string',
		'number',
		'number',
		'string',
		'string',
		'number',
		'number',
		'boolean',
		'date',
		'string',
		'date',
		'date'
	];
	const expectedColumnNames = [
		'interval_col',
		'numeric_col',
		'bignumeric_col',
		'string_col',
		'bytes_col',
		'int_col',
		'float_col',
		'bool_col',
		'date_col',
		'time_col',
		'timestamp_col',
		'datetime_col'
	];

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
});

test('numeric types are retrieved correctly', async () => {
	const { rows: row_generator, columnTypes } = await runQuery(
		'select CAST(1.23456789 AS NUMERIC) as numeric_number, CAST(1.23456789 AS FLOAT64) as float64_number, CAST(1.23456789 AS DECIMAL) as decimal_number, CAST(1.23456789 AS STRING) as string_number',
		{
			project_id: process.env.BIGQUERY_PROJECT_ID,
			client_email: process.env.BIGQUERY_CLIENT_EMAIL,
			private_key: process.env.BIGQUERY_PRIVATE_KEY
		}
	);
	const rows = await batchedAsyncGeneratorToArray(row_generator);
	let actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
	let actualColumnNames = columnTypes.map((columnType) => columnType.name);
	let actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);
	let actualValues = Object.keys(rows[0]).map((key) => rows[0][key]);

	let expectedColumnTypes = ['number', 'number', 'number', 'string'];
	let expectedColumnNames = ['numeric_number', 'float64_number', 'decimal_number', 'string_number'];
	let expectedTypePrecision = Array(4).fill(TypeFidelity.PRECISE);
	let expectedValues = [1.23456789, 1.23456789, 1.23456789, '1.23456789'];

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
	assert.equal(expectedValues, actualValues);
});

test('query batches results properly', async () => {
	const { rows, expectedRowCount } = await runQuery(
		'select 1 union all select 2 union all select 3 union all select 4 union all select 5',
		{
			project_id: process.env.BIGQUERY_PROJECT_ID,
			client_email: process.env.BIGQUERY_CLIENT_EMAIL,
			private_key: process.env.BIGQUERY_PRIVATE_KEY
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
});

const timezoneInsertedQuery = `select
  timestamp '2024-06-27 00:00:00 UTC' as timestamp_explicit_utc,
  timestamp '2024-06-27 02:00:00 Europe/Berlin' as timestamp_explicit_berlin,
  timestamp '2024-06-26 17:00:00 America/Los_Angeles' as timestamp_explicit_los_angeles,
  timestamp '2024-06-27 00:00:00'    as timestamp_implicit_utc,
  timestamp '2024-06-27 02:00:00'    as timestamp_implicit_berlin,
  timestamp '2024-06-26 17:00:00'    as timestamp_implicit_los_angeles`;


test('timestamps are converted to UTC', async () => {
	const timeZoneQuery = `select
		timestamp_explicit_utc,
		timestamp_explicit_berlin,
		timestamp_explicit_los_angeles,
		timestamp(datetime(timestamp_implicit_utc), 'UTC') as timestamp_implicit_utc_converted,
		timestamp(datetime(timestamp_implicit_berlin), 'Europe/Berlin') as timestamp_implicit_berlin_converted,
		timestamp(datetime(timestamp_implicit_los_angeles), 'America/Los_Angeles') as timestamp_implicit_los_angeles_converted
		from (${timezoneInsertedQuery})`;
	const { rows: row_generator, columnTypes } = await runQuery(timeZoneQuery, {
		project_id: process.env.BIGQUERY_PROJECT_ID,
		client_email: process.env.BIGQUERY_CLIENT_EMAIL,
		private_key: process.env.BIGQUERY_PRIVATE_KEY
	});
	const rows = await batchedAsyncGeneratorToArray(row_generator);
	const result = rows[0];
	// All these should give the same result
	assert.equal(
		result.timestamp_explicit_utc.getTime(),
		new Date('2024-06-27T00:00:00.000Z').getTime(),
		'Explicit UTC timestamps should remain the same'
	);
	assert.equal(
		result.timestamp_explicit_berlin.getTime(),
		new Date('2024-06-27T00:00:00.000Z').getTime(),
		'Explicit Berlin timestamps should be converted to UTC'
	);
	assert.equal(
		result.timestamp_explicit_los_angeles.getTime(),
		new Date('2024-06-27T00:00:00.000Z').getTime(),
		'Explicit Los Angeles timestamps should be converted to UTC'
	);
	assert.equal(
		result.timestamp_implicit_utc_converted.getTime(),
		new Date('2024-06-27T00:00:00.000Z').getTime(),
		'Implicit UTC timestamps should remain the same when converted by the user query'
	);
	assert.equal(
		result.timestamp_implicit_berlin_converted.getTime(),
		new Date('2024-06-27T00:00:00.000Z').getTime(),
		'Implicit Berlin timestamps should be convertable to UTC by the user query'
	);
	assert.equal(
		result.timestamp_implicit_los_angeles_converted.getTime(),
		new Date('2024-06-27T00:00:00.000Z').getTime(),
		'Implicit Los Angeles timestamps should be convertable to UTC by the user query'
	);
});
test.run();
