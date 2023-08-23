import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import { testQueryResults } from '@evidence-dev/db-commons';

let results;

test('query runs', async () => {
	try {
		results = await runQuery(`
			SELECT 
				true::BOOL as bool_col,
				1::NUMERIC as numeric_col,
				1::MONEY as money_col,
				1::INT2 as int2_col,
				1::INT4 as int4_col,
				1::INT8 as int8_col,
				1.5::FLOAT4 as float4_col,
				1.5::FLOAT8 as float8_col,
				'hello'::VARCHAR as varchar_col,
				'blah'::TEXT as text_col,
				'a'::CHAR as char_col,
				'{"hello": "world"}'::JSON as json_col,
				'<html></html>'::XML as xml_col,
				'1909-01-01'::DATE as date_col,
				'10:00:00'::TIME as time_col,
				'10:00:00'::TIMETZ as timetz_col,
				'1909-01-01 10:00:00'::TIMESTAMP as timestamp_col,
				'1909-01-01 10:00:00'::TIMESTAMPTZ as timestamptz_col
		`);
		assert.instance(results.rows, Array);
		assert.instance(results.columnTypes, Array);
		assert.type(results.rows[0], 'object');

		const expectedColumnTypes = [
			'boolean',
			'number',
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
			'string',
			'date',
			'string',
			'string',
			'date',
			'date'
		];
		const expectedColumnNames = [
			'bool_col',
			'numeric_col',
			'money_col',
			'int2_col',
			'int4_col',
			'int8_col',
			'float4_col',
			'float8_col',
			'varchar_col',
			'text_col',
			'char_col',
			'json_col',
			'xml_col',
			'date_col',
			'time_col',
			'timetz_col',
			'timestamp_col',
			'timestamptz_col'
		];

		testQueryResults(results, expectedColumnTypes, expectedColumnNames);
	} catch (e) {
		throw Error(e);
	}
});

test.run();
