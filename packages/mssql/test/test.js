import { test } from 'uvu';
import * as assert from 'uvu/assert';
import runQuery from '../index.cjs';
import 'dotenv/config';
import { testQueryResults } from '@evidence-dev/db-commons';

test('query runs', async () => {
	if (process.env.MSSQL_DATABASE) {
		try {
			const results = await runQuery(`
			SELECT
				CAST(1 AS bigint) as bigint_col,
				CAST(1 AS numeric) as numeric_col,
				CAST(1 AS bit) as bit_col,
				CAST(1 AS smallint) as smallint_col,
				CAST(1 AS decimal) as decimal_col,
				CAST(1 AS smallmoney) as smallmoney_col,
				CAST(1 AS int) as int_col,
				CAST(1 AS tinyint) as tinyint_col,
				CAST(1 AS money) as money_col,
				CAST(1.5 AS float) AS float_col,
				CAST(1.5 AS real) AS real_col,
				CAST('1909-01-01' AS date) AS date_col,
				CAST('1909-01-01' AS datetimeoffset) AS datetimeoffset_col,
				CAST('1909-01-01' AS datetime2) AS datetime2_col,
				CAST('1909-01-01' AS smalldatetime) AS smalldatetime_col,
				CAST('1909-01-01' AS datetime) AS datetime_col,
				CAST('10:00:00' AS time) as time_col,
				CAST('a' AS char) as char_col,
				CAST('ahhhh' AS varchar) as varchar_col,
				CAST('ahhh' AS text) AS text_col,
				CAST('h' AS nchar) AS nchar_col,
				CAST('hhhaaa' AS nvarchar) AS nvarchar_col,
				CAST('haaa' AS ntext) AS ntext_col,
				CAST('1010101' AS binary) as binary_col,
				CAST('1010101' AS varbinary) as varbinary_col,
				CAST('1010101' AS image) as image_col,
				CAST('6F9619FF-8B86-D011-B42D-00C04FC964FF' as uniqueidentifier) as uniqueidentifier_col,
				CAST(1.5 AS sql_variant) as sql_variant_col,
				CAST('<html></html>' AS xml) as xml_col
			`);

			assert.instance(results.rows, Array);
			assert.instance(results.columnTypes, Array);
			assert.type(results.rows[0], 'object');

			const expectedColumnTypes = [
				'number',
				'number',
				'boolean',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'number',
				'date',
				'date',
				'date',
				'date',
				'date',
				'date',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string',
				'string'
			];
			const expectedColumnNames = [
				'bigint_col',
				'numeric_col',
				'bit_col',
				'smallint_col',
				'decimal_col',
				'smallmoney_col',
				'int_col',
				'tinyint_col',
				'money_col',
				'float_col',
				'real_col',
				'date_col',
				'datetimeoffset_col',
				'datetime2_col',
				'smalldatetime_col',
				'datetime_col',
				'time_col',
				'char_col',
				'varchar_col',
				'text_col',
				'nchar_col',
				'nvarchar_col',
				'ntext_col',
				'binary_col',
				'varbinary_col',
				'image_col',
				'uniqueidentifier_col',
				'sql_variant_col',
				'xml_col'
			];

			testQueryResults(results, expectedColumnTypes, expectedColumnNames);
		} catch (e) {
			throw Error(e);
		}
	} else {
		console.log('SQL Server tests not currently configured to run during the automated builds');
		return;
	}
});

test.run();
