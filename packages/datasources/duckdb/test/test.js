import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { batchedAsyncGeneratorToArray, TypeFidelity } from '@evidence-dev/db-commons';
import 'dotenv/config';

// Types to test
// BOOLEAN
// TINYINT
// SMALLINT
// INTEGER
// BIGINT
// HUGEINT
// UTINYINT
// USMALLINT
// UINTEGER
// UBIGINT
// DATE
// TIME
// TIMESTAMP
// TIMESTAMP_S
// TIMESTAMP_MS
// TIMESTAMP_NS
// TIME WITH TIME ZONE
// TIMESTAMP WITH TIME ZONE
// FLOAT
// DOUBLE
// "DECIMAL(4,1)"
// "DECIMAL(9,4)"
// "DECIMAL(18,6)"
// "DECIMAL(38,10)"
// UUID
// INTERVAL
// VARCHAR
// BLOB
// BIT

let expectedColumnTypes, expectedColumnNames, expectedTypePrecision;
let actualColumnTypes, actualColumnNames, actualTypePrecisions;

test('query runs', async () => {
	try {
		const { rows: row_generator, columnTypes } = await runQuery(
			`select 
                true as boolean_col,
                CAST(127 AS TINYINT) as tinyint_col,
                CAST(32767 AS SMALLINT) as smallint_col,
                CAST(2147483647 AS INTEGER) as int_col,
                CAST(9223372036854775807 AS BIGINT) as bigint_col,
                CAST('9223372036854775807000000' AS HUGEINT) as hugeint_col,
                CAST(255 AS UTINYINT) as utinyint_col,
                CAST(65535 AS USMALLINT) as usmallint_col,
                CAST(4294967295 AS UINTEGER) as uint_col,
                CAST(18446744073709551615 AS UBIGINT) as ubigint_col,
                CURRENT_DATE as date_col,
                CURRENT_TIME as time_col,
                CURRENT_TIMESTAMP as timestamp_col,
                CAST('2023-12-13' AS TIMESTAMP_S) as timestamp_s_col,
                CAST('2023-12-13 12:34:56.789' AS TIMESTAMP_MS) as timestamp_ms_col,
                CAST('2023-12-13 12:34:56.789123456' AS TIMESTAMP_NS) as timestamp_ns_col,
                TIMETZ '1992-09-20 11:30:00.123456-02:00' as time_with_tz_col,
                TIMESTAMPTZ  '1992-09-20 11:30:00.123456' as timestamp_with_tz_col,
                CAST(3.14 AS FLOAT) as float_col,
                CAST(3.14 AS DOUBLE) as double_col,
                CAST(3.14 AS DECIMAL(4,1)) as decimal_4_1_col,
                CAST(3.14 AS DECIMAL(9,4)) as decimal_9_4_col,
                CAST(3.14 AS DECIMAL(18,6)) as decimal_18_6_col,
                CAST(3.14 AS DECIMAL(38,10)) as decimal_38_10_col,
                CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID) as uuid_col,
                CAST('1 day 2 hours 30 minutes' AS INTERVAL) as interval_col,
                'Evidence' as varchar_col,
                CAST('SGVsbG8gd29ybGQ=' AS BLOB) as blob_col,
                CAST(1 AS BIT) as bit_col
            `
		);
		const rows = await batchedAsyncGeneratorToArray(row_generator);
		assert.instance(rows, Array);
		assert.instance(columnTypes, Array);
		assert.type(rows[0], 'object');
		// Ensure each column has the expected type, name, and type precision
		assert.equal(columnTypes.length, 29); // Adjust based on the number of columns

		actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
		actualColumnNames = columnTypes.map((columnType) => columnType.name);
		actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);

		expectedColumnTypes = [
			'boolean', // boolean_col
			'number', // tinyint_col
			'number', // smallint_col
			'number', // int_col
			'number', // bigint_col
			'number', // hugeint_col
			'number', // utinyint_col
			'number', // usmallint_col
			'number', // uint_col
			'number', // ubigint_col
			'date', // date_col
			'string', // time_col
			'date', // timestamp_col
			'date', // timestamp_s_col
			'date', // timestamp_ms_col
			'date', // timestamp_ns_col
			'string', // time_with_tz_col
			'date', // timestamp_with_tz_col
			'number', // float_col
			'number', // double_col
			'number', // decimal_4_1_col
			'number', // decimal_9_4_col
			'number', // decimal_18_6_col
			'number', // decimal_38_10_col
			'string', // uuid_col
			'string', // interval_col
			'string', // varchar_col
			'string', // blob_col
			'string' // bit_col
		];
		expectedColumnNames = [
			'boolean_col',
			'tinyint_col',
			'smallint_col',
			'int_col',
			'bigint_col',
			'hugeint_col',
			'utinyint_col',
			'usmallint_col',
			'uint_col',
			'ubigint_col',
			'date_col',
			'time_col',
			'timestamp_col',
			'timestamp_s_col',
			'timestamp_ms_col',
			'timestamp_ns_col',
			'time_with_tz_col',
			'timestamp_with_tz_col',
			'float_col',
			'double_col',
			'decimal_4_1_col',
			'decimal_9_4_col',
			'decimal_18_6_col',
			'decimal_38_10_col',
			'uuid_col',
			'interval_col',
			'varchar_col',
			'blob_col',
			'bit_col'
		];
		expectedTypePrecision = Array(29).fill(TypeFidelity.PRECISE);

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
		console.error('Error:', e.message);

		// Print information about failed assertions
		console.log('Expected Column Types:', expectedColumnTypes);
		console.log('Actual Column Types:', actualColumnTypes);

		console.log('Expected Column Names:', expectedColumnNames);
		console.log('Actual Column Names:', actualColumnNames);

		console.log('Expected Type Precision:', expectedTypePrecision);
		console.log('Actual Type Precision:', actualTypePrecisions);

		// Re-throw the error to stop the test
		throw e;
	}
});

