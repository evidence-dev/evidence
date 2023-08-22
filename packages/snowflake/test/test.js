import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import 'dotenv/config';

let results;

test('query runs', async () => {
	try {
		results = await runQuery(`
			SELECT 
				1::NUMBER as number_col,
				1::DECIMAL as decimal_col,
				1::NUMERIC as numeric_col,
				1::INT as int_col,
				1::INTEGER as integer_col,
				1::BIGINT as bigint_col,
				1::SMALLINT as smallint_col,
				1::TINYINT as tinyint_col,
				1::BYTEINT as byteint_col,
				1.5::FLOAT as float_col,
				1.5::FLOAT4 as float4_col,
				1.5::FLOAT8 as float8_col,
				1.5::DOUBLE as double_col,
				1.5::DOUBLE PRECISION as double_precision_col,
				1.5::REAL as real_col,
				'bonjour'::VARCHAR as varchar_col,
				'h'::CHAR as char_col,
				's'::CHARACTER as character_col,
				'bonita'::STRING as string_col,
				'tree'::TEXT as text_col,
				TO_BINARY(HEX_ENCODE('robot'), 'HEX') as binary_col,
				TO_BINARY(HEX_ENCODE('wind chime'), 'HEX')::VARBINARY as varbinary_col,
				true::BOOLEAN as boolean_col,
				'1909-01-01'::DATE as date_col,
				'2009-01-01'::DATETIME as datetime_col,
				'10:00:00'::TIME as time_col,
				'2021-01-01 00:00:00'::TIMESTAMP as timestamp_col,
				'2022-01-01 00:00:00'::TIMESTAMP_LTZ as timestamp_ltz_col,
				'2023-01-01 00:00:00'::TIMESTAMP_NTZ as timestamp_ntz_col,
				'2024-01-01 00:00:00'::TIMESTAMP_TZ as timestamp_tz_col,
				1.5::VARIANT as variant_col,
				{ 'Manitoba': 'Winnipeg' }::OBJECT as object_col,
				[1, 2, 3]::ARRAY as array_col,
				TO_GEOMETRY('LINESTRING(100 102,100 102)', TRUE) as geometry_col,
				TO_GEOGRAPHY('LINESTRING(13.4814 52.5015, -121.8212 36.8252)', TRUE) as geography_col
		`);
		assert.instance(results.rows, Array);
		assert.instance(results.columnTypes, Array);
		assert.type(results.rows[0], 'object');
		assert.equal(results.rows[0].number_col, 1);

		const rows = Object.values(results.rows[0]);

		const actualColumnTypes = results.columnTypes.map((columnType) => columnType.evidenceType);
		const actualColumnNames = results.columnTypes.map((columnType) => columnType.name);

		const expectedColumnTypes = [
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
			'number',
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
			'string',
			'string',
			'boolean',
			'date',
			'date',
			'string',
			'date',
			'date',
			'date',
			'date',
			'string',
			'string',
			'string',
			'string',
			'string'
		];
		const expectedColumnNames = [
			'number_col',
			'decimal_col',
			'numeric_col',
			'int_col',
			'integer_col',
			'bigint_col',
			'smallint_col',
			'tinyint_col',
			'byteint_col',
			'float_col',
			'float4_col',
			'float8_col',
			'double_col',
			'double_precision_col',
			'real_col',
			'varchar_col',
			'char_col',
			'character_col',
			'string_col',
			'text_col',
			'binary_col',
			'varbinary_col',
			'boolean_col',
			'date_col',
			'datetime_col',
			'time_col',
			'timestamp_col',
			'timestamp_ltz_col',
			'timestamp_ntz_col',
			'timestamp_tz_col',
			'variant_col',
			'object_col',
			'array_col',
			'geometry_col',
			'geography_col'
		];

		assert.equal(
			true,
			expectedColumnTypes.length === actualColumnTypes.length &&
				expectedColumnTypes.every((value, index) => value === actualColumnTypes[index])
		);
		assert.equal(
			true,
			expectedColumnTypes.length === actualColumnTypes.length &&
				expectedColumnTypes.every((value, index) =>
					value === 'date'
						? rows[index] instanceof Date
						: typeof rows[index] === value
				)
		);
		assert.equal(
			true,
			expectedColumnNames.length === actualColumnNames.length &&
				expectedColumnNames.every(
					(value, index) => value.toUpperCase() === actualColumnNames?.[index]?.toUpperCase()
				)
		);
	} catch (e) {
		throw Error(e);
	}
});

test.run();
