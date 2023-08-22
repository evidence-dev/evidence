import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity } from '@evidence-dev/db-commons';
import 'dotenv/config';

let results;

test('query runs', async () => {
	try {
		results = await runQuery(
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

		assert.instance(results.rows, Array);
		assert.instance(results.columnTypes, Array);
		assert.type(results.rows[0], 'object');

		const result = results.rows[0];

		assert.equal(result.int_col, 123456, 'INT types should be converted to JS Numbers');
		assert.equal(result.float_col, 123456.789, 'FLOAT types should be converted to JS Numbers');
		assert.equal(result.bool_col, true, 'BOOL types should be converted to JS Booleans');
		assert.equal(result.string_col, 'hello!', 'STRING types should be converted to JS Strings');
		assert.equal(result.bytes_col, 'abc', 'BYTES types should be converted to strings');
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

		const actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
		const actualColumnNames = results.columnTypes.map((columnType) => columnType.name);

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

		const rows = Object.values(result);
		assert.equal(
			true,
			expectedColumnTypes.length === actualColumnTypes.length &&
				expectedColumnTypes.every((value, index) =>
					value === 'date' ? rows[index] instanceof Date : typeof rows[index] === value
				)
		);
	} catch (e) {
		throw Error(e);
	}
});

test('numeric types are retrieved correctly', async () => {
	results = await runQuery(
		'select CAST(1.23456789 AS NUMERIC) as numeric_number, CAST(1.23456789 AS FLOAT64) as float64_number, CAST(1.23456789 AS DECIMAL) as decimal_number, CAST(1.23456789 AS STRING) as string_number'
	);
	let actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
	let actualColumnNames = results.columnTypes.map((columnType) => columnType.name);
	let actualTypePrecisions = results.columnTypes.map((columnType) => columnType.typeFidelity);
	let actualValues = Object.keys(results.rows[0]).map((key) => results.rows[0][key]);

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

test.run();