test('handles nulls in first row', async () => {
	try {
		const { rows: row_generator, columnTypes } = await runQuery(
			`select 
				NULL as boolean_col,
				CAST(NULL AS TINYINT) as tinyint_col,
				CAST(NULL AS SMALLINT) as smallint_col,
				CAST(NULL AS INTEGER) as int_col,
				CAST(NULL AS BIGINT) as bigint_col,
				CAST(NULL AS HUGEINT) as hugeint_col,
				CAST(NULL AS UTINYINT) as utinyint_col,
				CAST(NULL AS USMALLINT) as usmallint_col,
				CAST(NULL AS UINTEGER) as uint_col,
				CAST(NULL AS UBIGINT) as ubigint_col,
				CAST(NULL AS DATE) as date_col,
				CAST(NULL AS TIME) as time_col,
				CAST(NULL AS TIMESTAMP) as timestamp_col,
				CAST(NULL AS TIMESTAMP_S) as timestamp_s_col,
				CAST(NULL AS TIMESTAMP_MS) as timestamp_ms_col,
				CAST(NULL AS TIMESTAMP_NS) as timestamp_ns_col,
				CAST(NULL AS TIME WITH TIME ZONE) as time_with_tz_col,
				CAST(NULL AS TIMESTAMP WITH TIME ZONE) as timestamp_with_tz_col,
				CAST(NULL AS FLOAT) as float_col,
				CAST(NULL AS DOUBLE) as double_col,
				CAST(NULL AS DECIMAL(4,1)) as decimal_4_1_col,
				CAST(NULL AS DECIMAL(9,4)) as decimal_9_4_col,
				CAST(NULL AS DECIMAL(18,6)) as decimal_18_6_col,
				CAST(NULL AS DECIMAL(38,10)) as decimal_38_10_col,
				CAST(NULL AS UUID) as uuid_col,
				CAST(NULL AS INTERVAL) as interval_col,
				CAST(NULL AS VARCHAR) as varchar_col,
				CAST(NULL AS BLOB) as blob_col,
				CAST(NULL AS BIT) as bit_col
			UNION ALL
			select 
				true as boolean_col,
				CAST(127 AS TINYINT) as tinyint_col,
				CAST(32767 AS SMALLINT) as smallint_col,
				CAST(2147483647 AS INTEGER) as int_col,
				CAST(9223372036854775807 AS BIGINT) as bigint_col,
				CAST('9223372036854775807000000' AS HUGEINT) as hugeint_col,
				CAST(255 AS UTINYINT) as utinyint_col,
				CAST(65535 AS USMALLINT) as usmallint_col,
				CAST(4294967295 AS UINTEGER) as uint_col,
				CAST(18446744073709551615 AS UBIGINT) as ubigint_col,
				CURRENT_DATE as date_col,
				CURRENT_TIME as time_col,
				CURRENT_TIMESTAMP as timestamp_col,
				CAST('2023-12-13' AS TIMESTAMP_S) as timestamp_s_col,
				CAST('2023-12-13 12:34:56.789' AS TIMESTAMP_MS) as timestamp_ms_col,
				CAST('2023-12-13 12:34:56.789123456' AS TIMESTAMP_NS) as timestamp_ns_col,
				TIMETZ '1992-09-20 11:30:00.123456-02:00' as time_with_tz_col,
				TIMESTAMPTZ  '1992-09-20 11:30:00.123456' as timestamp_with_tz_col,
				CAST(3.14 AS FLOAT) as float_col,
				CAST(3.14 AS DOUBLE) as double_col,
				CAST(3.14 AS DECIMAL(4,1)) as decimal_4_1_col,
				CAST(3.14 AS DECIMAL(9,4)) as decimal_9_4_col,
				CAST(3.14 AS DECIMAL(18,6)) as decimal_18_6_col,
				CAST(3.14 AS DECIMAL(38,10)) as decimal_38_10_col,
				CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID) as uuid_col,
				CAST('1 day 2 hours 30 minutes' AS INTERVAL) as interval_col,
				'Evidence' as varchar_col,
				CAST('SGVsbG8gd29ybGQ=' AS BLOB) as blob_col,
				CAST(1 AS BIT) as bit_col
			`
		);

		const rows = await batchedAsyncGeneratorToArray(row_generator);
		assert.instance(rows, Array);
		assert.instance(columnTypes, Array);
		assert.type(rows[0], 'object');
		assert.equal(columnTypes.length, 29);

		const actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
		const actualColumnNames = columnTypes.map((columnType) => columnType.name);
		const actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);

		const expectedColumnTypes = [
			'boolean',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'date',
			'string',
			'date',
			'date',
			'date',
			'date',
			'string',
			'date',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'string',
			'string',
			'string',
			'string',
			'string'
		];

		const expectedColumnNames = [
			'boolean_col',
			'tinyint_col',
			'smallint_col',
			'int_col',
			'bigint_col',
			'hugeint_col',
			'utinyint_col',
			'usmallint_col',
			'uint_col',
			'ubigint_col',
			'date_col',
			'time_col',
			'timestamp_col',
			'timestamp_s_col',
			'timestamp_ms_col',
			'timestamp_ns_col',
			'time_with_tz_col',
			'timestamp_with_tz_col',
			'float_col',
			'double_col',
			'decimal_4_1_col',
			'decimal_9_4_col',
			'decimal_18_6_col',
			'decimal_38_10_col',
			'uuid_col',
			'interval_col',
			'varchar_col',
			'blob_col',
			'bit_col'
		];

		const expectedTypePrecision = Array(29).fill(TypeFidelity.PRECISE);

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
		console.error('Error in null-first-row test:', e.message);
		throw e;
	}
});

test('query batches results properly', async () => {
	try {
		const { rows, expectedRowCount } = await runQuery(
			'select 1 union all select 2 union all select 3 union all select 4 union all select 5',
			undefined,
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

test.run();
