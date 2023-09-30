import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { TypeFidelity } from '@evidence-dev/db-commons';

let results;

test('query runs', async () => {
	try {
		results = await runQuery(`
			SELECT
				cast(100 AS BIGINT) as bigint_col,
				cast('true' AS BINARY) as binary_col,
				cast(1 AS BOOLEAN) as boolean_col,
				cast('1908-03-15' AS DATE) as date_col,
				cast(100.0 AS DECIMAL(10,2)) as decimal_col,
				cast(100.0 AS DOUBLE) as double_col,
				cast(100.0 AS FLOAT) as float_col,
				cast(100 AS INT) as int_col,
				INTERVAL '-3600' MONTH as interval_col,
				cast(null AS VOID) as null_col,
				cast(100 AS SMALLINT) as smallint_col,
				cast('string' AS STRING) as string_col,
				cast('1908-03-15 00:00:00' AS TIMESTAMP) as timestamp_col,
				cast('1908-03-15 00:00:00' AS TIMESTAMP_NTZ) as timestamp_ntz_col,
				cast(2 AS TINYINT) as tinyint_col
		`);
		assert.instance(results.rows, Array);
		assert.instance(results.columnTypes, Array);
		assert.type(results.rows[0], 'object');

		let actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
		let actualColumnNames = results.columnTypes.map((columnType) => columnType.name);
		let actualTypePrecisions = results.columnTypes.map((columnType) => columnType.typeFidelity);

		let expectedColumnTypes = [
			'number',
			'string',
			'boolean',
			'date',
			'number',
			'number',
			'number',
			'number',
			'string',
			'string',
			'number',
			'string',
			'date',
			'date',
			'number'
		];
		let expectedColumnNames = [
			'bigint_col',
			'binary_col',
			'boolean_col',
			'date_col',
			'decimal_col',
			'double_col',
			'float_col',
			'int_col',
			'interval_col',
			'null_col',
			'smallint_col',
			'string_col',
			'timestamp_col',
			'timestamp_ntz_col',
			'tinyint_col'
		];
		let expectedTypePrecision = Array(15).fill(TypeFidelity.PRECISE);

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

test.run();
