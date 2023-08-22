import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import 'dotenv/config';

let results;

test('query runs', async () => {
	try {
		results = await runQuery(`
		SELECT
			9007199254741001::BIGINT as bigint_col,
			'10101001'::BITSTRING as bitstring_col,
			true::BOOLEAN as boolean_col,
			'11001010101'::BLOB as blob_col,
			'1909-01-01'::DATE as date_col,
			1.5::DOUBLE as double_col,
			1.5::DECIMAL as decimal_col,
			9007199254741001::HUGEINT as hugeint_col,
			21849::INTEGER as integer_col,
			INTERVAL 1 YEAR as interval_col,
			1.5::REAL as real_col,
			1::SMALLINT as smallint_col,
			'10:00:00'::TIME as time_col,
			'1909-09-09 10:00:00'::TIMESTAMP as timestamp_col,
			'1909-09-09 10:00:00'::TIMESTAMPTZ as timestamptz_col,
			1::TINYINT as tinyint_col,
			100::UBIGINT as ubigint_col,
			100::UINTEGER as uinteger_col,
			100::USMALLINT as usmallint_col,
			100::UTINYINT as utinyint_col,
			'3b06bc86-855d-4bf9-a012-9775265e3ae4'::UUID as uuid_col,
			'blah'::VARCHAR as varchar_col,
			[1, 2, 3] as list_col,
			{'i': 42, 'j': 'a'} as struct_col,
			map([1,2],['a','b']) as map_col,
			union_value(num := 2) as union_col
		`);
		assert.instance(results.rows, Array);
		assert.instance(results.columnTypes, Array);
		assert.type(results.rows[0], 'object');

		const actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
		const actualColumnNames = results.columnTypes.map((columnType) => columnType.name);

		const expectedColumnTypes = [
			'number',
			'string',
			'boolean',
			'string',
			'date',
			'number',
			'number',
			'number',
			'number',
			'string',
			'number',
			'number',
			'string',
			'date',
			'date',
			'number',
			'number',
			'number',
			'number',
			'number',
			'string',
			'string',
			'string',
			'string',
			'string',
			'string'
		];
		const expectedColumnNames = [
			'bigint_col',
			'bitstring_col',
			'boolean_col',
			'blob_col',
			'date_col',
			'double_col',
			'decimal_col',
			'hugeint_col',
			'integer_col',
			'interval_col',
			'real_col',
			'smallint_col',
			'time_col',
			'timestamp_col',
			'timestamptz_col',
			'tinyint_col',
			'ubigint_col',
			'uinteger_col',
			'usmallint_col',
			'utinyint_col',
			'uuid_col',
			'varchar_col',
			'list_col',
			'struct_col',
			'map_col',
			'union_col'
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
		const rows = Object.values(results.rows[0]);
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

test.run();
