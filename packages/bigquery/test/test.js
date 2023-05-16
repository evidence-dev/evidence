import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity } from '@evidence-dev/db-commons';
import 'dotenv/config';

let results;

test('query runs', async () => {
	results = await runQuery(
		"select 100 as number_col, current_date  as date_col, current_timestamp as timestamp_col, 'Evidence' as string_col, true as bool_col"
	);
	assert.instance(results.rows, Array);
	assert.instance(results.columnTypes, Array);
	assert.type(results.rows[0], 'object');
	assert.equal(results.rows[0].number_col, 100);

	let actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
	let actualColumnNames = results.columnTypes.map((columnType) => columnType.name);
	let actualTypePrecisions = results.columnTypes.map((columnType) => columnType.typeFidelity);

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
});

792;
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
