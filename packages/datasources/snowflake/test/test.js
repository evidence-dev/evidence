import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity, batchedAsyncGeneratorToArray } from '@evidence-dev/db-commons';
import 'dotenv/config';

test('query runs', async () => {
	try {
		const { rows: row_generator, columnTypes } = await runQuery(
			"select 100 as number_col, current_date  as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, true as bool_col",
			{
				username: process.env.SNOWFLAKE_USERNAME,
				password: process.env.SNOWFLAKE_PASSWORD,
				account: process.env.SNOWFLAKE_ACCOUNT
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
				expectedColumnNames.every(
					(value, index) => value.toUpperCase() === actualColumnNames?.[index]?.toUpperCase()
				)
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
				username: process.env.SNOWFLAKE_USERNAME,
				password: process.env.SNOWFLAKE_PASSWORD,
				account: process.env.SNOWFLAKE_ACCOUNT
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

const timezoneInsertedQuery = `select
  to_timestamp_tz('2024-06-27 00:00:00 +0000') as timestamp_explicit_utc,
  to_timestamp_tz('2024-06-27 02:00:00 +0200') as timestamp_explicit_berlin,
  to_timestamp_tz('2024-06-26 17:00:00 -0700') as timestamp_explicit_los_angeles,
  to_timestamp_ntz('2024-06-27 00:00:00') as timestamp_implicit_utc,
  to_timestamp_ntz('2024-06-27 02:00:00') as timestamp_implicit_berlin,
  to_timestamp_ntz('2024-06-26 17:00:00') as timestamp_implicit_los_angeles`;


	  test('timestamps are converted to UTC', async () => {
		const timeZoneQuery = `select
		  timestamp_explicit_utc,
		  timestamp_explicit_berlin,
		  timestamp_explicit_los_angeles,
		  convert_timezone('UTC', 'UTC', timestamp_implicit_utc) as timestamp_implicit_utc_converted,
		  convert_timezone('Europe/Berlin', 'UTC', timestamp_implicit_berlin ) as timestamp_implicit_berlin_converted,
		  convert_timezone('America/Los_Angeles', 'UTC', timestamp_implicit_los_angeles) as timestamp_implicit_los_angeles_converted
		  from (${timezoneInsertedQuery})`;
	  
		const { rows: row_generator, columnTypes } = await runQuery(timeZoneQuery,
		  {
			username: process.env.SNOWFLAKE_USERNAME,
			password: process.env.SNOWFLAKE_PASSWORD,
			account: process.env.SNOWFLAKE_ACCOUNT
		  });
		const rows = await batchedAsyncGeneratorToArray(row_generator);
		const result = rows[0];
		// All these should give the same result
		assert.equal(
			new Date(result.timestamp_explicit_utc).getTime(),
			new Date('2024-06-27t00:00:00z').getTime(),
			'explicit utc timestamps should remain the same'
		  );
		  assert.equal(
			new Date(result.timestamp_explicit_berlin).getTime(),
			new Date('2024-06-27t00:00:00z').getTime(),
			'explicit berlin timestamps should be converted to utc'
		  );
		  assert.equal(
			new Date(result.timestamp_explicit_los_angeles).getTime(),
			new Date('2024-06-27t00:00:00z').getTime(),
			'explicit los angeles timestamps should be converted to utc'
		  );
		  assert.equal(
			new Date(result.timestamp_implicit_utc_converted).getTime(),
			new Date('2024-06-27t00:00:00z').getTime(),
			'implicit utc timestamps should be converted to utc by the user query'
		  );
		  assert.equal(
			new Date(result.timestamp_implicit_berlin_converted).getTime(),
			new Date('2024-06-27t00:00:00z').getTime(),
			'implicit berlin timestamps should be converted to utc by the user query'
		  );
		  assert.equal(
			new Date(result.timestamp_implicit_los_angeles_converted).getTime(),
			new Date('2024-06-27t00:00:00z').getTime(),
			'implicit los angeles timestamps should be converted to utc by the user query'
		  );		  
	  });
test.run();
