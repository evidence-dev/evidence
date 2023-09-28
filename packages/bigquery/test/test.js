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
			`
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
	assert.equal(
		result.interval_col,
		'0-0 5 0:0:0',
		'INTERVAL types should be converted to strings'
	);
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
		'select CAST(1.23456789 AS NUMERIC) as numeric_number, CAST(1.23456789 AS FLOAT64) as float64_number, CAST(1.23456789 AS DECIMAL) as decimal_number, CAST(1.23456789 AS STRING) as string_number'
	);
	const rows = await batchedAsyncGeneratorToArray(row_generator);
	let actualColumnTypes = columnTypes.map((columnType) => columnType.evidenceType);
	let actualColumnNames = columnTypes.map((columnType) => columnType.name);
	let actualTypePrecisions = columnTypes.map((columnType) => columnType.typeFidelity);
	let actualValues = Object.keys(rows[0]).map((key) => rows[0][key]);

	let expectedColumnTypes = ['number', 'number', 'number', 'string'];
	let expectedColumnNames = [
		'numeric_number',
		'float64_number',
		'decimal_number',
		'string_number'
	];
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
});

test.run();
